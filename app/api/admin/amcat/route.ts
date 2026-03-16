import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  parseAmcatRows,
  processAmcatData,
  computeCategoryDistribution,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
} from "@/lib/amcat/parser";
import { hasAmcatManagementPermission } from "@/lib/amcat/permissions";

function parseCSV(text: string): { headers: string[]; rows: unknown[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV file has no data rows");

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines
    .slice(1)
    .filter((line) => line.trim() && !line.startsWith(",,"))
    .map(parseCSVLine);

  return { headers, rows };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowed = await hasAmcatManagementPermission(session);
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden: requires amcat_management permission" },
      { status: 403 },
    );
  }

  if (!session?.user?.id || !session.user.collegeId) {
    return NextResponse.json({ error: "Missing session context" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sessionName = String(formData.get("session_name") ?? "").trim();
  const testDate = (formData.get("test_date") as string | null) || null;
  const batchYear = parseInt(String(formData.get("batch_year") ?? ""), 10) || null;
  const academicYear = (formData.get("academic_year") as string | null) || null;

  if (!file || !sessionName) {
    return NextResponse.json({ error: "file and session_name are required" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const lowerName = file.name.toLowerCase();
  const isCSV = lowerName.endsWith(".csv") || file.type.includes("csv");
  const isXLSX = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

  if (!isCSV && !isXLSX) {
    return NextResponse.json({ error: "Only CSV and XLSX files are accepted" }, { status: 400 });
  }

  let headers: string[];
  let rows: unknown[][];

  try {
    if (isCSV) {
      const text = await file.text();
      const parsed = parseCSV(text);
      headers = parsed.headers;
      rows = parsed.rows;
    } else {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      headers = (matrix[0] as string[]).map(String);
      rows = matrix.slice(1).filter((row: string[]) => row.some((value) => value !== ""));
    }
  } catch {
    return NextResponse.json({ error: "Failed to parse uploaded file" }, { status: 422 });
  }

  const { data: rawRows, unmapped, errors } = parseAmcatRows(headers, rows);
  if (rawRows.length === 0) {
    return NextResponse.json(
      {
        error: "No valid rows found in file",
        parseErrors: errors,
        unmappedColumns: unmapped,
      },
      { status: 422 },
    );
  }

  const processed = processAmcatData(rawRows, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
  const distribution = computeCategoryDistribution(processed);

  const existing = await db.execute(sql`
    SELECT id
    FROM amcat_sessions
    WHERE college_id = ${session.user.collegeId}
      AND session_name = ${sessionName}
    LIMIT 1
  `) as unknown as Array<{ id: string }>;

  if (existing.length > 0) {
    return NextResponse.json({ error: "A session with this name already exists" }, { status: 409 });
  }

  const [newSession] = await db.execute(sql`
    INSERT INTO amcat_sessions (
      college_id,
      uploaded_by,
      session_name,
      test_date,
      batch_year,
      academic_year,
      status,
      score_weights,
      category_thresholds,
      total_students,
      alpha_count,
      beta_count,
      gamma_count
    ) VALUES (
      ${session.user.collegeId},
      ${session.user.id},
      ${sessionName},
      ${testDate || null},
      ${batchYear},
      ${academicYear || null},
      'draft',
      ${JSON.stringify(DEFAULT_WEIGHTS)}::jsonb,
      ${JSON.stringify(DEFAULT_THRESHOLDS)}::jsonb,
      ${distribution.total},
      ${distribution.alpha},
      ${distribution.beta},
      ${distribution.gamma}
    )
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  const sessionId = newSession.id;

  const sapIds = processed.map((row) => row.sap_id);
  const matchedStudents = sapIds.length
    ? (await db.execute(sql`
        SELECT sap_id, id AS student_id
        FROM students
        WHERE college_id = ${session.user.collegeId}
          AND sap_id = ANY(${sapIds})
      `) as unknown as Array<{ sap_id: string; student_id: string }>)
    : [];

  const sapToStudentId = Object.fromEntries(
    matchedStudents.map((item) => [item.sap_id, item.student_id]),
  );
  const unmatchedCount = processed.filter((row) => !sapToStudentId[row.sap_id]).length;

  await db.execute(sql`
    UPDATE amcat_sessions
    SET unmatched_count = ${unmatchedCount}, updated_at = NOW()
    WHERE id = ${sessionId}
  `);

  const chunkSize = 100;
  for (let i = 0; i < processed.length; i += chunkSize) {
    const chunk = processed.slice(i, i + chunkSize);

    const values = chunk.map((row) => {
      const studentId = sapToStudentId[row.sap_id] ?? null;
      return sql`(
        ${sessionId}, ${session.user.collegeId}, ${row.sap_id}, ${studentId},
        ${row.full_name}, ${row.course}, ${row.branch}, ${row.programme_name},
        ${row.status}, ${row.attendance_pct},
        ${row.cs_score}, ${row.cp_score}, ${row.automata_score}, ${row.automata_fix_score}, ${row.quant_score},
        ${row.csv_total}, ${row.csv_category}::batch_category,
        ${row.computed_total}, ${row.computed_category}::batch_category,
        ${row.final_category}::batch_category, ${row.rank_in_session}
      )`;
    });

    await db.execute(sql`
      INSERT INTO amcat_results (
        session_id,
        college_id,
        sap_id,
        student_id,
        full_name,
        course,
        branch,
        programme_name,
        status,
        attendance_pct,
        cs_score,
        cp_score,
        automata_score,
        automata_fix_score,
        quant_score,
        csv_total,
        csv_category,
        computed_total,
        computed_category,
        final_category,
        rank_in_session
      ) VALUES ${sql.join(values, sql`,`)}
      ON CONFLICT (session_id, sap_id) DO NOTHING
    `);
  }

  return NextResponse.json(
    {
      success: true,
      sessionId,
      distribution,
      unmatchedCount,
      parseErrors: errors,
      unmappedColumns: unmapped,
      preview: processed.slice(0, 20),
    },
    { status: 201 },
  );
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowed = await hasAmcatManagementPermission(session);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session?.user?.collegeId) {
    return NextResponse.json({ sessions: [] });
  }

  const sessions = await db.execute(sql`
    SELECT
      s.id,
      s.session_name,
      s.test_date,
      s.batch_year,
      s.academic_year,
      s.status,
      s.total_students,
      s.alpha_count,
      s.beta_count,
      s.gamma_count,
      s.unmatched_count,
      s.score_weights,
      s.category_thresholds,
      s.published_at,
      s.created_at,
      u.name AS uploaded_by_name
    FROM amcat_sessions s
    LEFT JOIN users u ON u.id = s.uploaded_by
    WHERE s.college_id = ${session.user.collegeId}
    ORDER BY s.created_at DESC
  `);

  return NextResponse.json({ sessions });
}
