import "server-only";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { getRedis } from "@/lib/redis";

async function testRedisConnection(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try { await redis.ping(); return true; } catch { return false; }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout_${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}

function safeCount(r: PromiseSettledResult<unknown>): number {
  if (r.status === "rejected") return -1;
  return (r.value as Array<{ count: number }>)?.[0]?.count ?? 0;
}

export async function GET() {
  try {
    await requireRole(["admin"]);
    const MS = 12000;
    const q = (rawSql: ReturnType<typeof sql>) => withTimeout(db.execute(rawSql), MS);

    const results = await Promise.allSettled([
      q(sql`SELECT count(*)::int as count FROM students`),
      q(sql`SELECT count(*)::int as count FROM students WHERE profile_completeness >= 80`),
      q(sql`SELECT count(*)::int as count FROM students WHERE embedding IS NOT NULL`),
      q(sql`SELECT count(*)::int as count FROM drives`),
      q(sql`SELECT count(*)::int as count FROM drives WHERE ranking_status = 'completed'`),
      q(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'pending'::job_status`),
      q(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'failed'::job_status`),
      q(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'completed'::job_status AND updated_at > NOW() - INTERVAL '24 hours'`),
      withTimeout(testRedisConnection(), 3000),
    ]);

    results.forEach((r, i) => {
      if (r.status === "rejected")
        console.warn(`[health] query[${i}] failed:`, (r.reason as { message?: string })?.message ?? r.reason);
    });

    const redisR = results[8];
    return NextResponse.json({
      totalStudents: safeCount(results[0]),
      studentsOnboarded: safeCount(results[1]),
      studentsWithEmbeddings: safeCount(results[2]),
      drivesCreated: safeCount(results[3]),
      drivesRanked: safeCount(results[4]),
      jobsPending: safeCount(results[5]),
      jobsFailed: safeCount(results[6]),
      jobsCompletedToday: safeCount(results[7]),
      redisOk: redisR.status === "fulfilled" ? (redisR.value as boolean) : false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error("[GET /api/admin/health]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
