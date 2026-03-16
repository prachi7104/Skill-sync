import "server-only";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/helpers";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function GET() {
  try {
    const user = await requireRole(["student"]);

    if (!user.collegeId) {
      return NextResponse.json({ hasAmcat: false });
    }

    const [result] = await db.execute(sql`
      SELECT
        ar.computed_total AS score,
        ar.final_category AS category,
        ar.rank_in_session AS rank,
        ar.cs_score,
        ar.cp_score,
        ar.automata_score,
        ar.automata_fix_score,
        ar.quant_score,
        s.total_students,
        s.session_name,
        s.test_date,
        s.batch_year
      FROM amcat_results ar
      JOIN amcat_sessions s ON s.id = ar.session_id
      JOIN students st ON st.id = ar.student_id
      WHERE ar.student_id = ${user.id}
        AND s.status = 'published'
        AND st.college_id = ${user.collegeId}
      ORDER BY s.published_at DESC
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    if (!result) {
      return NextResponse.json({ hasAmcat: false, reason: "no_session" });
    }

    if (result && result.score === -1) {
      return NextResponse.json({
        hasAmcat: true,
        ...result,
        isAbsent: true,
        score: null,
        category: null,
      });
    }

    return NextResponse.json({ hasAmcat: true, ...result });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ hasAmcat: false, error: "Unable to fetch AMCAT data" }, { status: 500 });
  }
}
