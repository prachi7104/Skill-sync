import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "@/lib/auth/password";
import { redisRateLimit } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "student") {
    return NextResponse.json(
      { error: "Students authenticate via Microsoft. No password to change." },
      { status: 400 },
    );
  }

  // Rate limit: 5 attempts per 15 minutes per user
  const { allowed } = await redisRateLimit(
    `change-password:${session.user.id}`,
    5,
    900
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many password change attempts. Please wait 15 minutes before trying again." },
      { status: 429 }
    );
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Both current and new password are required" },
      { status: 400 },
    );
  }

  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "No password set for this account" },
      { status: 400 },
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 },
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    success: true,
    message: "Password changed successfully",
  });
}
