import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

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
    const user = await requireRole(["faculty", "admin"]);

    const { driveId } = params;

    if (!driveId || typeof driveId !== "string") {
      return NextResponse.json({ error: "Invalid drive ID" }, { status: 400 });
    }

    // Get the ranking status directly from the drives table
    const [drive] = await db
      .select({
        ranking_status: sql<string>`${drives}.ranking_status`,
        createdBy: drives.createdBy,
        collegeId: drives.collegeId,
      })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "admin" && (!user.collegeId || drive.collegeId !== user.collegeId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ status: drive.ranking_status });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error("[GET /api/drives/[driveId]/rank/status]", err);

    const message = err?.message ?? "Internal server error";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json(
        { error: message },
        { status: message.includes("Unauthorized") ? 401 : 403 },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch ranking status" },
      { status: 500 },
    );
  }
}
