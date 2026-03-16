import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";

const createSeasonSchema = z.object({
  name: z.string().min(2).max(120),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ seasons: [] });
    }

    const rows = await db.query.seasons.findMany({
      where: eq(seasons.collegeId, user.collegeId),
      orderBy: [desc(seasons.createdAt)],
    });

    return NextResponse.json({ seasons: rows });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to fetch seasons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);

    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createSeasonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.isActive) {
      await db
        .update(seasons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(seasons.collegeId, user.collegeId), eq(seasons.isActive, true)));
    }

    const [created] = await db
      .insert(seasons)
      .values({
        collegeId: user.collegeId,
        name: data.name,
        isActive: data.isActive,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      })
      .returning();

    return NextResponse.json({ season: created }, { status: 201 });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to create season" }, { status: 500 });
  }
}
