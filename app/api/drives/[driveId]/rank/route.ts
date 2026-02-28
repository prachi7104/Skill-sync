import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { enforceRankingGeneration, GuardrailViolation, ERRORS } from "@/lib/guardrails";
import { computeRanking } from "@/lib/matching";

// Vercel: allow up to 60s for this serverless function
export const maxDuration = 60;

/**
 * POST /api/drives/[driveId]/rank
 *
 * Synchronously computes rankings for a specific drive.
 * Only faculty and admin users can invoke this.
 *
 * Returns 200 with ranking result on success.
 * Returns 409 if a ranking job is already actively processing.
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

    // Phase 5.5: Block if a ranking job is actively processing
    await enforceRankingGeneration(driveId);

    // Dedup: return 409 if a pending/processing rank_students job already exists
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
        { message: "Rankings are currently being computed. Please wait.", jobId: existing.id },
        { status: 409 },
      );
    }

    // Run ranking synchronously — this works on Vercel because we await before returning
    const result = await computeRanking(driveId);

    return NextResponse.json(
      { message: "Rankings computed successfully", result },
      { status: 200 },
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
      { error: "Failed to compute rankings", details: message },
      { status: 500 },
    );
  }
}
