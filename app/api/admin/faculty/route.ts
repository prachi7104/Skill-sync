import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
    generateStrongPassword,
    validatePasswordStrength,
} from "@/lib/auth/password";

const VALID_COMPONENTS = [
    "drive_management",
    "amcat_management",
    "technical_content",
    "softskills_content",
    "company_experiences",
    "student_feedback_posting",
    "sandbox_access",
    "student_management",
    "analytics_view",
] as const;

const ALL_COMPONENTS: string[] = [...VALID_COMPONENTS];

// ── GET /api/admin/faculty ──────────────────────────────────────────────────
// Returns all staff (faculty + admin) for this college. Admin only.

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collegeId = session.user.collegeId;

    const staff = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(
            and(
                eq(users.role, "faculty"),
                collegeId ? eq(users.collegeId, collegeId) : undefined,
            )
        );

    return NextResponse.json({ success: true, data: staff });
}

// ── POST /api/admin/faculty ─────────────────────────────────────────────────
// Create a new staff account (faculty or admin).
// Body: { email, name, role?, password?, department?, designation?, grantedComponents? }

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
        email,
        name,
        role = "faculty",
        password: providedPassword,
        department,
        designation,
        grantedComponents = [],
    } = body as {
        email?: string;
        name?: string;
        role?: string;
        password?: string;
        department?: string;
        designation?: string;
        grantedComponents?: string[];
    };

    // Required fields
    if (!email || !name) {
        return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    if (!["faculty", "admin"].includes(role)) {
        return NextResponse.json({ error: "role must be faculty or admin" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate component list
    const invalidComponents = grantedComponents.filter(
        (c: string) => !(VALID_COMPONENTS as readonly string[]).includes(c)
    );
    if (invalidComponents.length > 0) {
        return NextResponse.json(
            { error: `Invalid components: ${invalidComponents.join(", ")}` },
            { status: 400 }
        );
    }

    // Admin always gets all components; faculty always gets sandbox_access
    const finalComponents: string[] =
        role === "admin"
            ? ALL_COMPONENTS
            : [...new Set([...grantedComponents, "sandbox_access"])];

    // Check if user already exists
    const existing = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
    });
    if (existing) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const plainPassword = providedPassword || generateStrongPassword();
    const validation = validatePasswordStrength(plainPassword);
    if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);
    const collegeId = session.user.collegeId;

    // Insert user
    const [newUser] = await db
        .insert(users)
        .values({
            email: email.toLowerCase(),
            name,
            role: role as "faculty" | "admin",
            passwordHash,
            collegeId: collegeId || undefined,
        })
        .returning();

    // Insert staff_profile with component permissions
    await db.execute(sql`
        INSERT INTO staff_profiles (user_id, college_id, department, designation, granted_components, created_by)
        VALUES (
            ${newUser.id},
            ${collegeId || null},
            ${department || null},
            ${designation || null},
            ${finalComponents}::staff_component[],
            ${session.user.id}
        )
    `);

    return NextResponse.json(
        {
            success: true,
            data: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
            generatedPassword: plainPassword,
            grantedComponents: finalComponents,
            note: "Save this password \u2014 it cannot be recovered. Send securely to the user.",
        },
        { status: 201 }
    );
}
