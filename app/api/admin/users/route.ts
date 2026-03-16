import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// ── GET /api/admin/users ───────────────────────────────────────────────────
// Returns ALL users (all roles) for the admin user management page.
// Admin only.

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.collegeId) {
    return NextResponse.json({ error: "College not found" }, { status: 400 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const search = url.searchParams.get("q")?.trim() ?? "";
  const filterRole = url.searchParams.get("role")?.trim() ?? "";

  const whereParts = [sql`u.college_id = ${session.user.collegeId}`];

  if (search) {
    whereParts.push(sql`(
      u.name ILIKE ${`%${search}%`}
      OR u.email ILIKE ${`%${search}%`}
    )`);
  }

  if (filterRole && ["admin", "faculty", "student"].includes(filterRole)) {
    whereParts.push(sql`u.role = ${filterRole}::role`);
  }

  const allUsers = await db.execute(sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.created_at AS "createdAt",
      sp.granted_components,
      sp.department,
      sp.designation,
      sp.is_active
    FROM users u
    LEFT JOIN staff_profiles sp ON sp.user_id = u.id
    WHERE ${sql.join(whereParts, sql` AND `)}
    ORDER BY
      CASE u.role WHEN 'admin' THEN 1 WHEN 'faculty' THEN 2 ELSE 3 END,
      u.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM users u
    WHERE ${sql.join(whereParts, sql` AND `)}
  `) as unknown as Array<{ total: number }>;

  const total = countResult[0]?.total ?? 0;

  return NextResponse.json({ success: true, data: allUsers, total, page, pageSize });
}
