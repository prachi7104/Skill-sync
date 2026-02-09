/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Matching Module
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Core matching engine for computing student-JD match scores.
 *
 * Exports:
 * - computeRanking: Main entry point for ranking computation
 * - Scoring utilities
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export { computeRanking, type RankingComputationResult } from "./computeRanking";

export {
  computeAllScores,
  computeMatchScore,
  computeSemanticScore,
  computeStructuredScore,
  computeSkillOverlap,
  computeProjectKeywordHitRatio,
  checkEligibility,
  generateShortExplanation,
  generateDetailedExplanation,
  type EligibilityCriteria,
  type StudentProfile,
  type ScoringResult,
} from "./scoring";
