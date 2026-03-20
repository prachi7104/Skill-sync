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

// Wraps a promise with a timeout. Returns the promise or rejects after ms.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// Safely extract a count from a Promise.allSettled result
function safeCount(result: PromiseSettledResult<unknown>): number {
  if (result.status === "rejected") return -1;
  const rows = result.value as Array<{ count?: number }>;
  return rows?.[0]?.count ?? 0;
}

export async function GET() {
  try {
    await requireRole(["admin"]);

    const QUERY_TIMEOUT = 12000; // 12 seconds per query

    const results = await Promise.allSettled([
      // [0] total students
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM students`),
        QUERY_TIMEOUT
      ),
      // [1] onboarded (completeness >= 80)
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM students WHERE profile_completeness >= 80`),
        QUERY_TIMEOUT
      ),
      // [2] with embedding
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM students WHERE embedding IS NOT NULL`),
        QUERY_TIMEOUT
      ),
      // [3] total drives
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM drives`),
        QUERY_TIMEOUT
      ),
      // [4] ranked drives
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM drives WHERE ranking_status = 'completed'`),
        QUERY_TIMEOUT
      ),
      // [5] pending jobs — uses explicit enum cast to hit the index
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'pending'::job_status`),
        QUERY_TIMEOUT
      ),
      // [6] failed jobs — explicit enum cast
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'failed'::job_status`),
        QUERY_TIMEOUT
      ),
      // [7] completed in last 24h
      withTimeout(
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'completed'::job_status AND updated_at > NOW() - INTERVAL '24 hours'`),
        QUERY_TIMEOUT
      ),
      // [8] redis
      withTimeout(testRedisConnection(), 3000),
    ]);

    // Log any failures for debugging (not returned to client)
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`[health] Query ${i} failed:`, (r.reason as { message?: string })?.message ?? r.reason);
      }
    });

    const redisResult = results[8];
    const redisOk = redisResult.status === "fulfilled" ? (redisResult.value as boolean) : false;

    return NextResponse.json({
      totalStudents: safeCount(results[0]),
      studentsOnboarded: safeCount(results[1]),
      studentsWithEmbeddings: safeCount(results[2]),
      drivesCreated: safeCount(results[3]),
      drivesRanked: safeCount(results[4]),
      jobsPending: safeCount(results[5]),
      jobsFailed: safeCount(results[6]),
      jobsCompletedToday: safeCount(results[7]),
      redisOk,
      // -1 means that specific query timed out — UI should show "—" not a number
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error("[GET /api/admin/health]", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}
