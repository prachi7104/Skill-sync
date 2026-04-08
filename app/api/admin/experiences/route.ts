import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { normalizeCompanyName } from "@/lib/content-utils";

const adminExperienceSchema = z.object({
  companyName: z.string().min(1).max(255),
  roleTitle: z.string().max(255).optional().nullable(),
  driveType: z.enum(["placement", "internship", "ppo"]).optional().nullable(),
  outcome: z.enum(["selected", "rejected", "not_disclosed"]).optional().nullable(),
  interviewProcess: z.string().max(1500).optional().nullable(),
  tips: z.string().max(1000).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  wouldRecommend: z.boolean().optional().nullable(),
  batchYear: z.number().int().optional().nullable(),
  category: z.enum(["alpha", "beta", "gamma"]).optional().nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }

  return [];
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const queue = new URL(req.url).searchParams.get("queue") ?? "pending";
    const whereClause = queue === "published"
      ? sql`ce.status = 'published'`
      : sql`ce.status IN ('pending', 'ai_flagged', 'ai_approved')`;

    const columnRows = getRows<{ column_name: string }>(await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'company_experiences'
        AND column_name IN ('student_name', 'student_email')
    `));

    const columnSet = new Set(columnRows.map((row) => row.column_name));
    const studentNameExpr = columnSet.has("student_name") ? sql`ce.student_name` : sql`u.name`;
    const studentEmailExpr = columnSet.has("student_email") ? sql`ce.student_email` : sql`u.email`;

    const experiences = getRows<Record<string, unknown>>(await db.execute(sql`
      SELECT
        ce.id,
        ce.company_name,
        ce.company_normalized,
        ce.role_title,
        ce.drive_type,
        ce.outcome,
        ce.interview_process,
        ce.tips,
        ce.difficulty,
        ce.show_name,
        ce.is_admin_posted,
        ce.status,
        ce.ai_screen_score,
        ce.ai_screen_reason,
        ce.helpful_count,
        ce.batch_year,
        ce.category_snapshot,
        ${studentNameExpr} AS student_name,
        ${studentEmailExpr} AS student_email,
        ce.created_at,
        ce.updated_at,
        ce.published_at,
        ce.rejected_reason,
        u.name AS author_real_name,
        u.email AS author_email,
        NULL::text AS reviewed_by_name
      FROM company_experiences ce
      LEFT JOIN users u ON u.id = ce.author_id
      WHERE ce.college_id = ${user.collegeId}
        AND ${whereClause}
      ORDER BY ce.created_at DESC
    `));

    return NextResponse.json({ experiences });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[admin/experiences][GET]", error);
    return NextResponse.json({ error: "Failed to load moderation queue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = adminExperienceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    await db.execute(sql`
      INSERT INTO company_experiences (
        college_id, author_id, company_name, company_normalized,
        role_title, drive_type, outcome, interview_process, tips,
        difficulty, would_recommend, show_name, is_admin_posted,
        batch_year, category_snapshot, status, published_at,
        ai_screen_score, ai_screen_passed, ai_screened_at
      ) VALUES (
        ${user.collegeId}, NULL, ${data.companyName}, ${normalizeCompanyName(data.companyName)},
        ${data.roleTitle ?? null}, ${data.driveType ?? "placement"}, ${data.outcome ?? "not_disclosed"}, ${data.interviewProcess ?? null}, ${data.tips ?? null},
        ${data.difficulty ?? 3}, ${data.wouldRecommend ?? null}, false, true,
        ${data.batchYear ?? null}, ${data.category ?? null}, 'published', NOW(),
        1, true, NOW()
      )
    `);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to create admin experience" }, { status: 500 });
  }
}