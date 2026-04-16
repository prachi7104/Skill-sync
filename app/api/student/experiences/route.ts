import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { getRouter } from "@/lib/antigravity/instance";
import { sanitizeInput } from "@/lib/antigravity/sanitize";
import {
  isOnboardingRequiredError,
  requireStudentApiPolicyAccess,
} from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { normalizeCompanyName } from "@/lib/content-utils";

const submissionSchema = z.object({
  companyName: z.string().min(1).max(255),
  roleTitle: z.string().max(255).optional().nullable(),
  driveType: z.enum(["placement", "internship", "ppo"]).optional().nullable(),
  outcome: z.enum(["selected", "rejected", "not_disclosed"]).optional().nullable(),
  interviewProcess: z.string().max(1500).optional().nullable(),
  tips: z.string().max(1000).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  wouldRecommend: z.boolean().optional().nullable(),
  showName: z.boolean().optional().nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireStudentApiPolicyAccess("/api/student/experiences");
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const url = new URL(req.url);
    const company = url.searchParams.get("company");
    const difficulty = url.searchParams.get("difficulty");
    const driveType = url.searchParams.get("driveType");
    const search = url.searchParams.get("q") ?? url.searchParams.get("company") ?? "";
    const mode = url.searchParams.get("mode");
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = 12;
    const offset = (page - 1) * pageSize;

    const [rankMeta] = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_rankings,
        COUNT(*) FILTER (WHERE shortlisted = true)::int AS total_shortlists
      FROM rankings
      WHERE student_id = ${user.id}
    `) as unknown as Array<{ total_rankings: number; total_shortlists: number }>;

    const canSubmit = Boolean((rankMeta?.total_rankings ?? 0) > 0 || (rankMeta?.total_shortlists ?? 0) > 0);

    if (mode === "suggestions") {
      const rows = await db.execute(sql`
        SELECT DISTINCT company_name AS value
        FROM company_experiences
        WHERE college_id = ${user.collegeId}
          AND status = 'published'
          AND company_name ILIKE ${`%${search}%`}
        UNION
        SELECT DISTINCT company AS value
        FROM drives d
        JOIN users u ON u.id = d.created_by
        WHERE u.college_id = ${user.collegeId}
          AND d.company ILIKE ${`%${search}%`}
        ORDER BY value ASC
        LIMIT 8
      `) as unknown as Array<{ value: string }>;

      return NextResponse.json({ suggestions: rows.map((row) => row.value), canSubmit });
    }

    const statusFilter = sql`(
      ce.status = 'published'
      OR (ce.author_id = ${user.id} AND ce.status IN ('pending', 'ai_approved', 'ai_flagged'))
    )`;

    const whereParts = [
      sql`ce.college_id = ${user.collegeId}`,
      statusFilter,
    ];

    if (company) {
      whereParts.push(sql`ce.company_normalized = ${company}`);
    } else if (search) {
      whereParts.push(sql`ce.company_name ILIKE ${`%${search}%`}`);
    }

    if (difficulty) {
      whereParts.push(sql`ce.difficulty = ${Number(difficulty)}`);
    }

    if (driveType) {
      whereParts.push(sql`ce.drive_type = ${driveType}`);
    }

    const whereClause = sql.join(whereParts, sql` AND `);

    if (company) {
      const experiences = await db.execute(sql`
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
          ce.would_recommend,
          ce.show_name,
          ce.is_admin_posted,
          ce.student_name,
          ce.batch_year,
          ce.category_snapshot,
          ce.helpful_count,
          ce.created_at,
          (ce.author_id = ${user.id} AND ce.status != 'published') AS is_own_draft,
          EXISTS(
            SELECT 1
            FROM company_experience_votes cev
            WHERE cev.experience_id = ce.id
              AND cev.user_id = ${user.id}
          ) AS has_voted
        FROM company_experiences ce
        WHERE ${whereClause}
        ORDER BY ce.published_at DESC NULLS LAST, ce.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as unknown as Array<{
        id: string;
        company_name: string;
        company_normalized: string;
        role_title: string | null;
        drive_type: string | null;
        outcome: string;
        interview_process: string | null;
        tips: string | null;
        difficulty: number;
        would_recommend: boolean | null;
        show_name: boolean;
        is_admin_posted: boolean;
        student_name: string | null;
        batch_year: number | null;
        category_snapshot: string | null;
        helpful_count: number;
        created_at: string;
        is_own_draft: boolean;
        has_voted: boolean;
      }>;

      return NextResponse.json({ canSubmit, experiences });
    }

    const companies = await db.execute(sql`
      SELECT
        ce.company_name,
        ce.company_normalized,
        COUNT(*)::int AS experience_count,
        ROUND(AVG(ce.difficulty)::numeric, 1) AS avg_difficulty
      FROM company_experiences ce
      WHERE ${whereClause}
      GROUP BY ce.company_name, ce.company_normalized
      ORDER BY experience_count DESC, ce.company_name ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as Array<{
      company_name: string;
      company_normalized: string;
      experience_count: number;
      avg_difficulty: string | number;
    }>;

    return NextResponse.json({ canSubmit, companies });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isOnboardingRequiredError(error)) {
      return NextResponse.json({ error: error.message, code: "ONBOARDING_REQUIRED" }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load company experiences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireStudentApiPolicyAccess("/api/student/experiences");
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      companyName,
      roleTitle,
      driveType,
      outcome,
      interviewProcess,
      tips,
      difficulty,
      wouldRecommend,
      showName,
    } = parsed.data;

    if (!companyName || (!interviewProcess && !tips)) {
      return NextResponse.json({ error: "Company name and at least one content field required" }, { status: 400 });
    }

    const content = sanitizeInput([interviewProcess, tips].filter(Boolean).join("\n\n"), 1800);
    let aiScreenScore = 1;
    let aiScreenPassed = true;
    let aiScreenReason: string | null = null;
    let status = "ai_approved";

    try {
      const router = getRouter();
      const screenResult = await router.execute<{ score: number; flag: boolean; reason?: string }>(
        "sandbox",
        `Rate this student review for appropriateness (0.0-1.0 score).
Flag if it contains: personal attacks targeting individuals by name, leaked confidential company data, offensive or abusive language, spam, or content unrelated to the company experience.

Company: ${companyName}
Content: "${content.slice(0, 800)}"

Return ONLY valid JSON: {"score": 0.0-1.0, "flag": true/false, "reason": "brief reason if flagged"}`,
        { maxTokens: 120, temperature: 0, responseFormat: "json" },
      );

      if (screenResult.success && screenResult.data) {
        const rawResult = screenResult.data as unknown;
        const parsedResult = typeof rawResult === "string"
          ? JSON.parse(rawResult.replace(/```json\n?|```\n?/g, "").trim())
          : rawResult;
        aiScreenScore = Math.max(0, Math.min(1, Number(parsedResult.score) || 1));
        aiScreenPassed = !parsedResult.flag;
        aiScreenReason = parsedResult.reason ?? null;
        status = parsedResult.flag ? "ai_flagged" : aiScreenScore > 0.6 ? "ai_approved" : "pending";
      } else {
        status = "pending";
      }
    } catch {
      status = "pending";
      aiScreenScore = 1;
      aiScreenPassed = true;
    }

    const companyNormalized = normalizeCompanyName(companyName);

    await db.execute(sql`
      INSERT INTO company_experiences (
        college_id, author_id, company_name, company_normalized,
        role_title, drive_type, outcome, interview_process, tips,
        difficulty, would_recommend, show_name, is_admin_posted,
        batch_year, category_snapshot,
        ai_screen_score, ai_screen_passed, ai_screen_reason, ai_screened_at, status
      ) VALUES (
        ${user.collegeId}, ${user.id}, ${companyName}, ${companyNormalized},
        ${roleTitle ?? null}, ${driveType ?? "placement"}, ${outcome ?? "not_disclosed"}, ${interviewProcess ?? null}, ${tips ?? null},
        ${difficulty ?? 3}, ${wouldRecommend ?? null}, ${showName ?? false}, false,
        ${profile.batchYear ?? null}, ${profile.category ?? null},
        ${aiScreenScore}, ${aiScreenPassed}, ${aiScreenReason}, NOW(), ${status}
      )
    `);

    const message = status === "ai_flagged"
      ? "Your experience has been submitted and is under review."
      : "Your experience has been submitted and will appear after admin approval.";

    return NextResponse.json({ success: true, status, message });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isOnboardingRequiredError(error)) {
      return NextResponse.json({ error: error.message, code: "ONBOARDING_REQUIRED" }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to submit experience" }, { status: 500 });
  }
}