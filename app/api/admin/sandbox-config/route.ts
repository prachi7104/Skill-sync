import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sandboxConfig } from "@/lib/db/schema";
import { getRedis } from "@/lib/redis";

const sandboxConfigSchema = z.object({
  studentDailyLimit: z.number().int().min(1).max(100).optional(),
  studentMonthlyLimit: z.number().int().min(1).max(1000).optional(),
  facultyDailyLimit: z.number().int().min(1).max(200).optional(),
  facultyMonthlyLimit: z.number().int().min(1).max(5000).optional(),
  studentDetailedDaily: z.number().int().min(1).max(100).optional(),
  studentDetailedMonthly: z.number().int().min(1).max(1000).optional(),
  facultyDetailedDaily: z.number().int().min(1).max(200).optional(),
  facultyDetailedMonthly: z.number().int().min(1).max(5000).optional(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const row = await db.query.sandboxConfig.findFirst({
      where: eq(sandboxConfig.collegeId, user.collegeId),
    });

    return NextResponse.json({ config: row ?? null });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to fetch sandbox config" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ message: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = sandboxConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const update = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    const existing = await db.query.sandboxConfig.findFirst({
      where: eq(sandboxConfig.collegeId, user.collegeId),
      columns: { id: true },
    });

    let config;
    if (existing) {
      [config] = await db
        .update(sandboxConfig)
        .set(update)
        .where(eq(sandboxConfig.id, existing.id))
        .returning();
    } else {
      [config] = await db
        .insert(sandboxConfig)
        .values({ collegeId: user.collegeId, ...parsed.data })
        .returning();
    }

    const redis = getRedis();
    if (redis) {
      await redis.del(`sandbox_config:${user.collegeId}`).catch(() => undefined);
    }

    return NextResponse.json({ config });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to update sandbox config" }, { status: 500 });
  }
}
