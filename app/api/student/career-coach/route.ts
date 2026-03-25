import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { getRouter } from "@/lib/antigravity/instance";
import { getCurrentUser, getStudentProfile, requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import type { ParsedJD } from "@/lib/db/schema";
import { drives, users } from "@/lib/db/schema";
import { buildSkillGapFrequency, extractRequiredSkills } from "@/lib/phase8-10";
import { getRedis } from "@/lib/redis";
import { expandBranches } from "@/lib/constants/branches";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isDriveEligibleForStudent(drive: {
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: string[] | null;
}, profile: {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: string | null;
}) {
  if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
    if (profile.cgpa === null || profile.cgpa === undefined || profile.cgpa < drive.minCgpa) return false;
  }
  if (drive.eligibleBranches?.length) {
    if (!profile.branch) return false;
    const expanded = expandBranches(drive.eligibleBranches).map((b) => b.toLowerCase().trim());
    if (!expanded.includes(profile.branch.toLowerCase().trim())) return false;
  }
  if (drive.eligibleBatchYears?.length) {
    if (profile.batchYear === null || profile.batchYear === undefined || !drive.eligibleBatchYears.includes(profile.batchYear)) return false;
  }
  if (drive.eligibleCategories?.length) {
    if (!profile.category || !drive.eligibleCategories.includes(profile.category)) return false;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    const { user, profile } = await requireStudentProfile();
    const redis = getRedis();
    const cacheKey = `career_coach:${user.id}`;
    const refresh = new URL(req.url).searchParams.get("refresh") === "1";

    if (redis && refresh) {
      await redis.del(cacheKey).catch(() => undefined);
    }

    if (redis && !refresh) {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return NextResponse.json({ cached: true, ...JSON.parse(cached) });
      }
    }

    const availableDrives = await db
      .select({
        company: drives.company,
        roleTitle: drives.roleTitle,
        parsedJd: drives.parsedJd,
        minCgpa: drives.minCgpa,
        eligibleBranches: drives.eligibleBranches,
        eligibleBatchYears: drives.eligibleBatchYears,
        eligibleCategories: drives.eligibleCategories,
      })
      .from(drives)
      .innerJoin(users, eq(users.id, drives.createdBy))
      .where(and(eq(drives.isActive, true), eq(users.collegeId, user.collegeId ?? "")))
      .limit(12);

    const eligibleDrives = availableDrives.filter((drive) => isDriveEligibleForStudent(drive, profile)).slice(0, 5);

    if (eligibleDrives.length === 0) {
      return NextResponse.json({
        message: "No active drives match your current profile.",
        suggestion: "Complete your profile (CGPA, branch, batch year) to see eligible drives. Your Career Advisor will activate once drives are available.",
        retryable: false,
      });
    }

    const studentSkills = profile.skills ?? [];
    const gapFrequency = buildSkillGapFrequency({
      studentSkills,
      parsedJds: eligibleDrives.map((drive) => drive.parsedJd as ParsedJD | null),
    });

    const topGaps = Object.entries(gapFrequency)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([skill, count]) => `${skill} (needed in ${count}/${eligibleDrives.length} drives)`);

    const router = getRouter();
    const prompt = `Generate a personalized 90-day upskilling roadmap for a ${profile.branch ?? "general engineering"} student (Batch ${profile.batchYear ?? "unknown"}, Category: ${profile.category ?? "Unknown"}).

Their current skills: ${(studentSkills ?? []).map((skill) => skill.name).slice(0, 15).join(", ")}

Critical skill gaps (appear in multiple eligible drives): ${topGaps.join("; ")}

Target drives they're eligible for: ${eligibleDrives.map((drive) => `${drive.company} - ${drive.roleTitle}`).join("; ")}

Rules:
- Focus on top 3 highest-impact gaps only
- Each skill: one specific free learning resource (official docs, YouTube channel, GitHub repo)
- Be realistic about 90-day timeline
- No generic advice — be specific to this student's branch and gaps

Return ONLY valid JSON:
{
  "summary": "2-sentence personalized summary",
  "priority_skills": [
    {
      "skill": "exact skill name",
      "why_critical": "appears in X drives, specifically for Y roles",
      "resource": {"type": "YouTube|GitHub|Docs|Course", "name": "specific resource name", "url_description": "what to search"},
      "week_start": 1,
      "hours_needed": 20
    }
  ],
  "amcat_tip": "if category is not alpha, what specific AMCAT section to focus on"
}`;

    const result = await router.execute("career_advice", prompt, { maxTokens: 800, temperature: 0.3, responseFormat: "json" });
    if (!result.success || !result.data) {
      console.error("[career-coach] AI call failed:", result.error);
      return NextResponse.json({
        error: "Career advisor is processing your request. Try again in a moment.",
        retryable: true,
      }, { status: 503 });
    }

    const parsed = typeof result.data === "string"
      ? JSON.parse(result.data.replace(/```json\n?|```\n?/g, "").trim())
      : result.data;

    const response = {
      ...parsed,
      cached: false,
      generatedAt: new Date().toISOString(),
      analyzedCompanies: eligibleDrives.map((drive) => ({
        company: drive.company,
        roleTitle: drive.roleTitle,
        requiredSkills: extractRequiredSkills(drive.parsedJd as ParsedJD | null),
      })),
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(response), { ex: 24 * 60 * 60 }).catch(() => undefined);
    }

    return NextResponse.json(response);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to build career coach" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as {
      message?: string;
      history?: ChatMessage[];
    } | null;

    const message = body?.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 });
    }

    const profile = await getStudentProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
    }

    const history = (Array.isArray(body?.history) ? body?.history : [])
      .filter((item): item is ChatMessage => (
        (item?.role === "user" || item?.role === "assistant") && typeof item?.content === "string" && item.content.trim().length > 0
      ))
      .slice(-8);

    const studentSkills = profile.skills ?? [];
    const systemPrompt = `You are SkillSync Career Advisor, a concise and actionable mentor for a student.

Student context:
- Branch: ${profile.branch ?? "Unknown"}
- Batch year: ${profile.batchYear ?? "Unknown"}
- Category: ${profile.category ?? "Unknown"}
- CGPA: ${profile.cgpa ?? "Unknown"}
- Skills: ${studentSkills.map((skill) => skill.name).slice(0, 20).join(", ") || "None listed"}

Guidelines:
- Keep responses practical and specific to the student profile.
- Prioritize drive eligibility, ranking improvement, and skill roadmap advice.
- Use short paragraphs and bullet points when useful.
- If information is missing, state assumptions clearly.`;

    const conversation = [
      ...history.map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content}`),
      `User: ${message}`,
    ].join("\n");

    const prompt = `${systemPrompt}\n\nConversation:\n${conversation}\nAssistant:`;

    const router = getRouter();
    const result = await router.execute("career_advice", prompt, {
      maxTokens: 500,
      temperature: 0.4,
    });

    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Career advisor temporarily unavailable" }, { status: 503 });
    }

    const reply = typeof result.data === "string"
      ? result.data.trim()
      : JSON.stringify(result.data);

    return NextResponse.json({ reply, role: "assistant" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to get career advice" }, { status: 500 });
  }
}