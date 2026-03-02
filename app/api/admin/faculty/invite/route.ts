import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, magicLinkTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// ── POST /api/admin/faculty/invite ──────────────────────────────────────────
// Generate a magic link login token for a faculty user. Admin only.
// Body: { email: string }
// Returns: { loginUrl: string, expiresAt: string }

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email) {
        return NextResponse.json(
            { error: "Missing required field: email" },
            { status: 400 }
        );
    }

    // Find the faculty user
    const facultyUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        columns: { id: true, role: true },
    });

    if (!facultyUser) {
        return NextResponse.json(
            { error: "Faculty user not found. Create the user first." },
            { status: 404 }
        );
    }

    if (facultyUser.role !== "faculty" && facultyUser.role !== "admin") {
        return NextResponse.json(
            { error: "User is not a faculty or admin" },
            { status: 400 }
        );
    }

    // Generate token
    const token = randomBytes(32).toString("hex"); // 64-char hex
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(magicLinkTokens).values({
        userId: facultyUser.id,
        token,
        expiresAt,
    });

    const loginUrl =
        (process.env.NEXTAUTH_URL || "http://localhost:3000") +
        "/api/auth/callback/magic-link?token=" +
        token;

    return NextResponse.json({
        success: true,
        data: { loginUrl, expiresAt: expiresAt.toISOString() },
    });
}
