import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { enforceRankingGeneration, GuardrailViolation, ERRORS } from "@/lib/guardrails";
import { isRedirectError } from "next/dist/client/components/redirect";

/**
 * POST /api/drives/[driveId]/rank
 *
 * Queues a rank_students background job for a specific drive.
 * Only admin users can invoke this.
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
    // Auth: admin only
    const user = await requireRole(["admin"]);

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

    // Ensure drive exists and is scoped to the admin's college
    const [driveCheck] = await db
      .select({ parsedJd: drives.parsedJd, collegeId: drives.collegeId })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!driveCheck) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (!user.collegeId || driveCheck.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Keep guardrail contract explicit (admin-only trigger route).
    await enforceRankingGeneration(driveId, "admin");

    // Ensure JD enhancement has completed before queuing ranking

    const hasParsedJd =
      driveCheck?.parsedJd &&
      typeof driveCheck.parsedJd === "object" &&
      Object.keys(driveCheck.parsedJd as unknown as Record<string, unknown>)
        .length > 0;

    if (!hasParsedJd) {
      return NextResponse.json(
        {
          error:
            "JD enhancement has not completed yet. Please wait a few minutes and try again.",
        },
        { status: 422 },
      );
    }

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

    // Queue the ranking job — mark as 'processing' to prevent cron from grabbing it
    // during the inline execution attempt. If inline fails, we reset to 'pending'.
    const [job] = await db
      .insert(jobs)
      .values({
        type: "rank_students",
        status: "processing",
        payload: { driveId },
        priority: 8,
      })
      .returning({ id: jobs.id });

    try {
      // Import inline ranking
      const { computeRanking } = await import("@/lib/matching");
      const result = await computeRanking(driveId);
      
      // Mark job as completed immediately
      await db.update(jobs)
        .set({ status: "completed", result: result as unknown as Record<string, unknown>, latencyMs: result.durationMs, updatedAt: new Date() })
        .where(eq(jobs.id, job.id));

      // Update drive ranking_status
      await db.update(drives)
        .set({ ranking_status: "completed", updatedAt: new Date() })
        .where(eq(drives.id, driveId));

      return NextResponse.json(
        {
          message: "Rankings generated successfully",
          rankedStudents: result.rankedStudents,
          wasTruncated: result.wasTruncated,
          truncationNote: result.wasTruncated
            ? `Only first ${result.truncatedAt} of ${result.totalStudents} students were ranked (ordered by registration date). Upgrade to process all students.`
            : undefined,
        },
        { status: 200 }
      );
    } catch (rankingError) {
      // Inline failed — reset to pending so cron picks it up
      await db.update(jobs)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(jobs.id, job.id))
        .catch(() => {}); // non-fatal

      console.error("[rank] Inline ranking failed, reset to pending for cron:", rankingError);
      return NextResponse.json(
        { message: "Ranking queued. Results will be available within 5 minutes.", jobId: job.id },
        { status: 202 }
      );
    }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err;
    console.error("[POST /api/drives/[driveId]/rank]", err);

    // Phase 5.5: Structured guardrail errors
    if (err instanceof GuardrailViolation) {
      return NextResponse.json(err.toJSON(), { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Internal server error";

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
