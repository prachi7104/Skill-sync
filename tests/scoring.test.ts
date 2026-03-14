/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Scoring Algorithm Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for the deterministic scoring algorithm (Phase 5.3).
 *
 * Functions are inlined (copied from scoring.ts) to avoid the `server-only`
 * import guard that blocks test environments.
 *
 * Verification checklist:
 * - Eligibility checks work correctly
 * - Skill overlap calculation is accurate
 * - Structured score sub-components add up correctly
 * - Match score uses 2-decimal rounding
 * - Project keyword hit ratio respects the 5-hit cap
 * - Tie-breaking order is correct
 * - Same input → same output (determinism)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Constants (mirror scoring.ts) ───────────────────────────────────────────
const SEMANTIC_WEIGHT = 0.7;
const STRUCTURED_WEIGHT = 0.3;
const REQUIRED_SKILLS_PTS = 60;
const PREFERRED_SKILLS_PTS = 25;
const PROJECT_KEYWORD_PTS = 15;

// ── Inline types (mirror scoring.ts) ────────────────────────────────────────

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
      return {
        isEligible: false,
        reason: "Performance category not available",
      };
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

/**
 * Word-boundary skill matching (mirrors scoring.ts).
 * Prevents false positives like "go" matching "django" or "mongo".
 */
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
    return { matchedSkills: [], missingSkills: [], overlapRatio: 0 };
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
  projectKeywordHitRatio: number;
  isEligible: boolean;
}): number {
  if (!opts.isEligible) return 0;

  let score = 0;
  score += REQUIRED_SKILLS_PTS * opts.requiredOverlapRatio;
  score += PREFERRED_SKILLS_PTS * opts.preferredOverlapRatio;
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
   const effectiveCap = Math.min(cap, requiredSkills.length);

  for (const skill of requiredSkills) {
    const lower = skill.toLowerCase().trim();
    const matched = projectKeywords.some((kw) => skillMatches(kw, lower));
    if (matched) {
      hits++;
      if (hits >= effectiveCap) break;
    }
  }
  return Math.min(hits / effectiveCap, 1);
}


function generateDetailedExplanation(result: {
  matchScore: number;
  semanticScore: number;
  structuredScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isEligible: boolean;
  ineligibilityReason?: string;
  cgpa?: number | null;
  minCgpa?: number | null;
  rankPosition?: number;
}): string {
  const lines: string[] = [];

  // Eligibility
  if (!result.isEligible) {
    lines.push(
      `Eligibility: ❌ Not eligible — ${result.ineligibilityReason}`,
    );
    return lines.join("\n");
  }
  lines.push("Eligibility: ✅ Meets all requirements.");

  // Score breakdown
  lines.push("");
  lines.push("Score Breakdown:");
  lines.push(
    `  • Semantic Score: ${result.semanticScore.toFixed(2)} / 100 (70% weight)`,
  );
  if (result.semanticScore < 70) {
    lines.push(
      `    (Lower semantic score suggests your profile descriptions and projects need more technical domain keywords found in the JD.)`,
    );
  } else {
    lines.push(
      `    (High semantic alignment indicating strong domain match.)`,
    );
  }

  lines.push(
    `  • Structured Score: ${result.structuredScore.toFixed(2)} / 100 (30% weight)`,
  );
  lines.push(
    `    (Computed based on exact matching of skills and project keywords.)`,
  );
  lines.push(
    `  • Final Match Score: ${result.matchScore.toFixed(2)} / 100`,
  );
  if (result.rankPosition !== undefined) {
    lines.push(`  • Rank Position: #${result.rankPosition}`);
  }

  // Skill analysis
  lines.push("");
  lines.push("Skill Analysis:");

  const totalChecked = result.matchedSkills.length + result.missingSkills.length;

  if (totalChecked === 0) {
    lines.push("  ⚠ No specific skills matched or missing.");
    lines.push("    (The Job Description did not yield any specific required skills to check against.)");
  } else {
    if (result.matchedSkills.length > 0) {
      lines.push(`  ✓ Matched (${result.matchedSkills.length}): ${result.matchedSkills.join(", ")}`);
    } else {
      lines.push("  ✓ Matched: None");
    }

    if (result.missingSkills.length > 0) {
      lines.push(`  🚩 Missing (${result.missingSkills.length}): ${result.missingSkills.join(", ")}`);
      lines.push("     (Try adding these skills to your profile or highlighting them in your projects to increase your score.)");
    } else {
      lines.push("  ✓ Missing: None — all found requirements covered.");
    }
  }

  // CGPA note
  if (
    result.cgpa !== null &&
    result.cgpa !== undefined &&
    result.minCgpa !== null &&
    result.minCgpa !== undefined
  ) {
    lines.push("");
    lines.push(
      `Academic Verification: CGPA ${result.cgpa.toFixed(2)} (Min Required: ${result.minCgpa.toFixed(2)})`,
    );
    if (result.cgpa < result.minCgpa) {
      lines.push("  🚩 RED FLAG: Your CGPA is below the mandated cutoff for this drive.");
    } else {
      lines.push("  ✓ Requirement met.");
    }
  }

  return lines.join("\n");
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Scoring Algorithm", () => {
  // ── Eligibility ─────────────────────────────────────────────────────────

  describe("checkEligibility", () => {
    const baseStudent: StudentProfile = {
      cgpa: 7.5,
      branch: "Computer Science",
      batchYear: 2026,
      category: "beta",
      skillNames: [],
      projectKeywords: [],
    };

    const noCriteria: EligibilityCriteria = {
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    it("should pass when no criteria specified", () => {
      expect(checkEligibility(baseStudent, noCriteria).isEligible).toBe(true);
    });

    it("should fail when CGPA is below minimum", () => {
      const r = checkEligibility(
        { ...baseStudent, cgpa: 6.5 },
        { ...noCriteria, minCgpa: 7.0 },
      );
      expect(r.isEligible).toBe(false);
      expect(r.reason).toContain("below minimum");
    });

    it("should fail when CGPA is null but required", () => {
      const r = checkEligibility(
        { ...baseStudent, cgpa: null },
        { ...noCriteria, minCgpa: 7.0 },
      );
      expect(r.isEligible).toBe(false);
      expect(r.reason).toBe("CGPA not available");
    });

    it("should fail when branch not in eligible list", () => {
      const r = checkEligibility(
        { ...baseStudent, branch: "Mechanical" },
        { ...noCriteria, eligibleBranches: ["Computer Science", "IT"] },
      );
      expect(r.isEligible).toBe(false);
      expect(r.reason).toContain("not in eligible list");
    });

    it("should pass when branch matches case-insensitively", () => {
      const r = checkEligibility(
        { ...baseStudent, branch: "computer science" },
        { ...noCriteria, eligibleBranches: ["Computer Science", "IT"] },
      );
      expect(r.isEligible).toBe(true);
    });

    it("should fail when batch year not in eligible list", () => {
      const r = checkEligibility(
        { ...baseStudent, batchYear: 2025 },
        { ...noCriteria, eligibleBatchYears: [2026, 2027] },
      );
      expect(r.isEligible).toBe(false);
    });

    it("should fail when category not in eligible list", () => {
      const r = checkEligibility(
        { ...baseStudent, category: "gamma" },
        { ...noCriteria, eligibleCategories: ["alpha", "beta"] },
      );
      expect(r.isEligible).toBe(false);
    });
  });

  // ── Skill Overlap ────────────────────────────────────────────────────────

  describe("computeSkillOverlap", () => {
    it("should return overlapRatio 0 when no skills required", () => {
      const result = computeSkillOverlap(["python", "javascript"], []);
      expect(result.overlapRatio).toBe(0);
      expect(result.matchedSkills).toEqual([]);
      expect(result.missingSkills).toEqual([]);
    });

    it("should correctly match exact skills", () => {
      const result = computeSkillOverlap(
        ["python", "javascript", "react"],
        ["Python", "JavaScript"],
      );
      expect(result.matchedSkills).toEqual(["Python", "JavaScript"]);
      expect(result.missingSkills).toEqual([]);
      expect(result.overlapRatio).toBe(1);
    });

    it("should identify missing skills", () => {
      const result = computeSkillOverlap(
        ["python"],
        ["Python", "JavaScript", "React"],
      );
      expect(result.matchedSkills).toEqual(["Python"]);
      expect(result.missingSkills).toEqual(["JavaScript", "React"]);
      expect(result.overlapRatio).toBeCloseTo(1 / 3);
    });

    it("should NOT match partial substrings due to word-boundary matching", () => {
      // "react.js" ≠ "react" with word-boundary logic (dot is not a boundary)
      const result = computeSkillOverlap(
        ["react.js", "node.js"],
        ["React", "Node"],
      );
      expect(result.matchedSkills).toEqual([]);
      expect(result.missingSkills).toEqual(["React", "Node"]);
      expect(result.overlapRatio).toBe(0);
    });

    it("should match exact skill names including dots", () => {
      const result = computeSkillOverlap(
        ["react.js", "node.js"],
        ["react.js", "node.js"],
      );
      expect(result.matchedSkills).toEqual(["react.js", "node.js"]);
      expect(result.overlapRatio).toBe(1);
    });

    it("should handle all missing skills", () => {
      const result = computeSkillOverlap(["python"], ["Java", "C++"]);
      expect(result.matchedSkills).toEqual([]);
      expect(result.missingSkills).toEqual(["Java", "C++"]);
      expect(result.overlapRatio).toBe(0);
    });
  });

  // ── Skill Matching Edge Cases (6.1) ──────────────────────────────────────

  describe("skillMatches — edge cases", () => {
    it("single-char skill 'R' should match exactly 'r'", () => {
      expect(skillMatches("r", "r")).toBe(true);
    });

    it("single-char skill 'R' should NOT match 'react'", () => {
      expect(skillMatches("r", "react")).toBe(false);
    });

    it("single-char skill 'C' should NOT match 'css'", () => {
      expect(skillMatches("c", "css")).toBe(false);
    });

    it("single-char skill 'C' should NOT match 'c++'", () => {
      expect(skillMatches("c", "c++")).toBe(false);
    });

    it("short skill 'Go' should match 'go' exactly", () => {
      expect(skillMatches("go", "go")).toBe(true);
    });

    it("short skill 'go' should NOT match 'django' (substring)", () => {
      expect(skillMatches("go", "django")).toBe(false);
    });

    it("short skill 'go' should NOT match 'mongo' (substring)", () => {
      expect(skillMatches("go", "mongo")).toBe(false);
    });

    it("short skill 'go' should NOT match 'golang'", () => {
      expect(skillMatches("go", "golang")).toBe(false);
    });

    it("'java' should NOT match 'javascript' (substring false match)", () => {
      expect(skillMatches("java", "javascript")).toBe(false);
    });

    it("'sql' should NOT match 'nosql' (substring)", () => {
      expect(skillMatches("sql", "nosql")).toBe(false);
    });

    it("'react' should match 'react' exactly", () => {
      expect(skillMatches("react", "react")).toBe(true);
    });

    it("'react' should NOT match 'reactive' (prefix match)", () => {
      expect(skillMatches("react", "reactive")).toBe(false);
    });

    it("should match multi-word skill with comma separation", () => {
      // "react" as a term in "react, node, python"
      expect(skillMatches("react", "react, node, python")).toBe(true);
    });

    it("should match skill in slash-separated list like ci/cd", () => {
      expect(skillMatches("ci/cd", "ci/cd")).toBe(true);
    });

    it("'node.js' should match 'node.js' exactly", () => {
      expect(skillMatches("node.js", "node.js")).toBe(true);
    });

    it("'css' should NOT match 'scss' (substring)", () => {
      expect(skillMatches("css", "scss")).toBe(false);
    });

    it("'ml' should NOT match 'html' (substring)", () => {
      expect(skillMatches("ml", "html")).toBe(false);
    });
  });

  describe("computeSkillOverlap — edge cases", () => {
    it("single-char skills R, C should match only exact", () => {
      const result = computeSkillOverlap(
        ["r", "c", "python"],
        ["R", "C", "React", "CSS"],
      );
      expect(result.matchedSkills).toEqual(["R", "C"]);
      expect(result.missingSkills).toEqual(["React", "CSS"]);
      expect(result.overlapRatio).toBe(0.5);
    });

    it("short skill Go should not false-match Django or Mongo", () => {
      const result = computeSkillOverlap(
        ["go", "python"],
        ["Go", "Django", "MongoDB"],
      );
      expect(result.matchedSkills).toEqual(["Go"]);
      expect(result.missingSkills).toEqual(["Django", "MongoDB"]);
      expect(result.overlapRatio).toBeCloseTo(1 / 3);
    });

    it("java should not match javascript", () => {
      const result = computeSkillOverlap(
        ["java"],
        ["JavaScript"],
      );
      expect(result.matchedSkills).toEqual([]);
      expect(result.missingSkills).toEqual(["JavaScript"]);
      expect(result.overlapRatio).toBe(0);
    });

    it("exact matches should work for all single-char languages", () => {
      const result = computeSkillOverlap(
        ["r", "c", "go"],
        ["R", "C", "Go"],
      );
      expect(result.matchedSkills).toEqual(["R", "C", "Go"]);
      expect(result.overlapRatio).toBe(1);
    });
  });

  // ── Cosine Similarity ────────────────────────────────────────────────────

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vec = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    });

    it("should throw for mismatched dimensions", () => {
      expect(() => cosineSimilarity([1, 0, 0], [0, 1])).toThrow(
        "dimension mismatch",
      );
    });

    it("should be symmetric", () => {
      const a = [0.3, 0.5, 0.2];
      const b = [0.4, 0.4, 0.2];
      expect(cosineSimilarity(a, b)).toBe(cosineSimilarity(b, a));
    });
  });

  // ── Structured Score ─────────────────────────────────────────────────────

  describe("computeStructuredScore", () => {
    it("should return 0 when student is not eligible", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 1,
        preferredOverlapRatio: 1,
        projectKeywordHitRatio: 1,
        isEligible: false,
      });
      expect(score).toBe(0);
    });

    it("should give 60 pts for full required skill overlap + 0 others", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 1,
        preferredOverlapRatio: 0,
        projectKeywordHitRatio: 0,
        isEligible: true,
      });
      expect(score).toBe(60);
    });

    it("should give 25 pts for full preferred skill overlap only", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 0,
        preferredOverlapRatio: 1,
        projectKeywordHitRatio: 0,
        isEligible: true,
      });
      expect(score).toBe(25);
    });

    it("should NOT give points for CGPA buffer anymore", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 0,
        preferredOverlapRatio: 0,
        projectKeywordHitRatio: 0,
        isEligible: true,
      });
      expect(score).toBe(0);
    });

    it("should give 15 pts for max project keyword hits", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 0,
        preferredOverlapRatio: 0,
        projectKeywordHitRatio: 1,
        isEligible: true,
      });
      expect(score).toBe(15);
    });

    it("should cap total at 100 when all components are maxed", () => {
      const score = computeStructuredScore({
        requiredOverlapRatio: 1,
        preferredOverlapRatio: 1,
        projectKeywordHitRatio: 1,
        isEligible: true,
      });
      // 60 + 25 + 15 = 100
      expect(score).toBe(100);
    });
  });

  // ── Project Keyword Hit Ratio ─────────────────────────────────────────────

  describe("computeProjectKeywordHitRatio", () => {
    it("should return 0 when no keywords or no required skills", () => {
      expect(computeProjectKeywordHitRatio([], ["python"])).toBe(0);
      expect(computeProjectKeywordHitRatio(["python"], [])).toBe(0);
    });

    it("should return 0.5 when 1 of 2 required skills hit", () => {
      expect(
        computeProjectKeywordHitRatio(["python"], ["python", "java"]),
      ).toBeCloseTo(0.5);
    });

    it("should cap at 1.0 even if more than the cap hits possible", () => {
      const keywords = [
        "python",
        "java",
        "react",
        "node",
        "docker",
        "kubernetes",
      ];
      const required = [
        "python",
        "java",
        "react",
        "node",
        "docker",
        "kubernetes",
      ];
      expect(computeProjectKeywordHitRatio(keywords, required)).toBe(1);
    });

    it("should match case-insensitively via required skills toLowerCase", () => {
      const keywords = ["python", "react"];
      const required = ["Python", "React"];
      expect(computeProjectKeywordHitRatio(keywords, required)).toBeCloseTo(
        1,
      );
    });
  });

  // ── Match Score ──────────────────────────────────────────────────────────

  describe("computeMatchScore", () => {
    it("should weight semantic 70% and structured 30%", () => {
      expect(computeMatchScore(100, 0)).toBe(70);
    });

    it("should return 100 when both scores are 100", () => {
      expect(computeMatchScore(100, 100)).toBe(100);
    });

    it("should return 0 when both scores are 0", () => {
      expect(computeMatchScore(0, 0)).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      // 0.7 * 77 + 0.3 * 33 = 53.9 + 9.9 = 63.8
      expect(computeMatchScore(77, 33)).toBe(63.8);
    });

    it("should produce 2-decimal precision for fractional inputs", () => {
      // 0.7 * 85.5 + 0.3 * 72.3 = 59.85 + 21.69 = 81.54
      expect(computeMatchScore(85.5, 72.3)).toBe(81.54);
    });
  });

  // ── Semantic Score ───────────────────────────────────────────────────────

  describe("computeSemanticScore", () => {
    it("should return 100 for identical unit vectors", () => {
      const vec = [0.5, 0.5, 0.5, 0.5];
      expect(computeSemanticScore(vec, vec)).toBe(100);
    });

    it("should return 0 for orthogonal vectors", () => {
      expect(computeSemanticScore([1, 0], [0, 1])).toBe(0);
    });

    it("should return 2-decimal result", () => {
      // cosineSim([0.6, 0.8], [0.8, 0.6]) = 0.48 + 0.48 = 0.96 → 96
      expect(computeSemanticScore([0.6, 0.8], [0.8, 0.6])).toBe(96);
    });
  });

  // ── Tie-breaking ─────────────────────────────────────────────────────────

  describe("Tie-breaking sort order", () => {
    it("should sort by matchScore DESC, semanticScore DESC, CGPA DESC, UUID ASC", () => {
      const students = [
        {
          id: "zzz-111",
          matchScore: 80,
          semanticScore: 70,
          cgpa: 8.0,
        },
        {
          id: "aaa-222",
          matchScore: 80,
          semanticScore: 70,
          cgpa: 8.0,
        },
        {
          id: "bbb-333",
          matchScore: 80,
          semanticScore: 75,
          cgpa: 7.0,
        },
        {
          id: "ccc-444",
          matchScore: 85,
          semanticScore: 60,
          cgpa: 9.0,
        },
        {
          id: "ddd-555",
          matchScore: 80,
          semanticScore: 70,
          cgpa: 9.0,
        },
      ];

      students.sort((a, b) => {
        if (a.matchScore !== b.matchScore)
          return b.matchScore - a.matchScore;
        if (a.semanticScore !== b.semanticScore)
          return b.semanticScore - a.semanticScore;
        const cgpaA = a.cgpa ?? -1;
        const cgpaB = b.cgpa ?? -1;
        if (cgpaA !== cgpaB) return cgpaB - cgpaA;
        return a.id.localeCompare(b.id);
      });

      expect(students.map((s) => s.id)).toEqual([
        "ccc-444", // 85 (highest matchScore)
        "bbb-333", // 80, semantic 75 (highest semantic among 80s)
        "ddd-555", // 80, semantic 70, cgpa 9.0 (highest CGPA tie-break)
        "aaa-222", // 80, semantic 70, cgpa 8.0, UUID "aaa" < "zzz"
        "zzz-111", // 80, semantic 70, cgpa 8.0, UUID "zzz"
      ]);
    });
  });

  // ── Determinism ──────────────────────────────────────────────────────────

  describe("Determinism", () => {
    it("should produce same skill overlap for same input", () => {
      const studentSkills = ["python", "react", "node.js"];
      const requiredSkills = ["Python", "JavaScript", "React"];

      const r1 = computeSkillOverlap(studentSkills, requiredSkills);
      const r2 = computeSkillOverlap(studentSkills, requiredSkills);

      expect(r1).toEqual(r2);
    });

    it("should produce same eligibility result for same input", () => {
      const student: StudentProfile = {
        cgpa: 7.5,
        branch: "Computer Science",
        batchYear: 2026,
        category: "beta",
        skillNames: [],
        projectKeywords: [],
      };

      const criteria: EligibilityCriteria = {
        minCgpa: 7.0,
        eligibleBranches: ["Computer Science"],
        eligibleBatchYears: [2026],
        eligibleCategories: ["alpha", "beta"],
      };

      expect(checkEligibility(student, criteria)).toEqual(
        checkEligibility(student, criteria),
      );
    });

    it("should produce same structured score for same input", () => {
      const opts = {
        requiredOverlapRatio: 0.75,
        preferredOverlapRatio: 0.5,
        projectKeywordHitRatio: 0.6,
        isEligible: true,
      };
      expect(computeStructuredScore(opts)).toBe(
        computeStructuredScore(opts),
      );
    });
  });

  // ── Explanation Logic ────────────────────────────────────────────────────

  describe("generateDetailedExplanation", () => {
    const baseResult = {
      matchScore: 80,
      semanticScore: 80,
      structuredScore: 80,
      matchedSkills: [],
      missingSkills: [],
      isEligible: true,
      cgpa: 8.0,
      minCgpa: 7.0,
    };

    it("should handle empty skills case correctly", () => {
      const explanation = generateDetailedExplanation({
        ...baseResult,
        matchedSkills: [],
        missingSkills: [],
      });

      expect(explanation).toContain("⚠ No specific skills matched or missing.");
      expect(explanation).toContain("(The Job Description did not yield any specific required skills");
      expect(explanation).not.toContain("Matched: None");
      expect(explanation).not.toContain("Missing: None");
    });

    it("should list matched and missing skills when present", () => {
      const explanation = generateDetailedExplanation({
        ...baseResult,
        matchedSkills: ["Python"],
        missingSkills: ["Java"],
      });

      expect(explanation).toContain("✓ Matched (1): Python");
      expect(explanation).toContain("🚩 Missing (1): Java");
    });

    it("should include semantic score explanation", () => {
      const explanation = generateDetailedExplanation(baseResult);
      expect(explanation).toContain("High semantic alignment indicating strong domain match");
    });
  });
});

describe("ATS Scoring — getWeights and Soft Scores", () => {
  // Inline getWeights
  function getWeights(roleType: string, seniority: string) {
    if (roleType === "Research") {
      return { hard: 0.20, research: 0.30, soft: 0.05, exp: 0.10, domain: 0.35 };
    }
    if (seniority === "Senior" || seniority === "Staff+") {
      return { hard: 0.25, research: 0.0, soft: 0.05, exp: 0.30, domain: 0.40 };
    }
    return { hard: 0.20, research: 0.0, soft: 0.10, exp: 0.10, domain: 0.60 };
  }

  // Inline computeSoftEvidenceScore
  function computeSoftEvidenceScore(resume: any): number {
    let evidenceCount = 0;
    if ((resume.certifications?.length || 0) > 0) evidenceCount++;
    if ((resume.coding_profiles?.length || 0) > 0) evidenceCount++;
    const quantifiedPattern = /\d+%|\d+x|improved|optimized|reduced|increased/i;
    const allProjectText = (resume.projects || []).map((p: any) => `${p.description || ""}`).join(" ");
    const allExpText = (resume.experience || []).map((e: any) => `${e.description || ""}`).join(" ");
    const achText = (resume.achievements || []).map((a: any) => `${a.title || ""} ${a.description || ""}`).join(" ");
    if (quantifiedPattern.test(allProjectText) || quantifiedPattern.test(allExpText) || quantifiedPattern.test(achText)) {
      evidenceCount++;
    }
    const collabKeywords = ["team", "hackathon", "open-source", "club", "collaborative"];
    const fullText = `${allProjectText} ${allExpText} ${achText}`.toLowerCase();
    if (collabKeywords.some(k => fullText.includes(k))) evidenceCount++;
    const raw = Math.round((Math.min(evidenceCount, 4) / 4) * 100);
    return evidenceCount > 0 ? Math.max(10, raw) : 0;
  }

  describe("getWeights", () => {
    it("should return Research weights for Research roles", () => {
      const w = getWeights("Research", "Entry");
      expect(w.hard).toBe(0.20);
      expect(w.research).toBe(0.30);
      expect(w.domain).toBe(0.35);
    });

    it("should return Senior weights for Senior roles", () => {
      const w = getWeights("Software Engineering", "Senior");
      expect(w.hard).toBe(0.25);
      expect(w.exp).toBe(0.30);
      expect(w.domain).toBe(0.40);
    });

    it("should return Standard weights (20/10/10/60) for standard roles", () => {
      const w = getWeights("Software Engineering", "Entry");
      expect(w.hard).toBe(0.20);
      expect(w.soft).toBe(0.10);
      expect(w.exp).toBe(0.10);
      expect(w.domain).toBe(0.60);
      expect(w.hard + w.soft + w.exp + w.domain).toBe(1.0);
    });
  });

  describe("computeSoftEvidenceScore", () => {
    it("should score 0 with no evidence", () => {
      expect(computeSoftEvidenceScore({})).toBe(0);
    });

    it("should give minimum 10 for a single piece of evidence", () => {
      const score = computeSoftEvidenceScore({ coding_profiles: [{ platform: "GitHub" }] });
      expect(score).toBeGreaterThanOrEqual(10);
      expect(score).toBeLessThanOrEqual(25);
    });

    it("should score 100 for all 4 types of evidence", () => {
      expect(computeSoftEvidenceScore({
        certifications: [{ name: "AWS" }],
        coding_profiles: [{ platform: "GitHub" }],
        projects: [{ description: "Improved speed by 50%" }],
        experience: [{ description: "Led a team of 4" }]
      })).toBe(100);
    });
  });
});
