/**
 * SkillSync — Antigravity barrel export
 *
 * Re-exports the multi-model router, registry, task definitions,
 * and placement-specific helper functions.
 */

export {
  MODEL_REGISTRY,
  TASK_DEFINITIONS,
  AntigravityRouter,
  parseResumeWithAntigravity,
  enhanceJDWithAntigravity,
  generateEmbeddingWithAntigravity,
  type ExecuteOptions,
  type ExecuteResult,
} from "./router";
