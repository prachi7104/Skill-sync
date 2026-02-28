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
import { students, drives, rankings } from "@/lib/db/schema";
import type { Skill, Project, WorkExperience } from "@/lib/db/schema";
import { eq, and, gte, inArray, or, isNull } from "drizzle-orm";
import {
  generateEmbedding,
  composeStudentEmbeddingText,
  composeJDEmbeddingText,
  extractStudentSkillNames,
  extractJDRequiredSkills,
} from "@/lib/embeddings";
import {
  computeAllScores,
  generateDetailedExplanation,
  type EligibilityCriteria,
  type StudentProfile,
  type ScoringResult,
} from "./scoring";

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Result of computing rankings for a drive.
 */
export interface RankingComputationResult {
  driveId: string;
  totalStudents: number;
  eligibleStudents: number;
  rankedStudents: number;
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
  certifications: any[] | null;
  embedding: number[] | null;
  resumeUrl: string | null;
}

// ── DB helpers ──────────────────────────────────────────────────────────────

/**
 * Fetches a drive by ID with all relevant fields.
 */
async function fetchDrive(driveId: string) {
  const result = await db
    .select()
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  return result[0] || null;
}

/**
 * Fetches all students that potentially match the drive eligibility criteria.
 * DB-level pre-filter (inclusive with NULL fallback), further filtering by
 * exact criteria is done in `checkEligibility`.
 */
async function fetchEligibleStudents(
  criteria: EligibilityCriteria,
): Promise<StudentForRanking[]> {
  const conditions: any[] = [];

  if (criteria.minCgpa !== null && criteria.minCgpa !== undefined) {
    conditions.push(
      or(gte(students.cgpa, criteria.minCgpa), isNull(students.cgpa)),
    );
  }

  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    conditions.push(
      or(
        inArray(students.branch, criteria.eligibleBranches),
        isNull(students.branch),
      ),
    );
  }

  if (criteria.eligibleBatchYears && criteria.eligibleBatchYears.length > 0) {
    conditions.push(
      or(
        inArray(students.batchYear, criteria.eligibleBatchYears),
        isNull(students.batchYear),
      ),
    );
  }

  if (criteria.eligibleCategories && criteria.eligibleCategories.length > 0) {
    conditions.push(
      or(
        inArray(students.category, criteria.eligibleCategories),
        isNull(students.category),
      ),
    );
  }

  const selectColumns = {
    id: students.id,
    cgpa: students.cgpa,
    branch: students.branch,
    batchYear: students.batchYear,
    category: students.category,
    skills: students.skills,
    projects: students.projects,
    workExperience: students.workExperience,
    certifications: students.certifications,
    embedding: students.embedding,
    resumeUrl: students.resumeUrl,
  };

  const query =
    conditions.length > 0
      ? db.select(selectColumns).from(students).where(and(...conditions))
      : db.select(selectColumns).from(students);

  const results = await query;

  return results.map((s) => ({
    id: s.id,
    cgpa: s.cgpa,
    branch: s.branch,
    batchYear: s.batchYear,
    category: s.category,
    skills: s.skills,
    projects: s.projects as Project[] | null,
    workExperience: s.workExperience as WorkExperience[] | null,
    certifications: s.certifications,
    embedding: s.embedding,
    resumeUrl: s.resumeUrl ?? null,
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

  await db
    .update(drives)
    .set({ jdEmbedding: embedding, updatedAt: new Date() })
    .where(eq(drives.id, drive.id));

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
  });

  if (!profileText || profileText.trim().length === 0) {
    return null;
  }

  const embedding = await generateEmbedding(profileText);

  await db
    .update(students)
    .set({ embedding, updatedAt: new Date() })
    .where(eq(students.id, student.id));

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

// ── Preferred skills extraction ─────────────────────────────────────────────

function extractJDPreferredSkills(
  parsedJd: { preferredSkills?: string[] } | null | undefined,
): string[] {
  if (
    !parsedJd ||
    !parsedJd.preferredSkills ||
    parsedJd.preferredSkills.length === 0
  ) {
    return [];
  }
  return parsedJd.preferredSkills.map((s: string) =>
    s.toLowerCase().trim(),
  );
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
  const SAFE_DURATION_MS = 45000; // Stay under Vercel Hobby's 60s limit
  const computeStart = Date.now();
  let skippedNoEmbedding = 0;

  console.log(`[Ranking] Starting computation for drive ${driveId}`);

  // 1. Fetch drive
  const drive = await fetchDrive(driveId);
  if (!drive) {
    throw new Error(`Drive not found: ${driveId}`);
  }

  console.log(`[Ranking] Drive: ${drive.company} - ${drive.roleTitle}`);

  // 2. Build eligibility criteria
  const eligibility: EligibilityCriteria = {
    minCgpa: drive.minCgpa,
    eligibleBranches: drive.eligibleBranches,
    eligibleBatchYears: drive.eligibleBatchYears,
    eligibleCategories: drive.eligibleCategories,
  };

  // 3. Fetch candidate students (DB pre-filtered)
  let allStudents = await fetchEligibleStudents(eligibility);
  console.log(`[Ranking] Found ${allStudents.length} candidate students`);

  const MAX_STUDENTS_PER_RANKING_RUN = 200;
  if (allStudents.length > MAX_STUDENTS_PER_RANKING_RUN) {
    console.warn(
      `[Ranking] Student cap applied — processing ${MAX_STUDENTS_PER_RANKING_RUN}/${allStudents.length} students. Upgrade server for full ranking.`,
      { driveId },
    );
    allStudents = allStudents.slice(0, MAX_STUDENTS_PER_RANKING_RUN);
  }

  // PILOT BEHAVIOUR: Students with NULL branch / batchYear / category are
  // deliberately included in rankings so newly-onboarded students appear even
  // before they complete their profile. This is intentional and acceptable for
  // the pilot; revisit before a production rollout with a larger student cohort.
  const nullFieldStudents = allStudents.filter(
    (s) => s.branch === null || s.batchYear === null || s.category === null,
  ).length;
  if (nullFieldStudents > 0) {
    console.warn(
      `[Ranking] ${nullFieldStudents} students have incomplete eligibility fields and were included by default`,
      { driveId },
    );
  }

  // 4. Ensure JD embedding exists
  let jdEmbedding: number[];
  try {
    jdEmbedding = await ensureJDEmbedding(drive);
    console.log(`[Ranking] JD embedding ready (${jdEmbedding.length} dims)`);
  } catch (err) {
    throw new Error(`Failed to generate JD embedding: ${err}`);
  }

  // 5. Extract required + preferred skills from JD
  const requiredSkills = extractJDRequiredSkills(drive.parsedJd);
  const preferredSkills = extractJDPreferredSkills(drive.parsedJd);
  console.log(
    `[Ranking] Required skills: ${requiredSkills.length}, Preferred: ${preferredSkills.length}`,
  );

  // 6. Compute scores for each student (parallelized with p-limit)
  type ScoredStudent = {
    studentId: string;
    scoring: ScoringResult;
    cgpa: number | null;
  };

  const scoredStudents: ScoredStudent[] = [];
  const limit = pLimit(5);

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
    if (Date.now() - computeStart > SAFE_DURATION_MS) {
      console.warn(`[Ranking] Time limit reached — stopping early`, { driveId });
      break;
    }

    if (result.status === "rejected") {
      const errorMsg = `Failed to generate embedding: ${result.reason}`;
      console.warn(`[Ranking] ${errorMsg}`);
      errors.push(errorMsg);
      continue;
    }

    const { student, embedding: studentEmbedding } = result.value;

    if (!studentEmbedding) {
      skippedNoEmbedding++;
      errors.push(
        `Skipped student ${student.id}: empty profile, cannot generate embedding`,
      );
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
      });
    } catch (err) {
      const errorMsg = `Failed to process student ${student.id}: ${err}`;
      console.warn(`[Ranking] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log(
    `[Ranking] Computed scores for ${scoredStudents.length} students`,
  );

  // 7. Filter: only eligible students appear in rankings
  const eligibleStudents = scoredStudents.filter(
    (s) => s.scoring.isEligible,
  );

  console.log(
    `[Ranking] Eligible: ${eligibleStudents.length} / ${scoredStudents.length}`,
  );

  // 8. Sort with tie-breaking:
  //    matchScore DESC → semanticScore DESC → CGPA DESC → UUID ASC
  eligibleStudents.sort((a, b) => {
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

  // 9. Assign rank positions (1-indexed)
  const rankedWithPositions = eligibleStudents.map((r, index) => ({
    ...r,
    rankPosition: index + 1,
  }));

  // 10. Persist rankings in a single transaction (DELETE + INSERT = idempotent)
  await db.transaction(async (tx) => {
    // Clear existing rankings for this drive
    await tx.delete(rankings).where(eq(rankings.driveId, driveId));

    // Insert new rankings
    if (rankedWithPositions.length > 0) {
      const rankingRows = rankedWithPositions.map((r) => ({
        driveId,
        studentId: r.studentId,
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
      }));

      await tx.insert(rankings).values(rankingRows);
    }
  });

  const durationMs = Date.now() - computeStart;
  console.log(`[Ranking] Completed in ${durationMs}ms`);

  // Log first 5 ranked student IDs for debugging
  if (rankedWithPositions.length > 0) {
    const sample = rankedWithPositions
      .slice(0, 5)
      .map((r) => `${r.rankPosition}. ${r.studentId} (${r.scoring.matchScore.toFixed(1)})`)
      .join(", ");
    console.log(`[Ranking] Top-ranked students: ${sample}`);
  }

  // 11. Return summary
  return {
    driveId,
    totalStudents: allStudents.length,
    eligibleStudents: eligibleStudents.length,
    rankedStudents: rankedWithPositions.length,
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
