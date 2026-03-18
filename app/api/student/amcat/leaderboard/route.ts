import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/helpers";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["student"]);

    if (!user.collegeId) {
      return NextResponse.json({ hasData: false });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    const [latestSession] = await db.execute(sql`
      SELECT
        id,
        session_name,
        test_date,
        total_students,
        alpha_count,
        beta_count,
        gamma_count
      FROM amcat_sessions
      WHERE college_id = ${user.collegeId}
        AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    if (!latestSession) {
      return NextResponse.json({ hasData: false });
    }

    const targetSessionId = (sessionId ?? String(latestSession.id)).trim();

    const [sessionRow] = await db.execute(sql`
      SELECT
        id,
        session_name,
        test_date,
        total_students,
        alpha_count,
        beta_count,
        gamma_count
      FROM amcat_sessions
      WHERE id = ${targetSessionId}
        AND college_id = ${user.collegeId}
        AND status = 'published'
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    if (!sessionRow) {
      return NextResponse.json({ hasData: false, error: "Session not found" }, { status: 404 });
    }

    const top50 = await db.execute(sql`
      SELECT
        rank_in_session AS rank,
        full_name AS name,
        branch,
        computed_total AS score,
        final_category AS category
      FROM amcat_results
      WHERE session_id = ${targetSessionId}
        AND college_id = ${user.collegeId}
        AND COALESCE(status, '') != 'Absent'
      ORDER BY rank_in_session ASC
      LIMIT 50
    `);

    const [myRank] = await db.execute(sql`
      SELECT
        rank_in_session AS rank,
        computed_total AS score,
        final_category AS category
      FROM amcat_results
      WHERE session_id = ${targetSessionId}
        AND college_id = ${user.collegeId}
        AND student_id = ${user.id}
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    const sessions = await db.execute(sql`
      SELECT
        id,
        session_name,
        test_date,
        batch_year
      FROM amcat_sessions
      WHERE college_id = ${user.collegeId}
        AND status = 'published'
      ORDER BY published_at DESC
    `);

    return NextResponse.json({
      hasData: true,
      session: sessionRow,
      sessions,
      top50,
      myRank: myRank ?? null,
      isInTop50: myRank ? Number(myRank.rank) <= 50 : false,
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ hasData: false, error: "Unable to fetch leaderboard" }, { status: 500 });
  }
}
