import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const experiences = await db.execute(sql`
      SELECT
        ce.id,
        ce.company_name,
        ce.role_title,
        ce.status,
        ce.drive_type,
        ce.outcome,
        ce.interview_process,
        ce.tips,
        ce.difficulty,
        ce.ai_screen_score,
        ce.ai_screen_reason,
        ce.helpful_count,
        ce.created_at,
        ce.updated_at
      FROM company_experiences ce
      WHERE ce.college_id = ${user.collegeId}
        AND ce.author_id = ${user.id}
      ORDER BY ce.created_at DESC
    `);

    return NextResponse.json({ experiences });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to load faculty experiences" }, { status: 500 });
  }
}