import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

// Admin only. Permanently deletes a drive and associated rankings/jobs.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    await requireRole(["admin"]);
    const { driveId } = params;

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!driveId || !uuidRe.test(driveId)) {
      return NextResponse.json({ error: "Invalid drive ID" }, { status: 400 });
    }

    const [drive] = await db
      .select({ id: drives.id, createdBy: drives.createdBy })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    // Delete in explicit order: jobs -> rankings -> drive.
    await db.delete(jobs).where(sql`${jobs.payload}->>'driveId' = ${driveId}`);
    await db.delete(rankings).where(eq(rankings.driveId, driveId));
    await db.delete(drives).where(eq(drives.id, driveId));

    return NextResponse.json({ success: true, deletedDriveId: driveId });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Faculty or Admin. Supports isActive/deadline updates.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    const { driveId } = params;

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!driveId || !uuidRe.test(driveId)) {
      return NextResponse.json({ error: "Invalid drive ID" }, { status: 400 });
    }

    const [drive] = await db
      .select({ id: drives.id, createdBy: drives.createdBy })
      .from(drives)
      .where(eq(drives.id, driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as { isActive?: boolean; deadline?: string | null };
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    }

    const [updated] = await db
      .update(drives)
      .set(updateData)
      .where(eq(drives.id, driveId))
      .returning({ id: drives.id, isActive: drives.isActive });

    return NextResponse.json({ success: true, drive: updated });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}