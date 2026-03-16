import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// ── GET /api/admin/users ───────────────────────────────────────────────────
// Returns ALL users (all roles) for the admin user management page.
// Admin only.

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Scope to the admin's own college. Falls back to all users if collegeId is missing
  // (e.g. seeded super-admin without a college assignment).
  const collegeFilter = session.user.collegeId
    ? eq(users.collegeId, session.user.collegeId)
    : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(collegeFilter);

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(collegeFilter)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  return NextResponse.json({ success: true, data: allUsers, total });
}
