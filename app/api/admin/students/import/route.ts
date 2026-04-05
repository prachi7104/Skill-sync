import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.collegeId) {
    return NextResponse.json({ error: "Missing college context" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const headers = parseCsvLine(lines[0])
    .map((header) => header.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));

  const getCol = (row: string[], name: string) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? row[idx]?.trim() ?? "" : "";
  };

  let imported = 0;
  let linked = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const sapId = getCol(cols, "sap_id");
    const name = getCol(cols, "name") || getCol(cols, "full_name");
    const email = getCol(cols, "email")?.toLowerCase();
    const branch = getCol(cols, "branch");
    const batchYear = parseInt(getCol(cols, "batch_year"), 10) || null;
    const rollNo = getCol(cols, "roll_no");
    const course = getCol(cols, "course");
    const programmeName = getCol(cols, "programme_name");

    if (!sapId || !name) continue;

    try {
      await db.execute(sql`
        INSERT INTO student_roster (college_id, sap_id, email, full_name, course, branch, batch_year, roll_no, programme_name, imported_from)
        VALUES (${session.user.collegeId}, ${sapId}, ${email || null}, ${name}, ${course || null}, ${branch || null}, ${batchYear}, ${rollNo || null}, ${programmeName || null}, 'roster_csv')
        ON CONFLICT (college_id, sap_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = COALESCE(student_roster.email, EXCLUDED.email),
          branch = COALESCE(student_roster.branch, EXCLUDED.branch),
          batch_year = COALESCE(student_roster.batch_year, EXCLUDED.batch_year),
          roll_no = COALESCE(student_roster.roll_no, EXCLUDED.roll_no),
          programme_name = COALESCE(student_roster.programme_name, EXCLUDED.programme_name)
      `);
      imported++;

      if (email) {
        const linkedResult = await db.execute(sql`
          UPDATE student_roster sr
          SET student_id = u.id, linked_at = NOW()
          FROM users u
          JOIN students s ON s.id = u.id
          WHERE sr.sap_id = ${sapId}
            AND sr.college_id = ${session.user.collegeId}
            AND lower(u.email) = ${email}
            AND sr.student_id IS NULL
          RETURNING sr.id
        `) as unknown as Array<unknown>;
        if (linkedResult.length > 0) linked++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ success: true, imported, linked, errors });
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.collegeId) {
    return NextResponse.json({ error: "Missing college context" }, { status: 400 });
  }

  const [stats] = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_roster,
      COUNT(student_id)::int AS linked,
      COUNT(*) FILTER (WHERE student_id IS NULL)::int AS unlinked
    FROM student_roster
    WHERE college_id = ${session.user.collegeId}
  `) as unknown as Array<{ total_roster: number; linked: number; unlinked: number }>;

  const unlinked = await db.execute(sql`
    SELECT sap_id, full_name, email, branch, batch_year, imported_from
    FROM student_roster
    WHERE college_id = ${session.user.collegeId}
      AND student_id IS NULL
    ORDER BY full_name
    LIMIT 100
  `);

  return NextResponse.json({ stats, unlinked });
}
