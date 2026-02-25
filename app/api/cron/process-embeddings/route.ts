import { NextRequest, NextResponse } from "next/server";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30s Vercel function limit

/**
 * GET /api/cron/process-embeddings
 *
 * Cron worker that polls for pending generate_embedding jobs and processes them.
 * - Checks DB-backed rate limits before starting
 * - Deduplicates: skips if student already has a pending job
 * - Processes N jobs per tick (N = safe budget from DB rate limiter)
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  // Security: verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmbeddingJobs();

    logger.info("[Cron:Embeddings] Worker completed", result);

    return NextResponse.json(
      { message: "Embeddings worker executed", ...result },
      { status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Cron:Embeddings] Worker failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
