import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

// ── GET /api/admin/staff/[userId]/permissions ────────────────────────────────
// Returns staff member profile + granted components. Admin only, college-scoped.

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db.execute(sql`
        SELECT
            sp.granted_components,
            sp.department,
            sp.designation,
            sp.is_active,
            u.name,
            u.email,
            u.role
        FROM staff_profiles sp
        JOIN users u ON u.id = sp.user_id
        WHERE sp.user_id = ${params.userId}
        AND sp.college_id = ${session.user.collegeId}
    `) as unknown as Array<{
        granted_components: string[];
        department: string | null;
        designation: string | null;
        is_active: boolean;
        name: string;
        email: string;
        role: string;
    }>;

    if (!profile) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
}

// ── PUT /api/admin/staff/[userId]/permissions ────────────────────────────────
// Update granted component permissions for a staff member. Admin only, college-scoped.
// Always includes sandbox_access. Invalidates Redis permission cache.

export async function PUT(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { grantedComponents, department, designation, isActive } = body as {
        grantedComponents?: unknown;
        department?: string | null;
        designation?: string | null;
        isActive?: boolean;
    };

    if (!Array.isArray(grantedComponents)) {
        return NextResponse.json(
            { error: "grantedComponents must be an array" },
            { status: 400 }
        );
    }

    // Validate all provided values are strings
    if (grantedComponents.some((c) => typeof c !== "string")) {
        return NextResponse.json(
            { error: "All components must be strings" },
            { status: 400 }
        );
    }

    // Always include sandbox_access
    const finalComponents = [...new Set([...grantedComponents as string[], "sandbox_access"])];

    await db.execute(sql`
        UPDATE staff_profiles
        SET
            granted_components = ${finalComponents}::staff_component[],
            department = COALESCE(${department ?? null}, department),
            designation = COALESCE(${designation ?? null}, designation),
            is_active = COALESCE(${isActive ?? null}, is_active),
            updated_at = NOW()
        WHERE user_id = ${params.userId}
        AND college_id = ${session.user.collegeId}
    `);

    // Invalidate Redis permission cache (fail-open — matches lib/redis.ts pattern)
    const redis = getRedis();
    if (redis) {
        await redis.del(`staff_perms:${params.userId}`).catch(() => {});
    }

    return NextResponse.json({
        success: true,
        grantedComponents: finalComponents,
        department: department ?? null,
        designation: designation ?? null,
        isActive: isActive ?? null,
    });
}
