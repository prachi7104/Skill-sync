import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * PATCH /api/admin/jobs
 * Admin can reset failed jobs back to pending for retry.
 * Body: { type?: "generate_embedding" | "parse_resume" | ..., action: "reset_failed" }
 */
export async function PATCH(req: NextRequest) {
    try {
        await requireRoleApi(["admin"]);

        const body = await req.json();
        const { type, action } = body;

        if (action !== "reset_failed") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const conditions = [eq(jobs.status, "failed")];
        if (type) conditions.push(eq(jobs.type, type));

        const updated = await db
            .update(jobs)
            .set({
                status: "pending",
                retryCount: 0,
                error: null,
                updatedAt: new Date(),
            })
            .where(and(...conditions))
            .returning({ id: jobs.id });

        return NextResponse.json({
            message: `Reset ${updated.length} failed jobs`,
            count: updated.length,
        });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode },
            );
        }
        console.error("[PATCH /api/admin/jobs]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
