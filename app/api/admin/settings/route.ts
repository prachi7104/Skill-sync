import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const ALLOWED_KEYS = [
    "sandbox_daily_limit",
    "sandbox_monthly_limit",
    "detailed_daily_limit",
    "detailed_monthly_limit",
    "embedding_batch_size",
    "max_students_per_ranking",
] as const;

export async function GET() {
    try {
        await requireRoleApi(["admin"]);
        const settings = await db.select().from(systemSettings).orderBy(systemSettings.key);
        return NextResponse.json({ settings });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await requireRoleApi(["admin"]);
        const body = await req.json();

        const schema = z.object({
            key: z.enum(ALLOWED_KEYS),
            value: z.number().int().positive().max(10000),
        });

        const { key, value } = schema.parse(body);

        await db
            .update(systemSettings)
            .set({ value: value.toString(), updatedBy: user.id, updatedAt: new Date() })
            .where(eq(systemSettings.key, key));

        return NextResponse.json({ success: true, key, value });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.flatten() },
                { status: 400 },
            );
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
