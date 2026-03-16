import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { hasAmcatManagementPermission } from "@/lib/amcat/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const session = await getServerSession(authOptions);
  const allowed = await hasAmcatManagementPermission(session);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!session?.user?.collegeId) {
    return NextResponse.json({ error: "Missing college context" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const filterCategory = url.searchParams.get("category");
  const searchSap = url.searchParams.get("sap");

  const whereParts = [
    sql`r.session_id = ${params.sessionId}`,
    sql`r.college_id = ${session.user.collegeId}`,
  ];

  if (filterCategory && ["alpha", "beta", "gamma"].includes(filterCategory)) {
    whereParts.push(sql`r.final_category = ${filterCategory}::batch_category`);
  }

  if (searchSap) {
    whereParts.push(sql`r.sap_id ILIKE ${`%${searchSap}%`}`);
  }

  const whereClause = sql.join(whereParts, sql` AND `);

  const [sessionData] = await db.execute(sql`
    SELECT *
    FROM amcat_sessions
    WHERE id = ${params.sessionId} AND college_id = ${session.user.collegeId}
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>;

  if (!sessionData) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const results = await db.execute(sql`
    SELECT
      r.id,
      r.sap_id,
      r.full_name,
      r.course,
      r.branch,
      r.status,
      r.cs_score,
      r.cp_score,
      r.automata_score,
      r.automata_fix_score,
      r.quant_score,
      r.attendance_pct,
      r.csv_total,
      r.csv_category,
      r.computed_total,
      r.computed_category,
      r.final_category,
      r.rank_in_session,
      r.admin_overridden,
      r.override_note,
      r.is_edited,
      (r.student_id IS NOT NULL) AS linked,
      u.name AS student_name
    FROM amcat_results r
    LEFT JOIN students st ON st.id = r.student_id
    LEFT JOIN users u ON u.id = st.id
    WHERE ${whereClause}
    ORDER BY r.rank_in_session ASC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `);

  const [{ total }] = await db.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM amcat_results r
    WHERE ${whereClause}
  `) as unknown as Array<{ total: number }>;

  const [summary] = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE r.student_id IS NOT NULL)::int AS linked,
      COUNT(*) FILTER (WHERE r.student_id IS NULL)::int AS unmatched,
      COUNT(*) FILTER (WHERE r.admin_overridden = true)::int AS overridden
    FROM amcat_results r
    WHERE r.session_id = ${params.sessionId}
      AND r.college_id = ${session.user.collegeId}
  `) as unknown as Array<{ linked: number; unmatched: number; overridden: number }>;

  return NextResponse.json({
    session: sessionData,
    results,
    total,
    page,
    pageSize,
    summary,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const session = await getServerSession(authOptions);
  const allowed = await hasAmcatManagementPermission(session);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!session?.user?.collegeId) {
    return NextResponse.json({ error: "Missing college context" }, { status: 401 });
  }

  const body = await req.json();
  const { resultId, finalCategory, overrideNote } = body as {
    resultId?: string;
    finalCategory?: "alpha" | "beta" | "gamma";
    overrideNote?: string;
  };

  if (!resultId || !finalCategory || !["alpha", "beta", "gamma"].includes(finalCategory)) {
    return NextResponse.json({ error: "resultId and valid finalCategory are required" }, { status: 400 });
  }

  const [updated] = await db.execute(sql`
    UPDATE amcat_results
    SET
      final_category = ${finalCategory}::batch_category,
      admin_overridden = true,
      override_note = ${overrideNote || null},
      is_edited = true,
      updated_at = NOW()
    WHERE id = ${resultId}
      AND session_id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  if (!updated) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  const [distribution] = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE final_category = 'alpha')::int AS alpha,
      COUNT(*) FILTER (WHERE final_category = 'beta')::int AS beta,
      COUNT(*) FILTER (WHERE final_category = 'gamma')::int AS gamma
    FROM amcat_results
    WHERE session_id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
  `) as unknown as Array<{ alpha: number; beta: number; gamma: number }>;

  await db.execute(sql`
    UPDATE amcat_sessions
    SET
      alpha_count = ${distribution.alpha},
      beta_count = ${distribution.beta},
      gamma_count = ${distribution.gamma},
      status = CASE WHEN status = 'draft' THEN 'review' ELSE status END,
      updated_at = NOW()
    WHERE id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
  `);

  return NextResponse.json({ success: true });
}
