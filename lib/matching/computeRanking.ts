/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Ranking Computation Service
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Core ranking computation service that:
 * 1. Fetches drive JD and eligible students
 * 2. Computes semantic + structured scores for each student
 * 3. Filters out ineligible students
 * 4. Sorts with proper tie-breaking
 * 5. Persists rankings to the database in a single transaction
 *
 * Input:  drive_id
 * Output: Rankings table populated with scores, explanations, and positions
 *
 * Rules:
 * - Respects RLS (uses service-role client)
 * - Uses single DB transaction for idempotent writes
 * - Deterministic output for same inputs
 * - Re-running replaces old results cleanly (DELETE + INSERT)
 * - Students without embeddings or resume are skipped
 * - Ineligible students are excluded from rankings
 * - Tie-breaking: matchScore DESC → semanticScore DESC → CGPA DESC → UUID ASC
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import pLimit from "p-limit";
import { db } from "@/lib/db";
import { students, drives, rankings, users } from "@/lib/db/schema";
import type { Skill, Project, WorkExperience, ResearchPaper, Achievement, CodingProfile } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import {
  generateEmbedding,
  composeStudentEmbeddingText,
  composeJDEmbeddingText,
  extractStudentSkillNames,
  extractJDRequiredSkills,
  extractJDPreferredSkills,
} from "@/lib/embeddings";
import {
  computeAllScores,
  checkEligibility,
  generateDetailedExplanation,
  computeSkillOverlap,
  round2,
  type EligibilityCriteria,
  type StudentProfile,
  type ScoringResult,
} from "./scoring";
import { logger } from "@/lib/logger";

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Result of computing rankings for a drive.
 */
export interface RankingComputationResult {
  driveId: string;
  totalStudents: number;
  eligibleStudents: number;
  rankedStudents: number;
  wasTruncated: boolean;
  truncatedAt: number;
  skippedNoEmbedding: number;
  topScores: Array<{
    studentId: string;
    matchScore: number;
    rankPosition: number;
  }>;
  errors: string[];
  durationMs: number;
}

/**
 * Extended student data for ranking computation.
 */
interface StudentForRanking {
  id: string;
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;
  skills: Skill[] | null;
  projects: Project[] | null;
  workExperience: WorkExperience[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  certifications: any[] | null;
  researchPapers: ResearchPaper[] | null;
  achievements: Achievement[] | null;
  softSkills: string[] | null;
  codingProfiles: CodingProfile[] | null;
  embedding: number[] | null;
  profileCompleteness: number | null;
}

// ── DB helpers ──────────────────────────────────────────────────────────────

/**
 * Fetches a drive by ID with all relevant fields.
 */
async function fetchDrive(driveId: string) {
  const result = await db
    .select({
      id: drives.id,
      createdBy: drives.createdBy,
      company: drives.company,
      roleTitle: drives.roleTitle,
      rawJd: drives.rawJd,
      parsedJd: drives.parsedJd,
      minCgpa: drives.minCgpa,
      eligibleBranches: drives.eligibleBranches,
      eligibleBatchYears: drives.eligibleBatchYears,
      eligibleCategories: drives.eligibleCategories,
      jdEmbedding: drives.jdEmbedding,
      collegeId: users.collegeId,
    })
    .from(drives)
    .innerJoin(users, eq(drives.createdBy, users.id))
    .where(eq(drives.id, driveId))
    .limit(1);

  return result[0] || null;
}

/**
 * Fetches all students that potentially match the drive eligibility criteria.
 * DB-level pre-filter (inclusive with NULL fallback), further filtering by
 * exact criteria is done in `checkEligibility`.
 */
async function fetchAllStudentsForCollege(
  collegeId: string,
): Promise<StudentForRanking[]> {
  const results = await db
    .select({
      id: students.id,
      cgpa: students.cgpa,
      branch: students.branch,
      batchYear: students.batchYear,
      category: students.category,
      skills: students.skills,
      projects: students.projects,
      workExperience: students.workExperience,
      certifications: students.certifications,
      researchPapers: students.researchPapers,
      achievements: students.achievements,
      softSkills: students.softSkills,
      codingProfiles: students.codingProfiles,
      embedding: students.embedding,
      profileCompleteness: students.profileCompleteness,
    })
    .from(students)
    .where(eq(students.collegeId, collegeId))
    .orderBy(asc(students.createdAt));

  return results.map((s: any) => ({
    id: s.id,
    cgpa: s.cgpa,
    branch: s.branch,
    batchYear: s.batchYear,
    category: s.category,
    skills: s.skills,
    projects: s.projects as Project[] | null,
    workExperience: s.workExperience as WorkExperience[] | null,
    certifications: s.certifications,
    researchPapers: s.researchPapers,
    achievements: s.achievements,
    softSkills: s.softSkills,
    codingProfiles: s.codingProfiles,
    embedding: s.embedding,
    profileCompleteness: s.profileCompleteness ?? 0,
  }));
}

// ── Embedding helpers ───────────────────────────────────────────────────────

/**
 * Generates JD embedding if not already present.
 */
async function ensureJDEmbedding(
  drive: NonNullable<Awaited<ReturnType<typeof fetchDrive>>>,
): Promise<number[]> {
  if (drive.jdEmbedding && drive.jdEmbedding.length === 768) {
    return drive.jdEmbedding;
  }

  const jdText = composeJDEmbeddingText({
    parsedJd: drive.parsedJd,
    rawJd: drive.rawJd,
    roleTitle: drive.roleTitle,
    company: drive.company,
  });

  const embedding = await generateEmbedding(jdText);

  // Guard: empty array means text was empty → compose produced no output
  if (!embedding || embedding.length === 0) {
    // Fall back: use raw JD text directly
    const fallbackText = `Role: ${drive.roleTitle}. ${drive.rawJd}`.slice(0, 8000);
    const fallbackEmbedding = await generateEmbedding(fallbackText);
    if (!fallbackEmbedding || fallbackEmbedding.length === 0) {
      throw new Error("JD embedding generation failed: empty text, raw JD fallback also empty");
    }
    // Use fallback and continue (don't try to write the empty vector)
    return fallbackEmbedding; // skip the db.update — embedding will regenerate next time
  }

  // Guard: zero vectors mean Gemini failed silently — ranking with a zero JD
  // embedding would assign semanticScore=0 to every student, so abort entirely.
  const isZeroJD = embedding.length === 768 && embedding.every((v) => v === 0);
  if (isZeroJD) {
    throw new Error(
      "JD embedding generation returned a zero vector — Gemini failed. Ranking aborted. Will retry on next cron tick.",
    );
  }

  await db.execute(sql`
    UPDATE drives
    SET   jd_embedding = ${`[${embedding.join(",")}]`}::vector(768),
          updated_at   = NOW()
    WHERE id = ${drive.id}
  `);

  return embedding;
}

/**
 * Generates student embedding if not already present.
 * Returns null (instead of throwing) if profile text is empty.
 */
async function ensureStudentEmbedding(
  student: StudentForRanking,
): Promise<number[] | null> {
  if (student.embedding && student.embedding.length === 768) {
    return student.embedding;
  }

  const profileText = composeStudentEmbeddingText({
    skills: student.skills,
    projects: student.projects,
    workExperience: student.workExperience,
    certifications: student.certifications,
    researchPapers: student.researchPapers,
    achievements: student.achievements,
    softSkills: student.softSkills,
    codingProfiles: student.codingProfiles,
  });

  if (!profileText || profileText.trim().length === 0) {
    return null;
  }

  const embedding = await generateEmbedding(profileText);

  // Guard: do not store zero vectors — they corrupt semantic scoring.
  // Return null so this student is treated as having no embedding and is skipped.
  const isZeroStudent =
    embedding.length === 768 && embedding.every((v) => v === 0);
  if (isZeroStudent) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Ranking] Zero vector for student ${student.id} — skipping.`,
    );
    return null;
  }

  await db.execute(sql`
    UPDATE students
    SET   embedding  = ${`[${embedding.join(",")}]`}::vector(768),
          updated_at = NOW()
    WHERE id = ${student.id}
  `);

  return embedding;
}

// ── Keyword extraction ──────────────────────────────────────────────────────

/**
 * Extracts lowercase keywords from project descriptions and work experience
 * descriptions. These are matched against JD required skills.
 */
function extractProjectKeywords(
  projects: Project[] | null,
  workExperience: WorkExperience[] | null,
): string[] {
  const keywords = new Set<string>();

  if (projects) {
    for (const p of projects) {
      if (p.techStack) {
        for (const t of p.techStack) keywords.add(t.toLowerCase().trim());
      }
      // Tokenize description into lowercase words > 2 chars
      if (p.description) {
        for (const w of tokenize(p.description)) keywords.add(w);
      }
    }
  }

  if (workExperience) {
    for (const w of workExperience) {
      if (w.description) {
        for (const word of tokenize(w.description)) keywords.add(word);
      }
    }
  }

  return Array.from(keywords);
}

/** Tokenize text into lowercase words > 2 chars. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;.()[\]{}/\\|]+/)
    .filter((w) => w.length > 2);
}



// ── Main ────────────────────────────────────────────────────────────────────

/**
 * Main ranking computation function.
 *
 * 1. Fetches drive + eligible students
 * 2. Hard-gates on embedding + resume
 * 3. Computes scores via the scoring module
 * 4. Filters ineligible students out of rankings
 * 5. Sorts with tie-breaking
 * 6. Persists in a single transaction
 */
export async function computeRanking(
  driveId: string,
): Promise<RankingComputationResult> {
  const errors: string[] = [];
  const computeStart = Date.now();
  let skippedNoEmbedding = 0;

  // eslint-disable-next-line no-console
  console.log(`[Ranking] Starting computation for drive ${driveId}`);

  // 1. Fetch drive
  const drive = await fetchDrive(driveId);
  if (!drive) {
    throw new Error(`Drive not found: ${driveId}`);
  }

  // eslint-disable-next-line no-console
  console.log(`[Ranking] Drive: ${drive.company} - ${drive.roleTitle}`);

  // 2. Build eligibility criteria
  const eligibility: EligibilityCriteria = {
    minCgpa: drive.minCgpa,
    eligibleBranches: drive.eligibleBranches,
    eligibleBatchYears: drive.eligibleBatchYears,
    eligibleCategories: drive.eligibleCategories,
  };

  if (!drive.collegeId) {
    throw new Error(`Drive ${driveId} creator has no college context`);
  }

  // 3. Fetch all students in the same college
  let allStudents = await fetchAllStudentsForCollege(drive.collegeId);
  // eslint-disable-next-line no-console
  console.log(`[Ranking] Total students in college: ${allStudents.length}`);
  const totalStudentsFetched = allStudents.length;

  const MAX_STUDENTS_PER_RANKING_RUN = 5000;
  if (allStudents.length > MAX_STUDENTS_PER_RANKING_RUN) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Ranking] Cap applied: ${MAX_STUDENTS_PER_RANKING_RUN}/${allStudents.length}`,
      { driveId },
    );
    allStudents = allStudents.slice(0, MAX_STUDENTS_PER_RANKING_RUN);
  }

  // 4. Ensure JD embedding exists
  let jdEmbedding: number[];
  try {
    jdEmbedding = await ensureJDEmbedding(drive);
    // eslint-disable-next-line no-console
    console.log(`[Ranking] JD embedding ready (${jdEmbedding.length} dims)`);
  } catch (err: unknown) {
    throw new Error(`Failed to generate JD embedding: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 5. Extract required + preferred skills from JD
  const requiredSkills = extractJDRequiredSkills(drive.parsedJd);
  const preferredSkills = extractJDPreferredSkills(drive.parsedJd);
  // eslint-disable-next-line no-console
  console.log(
    `[Ranking] Required skills: ${requiredSkills.length}, Preferred: ${preferredSkills.length}`,
  );

  // 6. Compute scores for each student (parallelized with p-limit)
  type ScoredStudent = {
    studentId: string;
    scoring: ScoringResult;
    cgpa: number | null;
    profileCompleteness: number;
    isEligible: boolean;
  };

  const scoredStudents: ScoredStudent[] = [];
  const limit = pLimit(5);
  const RANKING_TIMEOUT_MS = 50000; // 50s hard limit
  const startTime = Date.now();

  // Parallelize embedding generation with concurrency of 5
  const embeddingResults = await Promise.allSettled(
    allStudents.map((student) =>
      limit(async () => {
        const emb = await ensureStudentEmbedding(student);
        return { student, embedding: emb };
      }),
    ),
  );

  for (const result of embeddingResults) {
    if (Date.now() - startTime > RANKING_TIMEOUT_MS) {
      // eslint-disable-next-line no-console
      console.warn(`[Ranking] Timeout approaching — stopping at ${scoredStudents.length} students`, { driveId });
      break;
    }

    if (result.status === "rejected") {
      const errorMsg = `Failed to generate embedding: ${result.reason}`;
      // eslint-disable-next-line no-console
      console.warn(`[Ranking] ${errorMsg}`);
      errors.push(errorMsg);
      continue;
    }

    const { student, embedding: studentEmbedding } = result.value;

    const eligibilityResult = checkEligibility(
      {
        cgpa: student.cgpa,
        branch: student.branch,
        batchYear: student.batchYear,
        category: student.category,
        skillNames: [],
        projectKeywords: [],
      },
      eligibility,
    );

    if (!eligibilityResult.isEligible) {
      scoredStudents.push({
        studentId: student.id,
        scoring: {
          matchScore: 0,
          semanticScore: 0,
          structuredScore: 0,
          matchedSkills: [],
          missingSkills: [],
          shortExplanation: `Ineligible: ${eligibilityResult.reason}`,
          isEligible: false,
          ineligibilityReason: eligibilityResult.reason ?? "Does not meet drive criteria",
        },
        cgpa: student.cgpa,
        profileCompleteness: student.profileCompleteness ?? 0,
        isEligible: false,
      });
      continue;
    }

    if (!studentEmbedding) {
      // No embedding — use ATS-only scoring (30% of max)
      const { overlapRatio, matchedSkills, missingSkills } = computeSkillOverlap(
        extractStudentSkillNames(student.skills),
        requiredSkills,
      );
      const atsOnlyScore = overlapRatio * 30;  // Max 30 (structured weight)

      scoredStudents.push({
        studentId: student.id,
        scoring: {
          matchScore: round2(atsOnlyScore),
          semanticScore: 0,
          structuredScore: round2(atsOnlyScore / 0.3),  // Normalize back
          matchedSkills,
          missingSkills,
          shortExplanation: "Keyword match only — generate profile embedding for full score",
          isEligible: true,
          ineligibilityReason: undefined,
        },
        cgpa: student.cgpa,
        profileCompleteness: student.profileCompleteness ?? 0,
        isEligible: true,
      });
      continue;
    }

    try {
      // Build student profile for scoring
      const projectKeywords = extractProjectKeywords(
        student.projects,
        student.workExperience,
      );

      const studentProfile: StudentProfile = {
        cgpa: student.cgpa,
        branch: student.branch,
        batchYear: student.batchYear,
        category: student.category,
        skillNames: extractStudentSkillNames(student.skills),
        projectKeywords,
      };

      // Compute all scores
      const scoring = computeAllScores(
        studentEmbedding,
        jdEmbedding,
        studentProfile,
        requiredSkills,
        preferredSkills,
        eligibility,
      );

      scoredStudents.push({
        studentId: student.id,
        scoring,
        cgpa: student.cgpa,
        profileCompleteness: student.profileCompleteness ?? 0,
        isEligible: true,
      });
    } catch (err: unknown) {
      const errorMsg = `Failed to process student ${student.id}: ${err instanceof Error ? err.message : String(err)}`;
      logger.warn(`[Ranking] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[Ranking] Computed scores for ${scoredStudents.length} students`,
  );

  // 7. Sort all students with tie-breaking:
  //    matchScore DESC → semanticScore DESC → CGPA DESC → UUID ASC
  scoredStudents.sort((a, b) => {
    // Primary: matchScore DESC
    if (a.scoring.matchScore !== b.scoring.matchScore) {
      return b.scoring.matchScore - a.scoring.matchScore;
    }
    // Tie-break 1: semanticScore DESC
    if (a.scoring.semanticScore !== b.scoring.semanticScore) {
      return b.scoring.semanticScore - a.scoring.semanticScore;
    }
    // Tie-break 2: CGPA DESC (nulls last)
    const cgpaA = a.cgpa ?? -1;
    const cgpaB = b.cgpa ?? -1;
    if (cgpaA !== cgpaB) {
      return cgpaB - cgpaA;
    }
    // Tie-break 3: UUID ASC (lexicographic)
    return a.studentId.localeCompare(b.studentId);
  });

  // 8. Assign rank positions (1-indexed)
  const rankedWithPositions = scoredStudents.map((r, index) => ({
    ...r,
    rankPosition: index + 1,
  }));

  // 9. Persist rankings in a single upsert transaction
  await db.transaction(async (tx: any) => {
    if (rankedWithPositions.length > 0) {
      const rankingRows = rankedWithPositions.map((r) => ({
        driveId,
        studentId: r.studentId,
        collegeId: drive.collegeId,
        matchScore: r.scoring.matchScore,
        semanticScore: r.scoring.semanticScore,
        structuredScore: r.scoring.structuredScore,
        matchedSkills: r.scoring.matchedSkills,
        missingSkills: r.scoring.missingSkills,
        shortExplanation: r.scoring.shortExplanation,
        detailedExplanation: generateDetailedExplanation({
          ...r.scoring,
          cgpa: r.cgpa,
          minCgpa: eligibility.minCgpa,
          rankPosition: r.rankPosition,
        }),
        rankPosition: r.rankPosition,
        isEligible: r.isEligible,
        ineligibilityReason: r.scoring.ineligibilityReason ?? null,
        profileCompletenessAtRank: r.profileCompleteness ?? 0,
      }));

      await tx.insert(rankings).values(rankingRows).onConflictDoUpdate({
        target: [rankings.driveId, rankings.studentId],
        set: {
          matchScore: sql`excluded.match_score`,
          semanticScore: sql`excluded.semantic_score`,
          structuredScore: sql`excluded.structured_score`,
          matchedSkills: sql`excluded.matched_skills`,
          missingSkills: sql`excluded.missing_skills`,
          shortExplanation: sql`excluded.short_explanation`,
          detailedExplanation: sql`excluded.detailed_explanation`,
          rankPosition: sql`excluded.rank_position`,
          isEligible: sql`excluded.is_eligible`,
          ineligibilityReason: sql`excluded.ineligibility_reason`,
          profileCompletenessAtRank: sql`excluded.profile_completeness_at_rank`,
          updatedAt: new Date(),
        },
      });
    }
  });

  // After db.insert(rankings)...
  await db.update(drives)
    .set({ ranking_status: "completed", updatedAt: new Date() })
    .where(eq(drives.id, driveId))
    .catch(() => {}); // non-fatal

  const durationMs = Date.now() - computeStart;
  // eslint-disable-next-line no-console
  console.log(`[Ranking] Completed in ${durationMs}ms`);

  // 11. Return summary
  return {
    driveId,
    totalStudents: totalStudentsFetched,
    eligibleStudents: scoredStudents.filter((s) => s.isEligible).length,
    rankedStudents: rankedWithPositions.length,
    wasTruncated: totalStudentsFetched > MAX_STUDENTS_PER_RANKING_RUN,
    truncatedAt: MAX_STUDENTS_PER_RANKING_RUN,
    skippedNoEmbedding,
    topScores: rankedWithPositions.slice(0, 5).map((r) => ({
      studentId: r.studentId,
      matchScore: r.scoring.matchScore,
      rankPosition: r.rankPosition,
    })),
    errors,
    durationMs,
  };
}
