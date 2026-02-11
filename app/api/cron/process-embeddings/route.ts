import { NextRequest, NextResponse } from "next/server";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";

export const dynamic = "force-dynamic";



/**
 * GET /api/cron/process-embeddings
 *
 * Cron worker that polls for pending generate_embedding jobs and processes them.
 * Generates 384-dim embeddings for student profiles using all-MiniLM-L6-v2.
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await processEmbeddingJobs();

    return NextResponse.json(
      { message: "Embeddings worker executed", ...result },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Cron:Embeddings] Worker failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
