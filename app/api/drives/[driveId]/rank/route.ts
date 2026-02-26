import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
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
    const user = await requireRoleApi(["faculty", "admin"]);

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

    // Verify drive exists and faculty owns it
    const [drive] = await db
      .select({ id: drives.id, createdBy: drives.createdBy })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    // Faculty must own the drive; admin can rank any drive
    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: you do not own this drive" },
        { status: 403 },
      );
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

    // Fire-and-forget: inline ranking so faculty doesn't wait for cron
    import("@/lib/matching").then(({ computeRanking }) => {
      // Claim the job first
      db.update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(sql`${jobs.id} = ${job.id} AND ${jobs.status} = 'pending'`)
        .then(() => computeRanking(driveId))
        .then((result) => {
          db.update(jobs)
            .set({
              status: "completed",
              result: result as any,
              updatedAt: new Date(),
            })
            .where(eq(jobs.id, job.id))
            .catch(console.error);
        })
        .catch((err) => {
          console.error("[Rank] Inline ranking failed:", err);
          // Job stays pending for cron to retry
        });
    }).catch(console.error);

    return NextResponse.json(
      { message: "Ranking job queued", jobId: job.id },
      { status: 202 },
    );
  } catch (err: unknown) {
    console.error("[POST /api/drives/[driveId]/rank]", err);

    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    // Phase 5.5: Structured guardrail errors
    if (err instanceof GuardrailViolation) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Internal server error";

    // Drive not found
    if (message.includes("Drive not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to queue ranking job" },
      { status: 500 },
    );
  }
}
