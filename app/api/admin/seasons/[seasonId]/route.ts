import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";

const updateSeasonSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { seasonId: string } },
) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateSeasonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(and(eq(seasons.id, params.seasonId), eq(seasons.collegeId, user.collegeId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ message: "Season not found" }, { status: 404 });
    }

    const startsAtDate = updates.startsAt === undefined
      ? undefined
      : (updates.startsAt ? new Date(updates.startsAt) : null);
    const endsAtDate = updates.endsAt === undefined
      ? undefined
      : (updates.endsAt ? new Date(updates.endsAt) : null);

    if (startsAtDate && endsAtDate && startsAtDate > endsAtDate) {
      return NextResponse.json({ message: "startsAt must be before endsAt" }, { status: 400 });
    }

    if (updates.isActive) {
      await db
        .update(seasons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(seasons.collegeId, user.collegeId), eq(seasons.isActive, true)));
    }

    const [updated] = await db
      .update(seasons)
      .set({
        name: updates.name,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        isActive: updates.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(seasons.id, params.seasonId), eq(seasons.collegeId, user.collegeId)))
      .returning();

    return NextResponse.json({ season: updated });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to update season" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { seasonId: string } },
) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: seasons.id, isActive: seasons.isActive })
      .from(seasons)
      .where(and(eq(seasons.id, params.seasonId), eq(seasons.collegeId, user.collegeId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ message: "Season not found" }, { status: 404 });
    }

    if (existing.isActive) {
      return NextResponse.json({ message: "Deactivate the season before deleting it" }, { status: 409 });
    }

    await db
      .delete(seasons)
      .where(and(eq(seasons.id, params.seasonId), eq(seasons.collegeId, user.collegeId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to delete season" }, { status: 500 });
  }
}
