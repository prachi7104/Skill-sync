/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Ranking Pipeline Integration Test (Phase 6.5)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * End-to-end test of the ranking pipeline using mock student and drive data.
 *
 * Verifies:
 *   - Score computation correctness for multiple students
 *   - Ranking order (descending by matchScore)
 *   - Tie-breaking rules: matchScore → semanticScore → CGPA → UUID
 *   - Ineligible students excluded from rankings
 *   - Students without embeddings handled properly
 *
 * Uses inlined scoring functions (same as scoring.test.ts) to avoid
 * `server-only` import guard while testing the full pipeline flow.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

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

/**
 * Simulates the ranking pipeline (mirrors computeRanking.ts)
 * without DB dependencies.
 */
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
    // Skip students without embeddings (mirrors real pipeline)
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

    // Only include eligible students
    if (scoring.isEligible) {
      results.push({
        studentId: student.id,
        scoring,
        cgpa: student.cgpa,
      });
    }
  }

  // Sort: matchScore DESC → semanticScore DESC → CGPA DESC → UUID ASC
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

  // Assign rank positions
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

/**
 * Creates a simple unit embedding vector (used for controlled semantic scores).
 * Dimension = 8 for test simplicity.
 */
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
      { name: "docker", proficiency: 2 },
    ],
    projectKeywords: ["react", "node.js", "typescript", "postgresql", "docker"],
    embedding: makeEmbedding([0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0]),
  },
  {
    id: "student-bob",
    name: "Bob",
    cgpa: 7.5,
    branch: "Computer Science",
    batchYear: 2026,
    category: "beta",
    skills: [
      { name: "react", proficiency: 3 },
      { name: "node.js", proficiency: 2 },
    ],
    projectKeywords: ["react", "node.js"],
    embedding: makeEmbedding([0.4, 0.4, 0.3, 0.3, 0.1, 0.1, 0.0, 0.0]),
  },
  {
    id: "student-charlie",
    name: "Charlie",
    cgpa: 6.5, // Below minCgpa of 7.0
    branch: "Computer Science",
    batchYear: 2026,
    category: "gamma",
    skills: [
      { name: "react", proficiency: 5 },
      { name: "node.js", proficiency: 5 },
      { name: "typescript", proficiency: 5 },
      { name: "postgresql", proficiency: 5 },
    ],
    projectKeywords: ["react", "node.js", "typescript", "postgresql"],
    embedding: makeEmbedding([0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0]),
  },
  {
    id: "student-diana",
    name: "Diana",
    cgpa: 8.5,
    branch: "IT",
    batchYear: 2026,
    category: "alpha",
    skills: [
      { name: "react", proficiency: 3 },
      { name: "typescript", proficiency: 3 },
      { name: "docker", proficiency: 4 },
      { name: "aws", proficiency: 3 },
    ],
    projectKeywords: ["react", "typescript", "docker", "aws"],
    embedding: makeEmbedding([0.3, 0.3, 0.4, 0.4, 0.1, 0.1, 0.0, 0.0]),
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
  },
  {
    id: "student-frank",
    name: "Frank",
    cgpa: 7.0,
    branch: "Mechanical", // Not in eligible branches
    batchYear: 2026,
    category: "beta",
    skills: [
      { name: "react", proficiency: 4 },
      { name: "node.js", proficiency: 4 },
    ],
    projectKeywords: ["react", "node.js"],
    embedding: makeEmbedding([0.4, 0.4, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0]),
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Ranking Pipeline", () => {
  const rankings = simulateRankingPipeline(testDrive, mockStudents);

  it("should exclude ineligible students (Charlie: low CGPA, Frank: wrong branch)", () => {
    const rankedIds = rankings.map((r) => r.studentId);
    expect(rankedIds).not.toContain("student-charlie");
    expect(rankedIds).not.toContain("student-frank");
  });

  it("should skip students without embeddings (Eve)", () => {
    const rankedIds = rankings.map((r) => r.studentId);
    expect(rankedIds).not.toContain("student-eve");
  });

  it("should include eligible students (Alice, Bob, Diana)", () => {
    const rankedIds = rankings.map((r) => r.studentId);
    expect(rankedIds).toContain("student-alice");
    expect(rankedIds).toContain("student-bob");
    expect(rankedIds).toContain("student-diana");
  });

  it("should rank exactly 3 students", () => {
    expect(rankings).toHaveLength(3);
  });

  it("should assign rank positions 1, 2, 3", () => {
    expect(rankings.map((r) => r.rankPosition)).toEqual([1, 2, 3]);
  });

  it("should rank Alice first (highest skill overlap + highest semantic match)", () => {
    expect(rankings[0].studentId).toBe("student-alice");
  });

  it("should produce descending matchScore order", () => {
    for (let i = 0; i < rankings.length - 1; i++) {
      expect(rankings[i].matchScore).toBeGreaterThanOrEqual(
        rankings[i + 1].matchScore,
      );
    }
  });

  it("Alice should have all 4 required skills matched", () => {
    const alice = rankings.find((r) => r.studentId === "student-alice")!;
    expect(alice.matchedSkills).toHaveLength(4);
    expect(alice.missingSkills).toHaveLength(0);
  });

  it("Bob should match 2 of 4 required skills (react, node.js)", () => {
    const bob = rankings.find((r) => r.studentId === "student-bob")!;
    expect(bob.matchedSkills).toHaveLength(2);
    expect(bob.missingSkills).toHaveLength(2);
  });

  it("Diana should match 2 of 4 required skills (react, typescript)", () => {
    const diana = rankings.find((r) => r.studentId === "student-diana")!;
    expect(diana.matchedSkills).toHaveLength(2);
    expect(diana.missingSkills).toHaveLength(2);
  });

  it("all ranked students should be marked eligible", () => {
    rankings.forEach((r) => {
      expect(r.isEligible).toBe(true);
    });
  });

  it("matchScore should be within 0-100 range", () => {
    rankings.forEach((r) => {
      expect(r.matchScore).toBeGreaterThanOrEqual(0);
      expect(r.matchScore).toBeLessThanOrEqual(100);
    });
  });

  it("semanticScore should be within 0-100 range", () => {
    rankings.forEach((r) => {
      expect(r.semanticScore).toBeGreaterThanOrEqual(0);
      expect(r.semanticScore).toBeLessThanOrEqual(100);
    });
  });

  it("structuredScore should be within 0-100 range", () => {
    rankings.forEach((r) => {
      expect(r.structuredScore).toBeGreaterThanOrEqual(0);
      expect(r.structuredScore).toBeLessThanOrEqual(100);
    });
  });

  // ── Score Computation Verification ────────────────────────────────────

  describe("Score computation correctness", () => {
    it("Alice: semantic score should be 100 (identical embeddings)", () => {
      const alice = rankings.find((r) => r.studentId === "student-alice")!;
      expect(alice.semanticScore).toBe(100);
    });

    it("Alice: structured score should reflect full skill overlap + CGPA buffer + keywords", () => {
      const alice = rankings.find((r) => r.studentId === "student-alice")!;
      // Required overlap: 4/4 = 1.0 → 50 pts
      // Preferred overlap: docker matched → 1/2 = 0.5 → 10 pts
      // CGPA buffer: 9.0 - 7.0 = 2.0, min(2.0/2, 1) = 1 → 15 pts
      // Project keywords: 4 matched (react, node.js, typescript, postgresql) → 4/5 → 12 pts
      // Total: 50 + 10 + 15 + 12 = 87
      expect(alice.structuredScore).toBe(87);
    });

    it("Alice: matchScore = 0.7*100 + 0.3*87 = 96.1", () => {
      const alice = rankings.find((r) => r.studentId === "student-alice")!;
      expect(alice.matchScore).toBe(96.1);
    });
  });

  // ── Tie-breaking ──────────────────────────────────────────────────────

  describe("Tie-breaking", () => {
    it("should tie-break by CGPA DESC when matchScore and semanticScore are equal", () => {
      const tiedStudents: MockStudent[] = [
        {
          id: "zzz-student",
          name: "Z Student",
          cgpa: 8.0,
          branch: "Computer Science",
          batchYear: 2026,
          category: "beta",
          skills: [{ name: "react", proficiency: 3 }],
          projectKeywords: ["react"],
          embedding: makeEmbedding([0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
        {
          id: "aaa-student",
          name: "A Student",
          cgpa: 9.0,
          branch: "Computer Science",
          batchYear: 2026,
          category: "beta",
          skills: [{ name: "react", proficiency: 3 }],
          projectKeywords: ["react"],
          embedding: makeEmbedding([0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
      ];

      const driveNoRestrictions: MockDrive = {
        ...testDrive,
        minCgpa: null,
        eligibleBranches: null,
        eligibleBatchYears: null,
        eligibleCategories: null,
      };

      const tiedRankings = simulateRankingPipeline(driveNoRestrictions, tiedStudents);

      // Same embedding → same semantic score
      // Same skills → same structured score (nearly, except CGPA buffer)
      // CGPA tie-break: 9.0 > 8.0 → aaa-student first
      expect(tiedRankings[0].studentId).toBe("aaa-student");
      expect(tiedRankings[1].studentId).toBe("zzz-student");
    });

    it("should tie-break by UUID ASC when everything else is equal", () => {
      const identicalStudents: MockStudent[] = [
        {
          id: "zzz-student",
          name: "Z",
          cgpa: 8.0,
          branch: "Computer Science",
          batchYear: 2026,
          category: "beta",
          skills: [{ name: "react", proficiency: 3 }],
          projectKeywords: [],
          embedding: makeEmbedding([0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
        {
          id: "aaa-student",
          name: "A",
          cgpa: 8.0, // Same CGPA
          branch: "Computer Science",
          batchYear: 2026,
          category: "beta",
          skills: [{ name: "react", proficiency: 3 }],
          projectKeywords: [],
          embedding: makeEmbedding([0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        },
      ];

      const driveNoRestrictions: MockDrive = {
        ...testDrive,
        minCgpa: null,
        eligibleBranches: null,
        eligibleBatchYears: null,
        eligibleCategories: null,
      };

      const tiedRankings = simulateRankingPipeline(
        driveNoRestrictions,
        identicalStudents,
      );

      // Everything equal → UUID ASC: "aaa-student" < "zzz-student"
      expect(tiedRankings[0].studentId).toBe("aaa-student");
      expect(tiedRankings[1].studentId).toBe("zzz-student");
    });
  });

  // ── Empty / edge cases ────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("should return empty rankings when no students are eligible", () => {
      const driveHighBar: MockDrive = {
        ...testDrive,
        minCgpa: 10.0, // Nobody has 10.0
      };

      const result = simulateRankingPipeline(driveHighBar, mockStudents);
      expect(result).toHaveLength(0);
    });

    it("should return empty rankings when no students have embeddings", () => {
      const studentsNoEmbeddings = mockStudents.map((s) => ({
        ...s,
        embedding: null,
      }));

      const result = simulateRankingPipeline(testDrive, studentsNoEmbeddings);
      expect(result).toHaveLength(0);
    });

    it("should handle drive with no eligibility restrictions", () => {
      const openDrive: MockDrive = {
        ...testDrive,
        minCgpa: null,
        eligibleBranches: null,
        eligibleBatchYears: null,
        eligibleCategories: null,
      };

      // Charlie (low CGPA) and Frank (wrong branch) should now be included
      const result = simulateRankingPipeline(openDrive, mockStudents);
      const ids = result.map((r) => r.studentId);
      expect(ids).toContain("student-charlie");
      expect(ids).toContain("student-frank");
      // Eve still excluded (no embedding)
      expect(ids).not.toContain("student-eve");
      expect(result).toHaveLength(5);
    });

    it("should handle drive with no required or preferred skills", () => {
      const noSkillsDrive: MockDrive = {
        ...testDrive,
        requiredSkills: [],
        preferredSkills: [],
        minCgpa: null,
        eligibleBranches: null,
        eligibleBatchYears: null,
        eligibleCategories: null,
      };

      const result = simulateRankingPipeline(noSkillsDrive, mockStudents);
      // All with embeddings should be included
      expect(result).toHaveLength(5);
      // When no required skills, overlapRatio = 1, so structured component is high
      result.forEach((r) => {
        expect(r.matchScore).toBeGreaterThanOrEqual(0);
      });
    });

    it("should produce deterministic results across multiple runs", () => {
      const run1 = simulateRankingPipeline(testDrive, mockStudents);
      const run2 = simulateRankingPipeline(testDrive, mockStudents);

      expect(run1).toEqual(run2);
    });
  });
});
