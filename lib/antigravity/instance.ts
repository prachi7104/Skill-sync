/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Antigravity Singleton Instance
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-only singleton for the Antigravity multi-model router.
 * Import this wherever you need an initialized router instance.
 *
 * Reads API keys from environment variables:
 *   GOOGLE_GENERATIVE_AI_API_KEY
 *   GROQ_API_KEY
 *
 * Usage:
 *   import { getRouter } from "@/lib/antigravity/instance";
 *   const router = getRouter();
 *   const result = await router.execute("enhance_jd", jdText, { ... });
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import { AntigravityRouter } from "./router";

let _instance: AntigravityRouter | null = null;

/**
 * Returns the singleton AntigravityRouter instance.
 * Lazy-initialised on first call; reused across all subsequent calls.
 */
export function getRouter(): AntigravityRouter {
  if (!_instance) {
    _instance = new AntigravityRouter({
      googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
      enableLogging: process.env.NODE_ENV !== "production",
    });
  }
  return _instance;
}
