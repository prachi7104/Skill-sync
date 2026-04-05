import "server-only";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { getRedis } from "@/lib/redis";

async function testRedis(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try { await r.ping(); return true; } catch { return false; }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}

function safeCount(r: PromiseSettledResult<unknown>): number {
  if (r.status === "rejected") return -1;
  const rows = r.value as Array<{ count: number }>;
  return rows?.[0]?.count ?? 0;
}

export async function GET() {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "Admin account not linked to a college" }, { status: 400 });
    }

    const Q = 4000;
    const ex = (q: ReturnType<typeof sql>) => withTimeout(db.execute(q), Q);
    const checkNames = [
      "total_students",
      "students_onboarded",
      "students_with_embeddings",
      "drives_created",
      "drives_ranked",
      "jobs_pending",
      "jobs_failed",
      "jobs_completed_today",
      "redis_ping",
    ] as const;

    const R = await Promise.allSettled([
      ex(sql`SELECT count(*)::int as count FROM students WHERE college_id = ${user.collegeId}`),
      ex(sql`SELECT count(*)::int as count FROM students WHERE college_id = ${user.collegeId} AND profile_completeness >= 80`),
      ex(sql`SELECT count(*)::int as count FROM students WHERE college_id = ${user.collegeId} AND embedding IS NOT NULL`),
      ex(sql`SELECT count(*)::int as count FROM drives WHERE college_id = ${user.collegeId}`),
      ex(sql`SELECT count(*)::int as count FROM drives WHERE college_id = ${user.collegeId} AND ranking_status = 'completed'`),
      ex(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'pending'::job_status`),
      ex(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'failed'::job_status`),
      ex(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'completed'::job_status AND updated_at > NOW() - INTERVAL '24 hours'`),
      withTimeout(testRedis(), 3000),
    ]);

    const failedChecks = R
      .map((result, idx) => (result.status === "rejected" ? checkNames[idx] : null))
      .filter(Boolean) as string[];

    R.forEach((r, i) => {
      if (r.status === "rejected")
        console.warn(`[health] query[${i}] failed:`, (r.reason as { message?: string })?.message ?? r.reason);
    });

    const redis = R[8];
    return NextResponse.json({
      totalStudents: safeCount(R[0]),
      studentsOnboarded: safeCount(R[1]),
      studentsWithEmbeddings: safeCount(R[2]),
      drivesCreated: safeCount(R[3]),
      drivesRanked: safeCount(R[4]),
      jobsPending: safeCount(R[5]),
      jobsFailed: safeCount(R[6]),
      jobsCompletedToday: safeCount(R[7]),
      redisOk: redis.status === "fulfilled" ? (redis.value as boolean) : false,
      degraded: failedChecks.length > 0,
      failedChecks,
      queryTimeoutMs: Q,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error("[GET /api/admin/health]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
