import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { experienceId: string } }
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const body = await req.json();

    const existingRows = await db.execute(sql`
      SELECT id, status, author_id
      FROM company_experiences
      WHERE id = ${params.experienceId}
        AND college_id = ${user.collegeId}
      LIMIT 1
    `) as unknown as Array<{ id: string; status: string; author_id: string | null }>;

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.author_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing.status === "published" && user.role !== "admin") {
      return NextResponse.json({ error: "Published posts can only be edited by admin" }, { status: 403 });
    }

    const { companyName, roleTitle, interviewProcess, tips, difficulty, outcome, driveType } = body as {
      companyName?: string | null;
      roleTitle?: string | null;
      interviewProcess?: string | null;
      tips?: string | null;
      difficulty?: number | null;
      outcome?: string | null;
      driveType?: string | null;
    };

    const normalizedCompany = companyName ? companyName.toLowerCase().trim() : null;

    await db.execute(sql`
      UPDATE company_experiences
      SET
        company_name = COALESCE(${companyName ?? null}, company_name),
        company_normalized = COALESCE(${normalizedCompany}, company_normalized),
        role_title = COALESCE(${roleTitle ?? null}, role_title),
        interview_process = COALESCE(${interviewProcess ?? null}, interview_process),
        tips = COALESCE(${tips ?? null}, tips),
        difficulty = COALESCE(${difficulty ?? null}, difficulty),
        outcome = COALESCE(${outcome ?? null}, outcome),
        drive_type = COALESCE(${driveType ?? null}, drive_type),
        status = CASE WHEN status = 'published' THEN status ELSE 'pending' END,
        updated_at = NOW()
      WHERE id = ${params.experienceId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 });
  }
}