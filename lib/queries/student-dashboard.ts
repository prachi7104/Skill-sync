/**
 * Direct DB query functions for the student dashboard server component.
 *
 * These replace the former self-fetch pattern
 * (fetch(`${NEXT_PUBLIC_APP_URL}/api/student/...`)) which added unnecessary
 * HTTP round-trip latency and required NEXT_PUBLIC_APP_URL to be correct at
 * runtime. Server components have direct DB access — use it.
 *
 * API routes that previously served this data are kept intact for client-side
 * callers (career coach, mobile components, etc.).
 */

import "server-only";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AMCATResult {
  score: number | null;
  category: string | null;
  rank: number | null;
  cs_score: number | null;
  cp_score: number | null;
  automata_score: number | null;
  automata_fix_score: number | null;
  quant_score: number | null;
  total_students: number | null;
  session_name: string | null;
  test_date: string | null;
  batch_year: number | null;
  hasAmcat: boolean;
  isAbsent?: boolean;
}

export interface AMCATHistoryResult {
  score: number;
  rank: number | null;
  category: string | null;
  session_name: string;
  test_date: string | null;
  total_students: number | null;
}

export interface StudentRankResult {
  rank: number | null;
}

export interface ActiveDrivesResult {
  count: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetches the most recent published AMCAT result for the given student.
 * Mirrors the logic in `app/api/student/amcat/route.ts`.
 */
export async function getStudentAMCATData(
  studentId: string,
  collegeId: string,
): Promise<AMCATResult | null> {
  const rows = await db.execute(sql`
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
    WHERE ar.student_id = ${studentId}
      AND s.status = 'published'
      AND st.college_id = ${collegeId}
    ORDER BY s.published_at DESC
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>;

  const result = rows[0];
  if (!result) return null;

  if (result.score === -1) {
    return { hasAmcat: true, isAbsent: true, score: null, category: null, rank: null, cs_score: null, cp_score: null, automata_score: null, automata_fix_score: null, quant_score: null, total_students: null, session_name: result.session_name as string | null, test_date: result.test_date as string | null, batch_year: result.batch_year as number | null };
  }

  return {
    hasAmcat: true,
    score: result.score as number | null,
    category: result.category as string | null,
    rank: result.rank as number | null,
    cs_score: result.cs_score as number | null,
    cp_score: result.cp_score as number | null,
    automata_score: result.automata_score as number | null,
    automata_fix_score: result.automata_fix_score as number | null,
    quant_score: result.quant_score as number | null,
    total_students: result.total_students as number | null,
    session_name: result.session_name as string | null,
    test_date: result.test_date as string | null,
    batch_year: result.batch_year as number | null,
  };
}

/**
 * Fetches recent published AMCAT sessions for the student.
 * Used for dashboard trend visualization.
 */
export async function getStudentAMCATHistory(
  studentId: string,
  collegeId: string,
  limit = 5,
): Promise<AMCATHistoryResult[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 8));

  const rows = await db.execute(sql`
    SELECT
      ar.computed_total AS score,
      ar.rank_in_session AS rank,
      ar.final_category AS category,
      s.session_name,
      s.test_date,
      s.total_students
    FROM amcat_results ar
    JOIN amcat_sessions s ON s.id = ar.session_id
    JOIN students st ON st.id = ar.student_id
    WHERE ar.student_id = ${studentId}
      AND s.status = 'published'
      AND st.college_id = ${collegeId}
      AND COALESCE(ar.status, '') != 'Absent'
      AND ar.computed_total IS NOT NULL
      AND ar.computed_total >= 0
    ORDER BY s.published_at DESC, ar.created_at DESC
    LIMIT ${safeLimit}
  `) as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    score: Number(row.score ?? 0),
    rank: row.rank == null ? null : Number(row.rank),
    category: row.category as string | null,
    session_name: String(row.session_name ?? ''),
    test_date: row.test_date as string | null,
    total_students: row.total_students == null ? null : Number(row.total_students),
  }));
}

/**
 * Fetches the student's overall leaderboard rank within their college's most
 * recent published AMCAT session.
 */
export async function getStudentRank(
  studentId: string,
  collegeId: string,
): Promise<StudentRankResult> {
  const rows = await db.execute(sql`
    WITH latest_session AS (
      SELECT id
      FROM amcat_sessions
      WHERE college_id = ${collegeId}
        AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 1
    ),
    ranked AS (
      SELECT
        student_id,
        ROW_NUMBER() OVER (ORDER BY computed_total DESC, rank_in_session ASC) AS rank
      FROM amcat_results
      WHERE session_id = (SELECT id FROM latest_session)
        AND college_id = ${collegeId}
        AND COALESCE(status, '') != 'Absent'
    )
    SELECT rank::int AS rank
    FROM ranked
    WHERE student_id = ${studentId}
    LIMIT 1
  `) as unknown as Array<{ rank: number | null }>;

  return { rank: rows[0]?.rank ?? null };
}

/**
 * Counts the number of currently active (open) drives scoped to the student's
 * college.
 */
export async function getStudentActiveDrivesCount(
  collegeId: string,
): Promise<ActiveDrivesResult> {
  const rows = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM drives
    WHERE college_id = ${collegeId}
      AND is_active = true
  `) as unknown as Array<{ count: number }>;

  return { count: rows[0]?.count ?? 0 };
}
