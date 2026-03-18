
import { NextRequest, NextResponse } from "next/server";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";
import { CRON_SECRET } from "@/lib/env";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

// Secret key for cron authentication (should be set in environment variables)


export async function GET(req: NextRequest) {
    try {
        // Security: Verify cron secret to prevent unauthorized access
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

        logger.info("Triggering resume parse worker...");
        const processed = await processResumeParseJobs();

        return NextResponse.json({ message: "Worker executed", processed }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Worker failed:", err);
        return NextResponse.json({
            error: message,
            timestamp: new Date().toISOString(),
            type: "cron_worker_failure",
            worker: "process-resumes"
        }, { status: 500 });
    }
}
