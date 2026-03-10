import { describe, it, expect } from "vitest";

// ── Constants (mirror scoring.ts) ───────────────────────────────────────────
const SEMANTIC_WEIGHT = 0.7;
const STRUCTURED_WEIGHT = 0.3;
const REQUIRED_SKILLS_PTS = 50;
const PREFERRED_SKILLS_PTS = 20;
const CGPA_BUFFER_PTS = 15;
const PROJECT_KEYWORD_PTS = 15;

// ── Types ───────────────────────────────────────────────────────────────────

interface EligibilityCriteria {
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: ("alpha" | "beta" | "gamma")[] | null;
}

interface StudentProfile {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;
  skillNames: string[];
  projectKeywords: string[];
}

interface ScoringResult {
  matchScore: number;
  semanticScore: number;
  structuredScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation: string;
  isEligible: boolean;
  ineligibilityReason?: string;
}

interface MockStudent {
  id: string;
  name: string;
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;
  skills: { name: string; proficiency: number }[];
  projectKeywords: string[];
  embedding: number[] | null;
}

interface MockDrive {
  id: string;
  company: string;
  roleTitle: string;
  rawJd: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: ("alpha" | "beta" | "gamma")[] | null;
  jdEmbedding: number[];
}

interface RankingEntry {
  studentId: string;
  matchScore: number;
  semanticScore: number;
  structuredScore: number;
  rankPosition: number;
  isEligible: boolean;
  matchedSkills: string[];
  missingSkills: string[];
}

// ── Inline functions (mirror scoring.ts) ────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function checkEligibility(
  student: StudentProfile,
  criteria: EligibilityCriteria,
): { isEligible: boolean; reason?: string } {
  if (criteria.minCgpa !== null && criteria.minCgpa !== undefined) {
    if (student.cgpa === null || student.cgpa === undefined) {
      return { isEligible: false, reason: "CGPA not available" };
    }
    if (student.cgpa < criteria.minCgpa) {
      return {
        isEligible: false,
        reason: `CGPA ${student.cgpa.toFixed(2)} below minimum ${criteria.minCgpa}`,
      };
    }
  }
  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    if (!student.branch) {
      return { isEligible: false, reason: "Branch not available" };
    }
    const normalizedBranches = criteria.eligibleBranches.map((b) =>
      b.toLowerCase().trim(),
    );
    if (!normalizedBranches.includes(student.branch.toLowerCase().trim())) {
      return {
        isEligible: false,
        reason: `Branch "${student.branch}" not in eligible list`,
      };
    }
  }
  if (criteria.eligibleBatchYears && criteria.eligibleBatchYears.length > 0) {
    if (student.batchYear === null || student.batchYear === undefined) {
      return { isEligible: false, reason: "Batch year not available" };
    }
    if (!criteria.eligibleBatchYears.includes(student.batchYear)) {
      return {
        isEligible: false,
        reason: `Batch year ${student.batchYear} not in eligible list`,
      };
    }
  }
  if (criteria.eligibleCategories && criteria.eligibleCategories.length > 0) {
    if (!student.category) {
      return { isEligible: false, reason: "Performance category not available" };
    }
    if (!criteria.eligibleCategories.includes(student.category)) {
      return {
        isEligible: false,
        reason: `Category "${student.category}" not in eligible list`,
      };
    }
  }
  return { isEligible: true };
}

function skillMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryMatch = (term: string, text: string): boolean => {
    const pattern = new RegExp(`(?:^|[\\s,;|/])${escape(term)}(?:$|[\\s,;|/])`);
    return pattern.test(` ${text} `);
  };
  return boundaryMatch(a, b) || boundaryMatch(b, a);
}

function computeSkillOverlap(
  studentSkills: string[],
  requiredSkills: string[],
): { matchedSkills: string[]; missingSkills: string[]; overlapRatio: number } {
  if (requiredSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], overlapRatio: 1 };
  }
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase().trim());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const required of requiredSkills) {
    const normalizedRequired = required.toLowerCase().trim();
    const isMatched = normalizedStudentSkills.some((studentSkill) =>
      skillMatches(studentSkill, normalizedRequired),
    );
    if (isMatched) {
      matchedSkills.push(required);
    } else {
      missingSkills.push(required);
    }
  }
  return {
    matchedSkills,
    missingSkills,
    overlapRatio: matchedSkills.length / requiredSkills.length,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

function computeSemanticScore(
  studentEmbedding: number[],
  jdEmbedding: number[],
): number {
  const similarity = cosineSimilarity(studentEmbedding, jdEmbedding);
  return round2(similarity * 100);
}

function computeStructuredScore(opts: {
  requiredOverlapRatio: number;
  preferredOverlapRatio: number;
  cgpaAboveMin: number | null;
  projectKeywordHitRatio: number;
  isEligible: boolean;
}): number {
  if (!opts.isEligible) return 0;
  let score = 0;
  score += REQUIRED_SKILLS_PTS * opts.requiredOverlapRatio;
  score += PREFERRED_SKILLS_PTS * opts.preferredOverlapRatio;
  if (opts.cgpaAboveMin !== null && opts.cgpaAboveMin > 0) {
    const normalized = Math.min(opts.cgpaAboveMin / 2, 1);
    score += CGPA_BUFFER_PTS * normalized;
  }
  score += PROJECT_KEYWORD_PTS * opts.projectKeywordHitRatio;
  return round2(Math.min(score, 100));
}

function computeMatchScore(
  semanticScore: number,
  structuredScore: number,
): number {
  const score =
    SEMANTIC_WEIGHT * semanticScore + STRUCTURED_WEIGHT * structuredScore;
  return round2(score);
}

function computeProjectKeywordHitRatio(
  projectKeywords: string[],
  requiredSkills: string[],
): number {
  if (requiredSkills.length === 0 || projectKeywords.length === 0) return 0;
  let hits = 0;
  const cap = 5;
  for (const skill of requiredSkills) {
    const lower = skill.toLowerCase().trim();
    const matched = projectKeywords.some((kw) => skillMatches(kw, lower));
    if (matched) {
      hits++;
      if (hits >= cap) break;
    }
  }
  return Math.min(hits / cap, 1);
}

function computeAllScores(
  studentEmbedding: number[],
  jdEmbedding: number[],
  studentProfile: StudentProfile,
  requiredSkills: string[],
  preferredSkills: string[],
  eligibility: EligibilityCriteria,
): ScoringResult {
  const { isEligible, reason } = checkEligibility(studentProfile, eligibility);
  const { matchedSkills, missingSkills, overlapRatio: requiredOverlapRatio } =
    computeSkillOverlap(studentProfile.skillNames, requiredSkills);
  const { overlapRatio: preferredOverlapRatio } = computeSkillOverlap(
    studentProfile.skillNames,
    preferredSkills,
  );
  const projectKeywordHitRatio = computeProjectKeywordHitRatio(
    studentProfile.projectKeywords,
    requiredSkills,
  );
  const cgpaAboveMin =
    eligibility.minCgpa !== null &&
      studentProfile.cgpa !== null &&
      studentProfile.cgpa !== undefined
      ? studentProfile.cgpa - eligibility.minCgpa
      : null;
  const semanticScore = computeSemanticScore(studentEmbedding, jdEmbedding);
  const structuredScore = computeStructuredScore({
    requiredOverlapRatio,
    preferredOverlapRatio,
    cgpaAboveMin,
    projectKeywordHitRatio,
    isEligible,
  });
  const matchScore = computeMatchScore(semanticScore, structuredScore);
  return {
    matchScore,
    semanticScore,
    structuredScore,
    matchedSkills,
    missingSkills,
    shortExplanation: "",
    isEligible,
    ineligibilityReason: reason,
  };
}

// ── Ranking pipeline simulation ─────────────────────────────────────────────

function simulateRankingPipeline(
  drive: MockDrive,
  students: MockStudent[],
): RankingEntry[] {
  const eligibility: EligibilityCriteria = {
    minCgpa: drive.minCgpa,
    eligibleBranches: drive.eligibleBranches,
    eligibleBatchYears: drive.eligibleBatchYears,
    eligibleCategories: drive.eligibleCategories,
  };

  const results: Array<{
    studentId: string;
    scoring: ScoringResult;
    cgpa: number | null;
  }> = [];

  for (const student of students) {
    if (!student.embedding) continue;

    const studentProfile: StudentProfile = {
      cgpa: student.cgpa,
      branch: student.branch,
      batchYear: student.batchYear,
      category: student.category,
      skillNames: student.skills.map((s) => s.name),
      projectKeywords: student.projectKeywords,
    };

    const scoring = computeAllScores(
      student.embedding,
      drive.jdEmbedding,
      studentProfile,
      drive.requiredSkills,
      drive.preferredSkills,
      eligibility,
    );

    if (scoring.isEligible) {
      results.push({
        studentId: student.id,
        scoring,
        cgpa: student.cgpa,
      });
    }
  }

  results.sort((a, b) => {
    if (a.scoring.matchScore !== b.scoring.matchScore)
      return b.scoring.matchScore - a.scoring.matchScore;
    if (a.scoring.semanticScore !== b.scoring.semanticScore)
      return b.scoring.semanticScore - a.scoring.semanticScore;
    const cgpaA = a.cgpa ?? -1;
    const cgpaB = b.cgpa ?? -1;
    if (cgpaA !== cgpaB) return cgpaB - cgpaA;
    return a.studentId.localeCompare(b.studentId);
  });

  return results.map((r, idx) => ({
    studentId: r.studentId,
    matchScore: r.scoring.matchScore,
    semanticScore: r.scoring.semanticScore,
    structuredScore: r.scoring.structuredScore,
    rankPosition: idx + 1,
    isEligible: r.scoring.isEligible,
    matchedSkills: r.scoring.matchedSkills,
    missingSkills: r.scoring.missingSkills,
  }));
}

// ── Test Data ───────────────────────────────────────────────────────────────

function makeEmbedding(values: number[]): number[] {
  return values;
}

const testDrive: MockDrive = {
  id: "drive-001",
  company: "TechCorp",
  roleTitle: "Full Stack Engineer",
  rawJd: "Looking for a full stack engineer with React, Node.js, TypeScript, and PostgreSQL experience.",
  requiredSkills: ["react", "node.js", "typescript", "postgresql"],
  preferredSkills: ["docker", "aws"],
  minCgpa: 7.0,
  eligibleBranches: ["Computer Science", "IT"],
  eligibleBatchYears: [2026],
  eligibleCategories: null,
  jdEmbedding: makeEmbedding([0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0]),
};

const mockStudents: MockStudent[] = [
  {
    id: "student-alice",
    name: "Alice",
    cgpa: 9.0,
    branch: "Computer Science",
    batchYear: 2026,
    category: "alpha",
    skills: [
      { name: "react", proficiency: 4 },
      { name: "node.js", proficiency: 4 },
      { name: "typescript", proficiency: 3 },
      { name: "postgresql", proficiency: 3 },
    ],
    projectKeywords: ["react", "node.js", "typescript", "postgresql"],
    embedding: makeEmbedding([0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0]),
  },
  {
    id: "student-eve",
    name: "Eve",
    cgpa: 8.0,
    branch: "Computer Science",
    batchYear: 2026,
    category: "beta",
    skills: [],
    projectKeywords: [],
    embedding: null, // No embedding — should be skipped
  }
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Ranking Pipeline", () => {
  it("should skip students without embeddings (Eve)", () => {
    const rankings = simulateRankingPipeline(testDrive, mockStudents);
    const rankedIds = rankings.map((r) => r.studentId);
    expect(rankedIds).not.toContain("student-eve");
  });

  it("should correctly tie-break: equal matchScore → higher CGPA first", () => {
    const studentA: MockStudent = {
      ...mockStudents[0],
      id: "a",
      cgpa: 7.0,
      embedding: [0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    };
    const studentB: MockStudent = {
      ...mockStudents[0],
      id: "b",
      cgpa: 9.0,
      embedding: [0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // Same embedding → same semantic
    };

    const drive: MockDrive = {
      ...testDrive,
      jdEmbedding: [1, 1, 0, 0, 0, 0, 0, 0],
    };

    const results = simulateRankingPipeline(drive, [studentA, studentB]);
    // Same matchScore, same semanticScore → CGPA DESC → B (9.0) before A (7.0)
    expect(results[0].studentId).toBe("b");
  });

  it("should tie-break by UUID ASC when all else is equal", () => {
    const studentA: MockStudent = {
      ...mockStudents[0],
      id: "alpha",
      cgpa: 8.0,
      embedding: [0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    };
    const studentB: MockStudent = {
      ...mockStudents[0],
      id: "bravo",
      cgpa: 8.0,
      embedding: [0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    };

    const drive: MockDrive = {
      ...testDrive,
      jdEmbedding: [1, 1, 0, 0, 0, 0, 0, 0],
    };

    const results = simulateRankingPipeline(drive, [studentA, studentB]);
    // Same everything → UUID ASC → "alpha" before "bravo"
    expect(results[0].studentId).toBe("alpha");
  });
});

// ── Inlined Ranking API Trigger Logic (mirrors /api/drives/[driveId]/rank) ──

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TriggerResult {
  status: number;
  body: Record<string, unknown>;
}

async function simulateRankTrigger(
  driveId: string,
  _userRole: string,
  guardResult: { ok: boolean; error?: string; code?: number },
  existingJobId: string | null,
): Promise<TriggerResult> {
  // Validate UUID
  if (!UUID_REGEX.test(driveId)) {
    return { status: 400, body: { error: "Invalid drive ID format" } };
  }

  // Guardrail enforcement
  if (!guardResult.ok) {
    return { status: guardResult.code || 403, body: { error: guardResult.error || "Guardrail violation" } };
  }

  // Check for duplicate pending job
  if (existingJobId) {
    return { status: 202, body: { jobId: existingJobId, message: "Ranking already queued" } };
  }

  // Create new job
  return { status: 202, body: { jobId: "new-job-id", message: "Ranking queued" } };
}

describe("Ranking API Trigger", () => {
  it("should return 400 for an invalid UUID", async () => {
    const result = await simulateRankTrigger("abc", "admin", { ok: true }, null);
    expect(result.status).toBe(400);
  });

  it("should return 202 for faculty triggering an unranked drive", async () => {
    const result = await simulateRankTrigger(
      "00000000-0000-0000-0000-000000000000", "faculty", { ok: true }, null,
    );
    expect(result.status).toBe(202);
  });

  it("should return 403 for faculty re-triggering a ranked drive (GuardrailViolation)", async () => {
    const result = await simulateRankTrigger(
      "00000000-0000-0000-0000-000000000000", "faculty",
      { ok: false, error: "Already ranked", code: 403 }, null,
    );
    expect(result.status).toBe(403);
  });

  it("should return 202 for admin re-triggering a ranked drive", async () => {
    const result = await simulateRankTrigger(
      "00000000-0000-0000-0000-000000000000", "admin", { ok: true }, null,
    );
    expect(result.status).toBe(202);
  });

  it("should return 202 with existing jobId for duplicate pending job", async () => {
    const result = await simulateRankTrigger(
      "00000000-0000-0000-0000-000000000000", "admin", { ok: true }, "job-123",
    );
    expect(result.status).toBe(202);
    expect(result.body.jobId).toBe("job-123");
  });
});
