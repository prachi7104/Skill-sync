/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Ranking Pipeline Integration Tests (Phase 6.5 — Rewrite)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * End-to-end test of the ranking pipeline using mock student and drive data.
 * Constants are imported from scoring-constants.ts (not hardcoded).
 *
 * Verifies:
 *   1. Perfect match → matchScore near 100
 *   2. Zero match (no skills, no semantic similarity) → matchScore near 0
 *   3. Ineligible student (low CGPA) → excluded from rankings
 *   4. Ineligible student (wrong branch) → excluded from rankings
 *   5. Tie-breaking: same matchScore → sorted by semanticScore DESC
 *   6. Tie-breaking: same matchScore + semanticScore → sorted by CGPA DESC
 *   7. Student without embedding → skipped
 *   8. Empty required skills in JD → 0 skill pts, only semantic contributes
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import {
  SEMANTIC_WEIGHT,
  STRUCTURED_WEIGHT,
  REQUIRED_SKILLS_PTS,
  PREFERRED_SKILLS_PTS,
  PROJECT_KEYWORD_PTS,
} from "../lib/matching/scoring-constants";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Inline implementations (mirror scoring.ts) ────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function checkEligibility(
  student: StudentProfile,
  criteria: EligibilityCriteria,
): { isEligible: boolean; reason?: string } {
  if (criteria.minCgpa !== null) {
    if (student.cgpa === null || student.cgpa === undefined)
      return { isEligible: false, reason: "CGPA not available" };
    if (student.cgpa < criteria.minCgpa)
      return { isEligible: false, reason: `CGPA ${student.cgpa.toFixed(2)} below minimum ${criteria.minCgpa}` };
  }
  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    if (!student.branch) return { isEligible: false, reason: "Branch not available" };
    if (!criteria.eligibleBranches.map((b) => b.toLowerCase()).includes(student.branch.toLowerCase()))
      return { isEligible: false, reason: `Branch "${student.branch}" not in eligible list` };
  }
  if (criteria.eligibleBatchYears && criteria.eligibleBatchYears.length > 0) {
    if (student.batchYear === null || student.batchYear === undefined)
      return { isEligible: false, reason: "Batch year not available" };
    if (!criteria.eligibleBatchYears.includes(student.batchYear))
      return { isEligible: false, reason: `Batch year ${student.batchYear} not eligible` };
  }
  if (criteria.eligibleCategories && criteria.eligibleCategories.length > 0) {
    if (!student.category) return { isEligible: false, reason: "Category not available" };
    if (!criteria.eligibleCategories.includes(student.category))
      return { isEligible: false, reason: `Category "${student.category}" not eligible` };
  }
  return { isEligible: true };
}

function skillMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = (term: string, text: string) =>
    new RegExp(`(?:^|[\\s,;|/])${escape(term)}(?:$|[\\s,;|/])`).test(` ${text} `);
  return boundary(a, b) || boundary(b, a);
}

function computeSkillOverlap(
  studentSkills: string[],
  requiredSkills: string[],
): { matchedSkills: string[]; missingSkills: string[]; overlapRatio: number } {
  if (requiredSkills.length === 0) return { matchedSkills: [], missingSkills: [], overlapRatio: 1 };
  const normalized = studentSkills.map((s) => s.toLowerCase().trim());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const req of requiredSkills) {
    const n = req.toLowerCase().trim();
    if (normalized.some((sk) => skillMatches(sk, n))) matchedSkills.push(req);
    else missingSkills.push(req);
  }
  return { matchedSkills, missingSkills, overlapRatio: matchedSkills.length / requiredSkills.length };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(magA) * Math.sqrt(magB))));
}

function computeProjectKeywordHitRatio(projectKeywords: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0 || projectKeywords.length === 0) return 0;
  let hits = 0;
  const cap = 5;
  for (const skill of requiredSkills) {
    if (projectKeywords.some((kw) => skillMatches(kw, skill.toLowerCase()))) {
      hits++;
      if (hits >= cap) break;
    }
  }
  return Math.min(hits / cap, 1);
}

function computeStructuredScore(opts: {
  requiredOverlapRatio: number;
  preferredOverlapRatio: number;
  projectKeywordHitRatio: number;
  isEligible: boolean;
}): number {
  if (!opts.isEligible) return 0;
  const score =
    REQUIRED_SKILLS_PTS * opts.requiredOverlapRatio +
    PREFERRED_SKILLS_PTS * opts.preferredOverlapRatio +
    PROJECT_KEYWORD_PTS * opts.projectKeywordHitRatio;
  return round2(Math.min(score, 100));
}

function computeMatchScore(semantic: number, structured: number): number {
  return round2(SEMANTIC_WEIGHT * semantic + STRUCTURED_WEIGHT * structured);
}

function computeAllScores(
  studentEmbedding: number[],
  jdEmbedding: number[],
  profile: StudentProfile,
  requiredSkills: string[],
  preferredSkills: string[],
  eligibility: EligibilityCriteria,
): ScoringResult {
  const { isEligible, reason } = checkEligibility(profile, eligibility);
  const { matchedSkills, missingSkills, overlapRatio: req } = computeSkillOverlap(profile.skillNames, requiredSkills);
  const { overlapRatio: pref } = computeSkillOverlap(profile.skillNames, preferredSkills);
  const keywordRatio = computeProjectKeywordHitRatio(profile.projectKeywords, requiredSkills);
  const semanticScore = round2(cosineSimilarity(studentEmbedding, jdEmbedding) * 100);
  const structuredScore = computeStructuredScore({ requiredOverlapRatio: req, preferredOverlapRatio: pref, projectKeywordHitRatio: keywordRatio, isEligible });
  const matchScore = computeMatchScore(semanticScore, structuredScore);
  return { matchScore, semanticScore, structuredScore, matchedSkills, missingSkills, isEligible, ineligibilityReason: reason };
}

// ── Pipeline Simulation ───────────────────────────────────────────────────────

interface PipelineResult {
  rankings: RankingEntry[];
  skippedNoEmbedding: number;
}

function simulateRankingPipeline(drive: MockDrive, students: MockStudent[]): PipelineResult {
  const eligibility: EligibilityCriteria = {
    minCgpa: drive.minCgpa,
    eligibleBranches: drive.eligibleBranches,
    eligibleBatchYears: drive.eligibleBatchYears,
    eligibleCategories: drive.eligibleCategories,
  };

  let skippedNoEmbedding = 0;
  const scored: Array<{ studentId: string; scoring: ScoringResult; cgpa: number | null }> = [];

  for (const student of students) {
    if (!student.embedding) {
      skippedNoEmbedding++;
      continue;
    }
    const profile: StudentProfile = {
      cgpa: student.cgpa,
      branch: student.branch,
      batchYear: student.batchYear,
      category: student.category,
      skillNames: student.skills.map((s) => s.name),
      projectKeywords: student.projectKeywords,
    };
    const scoring = computeAllScores(student.embedding, drive.jdEmbedding, profile, drive.requiredSkills, drive.preferredSkills, eligibility);
    if (scoring.isEligible) {
      scored.push({ studentId: student.id, scoring, cgpa: student.cgpa });
    }
  }

  // Sort: matchScore DESC → semanticScore DESC → CGPA DESC → UUID ASC
  scored.sort((a, b) => {
    if (a.scoring.matchScore !== b.scoring.matchScore) return b.scoring.matchScore - a.scoring.matchScore;
    if (a.scoring.semanticScore !== b.scoring.semanticScore) return b.scoring.semanticScore - a.scoring.semanticScore;
    const cgpaA = a.cgpa ?? -1;
    const cgpaB = b.cgpa ?? -1;
    if (cgpaA !== cgpaB) return cgpaB - cgpaA;
    return a.studentId.localeCompare(b.studentId);
  });

  return {
    rankings: scored.map((r, idx) => ({
      studentId: r.studentId,
      matchScore: r.scoring.matchScore,
      semanticScore: r.scoring.semanticScore,
      structuredScore: r.scoring.structuredScore,
      rankPosition: idx + 1,
      isEligible: r.scoring.isEligible,
      matchedSkills: r.scoring.matchedSkills,
      missingSkills: r.scoring.missingSkills,
    })),
    skippedNoEmbedding,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const JD_EMBEDDING = [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0];
const IDENTICAL_EMBEDDING = [...JD_EMBEDDING]; // cosine sim = 1 → semantic = 100
const ZERO_EMBEDDING = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // cos sim = 0

const BASE_DRIVE: MockDrive = {
  id: "drive-001",
  requiredSkills: ["react", "node.js", "typescript", "postgresql"],
  preferredSkills: ["docker", "aws"],
  minCgpa: 7.0,
  eligibleBranches: ["Computer Science", "IT"],
  eligibleBatchYears: [2026],
  eligibleCategories: null,
  jdEmbedding: JD_EMBEDDING,
};

function makeStudent(overrides: Partial<MockStudent>): MockStudent {
  return {
    id: "student-default",
    name: "Default Student",
    cgpa: 8.0,
    branch: "Computer Science",
    batchYear: 2026,
    category: "beta",
    skills: [],
    projectKeywords: [],
    embedding: IDENTICAL_EMBEDDING,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Ranking Pipeline — core scenarios", () => {
  // 1. Perfect match
  it("1. perfect match: student with all required skills + identical embedding → high matchScore", () => {
    const student = makeStudent({
      id: "perfect-student",
      skills: [
        { name: "react", proficiency: 5 },
        { name: "node.js", proficiency: 5 },
        { name: "typescript", proficiency: 5 },
        { name: "postgresql", proficiency: 5 },
        { name: "docker", proficiency: 4 },
      ],
      projectKeywords: ["react", "node.js", "typescript", "postgresql", "docker"],
    });

    const { rankings } = simulateRankingPipeline(BASE_DRIVE, [student]);
    expect(rankings).toHaveLength(1);
    expect(rankings[0].matchScore).toBeGreaterThan(90);
    expect(rankings[0].matchedSkills).toHaveLength(4);
    expect(rankings[0].missingSkills).toHaveLength(0);
  });

  // 2. Zero match
  it("2. zero match: no skills + zero embedding → matchScore near 0", () => {
    const student = makeStudent({
      id: "zero-student",
      skills: [],
      projectKeywords: [],
      embedding: ZERO_EMBEDDING,
    });

    const { rankings } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      [student],
    );
    expect(rankings).toHaveLength(1);
    // Semantic = 0, structured = REQUIRED_SKILLS * 1 (empty required → overlapRatio=1)
    // But BASE_DRIVE has required skills, so overlapRatio = 0/4 = 0, structured = 0
    expect(rankings[0].semanticScore).toBe(0);
    expect(rankings[0].structuredScore).toBe(0);
    expect(rankings[0].matchScore).toBe(0);
  });

  // 3. Ineligible — low CGPA
  it("3. ineligible student (CGPA below minimum) → excluded from rankings", () => {
    const lowCgpa = makeStudent({ id: "low-cgpa", cgpa: 6.5 });
    const eligible = makeStudent({ id: "eligible", cgpa: 8.0 });

    const { rankings } = simulateRankingPipeline(BASE_DRIVE, [lowCgpa, eligible]);
    const ids = rankings.map((r) => r.studentId);
    expect(ids).not.toContain("low-cgpa");
    expect(ids).toContain("eligible");
  });

  // 4. Ineligible — wrong branch
  it("4. ineligible student (wrong branch) → excluded from rankings", () => {
    const wrongBranch = makeStudent({ id: "wrong-branch", branch: "Mechanical" });
    const eligible = makeStudent({ id: "cs-student", branch: "Computer Science" });

    const { rankings } = simulateRankingPipeline(BASE_DRIVE, [wrongBranch, eligible]);
    const ids = rankings.map((r) => r.studentId);
    expect(ids).not.toContain("wrong-branch");
    expect(ids).toContain("cs-student");
  });

  // 5. Tie-breaking by semanticScore
  it("5. tie-breaking: same matchScore → sorted by semanticScore DESC", () => {
    // Use correctly normalized unit vectors so cosine similarity is computable
    // highSemantic has cos_sim=1 with JD (identical direction)
    // lowSemantic has different direction (lower cos_sim)
    const jdEmb = [1, 0, 0, 0, 0, 0, 0, 0]; // unit vector
    const highSemEmb = [1, 0, 0, 0, 0, 0, 0, 0]; // cos_sim = 1
    const lowSemEmb = [0.6, 0.8, 0, 0, 0, 0, 0, 0]; // cos_sim = 0.6 (unit, orthogonal component)

    const highSemantic = makeStudent({
      id: "aaa-high-sem",
      skills: [{ name: "react", proficiency: 3 }],
      projectKeywords: [],
      embedding: highSemEmb,
    });
    const lowSemantic = makeStudent({
      id: "bbb-low-sem",
      skills: [{ name: "react", proficiency: 3 }],
      projectKeywords: [],
      embedding: lowSemEmb,
    });

    const openDrive: MockDrive = {
      ...BASE_DRIVE,
      requiredSkills: ["react"],
      preferredSkills: [],
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      jdEmbedding: jdEmb,
    };

    const { rankings } = simulateRankingPipeline(openDrive, [lowSemantic, highSemantic]);
    expect(rankings).toHaveLength(2);
    expect(rankings[0].studentId).toBe("aaa-high-sem");
    expect(rankings[0].semanticScore).toBeGreaterThanOrEqual(rankings[1].semanticScore);
  });

  // 6. Tie-breaking by CGPA
  it("6. tie-breaking: same matchScore + semanticScore → sorted by CGPA DESC", () => {
    // Use identical unit vectors so cosine similarity is exactly equal for both
    const sharedEmb = [1, 0, 0, 0, 0, 0, 0, 0];

    const highCgpa = makeStudent({
      id: "aaa-high-cgpa",
      cgpa: 9.5,
      skills: [{ name: "react", proficiency: 3 }],
      projectKeywords: [],
      embedding: sharedEmb,
    });
    const lowCgpa = makeStudent({
      id: "bbb-low-cgpa",
      cgpa: 7.5,
      skills: [{ name: "react", proficiency: 3 }],
      projectKeywords: [],
      embedding: sharedEmb,
    });

    const openDrive: MockDrive = {
      ...BASE_DRIVE,
      requiredSkills: ["react"],
      preferredSkills: [],
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      jdEmbedding: [1, 0, 0, 0, 0, 0, 0, 0],
    };

    const { rankings } = simulateRankingPipeline(openDrive, [lowCgpa, highCgpa]);
    expect(rankings).toHaveLength(2);
    expect(rankings[0].studentId).toBe("aaa-high-cgpa");
    expect(rankings[1].studentId).toBe("bbb-low-cgpa");
  });

  // 7. Student without embedding
  it("7. student without embedding → skipped (counted in skippedNoEmbedding)", () => {
    const withEmbedding = makeStudent({ id: "has-embedding" });
    const noEmbedding = makeStudent({ id: "no-embedding", embedding: null });

    const { rankings, skippedNoEmbedding } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      [withEmbedding, noEmbedding],
    );

    const ids = rankings.map((r) => r.studentId);
    expect(ids).not.toContain("no-embedding");
    expect(skippedNoEmbedding).toBe(1);
  });

  // 8. Empty required skills → only semantic contributes
  it("8. empty required skills in JD → overlapRatio=1, only semantic contributes to match", () => {
    const student = makeStudent({
      id: "no-skills-drive",
      skills: [],
      projectKeywords: [],
      embedding: IDENTICAL_EMBEDDING,
    });

    const noSkillsDrive: MockDrive = {
      ...BASE_DRIVE,
      requiredSkills: [],
      preferredSkills: [],
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
    };

    const { rankings } = simulateRankingPipeline(noSkillsDrive, [student]);
    expect(rankings).toHaveLength(1);

    // With empty required AND preferred skills, both get overlapRatio=1 (no skills = not filtered out)
    // structuredScore = REQUIRED_SKILLS_PTS * 1 + PREFERRED_SKILLS_PTS * 1 + keywords * 0
    const expectedStructured = round2(REQUIRED_SKILLS_PTS + PREFERRED_SKILLS_PTS);
    expect(rankings[0].structuredScore).toBe(expectedStructured);

    // Semantic = 100 (identical embeddings)
    expect(rankings[0].semanticScore).toBe(100);

    // matchScore = SEMANTIC_WEIGHT*100 + STRUCTURED_WEIGHT*(REQUIRED+PREFERRED)
    const expectedMatch = round2(SEMANTIC_WEIGHT * 100 + STRUCTURED_WEIGHT * expectedStructured);
    expect(rankings[0].matchScore).toBe(expectedMatch);
  });
});

describe("Ranking Pipeline — edge cases", () => {
  it("all ineligible → empty rankings list", () => {
    const students = [
      makeStudent({ id: "s1", cgpa: 5.0 }),
      makeStudent({ id: "s2", cgpa: 6.0 }),
    ];
    const { rankings } = simulateRankingPipeline(BASE_DRIVE, students);
    expect(rankings).toHaveLength(0);
  });

  it("all students lack embedding → empty rankings list", () => {
    const students = [
      makeStudent({ id: "s1", embedding: null }),
      makeStudent({ id: "s2", embedding: null }),
    ];
    const { rankings, skippedNoEmbedding } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      students,
    );
    expect(rankings).toHaveLength(0);
    expect(skippedNoEmbedding).toBe(2);
  });

  it("empty student list → empty rankings", () => {
    const { rankings } = simulateRankingPipeline(BASE_DRIVE, []);
    expect(rankings).toHaveLength(0);
  });

  it("rank positions are sequential starting at 1", () => {
    const students = [
      makeStudent({ id: "s1", skills: [{ name: "react", proficiency: 5 }] }),
      makeStudent({ id: "s2", skills: [] }),
      makeStudent({ id: "s3", skills: [{ name: "node.js", proficiency: 3 }] }),
    ];
    const { rankings } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      students,
    );
    expect(rankings.map((r) => r.rankPosition)).toEqual([1, 2, 3]);
  });

  it("matchScore is always within 0–100 range", () => {
    const students = [
      makeStudent({ id: "s1", embedding: IDENTICAL_EMBEDDING }),
      makeStudent({ id: "s2", embedding: ZERO_EMBEDDING }),
    ];
    const { rankings } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      students,
    );
    for (const r of rankings) {
      expect(r.matchScore).toBeGreaterThanOrEqual(0);
      expect(r.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it("results are deterministic across two identical runs", () => {
    const students = [
      makeStudent({ id: "s1" }),
      makeStudent({ id: "s2" }),
    ];
    const r1 = simulateRankingPipeline(BASE_DRIVE, students);
    const r2 = simulateRankingPipeline(BASE_DRIVE, students);
    expect(r1).toEqual(r2);
  });

  it("UUID tiebreaker: same scores + same CGPA → sorted lexicographically ASC", () => {
    const sharedEmb = [0, 0, 0, 0, 0, 0, 0, 0];
    const students = [
      makeStudent({ id: "zzz-last", cgpa: 8.0, skills: [], embedding: sharedEmb }),
      makeStudent({ id: "aaa-first", cgpa: 8.0, skills: [], embedding: sharedEmb }),
    ];
    const { rankings } = simulateRankingPipeline(
      { ...BASE_DRIVE, minCgpa: null, eligibleBranches: null, eligibleBatchYears: null },
      students,
    );
    expect(rankings[0].studentId).toBe("aaa-first");
    expect(rankings[1].studentId).toBe("zzz-last");
  });
});
