/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Scoring Algorithm
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Deterministic scoring algorithm for computing match scores between
 * student profiles and job descriptions.
 *
 * Hybrid Score Formula:
 *   match_score = 0.7 * semantic_score + 0.3 * structured_score
 *
 * Structured Score Breakdown (0–100):
 *   - Required skills overlap:  60 pts  (60 × overlapRatio)
 *   - Preferred skills overlap: 25 pts  (25 × preferredOverlapRatio)
 *   - Project/work keywords:    15 pts  (15 × keywordHitRatio, max 5 keywords)
 *
 * Rules:
 * - No heuristics, no AI reasoning
 * - Deterministic output for same inputs
 * - Ineligible students never appear in rankings
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import { cosineSimilarity } from "@/lib/embeddings";
import { expandBranches } from "@/lib/constants/branches";

// ── Scoring weights (locked) ────────────────────────────────────────────────
const SEMANTIC_WEIGHT = 0.7;
const STRUCTURED_WEIGHT = 0.3;

// ── Structured sub-weights (out of 100) ─────────────────────────────────────
const REQUIRED_SKILLS_PTS = 60;
const PREFERRED_SKILLS_PTS = 25;
const PROJECT_KEYWORD_PTS = 15;

/**
 * Eligibility criteria for a drive.
 */
export interface EligibilityCriteria {
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: ("alpha" | "beta" | "gamma")[] | null;
}

/**
 * Student profile data for eligibility and skill matching.
 */
export interface StudentProfile {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;
  skillNames: string[];
  /** Flat list of project/work description keywords (lowercase). */
  projectKeywords: string[];
}

/**
 * Result of computing all scores for a student-JD pair.
 */
export interface ScoringResult {
  /** Final composite score (0–100, 2 decimal places) */
  matchScore: number;
  /** Semantic similarity score (0–100, 2 decimal places) */
  semanticScore: number;
  /** Structured comparison score (0–100, 2 decimal places) */
  structuredScore: number;
  /** Skills the student has that match JD required skills */
  matchedSkills: string[];
  /** Skills the JD requires that the student is missing */
  missingSkills: string[];
  /** Short explanation for display */
  shortExplanation: string;
  /** Whether the student meets eligibility criteria */
  isEligible: boolean;
  /** Reason for ineligibility (if applicable) */
  ineligibilityReason?: string;
}

// ── Eligibility ─────────────────────────────────────────────────────────────

/**
 * Checks if a student meets the eligibility criteria for a drive.
 */
export function checkEligibility(
  student: StudentProfile,
  criteria: EligibilityCriteria,
): { isEligible: boolean; reason?: string } {
  // CGPA
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

  // Branch
  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    if (!student.branch) {
      return { isEligible: false, reason: "Branch not available" };
    }
    const normalizedBranches = expandBranches(criteria.eligibleBranches).map((b) =>
      b.toLowerCase().trim(),
    );
    if (!normalizedBranches.includes(student.branch.toLowerCase().trim())) {
      return {
        isEligible: false,
        reason: `Branch "${student.branch}" not in eligible list`,
      };
    }
  }

  // Batch year
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

  // Category
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

// ── Skill overlap ───────────────────────────────────────────────────────────

/**
 * Word-boundary skill matching.
 * Prevents false positives like "go" matching "django" or "mongo".
 * Matches when:
 *   - Exact match ("react" === "react")
 *   - One term is a multi-word superset containing the other as a whole word
 *     ("react native" contains "react", "node.js" matches "node.js")
 * Does NOT match substrings within other words.
 */
function skillMatches(a: string, b: string): boolean {
  if (a === b) return true;

  // Build a regex that matches the term as a whole word.
  // \b handles most cases; we also treat `.` and `/` as word chars for
  // skills like "node.js", "ci/cd".
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryMatch = (term: string, text: string): boolean => {
    const pattern = new RegExp(`(?:^|[\\s,;|/])${escape(term)}(?:$|[\\s,;|/])`);
    // Pad so boundaries at start/end work
    return pattern.test(` ${text} `);
  };

  return boundaryMatch(a, b) || boundaryMatch(b, a);
}

/**
 * Computes skill overlap between student skills and a list of required skills.
 */
export function computeSkillOverlap(
  studentSkills: string[],
  requiredSkills: string[],
): {
  matchedSkills: string[];
  missingSkills: string[];
  overlapRatio: number;
} {
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

  const overlapRatio = matchedSkills.length / requiredSkills.length;
  return { matchedSkills, missingSkills, overlapRatio };
}

// ── Score computations ──────────────────────────────────────────────────────

/**
 * Computes the semantic score from cosine similarity (0–100, 2 dp).
 */
export function computeSemanticScore(
  studentEmbedding: number[],
  jdEmbedding: number[],
): number {
  const similarity = cosineSimilarity(studentEmbedding, jdEmbedding);
  return round2(similarity * 100);
}

/**
 * Computes the structured score (0–100).
 *
 * Sub-components:
 *   required skills  (60 pts)
 *   preferred skills (25 pts)
 *   project keywords (15 pts)
 */
export function computeStructuredScore(opts: {
  requiredOverlapRatio: number;
  preferredOverlapRatio: number;
  projectKeywordHitRatio: number;
  isEligible: boolean;
}): number {
  if (!opts.isEligible) return 0;

  let score = 0;

  // Required skills: 60 pts
  score += REQUIRED_SKILLS_PTS * opts.requiredOverlapRatio;

  // Preferred skills: 25 pts
  score += PREFERRED_SKILLS_PTS * opts.preferredOverlapRatio;

  // Project/work keyword hits: 15 pts
  score += PROJECT_KEYWORD_PTS * opts.projectKeywordHitRatio;

  return round2(Math.min(score, 100));
}

/**
 * Computes the final match score using the hybrid formula.
 */
export function computeMatchScore(
  semanticScore: number,
  structuredScore: number,
): number {
  const score =
    SEMANTIC_WEIGHT * semanticScore + STRUCTURED_WEIGHT * structuredScore;
  return round2(score);
}

/**
 * Counts how many JD required-skill keywords appear in student project/work text.
 * Uses word-boundary matching to prevent false positives.
 * Returns a ratio (0–1) capped at 5 keyword hits.
 */
export function computeProjectKeywordHitRatio(
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

// ── Explanation ─────────────────────────────────────────────────────────────

/**
 * Generates a short (1–2 line) explanation from scoring components.
 */
export function generateShortExplanation(result: {
  matchScore: number;
  semanticScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isEligible: boolean;
  ineligibilityReason?: string;
  cgpa?: number | null;
  minCgpa?: number | null;
}): string {
  if (!result.isEligible) {
    return `Ineligible: ${result.ineligibilityReason}`;
  }

  const parts: string[] = [];
  if (result.matchedSkills.length > 0) {
    parts.push(`matched ${result.matchedSkills.length} required skills`);
  }

  // CGPA buffer
  if (
    result.cgpa !== null &&
    result.cgpa !== undefined &&
    result.minCgpa !== null &&
    result.minCgpa !== undefined
  ) {
    const buffer = result.cgpa - result.minCgpa;
    if (buffer > 0) {
      parts.push(`CGPA exceeds the cutoff by ${buffer.toFixed(1)}`);
    }
  }

  return parts.join(", ") + ".";
}

/**
 * Generates a detailed multi-line explanation.
 */
export function generateDetailedExplanation(result: {
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

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Computes all scores for a student-JD pair.
 */
export function computeAllScores(
  studentEmbedding: number[],
  jdEmbedding: number[],
  studentProfile: StudentProfile,
  requiredSkills: string[],
  preferredSkills: string[],
  eligibility: EligibilityCriteria,
): ScoringResult {
  // Eligibility
  const { isEligible, reason } = checkEligibility(studentProfile, eligibility);

  // Required skill overlap
  const {
    matchedSkills,
    missingSkills,
    overlapRatio: requiredOverlapRatio,
  } = computeSkillOverlap(studentProfile.skillNames, requiredSkills);

  // Preferred skill overlap
  const { overlapRatio: preferredOverlapRatio } = computeSkillOverlap(
    studentProfile.skillNames,
    preferredSkills,
  );

  // Project/work keyword ratio
  const projectKeywordHitRatio = computeProjectKeywordHitRatio(
    studentProfile.projectKeywords,
    requiredSkills,
  );

  // Scores
  const semanticScore = computeSemanticScore(studentEmbedding, jdEmbedding);
  const structuredScore = computeStructuredScore({
    requiredOverlapRatio,
    preferredOverlapRatio,
    projectKeywordHitRatio,
    isEligible,
  });
  const matchScore = computeMatchScore(semanticScore, structuredScore);

  // Explanation
  const shortExplanation = generateShortExplanation({
    matchScore,
    semanticScore,
    matchedSkills,
    missingSkills,
    isEligible,
    ineligibilityReason: reason,
    cgpa: studentProfile.cgpa,
    minCgpa: eligibility.minCgpa,
  });

  return {
    matchScore,
    semanticScore,
    structuredScore,
    matchedSkills,
    missingSkills,
    shortExplanation,
    isEligible,
    ineligibilityReason: reason,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

/** Round to 2 decimal places. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
