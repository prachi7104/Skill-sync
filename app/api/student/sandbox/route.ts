
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { enforceSandboxLimits, enforceProfileGate, incrementSandboxUsage } from "@/lib/guardrails";
import { GuardrailViolation } from "@/lib/guardrails/errors";
import { db } from "@/lib/db";
import { isRedirectError } from "next/dist/client/components/redirect";
import { students, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkEligibility, type EligibilityCriteria, type StudentProfile } from "@/lib/matching";
import { parseJD } from "@/lib/jd/parser";
import { analyzeMatch } from "@/lib/ats";
import { getHireRecommendation } from "@/lib/ats/scoring";
import { ATSScore } from "@/lib/ats/types";
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { z } from "zod";
import type { Skill, Project, WorkExperience } from "@/lib/db/schema";
import { generateEmbedding, composeStudentEmbeddingText, cosineSimilarity, isValidEmbedding } from "@/lib/embeddings";
import { logger } from "@/lib/logger";
import { GENERATE_SANDBOX_FEEDBACK } from "@/lib/antigravity/prompts";
import { buildFeedbackPayload } from "@/lib/sandbox/build-feedback-payload";
import { getRouter } from "@/lib/antigravity/instance";

const sandboxSchema = z.object({
  jdText: z.string().min(20, "Job description must be at least 20 characters").max(10000),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  minCgpa: z.number().min(0).max(10).optional().nullable(),
});

function formatDetailedExplanation(result: ATSScore): string {
  const lines: string[] = [];

  // ── Headline ──
  lines.push(`## ${result.match_score.interpretation} — ${result.match_score.overall}/100`);
  lines.push("");

  // ── What's Working ──
  const matched = result.skill_analysis.matched.filter(m => m.matched_category === "Hard Requirement");
  if (matched.length > 0) {
    lines.push("### ✅ Strong Points");
    for (const m of matched.slice(0, 5)) {
      const evidence = m.evidence_description
        ? m.evidence_description.split(";")[0].trim()
        : "matched";
      const confidenceLabel = m.confidence >= 80 ? "Strong match" : m.confidence >= 60 ? "Moderate match" : "Weak match";
      lines.push(`- **${m.skill}** — ${confidenceLabel}. Evidence: ${evidence}`);
    }
    lines.push("");
  }

  // ── Critical Gaps ──
  const missing = result.skill_analysis.missing_critical;
  if (missing.length > 0) {
    lines.push("### 🚩 Critical Gaps (Required by JD)");
    for (const m of missing) {
      const nearMiss = m.semantic_near_miss
        ? ` *(${m.semantic_near_miss.confidence}% weak evidence found — strengthen it)*`
        : "";
      lines.push(`- **${m.skill}** — Not found in resume or profile.${nearMiss}`);
    }
    lines.push("");
  }

  // ── Domain / Stack Context ──
  const domain = result.component_breakdown.domain_alignment;
  lines.push("### 🎯 Domain Fit");
  if (domain.jd_stack && domain.candidate_stack) {
    if (domain.jd_stack === domain.candidate_stack) {
      lines.push(`- Your **${domain.candidate_stack}** background is a direct match for this role's stack.`);
    } else if (domain.percentage >= 50) {
      lines.push(`- JD targets **${domain.jd_stack}** — your **${domain.candidate_stack}** background is related (${domain.percentage.toFixed(0)}% alignment).`);
    } else {
      lines.push(`- ⚠️ JD targets **${domain.jd_stack}** — your **${domain.candidate_stack}** background is a mismatch. Focus on roles in your domain first.`);
    }
  }
  lines.push("");

  // ── Transferable Strengths ──
  const transferable = result.skill_analysis.transferable_strengths;
  if (transferable.length > 0) {
    lines.push("### 💡 Transferable Strengths");
    for (const t of transferable.slice(0, 3)) {
      lines.push(`- **${t.skill}** — ${t.relevance}`);
    }
    lines.push("");
  }

  // ── Top 3 Actions ──
  lines.push("### 📋 Top Actions Before Applying");
  const actions: string[] = [];

  // Missing required skills
  for (const m of missing.slice(0, 2)) {
    actions.push(`Add "${m.skill}" to your resume — it is listed as required in the JD`);
  }

  // Low-evidence matched skills
  const weakEvidence = matched.filter(m => m.evidence_level <= 1);
  for (const w of weakEvidence.slice(0, 2)) {
    actions.push(`Strengthen "${w.skill}" — it's listed but lacks project/work evidence`);
  }

  // Domain fix
  if (domain.percentage < 50 && domain.jd_stack) {
    actions.push(`Study the ${domain.jd_stack} ecosystem — it's the core domain for this role`);
  }

  if (actions.length === 0) {
    actions.push("Your profile is well-aligned. Quantify your project impact before applying (use numbers: %, ms, requests/sec)");
  }

  actions.slice(0, 3).forEach((a, i) => lines.push(`${i + 1}. ${a}`));

  return lines.join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileToResumeData(profile: any, skills: Skill[], projects: Project[], workExperience: WorkExperience[], userName?: string | null): ParsedResumeData {
  // Priority: parsed_resume_json (AI-parsed, most complete) > profile JSONB fields > hardcoded defaults
  const parsedJson = profile.parsedResumeJson as ParsedResumeData | null;

  return {
    full_name: userName || parsedJson?.full_name || "Candidate",
    email: parsedJson?.email || profile.email || null,
    phone: parsedJson?.phone || profile.phone || null,
    linkedin_url: parsedJson?.linkedin_url || profile.linkedin || null,
    professional_summary: parsedJson?.professional_summary || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coding_profiles: parsedJson?.coding_profiles || (profile.codingProfiles || []).map((cp: any) => ({ platform: cp.platform, profile_url: cp.url || cp.profile_url || "" })),
    education_history: (parsedJson?.education_history?.length ?? 0) > 0
      ? parsedJson!.education_history
      : [
          {
            institution: "University",
            degree: "Bachelor's",
            branch: profile.branch || "Unknown",
            current_cgpa: profile.cgpa,
            expected_graduation: profile.batchYear ? String(profile.batchYear) : undefined
          }
        ],
    experience: (parsedJson?.experience?.length ?? 0) > 0
      ? parsedJson!.experience
      : workExperience.map(w => ({
          company: w.company,
          role: w.role,
          duration: w.startDate + (w.endDate ? " - " + w.endDate : " - Present"),
          description: w.description,
          is_internship: w.role.toLowerCase().includes("intern")
        })),
    projects: (parsedJson?.projects?.length ?? 0) > 0
      ? parsedJson!.projects
      : projects.map(p => ({
          title: p.title,
          description: p.description,
          link: p.url,
          tech_stack: p.techStack,
          date: p.startDate
        })),
    skills: (parsedJson?.skills?.length ?? 0) > 0
      ? parsedJson!.skills
      : skills.map(s => ({ name: s.name, category: s.category || "other" })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    research_papers: parsedJson?.research_papers || (profile.researchPapers || []).map((r: any) => ({ title: r.title, paper_link: r.url })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    certifications: parsedJson?.certifications || (profile.certifications || []).map((c: any) => ({ certification_name: c.title, issuer: c.issuer, verification_link: c.url })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    achievements: parsedJson?.achievements || (profile.achievements || []).map((a: any) => ({ title: a.title, description: a.description })),
    soft_skills: parsedJson?.soft_skills || profile.softSkills || []
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [authUser] = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = authUser.role;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profile: any = null;
    if (role === "student") {
      const [studentRow] = await db
        .select()
        .from(students)
        .where(eq(students.id, authUser.id))
        .limit(1);

      if (!studentRow) {
        return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
      }
      profile = studentRow;
    } else {
      // Faculty/admin can run JD sandbox without student embedding context.
      profile = {
        id: authUser.id,
        skills: [],
        projects: [],
        workExperience: [],
        certifications: [],
        embedding: null,
        cgpa: null,
        branch: null,
        batchYear: null,
        category: null,
        sandboxUsageToday: 0,
        sandboxUsageMonth: 0,
        sandboxResetDate: null,
        sandboxMonthResetDate: null,
      };
    }

    // Fix: If embedding is missing or all-zeros (e.g. from legacy profile or failed job), generate it now
    if (role === "student" && !isValidEmbedding(profile.embedding as number[])) {
      logger.info("[Sandbox] Profile embedding missing. Generating on-the-fly...");
      try {
        const skills = (profile.skills as Skill[] | null) ?? [];
        const projects = (profile.projects as Project[] | null) ?? [];
        const workExperience = (profile.workExperience as WorkExperience[] | null) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const certifications = (profile.certifications as any[] | null) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const researchPapers = (profile.researchPapers as any[] | null) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const achievements = (profile.achievements as any[] | null) ?? [];
        const softSkills = (profile.softSkills as string[] | null) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const codingProfiles = (profile.codingProfiles as any[] | null) ?? [];

        const embeddingText = composeStudentEmbeddingText({
          skills,
          projects,
          workExperience,
          certifications,
          researchPapers,
          achievements,
          softSkills,
          codingProfiles,
        });

        const embedding = await generateEmbedding(embeddingText);

        // Save to DB so we don't regenerate next time
        await db.execute(sql`
          UPDATE students
          SET   embedding  = ${`[${embedding.join(",")}]`}::vector(768),
                updated_at = NOW()
          WHERE id = ${authUser.id}
        `);

        // Update local object so gate passes
        profile.embedding = embedding;
        logger.info("[Sandbox] Embedding generated and saved.");
      } catch (err) {
        console.error("[Sandbox] Failed to generate embedding:", err);
        // Continue and let the gate fail naturally with the correct error
      }
    }

    // 2. Profile gate — must have complete enough profile
    if (role === "student") {
      await enforceProfileGate(authUser.id);
    }

    // 3. Sandbox rate limits
    if (role === "student") {
      await enforceSandboxLimits(authUser.id, role);
    }

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

    const parsedResume = mapProfileToResumeData(profile, skills, projects, workExperience, authUser.name);

    // Analyze
    const atsResult = analyzeMatch(parsedJd, parsedResume);

    let jdEmbedding: number[] | null = null;
    try {
      const rawJdEmbedding = await generateEmbedding(jdText, "jd");
      if (isValidEmbedding(rawJdEmbedding)) {
        const norm = Math.sqrt(rawJdEmbedding.reduce((s, v) => s + v * v, 0));
        jdEmbedding = norm > 0 ? rawJdEmbedding.map((v) => v / norm) : null;
      }
    } catch (embErr: unknown) {
      const embErrMsg = embErr instanceof Error ? embErr.message : String(embErr);
      logger.warn(`[Sandbox] JD embedding failed, using ATS-only scoring: ${embErrMsg}`);
    }

    let matchScore: number;
    let semanticScore: number;
    let structuredScore: number;

    const studentEmbedding = isValidEmbedding(profile.embedding as number[])
      ? (profile.embedding as number[])
      : null;

    if (jdEmbedding && studentEmbedding) {
      const cosine = cosineSimilarity(studentEmbedding, jdEmbedding);
      semanticScore = Math.round(cosine * 100 * 100) / 100;
      structuredScore = atsResult.match_score.overall;
      matchScore = Math.round((semanticScore * 0.7 + structuredScore * 0.3) * 100) / 100;
    } else {
      semanticScore = atsResult.component_breakdown.domain_alignment.percentage;
      structuredScore = atsResult.match_score.overall;
      matchScore = atsResult.match_score.overall;
      logger.warn("[Sandbox] Falling back to ATS-only scoring (no embeddings)");
    }

    if (!eligibilityResult.isEligible) {
      atsResult.match_score.overall = 0;
      atsResult.match_score.interpretation = "Ineligible";
      atsResult.match_score.hire_recommendation = "REJECT";
      atsResult.red_flags.push({
        flag: eligibilityResult.reason || "Did not meet eligibility criteria",
        severity: "Critical",
        impact: -100,
      });

      matchScore = 0;
      semanticScore = 0;
      structuredScore = 0;
    }

    const expRequired = (parsedJd as { role_metadata?: { experience_years_min?: number } })
      ?.role_metadata?.experience_years_min ?? 0;
    const seniorityWarning =
      expRequired >= 3
        ? `This role requires ${expRequired}+ years of professional experience. Student profiles will score lower due to limited industry experience, this is expected and by design.`
        : null;

    // ── Generate AI card feedback (new system) ────────────────────────────────
    let cardFeedback: Record<string, unknown> | null = null;
    try {
      // Build payload for the AI prompt
      const feedbackPayload = buildFeedbackPayload(
        parsedJd as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        parsedResume as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        atsResult
      );

      // Call AI with the card-generation prompt
      const router = getRouter();
      const aiResult = await router.execute(
        "sandbox_feedback",
        `${feedbackPayload}\n\nGenerate the feedback cards now.`,
        {
          systemPrompt: GENERATE_SANDBOX_FEEDBACK,
          responseFormat: "json",
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      if (aiResult.success && aiResult.data) {
        const raw = typeof aiResult.data === "string" ? aiResult.data : JSON.stringify(aiResult.data);
        const cleaned = raw.replace(/```json|```/g, "").trim();
        cardFeedback = JSON.parse(cleaned);
      }
    } catch (feedbackErr) {
      console.warn("[Sandbox] Card feedback generation failed, falling back to old format:", feedbackErr);
      // cardFeedback stays null — frontend falls back to old display
    }

    // 7. Increment usage counters after successful analysis (students only)
    if (role === "student") {
      await incrementSandboxUsage(authUser.id);
    }

    // 8. Fetch updated usage for request context (students only)
    const [updated] = role === "student"
      ? await db
          .select({
            sandboxUsageToday: students.sandboxUsageToday,
            sandboxUsageMonth: students.sandboxUsageMonth,
          })
          .from(students)
          .where(eq(students.id, authUser.id))
          .limit(1)
      : [{ sandboxUsageToday: 0, sandboxUsageMonth: 0 }];

    return NextResponse.json({
      matchScore,
      semanticScore,
      structuredScore,
      // 4-dimension breakdown (new scoring system)
      hardSkillsScore: atsResult.component_breakdown.hard_requirements.percentage,
      softSkillsScore: atsResult.component_breakdown.soft_requirements.percentage,
      experienceScore: atsResult.component_breakdown.experience_level.percentage,
      domainMatchScore: atsResult.component_breakdown.domain_alignment.percentage,
      recommendation: eligibilityResult.isEligible ? getHireRecommendation(matchScore) : "Ineligible",
      matchedSkills: atsResult.skill_analysis.matched.map(s => s.skill),
      missingSkills: atsResult.skill_analysis.missing_critical.map(s => s.skill),
      shortExplanation: atsResult.match_score.interpretation,
      detailedExplanation: formatDetailedExplanation(atsResult),
      isEligible: eligibilityResult.isEligible,
      ineligibilityReason: eligibilityResult.reason ?? null,
      redFlags: atsResult.red_flags,
      seniorityWarning,
      scoreBreakdown: {
        semantic: { score: semanticScore, weight: 70, label: "Semantic Match" },
        ats: { score: structuredScore, weight: 30, label: "Keyword Match" },
        hasEmbedding: Boolean(jdEmbedding && studentEmbedding),
      },
      usage: {
        dailyUsed: updated?.sandboxUsageToday ?? 0,
        dailyLimit: 3,
        monthlyUsed: updated?.sandboxUsageMonth ?? 0,
        monthlyLimit: 20,
      },
      cardFeedback,        // New structured card data (null if AI generation failed)
      feedbackVersion: cardFeedback ? "v2_cards" : "v1_text",  // Frontend knows which to use
      analysis: atsResult // Full new ATS result
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    // Handle guardrail violations with proper status codes
    if (error instanceof GuardrailViolation) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    if (error?.message?.includes("Unauthorized") || error?.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error?.message?.includes("Student profile not found")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("[api/student/sandbox] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
