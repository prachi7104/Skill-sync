import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfileApi, ApiError } from "@/lib/auth/helpers";
import { checkAndIncrementSandboxUsage, enforceProfileGate } from "@/lib/guardrails";
import { GuardrailViolation } from "@/lib/guardrails/errors";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkEligibility, type EligibilityCriteria, type StudentProfile } from "@/lib/matching";
import { parseJD } from "@/lib/jd/parser";
import { analyzeMatch } from "@/lib/ats";
import { ATSScore } from "@/lib/ats/types";
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { z } from "zod";
import type { Skill, Project, WorkExperience } from "@/lib/db/schema";

const sandboxSchema = z.object({
  jdText: z.string().min(20, "Job description must be at least 20 characters").max(10000),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  minCgpa: z.number().min(0).max(10).optional().nullable(),
});

function formatDetailedExplanation(result: ATSScore): string {
  const lines: string[] = [];
  lines.push(`**Match Verdict**: ${result.match_score.interpretation} (${result.match_score.overall}/100)`);
  lines.push(`**Recommendation**: ${result.match_score.hire_recommendation}`);
  lines.push("");

  lines.push("**Score Breakdown**:");
  lines.push(`- Hard Skills: ${result.component_breakdown.hard_requirements.score.toFixed(1)}%`);
  lines.push(`- Soft Skills: ${result.component_breakdown.soft_requirements.score.toFixed(1)}%`);
  lines.push(`- Experience: ${result.component_breakdown.experience_level.score.toFixed(1)}%`);
  lines.push(`- Domain/Stack: ${result.component_breakdown.domain_alignment.score.toFixed(1)}%`);

  if (result.red_flags.length > 0) {
    lines.push("");
    lines.push("**Red Flags**:");
    result.red_flags.forEach(f => lines.push(`- 🚩 ${f.flag} (${f.impact})`));
  }

  if (result.positive_signals.length > 0) {
    lines.push("");
    lines.push("**Positive Signals**:");
    result.positive_signals.forEach(s => lines.push(`- ✅ ${s.signal} (${s.value})`));
  }

  lines.push("");
  lines.push("**Analysis**:");
  if (result.skill_analysis.missing_critical.length > 0) {
    lines.push(`Missing critical skills: ${result.skill_analysis.missing_critical.map(m => m.skill).join(", ")}`);
  } else {
    lines.push("No critical skills missing.");
  }

  return lines.join("\n");
}

function mapProfileToResumeData(profile: any, skills: Skill[], projects: Project[], workExperience: WorkExperience[]): ParsedResumeData {
  return {
    full_name: profile.fullName || "Candidate",
    email: profile.email || null,
    phone: profile.phone || null,
    linkedin_url: profile.linkedin || null,
    professional_summary: null,
    coding_profiles: (profile.codingProfiles || []).map((cp: any) => ({ platform: cp.platform, profile_url: cp.url || "" })),
    education_history: [
      {
        institution: "University",
        degree: "Bachelor's",
        branch: profile.branch || "Unknown",
        current_cgpa: profile.cgpa,
        expected_graduation: profile.batchYear ? String(profile.batchYear) : undefined
      }
    ],
    experience: workExperience.map(w => ({
      company: w.company,
      role: w.role,
      duration: w.startDate + (w.endDate ? " - " + w.endDate : " - Present"),
      description: w.description,
      is_internship: w.role.toLowerCase().includes("intern")
    })),
    projects: projects.map(p => ({
      title: p.title,
      description: p.description,
      link: p.url,
      tech_stack: p.techStack,
      date: p.startDate
    })),
    skills: skills.map(s => ({ name: s.name, category: s.category || "other" })),
    research_papers: (profile.researchPapers || []).map((r: any) => ({ title: r.title, paper_link: r.url })),
    certifications: (profile.certifications || []).map((c: any) => ({ certification_name: c.title, issuer: c.issuer, verification_link: c.url })),
    achievements: (profile.achievements || []).map((a: any) => ({ title: a.title, description: a.description })),
    soft_skills: profile.softSkills || []
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — require student with profile
    const { user, profile } = await requireStudentProfileApi();

    // 2. Profile gate — must have complete enough profile
    await enforceProfileGate(user.id);

    // 3. Sandbox rate limits
    await checkAndIncrementSandboxUsage(user.id);

    // 4. Parse input
    const body = await req.json();
    const parsed = sandboxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { jdText, minCgpa = null } = parsed.data;

    // 5. Build eligibility criteria
    const eligibility: EligibilityCriteria = {
      minCgpa: minCgpa ?? null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    // Check basic eligibility first
    const studentProfileForCheck: StudentProfile = {
      cgpa: profile.cgpa,
      branch: profile.branch,
      batchYear: profile.batchYear,
      category: profile.category,
      skillNames: [], // Not needed for eligibility check
      projectKeywords: [] // Not needed
    };
    const eligibilityResult = checkEligibility(studentProfileForCheck, eligibility);

    // 6. Run ATS Analysis
    // Parse JD
    const parsedJd = await parseJD(jdText);

    // Map Profile to Resume Data
    const skills = (profile.skills as Skill[] | null) ?? [];
    const projects = (profile.projects as Project[] | null) ?? [];
    const workExperience = (profile.workExperience as WorkExperience[] | null) ?? [];

    const parsedResume = mapProfileToResumeData(profile, skills, projects, workExperience);

    // Analyze (passing existing student embedding if available)
    const atsResult = analyzeMatch(parsedJd, parsedResume);

    // Override score if ineligible
    if (!eligibilityResult.isEligible) {
      atsResult.match_score.overall = 0;
      atsResult.match_score.interpretation = "Ineligible";
      atsResult.match_score.hire_recommendation = "REJECT";
      atsResult.red_flags.push({ flag: eligibilityResult.reason || "Did not meet eligibility criteria", severity: "Critical", impact: -100 });
    }

    // 7. Increment usage counters (handled atomically in step 3 now)

    // 8. Fetch updated usage for request context
    const [updated] = await db
      .select({
        sandboxUsageToday: students.sandboxUsageToday,
        sandboxUsageMonth: students.sandboxUsageMonth,
      })
      .from(students)
      .where(eq(students.id, user.id))
      .limit(1);

    // Fetch real limits from system_settings
    const { getSandboxLimitsPublic } = await import("@/lib/guardrails/sandbox-limits");
    const realLimits = await getSandboxLimitsPublic();

    return NextResponse.json({
      matchScore: atsResult.match_score.overall,
      // 4-dimension breakdown (new scoring system)
      hardSkillsScore: atsResult.component_breakdown.hard_requirements.percentage,
      softSkillsScore: atsResult.component_breakdown.soft_requirements.percentage,
      experienceScore: atsResult.component_breakdown.experience_level.percentage,
      domainMatchScore: atsResult.component_breakdown.domain_alignment.percentage,
      recommendation: atsResult.match_score.hire_recommendation,
      // Backward compat — keep old field names mapped to closest new equivalents
      semanticScore: atsResult.component_breakdown.domain_alignment.percentage,
      structuredScore: atsResult.component_breakdown.hard_requirements.percentage,
      matchedSkills: atsResult.skill_analysis.matched.map(s => s.skill),
      missingSkills: atsResult.skill_analysis.missing_critical.map(s => s.skill),
      shortExplanation: atsResult.match_score.interpretation,
      detailedExplanation: formatDetailedExplanation(atsResult),
      isEligible: eligibilityResult.isEligible,
      ineligibilityReason: eligibilityResult.reason,
      redFlags: atsResult.red_flags,
      usage: {
        dailyUsed: updated?.sandboxUsageToday ?? 0,
        dailyLimit: realLimits.daily,
        monthlyUsed: updated?.sandboxUsageMonth ?? 0,
        monthlyLimit: realLimits.monthly,
      },
      analysis: atsResult // Full new ATS result
    });
  } catch (error: unknown) {
    // Handle ApiError from requireStudentProfileApi
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    // Handle guardrail violations with proper status codes
    if (error instanceof GuardrailViolation) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[api/student/sandbox] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
