import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { hasAmcatManagementPermission } from "@/lib/amcat/permissions";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const allowed = await hasAmcatManagementPermission(session);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!session?.user?.id || !session.user.collegeId) {
      return NextResponse.json({ error: "Missing session context" }, { status: 401 });
    }

    const [amcatSession] = await db.execute(sql`
    SELECT id, status
    FROM amcat_sessions
    WHERE id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
    LIMIT 1
  `) as unknown as Array<{ id: string; status: string }>;

    if (!amcatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (amcatSession.status === "published") {
      return NextResponse.json({ error: "Session is already published" }, { status: 409 });
    }

    const [{ total }] = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM amcat_results
      WHERE session_id = ${params.sessionId}
        AND college_id = ${session.user.collegeId}
    `) as unknown as Array<{ total: number }>;

    if (!total) {
      return NextResponse.json({ error: "Cannot publish an empty AMCAT session" }, { status: 409 });
    }

    await db.execute(sql`
    UPDATE students s
    SET
      category = r.final_category,
      updated_at = NOW()
    FROM amcat_results r
    WHERE r.session_id = ${params.sessionId}
      AND r.college_id = ${session.user.collegeId}
      AND r.student_id = s.id
      AND r.student_id IS NOT NULL
  `);

    await db.execute(sql`
    UPDATE amcat_sessions
    SET
      status = 'published',
      published_by = ${session.user.id},
      published_at = NOW(),
      updated_at = NOW()
    WHERE id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
  `);

    const [{ updated }] = await db.execute(sql`
    SELECT COUNT(*)::int AS updated
    FROM amcat_results
    WHERE session_id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
      AND student_id IS NOT NULL
  `) as unknown as Array<{ updated: number }>;

    return NextResponse.json({
      success: true,
      studentsUpdated: updated,
      message: `Published. ${updated} student categories updated in SkillSync.`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[POST /api/admin/amcat/[sessionId]/publish]", error);
    return NextResponse.json({ error: "Failed to publish AMCAT session" }, { status: 500 });
  }
}
