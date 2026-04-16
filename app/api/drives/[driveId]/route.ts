import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

const patchDriveSchema = z.object({
  isActive: z.boolean().optional(),
  deadline: z.string().datetime().nullable().optional(),
  rankingsVisible: z.boolean().optional(),
}).strict();

// Admin only. Permanently deletes a drive and associated rankings/jobs.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    const user = await requireRole(["admin"]);
    const { driveId } = params;

    if (!user.collegeId) {
      return NextResponse.json({ error: "Admin account not linked to a college" }, { status: 403 });
    }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!driveId || !uuidRe.test(driveId)) {
      return NextResponse.json({ error: "Invalid drive ID" }, { status: 400 });
    }

    const [drive] = await db
      .select({ id: drives.id, createdBy: drives.createdBy })
      .from(drives)
      .where(and(eq(drives.id, driveId), eq(drives.collegeId, user.collegeId)))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    // Delete in explicit order: jobs -> rankings -> drive.
    // Use typed drizzle conditions to avoid fragile JSONB text extraction.
    await db.delete(jobs).where(
      and(
        sql`${jobs.payload}->>'driveId' = ${driveId}`,
        sql`${jobs.type} IN ('rank_students', 'enhance_jd')`,
      )
    );
    await db.delete(rankings).where(eq(rankings.driveId, driveId));
    await db.delete(drives).where(eq(drives.id, driveId));

    return NextResponse.json({ success: true, deletedDriveId: driveId });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    const message = err?.message ?? "Internal server error";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
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

    if (!user.collegeId) {
      return NextResponse.json({ error: "Account not linked to a college" }, { status: 403 });
    }

    const [drive] = await db
      .select({ id: drives.id, createdBy: drives.createdBy, collegeId: drives.collegeId })
      .from(drives)
      .where(and(eq(drives.id, driveId), eq(drives.collegeId, user.collegeId)))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json();
    const parsed = patchDriveSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    }
    if (body.rankingsVisible !== undefined) updateData.rankingsVisible = body.rankingsVisible;

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