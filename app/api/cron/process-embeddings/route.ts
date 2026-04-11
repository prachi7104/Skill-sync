import { NextRequest, NextResponse } from "next/server";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { validateCronAuth } from "@/lib/env";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";



/**
 * GET /api/cron/process-embeddings
 *
 * Cron worker that polls for pending generate_embedding jobs and processes them.
 * Generates 768-dim embeddings for student profiles using text-embedding-004.
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    if (!validateCronAuth(req.headers.get("authorization"))) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Recover stuck jobs (processing for >5 minutes and still have retries left)
    await db.update(jobs)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(and(
        eq(jobs.type, "generate_embedding"),
        eq(jobs.status, 'processing'),
        lt(jobs.updatedAt, new Date(Date.now() - 5 * 60 * 1000)),
        lt(jobs.retryCount, jobs.maxRetries)
      ));

    const result = await processEmbeddingJobs();

    return NextResponse.json(
      { message: "Embeddings worker executed", ...result },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Cron:Embeddings] Worker failed:", err);
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: "cron_worker_failure",
      worker: "process-embeddings"
    }, { status: 500 });
  }
}
