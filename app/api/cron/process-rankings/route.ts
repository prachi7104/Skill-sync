import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { computeRanking } from "@/lib/matching";
import { logger } from "@/lib/logger";
import { CRON_SECRET } from "@/lib/env";

export const dynamic = "force-dynamic";
// Vercel Hobby plan: 10s max function duration.
// Rankings are chunked via MAX_JOBS_PER_TICK (3 per cron trigger).
// Triggered by Supabase pg_cron every 10 minutes (see drizzle/0006_pg_cron_workers.sql).


const MAX_JOBS_PER_TICK = 3;

/**
 * GET /api/cron/process-rankings
 *
 * Cron worker that polls for pending rank_students jobs and processes them.
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Recover stuck jobs (processing for >5 minutes and still have retries left)
    await db.update(jobs)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(and(
        eq(jobs.status, 'processing'),
        lt(jobs.updatedAt, new Date(Date.now() - 5 * 60 * 1000)),
        lt(jobs.retryCount, jobs.maxRetries)
      ));

    logger.info("Checking for pending rank_students jobs");

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
      // 1. Find one pending rank_students job
      const [pendingJob] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(
          and(eq(jobs.type, "rank_students"), eq(jobs.status, "pending")),
        )
        .orderBy(jobs.priority, jobs.createdAt)
        .limit(1);

      if (!pendingJob) break; // queue drained

      // 2. Atomically claim it
      const claimed = await db
        .update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(and(eq(jobs.id, pendingJob.id), eq(jobs.status, "pending")))
        .returning();

      if (claimed.length === 0) continue; // another worker grabbed it

      const job = claimed[0];
      const startTime = Date.now();

      try {
        const { driveId } = job.payload as { driveId: string };
        logger.info(`[Cron:Rankings] Processing job ${job.id} for drive ${driveId}`);
        const result = await computeRanking(driveId);

        // Mark complete
        await db
          .update(jobs)
          .set({
            status: "completed",
            result: result as any,
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        logger.info("Ranking job completed", {
          jobId: job.id,
          driveId,
          rankedStudents: result.rankedStudents,
          durationMs: result.durationMs,
        });
        processed++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error("Ranking job failed", { jobId: job.id, error: message });

        const newRetryCount = (job.retryCount ?? 0) + 1;
        const maxRetries = job.maxRetries ?? 3;

        await db
          .update(jobs)
          .set({
            status: newRetryCount < maxRetries ? "pending" : "failed",
            error: message,
            retryCount: newRetryCount,
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        failed++;
      }
    }

    return NextResponse.json(
      { message: "Rankings worker executed", processed, failed },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Cron:Rankings] Worker failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
