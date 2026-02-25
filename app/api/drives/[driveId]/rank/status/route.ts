import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs, rankings } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/drives/[driveId]/rank/status
 *
 * Returns the current state of ranking for a drive:
 *   - The latest rank_students job status (pending/processing/completed/failed)
 *   - The count of existing rankings
 *
 * Used by the frontend to poll progress after queueing a ranking job.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { driveId: string } },
) {
  try {
    await requireRoleApi(["faculty", "admin"]);

    const { driveId } = params;

    if (!driveId || typeof driveId !== "string") {
      return NextResponse.json({ error: "Invalid drive ID" }, { status: 400 });
    }

    // Find the latest rank_students job for this drive
    const [latestJob] = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        error: jobs.error,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        latencyMs: jobs.latencyMs,
      })
      .from(jobs)
      .where(
        sql`${jobs.type} = 'rank_students'
          AND ${jobs.payload}->>'driveId' = ${driveId}`,
      )
      .orderBy(sql`${jobs.createdAt} DESC`)
      .limit(1);

    // Count existing rankings for this drive
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rankings)
      .where(eq(rankings.driveId, driveId));

    const rankingsCount = countResult?.count ?? 0;

    return NextResponse.json({
      driveId,
      rankingsCount,
      job: latestJob
        ? {
          id: latestJob.id,
          status: latestJob.status,
          error: latestJob.error,
          createdAt: latestJob.createdAt,
          updatedAt: latestJob.updatedAt,
          latencyMs: latestJob.latencyMs,
        }
        : null,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    console.error("[GET /api/drives/[driveId]/rank/status]", err);
    return NextResponse.json(
      { error: "Failed to fetch ranking status" },
      { status: 500 },
    );
  }
}
