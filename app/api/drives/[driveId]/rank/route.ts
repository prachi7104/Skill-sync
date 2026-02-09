import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { enforceRankingGeneration, GuardrailViolation, ERRORS } from "@/lib/guardrails";

/**
 * POST /api/drives/[driveId]/rank
 *
 * Queues a rank_students background job for a specific drive.
 * Only faculty and admin users can invoke this.
 *
 * Phase 5.5 guardrails:
 *   - Faculty can only rank drives that have NOT been ranked yet.
 *   - Admin can regenerate rankings for any drive.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    // Auth: faculty or admin only
    const user = await requireRole(["faculty", "admin"]);

    const { driveId } = params;

    if (!driveId || typeof driveId !== "string") {
      const err = ERRORS.DRIVE_INVALID_ID();
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    // UUID format check (loose)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(driveId)) {
      const err = ERRORS.DRIVE_INVALID_ID();
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    // Phase 5.5: Block re-ranking unless admin
    await enforceRankingGeneration(driveId, user.role as "faculty" | "admin");

    // Dedup: skip if a pending/processing rank_students job already exists for this drive
    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        sql`${jobs.type} = 'rank_students'
          AND ${jobs.status} IN ('pending', 'processing')
          AND ${jobs.payload}->>'driveId' = ${driveId}`,
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { message: "Ranking job already queued", jobId: existing.id },
        { status: 202 },
      );
    }

    // Queue the ranking job
    const [job] = await db
      .insert(jobs)
      .values({
        type: "rank_students",
        payload: { driveId },
        priority: 8,
      })
      .returning({ id: jobs.id });

    return NextResponse.json(
      { message: "Ranking job queued", jobId: job.id },
      { status: 202 },
    );
  } catch (err: any) {
    console.error("[POST /api/drives/[driveId]/rank]", err);

    // Phase 5.5: Structured guardrail errors
    if (err instanceof GuardrailViolation) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    const message = err?.message ?? "Internal server error";

    // Drive not found
    if (message.includes("Drive not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    // Auth errors
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json(
        { error: message },
        { status: message.includes("Unauthorized") ? 401 : 403 },
      );
    }

    return NextResponse.json(
      { error: "Failed to queue ranking job" },
      { status: 500 },
    );
  }
}
