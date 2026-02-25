import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const addUserSchema = z.object({
    email: z.string().email().max(320),
    name: z.string().min(1).max(255),
    role: z.enum(["faculty", "admin"]),
});

export async function POST(req: NextRequest) {
    try {
        await requireRoleApi(["admin"]);
        const body = await req.json();
        const { email, name, role } = addUserSchema.parse(body);

        // Check if user already exists
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (existing) {
            // Update role if needed
            if (existing.role === role) {
                return NextResponse.json(
                    { error: "User already exists with this role" },
                    { status: 409 },
                );
            }
            const [updated] = await db
                .update(users)
                .set({ role, name, updatedAt: new Date() })
                .where(eq(users.id, existing.id))
                .returning();
            return NextResponse.json({ user: updated, action: "updated" });
        }

        const [created] = await db
            .insert(users)
            .values({ email: email.toLowerCase(), name, role })
            .returning();

        return NextResponse.json({ user: created, action: "created" }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.flatten() }, { status: 400 });
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await requireRoleApi(["admin"]);
        const allUsers = await db
            .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
            .from(users)
            .orderBy(users.role, users.createdAt);
        return NextResponse.json({ users: allUsers });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
