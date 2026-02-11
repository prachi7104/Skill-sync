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
  computeSkillEvidence,
  computeCertQualityScore,
  computeSemanticDetail,
  checkEligibility,
  generateShortExplanation,
  generateDetailedExplanation,
  SCORING_CRITERIA,
  type EligibilityCriteria,
  type StudentProfile,
  type ScoringResult,
  type StructuredBreakdown,
  type SemanticDetail,
  type CertInput,
  type ProjectInput,
  type WorkInput,
} from "./scoring";
