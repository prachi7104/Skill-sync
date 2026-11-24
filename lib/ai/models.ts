/**
 * Central, server-side AI model registry.
 *
 * Every Gemini/Groq model name used on an active code path comes from here.
 * Defaults were qualified live on 2026-11-23 against the configured API keys
 * (see docs/guest-mode/PROGRESS.md). Each can be overridden with an env var
 * so a provider deprecation needs a config change, not a code change.
 *
 * Gemini docs:  https://ai.google.dev/gemini-api/docs/models
 * Groq docs:    https://console.groq.com/docs/models
 */

export type AiProvider = "google" | "groq";

export interface AiModelSpec {
  provider: AiProvider;
  id: string;
  /**
   * Thinking control. Gemini 2.5 takes a token budget (0 = off); Gemini 3.x takes a
   * level and some 3.x models reject `thinkingBudget: 0` with HTTP 400, so keep the
   * lowest level ("minimal") there. Thinking adds 10–100s of latency otherwise.
   */
  thinking?: { budget: number } | { level: "minimal" | "low" | "medium" | "high" };
  timeoutMs: number;
}

const env = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

/** Lowest-latency thinking setting each Gemini generation accepts. */
export function thinkingFor(modelId: string): AiModelSpec["thinking"] {
  return /^gemini-2\./.test(modelId) ? { budget: 0 } : { level: "minimal" };
}

export const AI_MODELS = {
  /** Fast structured extraction (resume/JD parsing). Verified: JSON schema OK, ~1s. */
  geminiFast: (): AiModelSpec => ({ provider: "google", id: env("GEMINI_FAST_MODEL", "gemini-3.5-flash-lite"), thinking: thinkingFor(env("GEMINI_FAST_MODEL", "gemini-3.5-flash-lite")), timeoutMs: 25_000 }),
  /** Higher-quality reasoning (coaching, recommendations). Verified with minimal thinking. */
  geminiAdvanced: (): AiModelSpec => ({ provider: "google", id: env("GEMINI_ADVANCED_MODEL", "gemini-3.6-flash"), thinking: thinkingFor(env("GEMINI_ADVANCED_MODEL", "gemini-3.6-flash")), timeoutMs: 20_000 }),
  /** Stable, non-deprecated fallback. Verified: JSON OK, ~1s. */
  geminiFallback: (): AiModelSpec => ({ provider: "google", id: env("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite"), thinking: thinkingFor(env("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite")), timeoutMs: 25_000 }),
  /** Groq production models per docs. NOT live-verified: the configured GROQ_API_KEY returned 401. */
  groqFast: (): AiModelSpec => ({ provider: "groq", id: env("GROQ_FAST_MODEL", "openai/gpt-oss-20b"), timeoutMs: 15_000 }),
  groqAdvanced: (): AiModelSpec => ({ provider: "groq", id: env("GROQ_ADVANCED_MODEL", "openai/gpt-oss-120b"), timeoutMs: 20_000 }),
} as const;

/** `generationConfig.thinkingConfig` for a Gemini model id. */
export function geminiThinkingConfig(modelId: string) {
  const t = thinkingFor(modelId);
  return t && "budget" in t ? { thinkingBudget: t.budget } : { thinkingLevel: t?.level ?? "minimal" };
}

/** Embeddings: must stay index-compatible with existing 768-dim vectors. */
export const EMBEDDING_MODEL = {
  id: () => env("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"),
  dimensions: 768,
} as const;

export type AiTask = "extraction" | "reasoning";

/** Ordered fallback chain per task. Groq is appended only when a key is configured. */
export function modelChain(task: AiTask): AiModelSpec[] {
  const chain = task === "extraction"
    ? [AI_MODELS.geminiFast(), AI_MODELS.geminiFallback(), AI_MODELS.groqFast()]
    : [AI_MODELS.geminiAdvanced(), AI_MODELS.geminiFast(), AI_MODELS.groqAdvanced()];
  return chain.filter((model) => model.provider === "google"
    ? !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    : !!process.env.GROQ_API_KEY);
}
