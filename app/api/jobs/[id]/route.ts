import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/db/schema";
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

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

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { role: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (job.payload ?? {}) as Record<string, unknown>;
        const payloadStudentId = typeof payload.studentId === "string" ? payload.studentId : null;

        // Students can only read their own jobs.
        if (currentUser.role === "student" && payloadStudentId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Faculty can only read student-scoped jobs in their own context. For now,
        // restrict faculty to jobs tied to their own account.
        if (currentUser.role === "faculty" && payloadStudentId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const isSensitiveJob = job.type === "parse_resume";
        const includeResult = !isSensitiveJob || currentUser.role === "admin";
        const includeError = currentUser.role === "admin";

        return NextResponse.json({
            id: job.id,
            type: job.type,
            status: job.status,
            result: job.status === "completed" && includeResult ? job.result : null,
            error: job.status === "failed" && includeError ? job.error : null,
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
