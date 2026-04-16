import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/[id] — Check the status of a background job.
 *
 * Used by the frontend to poll for resume parsing completion.
 * Returns status, result (if completed), error (if failed), and timing info.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        await requireAuth();

        if (!id) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 },
            );
        }

        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, id),
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            id: job.id,
            type: job.type,
            status: job.status,
            result: job.status === "completed" ? job.result : null,
            error: job.status === "failed" ? job.error : null,
            retryCount: job.retryCount,
            maxRetries: job.maxRetries,
            modelUsed: job.modelUsed,
            latencyMs: job.latencyMs,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        });
    } catch (error: unknown) {
        if (isRedirectError(error)) throw error;
        console.error("[Jobs API] Failed to fetch job:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
