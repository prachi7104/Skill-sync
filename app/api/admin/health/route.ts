import "server-only";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, rankings, jobs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { getRedis } from "@/lib/redis";

async function testRedisConnection(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/health
 *
 * Admin-only system health overview. Raw counts only.
 * No charts, no exports, no filters.
 *
 * Returns:
 *   studentsOnboarded   — students with profile_completeness >= 80
 *   studentsWithEmbeddings — students with non-null embedding
 *   drivesCreated       — total drives
 *   drivesRanked        — drives with at least 1 ranking row
 *   jobFailures         — jobs with status = 'failed'
 */
export async function GET() {
  try {
    await requireRole(["admin"]);

    // 5-second timeout wrapper to prevent any single slow query from blocking
    function withDbTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`DB query timeout: ${label}`)),
          5000,
        );
        promise.then(
          (val) => { clearTimeout(timer); resolve(val); },
          (err) => { clearTimeout(timer); reject(err); },
        );
      });
    }

    // Execute all counts + Redis ping in parallel (each with 5s timeout)
    const [
      onboardedResult,
      embeddingsResult,
      drivesCreatedResult,
      drivesRankedResult,
      jobFailuresResult,
      totalStudentsResult,
      redisOk,
    ] = await Promise.all([
      // Students considered onboarded by profile completeness
      withDbTimeout(
        db.select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(sql`${students.profileCompleteness} >= 80`),
        "onboarded_count",
      ),

      // Students with non-null embedding (raw SQL to avoid pgvector isNotNull scan)
      withDbTimeout(
        db.execute(sql`SELECT COUNT(*)::int AS count FROM students WHERE embedding IS NOT NULL`),
        "embeddings_count",
      ),

      // Total drives
      withDbTimeout(
        db.select({ count: sql<number>`count(*)::int` }).from(drives),
        "drives_count",
      ),

      // Drives that have at least one ranking row
      withDbTimeout(
        db.select({ count: sql<number>`count(distinct ${rankings.driveId})::int` })
          .from(rankings),
        "drives_ranked_count",
      ),

      // Failed jobs
      withDbTimeout(
        db.select({ count: sql<number>`count(*)::int` })
          .from(jobs)
          .where(eq(jobs.status, "failed")),
        "job_failures_count",
      ),

      // Total student rows
      withDbTimeout(
        db.select({ count: sql<number>`count(*)::int` }).from(students),
        "total_students_count",
      ),

      // Redis connectivity check
      testRedisConnection(),
    ]);

    return NextResponse.json(
      {
        totalStudents: totalStudentsResult[0]?.count ?? 0,
        studentsOnboarded: onboardedResult[0]?.count ?? 0,
        studentsWithEmbeddings: (embeddingsResult as unknown as Array<{ count: number }>)[0]?.count ?? 0,
        drivesCreated: drivesCreatedResult[0]?.count ?? 0,
        drivesRanked: drivesRankedResult[0]?.count ?? 0,
        jobFailures: jobFailuresResult[0]?.count ?? 0,
        redisOk,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    const message = err?.message ?? "Internal server error";

    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[GET /api/admin/health]", err);
    return NextResponse.json(
      { error: "Failed to retrieve system health" },
      { status: 500 },
    );
  }
}
