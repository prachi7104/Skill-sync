import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { getRouter } from "@/lib/antigravity/instance";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import type { ParsedJD } from "@/lib/db/schema";
import { drives, users } from "@/lib/db/schema";
import { buildSkillGapFrequency, extractRequiredSkills } from "@/lib/phase8-10";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    if (!profile.branch || !drive.eligibleBranches.includes(profile.branch)) return false;
  }
  if (drive.eligibleBatchYears?.length) {
    if (profile.batchYear === null || profile.batchYear === undefined || !drive.eligibleBatchYears.includes(profile.batchYear)) return false;
  }
  if (drive.eligibleCategories?.length) {
    if (!profile.category || !drive.eligibleCategories.includes(profile.category)) return false;
  }
  return true;
}

export async function GET() {
  try {
    const { user, profile } = await requireStudentProfile();
    const redis = getRedis();
    const cacheKey = `career_coach:${user.id}`;

    if (redis) {
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
      return NextResponse.json({ message: "No active drives to analyze against. Check back when drives are posted." });
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

    const result = await router.execute("sandbox", prompt, { maxTokens: 800, temperature: 0.3, responseFormat: "json" });
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Career coach temporarily unavailable" }, { status: 503 });
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