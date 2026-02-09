import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { enforceSandboxLimits, incrementSandboxUsage, enforceProfileGate } from "@/lib/guardrails";
import { GuardrailViolation } from "@/lib/guardrails/errors";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  computeAllScores,
  generateDetailedExplanation,
  type StudentProfile,
  type EligibilityCriteria,
} from "@/lib/matching";
import { extractStudentSkillNames } from "@/lib/embeddings";
import { z } from "zod";
import type { Skill, Project, WorkExperience } from "@/lib/db/schema";

const sandboxSchema = z.object({
  jdText: z.string().min(20, "Job description must be at least 20 characters").max(10000),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  minCgpa: z.number().min(0).max(10).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — require student with profile
    const { user, profile } = await requireStudentProfile();

    // 2. Profile gate — must have complete enough profile
    await enforceProfileGate(user.id);

    // 3. Sandbox rate limits
    await enforceSandboxLimits(user.id);

    // 4. Parse input
    const body = await req.json();
    const parsed = sandboxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { jdText, requiredSkills = [], preferredSkills = [], minCgpa = null } = parsed.data;

    // 5. Build student profile for scoring
    const skills = (profile.skills as Skill[] | null) ?? [];
    const projects = (profile.projects as Project[] | null) ?? [];
    const workExperience = (profile.workExperience as WorkExperience[] | null) ?? [];

    const skillNames = extractStudentSkillNames(skills);
    const projectKeywords = [
      ...projects.flatMap((p) =>
        (p.techStack || []).map((t) => t.toLowerCase())
      ),
      ...workExperience.flatMap((w) =>
        w.description.toLowerCase().split(/\s+/)
      ),
    ];

    const studentProfile: StudentProfile = {
      cgpa: profile.cgpa,
      branch: profile.branch,
      batchYear: profile.batchYear,
      category: profile.category,
      skillNames,
      projectKeywords,
    };

    const eligibility: EligibilityCriteria = {
      minCgpa: minCgpa ?? null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    // 6. Compute scores
    // Use the student's embedding and a zero-vector for JD (since we don't
    // generate JD embeddings in the sandbox — the semantic score will be
    // based on skill overlap and structured scoring alone).
    const studentEmbedding = (profile.embedding as number[] | null) ?? new Array(384).fill(0);
    // For sandbox, use a zero vector to effectively disable semantic scoring
    // unless we have an actual JD embedding. The structured score carries the analysis.
    const jdEmbedding = new Array(384).fill(0);

    // If student has no embedding, structured scoring still works
    const scoringResult = computeAllScores(
      studentEmbedding,
      jdEmbedding,
      studentProfile,
      requiredSkills.length > 0 ? requiredSkills : extractSkillsFromText(jdText),
      preferredSkills,
      eligibility,
    );

    // Generate detailed explanation
    const detailedExplanation = generateDetailedExplanation({
      matchScore: scoringResult.matchScore,
      semanticScore: scoringResult.semanticScore,
      structuredScore: scoringResult.structuredScore,
      matchedSkills: scoringResult.matchedSkills,
      missingSkills: scoringResult.missingSkills,
      isEligible: scoringResult.isEligible,
      ineligibilityReason: scoringResult.ineligibilityReason,
      cgpa: profile.cgpa,
      minCgpa: minCgpa,
    });

    // 7. Increment usage counters (AFTER successful computation)
    await incrementSandboxUsage(user.id);

    // 8. Fetch updated usage for response
    const [updated] = await db
      .select({
        sandboxUsageToday: students.sandboxUsageToday,
        sandboxUsageMonth: students.sandboxUsageMonth,
      })
      .from(students)
      .where(eq(students.id, user.id))
      .limit(1);

    return NextResponse.json({
      matchScore: scoringResult.matchScore,
      semanticScore: scoringResult.semanticScore,
      structuredScore: scoringResult.structuredScore,
      matchedSkills: scoringResult.matchedSkills,
      missingSkills: scoringResult.missingSkills,
      shortExplanation: scoringResult.shortExplanation,
      detailedExplanation,
      isEligible: scoringResult.isEligible,
      ineligibilityReason: scoringResult.ineligibilityReason,
      usage: {
        dailyUsed: updated?.sandboxUsageToday ?? 0,
        dailyLimit: 3,
        monthlyUsed: updated?.sandboxUsageMonth ?? 0,
        monthlyLimit: 20,
      },
    });
  } catch (error: any) {
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

/**
 * Simple keyword extraction from JD text for sandbox when no explicit skills provided.
 * Extracts capitalized multi-word terms and common tech terms.
 */
function extractSkillsFromText(text: string): string[] {
  const commonTechTerms = new Set([
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
    "react", "angular", "vue", "node.js", "express", "django", "flask",
    "spring", "docker", "kubernetes", "aws", "azure", "gcp", "sql",
    "nosql", "mongodb", "postgresql", "redis", "graphql", "rest",
    "git", "ci/cd", "agile", "scrum", "machine learning", "deep learning",
    "tensorflow", "pytorch", "pandas", "numpy", "html", "css", "sass",
    "tailwind", "figma", "linux", "bash", "terraform", "jenkins",
  ]);

  const words = text.toLowerCase().split(/[\s,;.()]+/).filter(Boolean);
  const found: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    if (commonTechTerms.has(word) && !seen.has(word)) {
      seen.add(word);
      found.push(word);
    }
  }

  return found.slice(0, 15); // Cap at 15 skills
}
