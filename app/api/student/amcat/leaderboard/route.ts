import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isOnboardingRequiredError, requireStudentApiPolicyAccess } from "@/lib/auth/helpers";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireStudentApiPolicyAccess("/api/student/amcat/leaderboard");

    if (!user.collegeId) {
      return NextResponse.json({ hasData: false });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const branchParam = (url.searchParams.get("branch") ?? "").trim();
    const hasBranchFilter = branchParam.length > 0 && branchParam.toLowerCase() !== "all";

    const [latestSession] = await db.execute(sql`
      SELECT
        s.id,
        s.session_name,
        s.test_date,
        s.batch_year,
        s.academic_year,
        s.status,
        s.total_students,
        s.score_weights,
        s.category_thresholds,
        s.published_at,
        s.created_at,
        COUNT(CASE WHEN r.final_category = 'alpha' THEN 1 END)::int AS alpha_count,
        COUNT(CASE WHEN r.final_category = 'beta'  THEN 1 END)::int AS beta_count,
        COUNT(CASE WHEN r.final_category = 'gamma' THEN 1 END)::int AS gamma_count,
        COUNT(r.id)::int AS matched_count
      FROM amcat_sessions s
      LEFT JOIN amcat_results r ON r.session_id = s.id
      WHERE s.college_id = ${user.collegeId}
        AND s.status = 'published'
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    if (!latestSession) {
      return NextResponse.json({ hasData: false });
    }

    const targetSessionId = (sessionId ?? String(latestSession.id)).trim();

    const [sessionRow] = await db.execute(sql`
      SELECT
        s.id,
        s.session_name,
        s.test_date,
        s.batch_year,
        s.academic_year,
        s.status,
        s.total_students,
        s.score_weights,
        s.category_thresholds,
        s.published_at,
        s.created_at,
        COUNT(CASE WHEN r.final_category = 'alpha' THEN 1 END)::int AS alpha_count,
        COUNT(CASE WHEN r.final_category = 'beta'  THEN 1 END)::int AS beta_count,
        COUNT(CASE WHEN r.final_category = 'gamma' THEN 1 END)::int AS gamma_count,
        COUNT(r.id)::int AS matched_count
      FROM amcat_sessions s
      LEFT JOIN amcat_results r ON r.session_id = s.id
      WHERE s.id = ${targetSessionId}
        AND s.college_id = ${user.collegeId}
        AND s.status = 'published'
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    if (!sessionRow) {
      return NextResponse.json({ hasData: false, error: "Session not found" }, { status: 404 });
    }

    const top50 = await db.execute(sql`
      WITH ranked AS (
        SELECT
          full_name,
          branch,
          computed_total,
          final_category,
          ROW_NUMBER() OVER (ORDER BY computed_total DESC, rank_in_session ASC) AS rank
        FROM amcat_results
        WHERE session_id = ${targetSessionId}
          AND college_id = ${user.collegeId}
          AND COALESCE(status, '') != 'Absent'
          ${hasBranchFilter ? sql`AND branch = ${branchParam}` : sql``}
      )
      SELECT
        rank,
        full_name AS name,
        branch,
        computed_total AS score,
        final_category AS category
      FROM ranked
      ORDER BY rank ASC
      LIMIT 50
    `);

    const [myRank] = await db.execute(sql`
      WITH ranked AS (
        SELECT
          student_id,
          ROW_NUMBER() OVER (ORDER BY computed_total DESC, rank_in_session ASC) AS rank,
          computed_total AS score,
          final_category AS category
        FROM amcat_results
        WHERE session_id = ${targetSessionId}
          AND college_id = ${user.collegeId}
          AND COALESCE(status, '') != 'Absent'
          ${hasBranchFilter ? sql`AND branch = ${branchParam}` : sql``}
      )
      SELECT
        rank,
        score,
        category
      FROM ranked
      WHERE student_id = ${user.id}
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;

    const branchRows = await db.execute(sql`
      SELECT DISTINCT branch
      FROM amcat_results
      WHERE session_id = ${targetSessionId}
        AND college_id = ${user.collegeId}
        AND branch IS NOT NULL
        AND btrim(branch) <> ''
      ORDER BY branch ASC
    `) as unknown as Array<{ branch: string | null }>;

    const branches = branchRows
      .map((row) => (typeof row.branch === "string" ? row.branch : ""))
      .filter((branch) => branch.length > 0);

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
      branches,
      appliedBranch: hasBranchFilter ? branchParam : "all",
      top50,
      myRank: myRank ?? null,
      isInTop50: myRank ? Number(myRank.rank) <= 50 : false,
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (isOnboardingRequiredError(error)) {
      return NextResponse.json({ hasData: false, error: error.message, code: "ONBOARDING_REQUIRED" }, { status: error.status });
    }
    return NextResponse.json({ hasData: false, error: "Unable to fetch leaderboard" }, { status: 500 });
  }
}
