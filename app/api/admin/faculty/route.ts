import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
    generateStrongPassword,
    validatePasswordStrength,
} from "@/lib/auth/password";

// ── GET /api/admin/faculty ──────────────────────────────────────────────────
// Returns all users with role = "faculty". Admin only.

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const faculty = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, "faculty"));

    return NextResponse.json({ success: true, data: faculty });
}

// ── POST /api/admin/faculty ─────────────────────────────────────────────────
// Create a new user with role = "faculty". Admin only.
// Body: { email: string, name: string, password?: string }
// Returns 409 if user already exists.

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
        email,
        name,
        password: providedPassword,
    } = body as { email?: string; name?: string; password?: string };

    if (!email || !name) {
        return NextResponse.json(
            { error: "Missing required fields: email and name are required" },
            { status: 400 }
        );
    }

    const plainPassword = providedPassword || generateStrongPassword();
    const validation = validatePasswordStrength(plainPassword);
    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.reason },
            { status: 400 }
        );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json(
            { error: "Invalid email format" },
            { status: 400 }
        );
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
    });

    if (existing) {
        return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const [newUser] = await db
        .insert(users)
        .values({
            email: email.toLowerCase(),
            name,
            role: "faculty",
            passwordHash: passwordHash,
        })
        .returning({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
        });

    return NextResponse.json(
        {
            success: true,
            data: newUser,
            generatedPassword: plainPassword,
            note: "Save this password now - it cannot be recovered. Send it securely to the faculty member.",
        },
        { status: 201 },
    );
}
