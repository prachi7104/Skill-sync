import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "@/lib/auth/password";

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!session.user.collegeId) {
    return NextResponse.json({ error: "Admin account not linked to a college" }, { status: 400 });
  }

  const [targetUser] = await db
    .select({ id: users.id, role: users.role, collegeId: users.collegeId })
    .from(users)
    .where(and(
      eq(users.id, params.userId),
      eq(users.collegeId, session.user.collegeId),
    ))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.role === "admin") {
    return NextResponse.json({ error: "Cannot reset another admin's password" }, { status: 403 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  await db.update(users)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(users.id, targetUser.id));

  return NextResponse.json({ success: true });
}
