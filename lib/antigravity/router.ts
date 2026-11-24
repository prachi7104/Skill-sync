
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ANTIGRAVITY — Intelligent Multi-Model Fallback System
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Routes tasks to optimal models based on:
 * - Task type and complexity
 * - Rate limit availability
 * - Context length requirements
 * - Latency requirements
 *
 * Built for: SkillSync Placement Copilot MVP
 *
 * Providers:
 *   - Google Generative AI (Gemini, Gemma)
 *   - Groq (LLaMA, GPT-OSS, Prompt Guard)
 *   - Google Embedding API (model from lib/ai/models.ts)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import Groq from "groq-sdk";
import { logger } from "@/lib/logger";
import { AntigravityModelCache } from "./model-cache";
import { checkAndIncrementRateLimit } from "./db-rate-limiter";
import { AI_MODELS, EMBEDDING_MODEL, geminiThinkingConfig } from "@/lib/ai/models";

// ============================================================================
// MODEL REGISTRY & CONFIGURATION
// ============================================================================

export interface ModelCapabilities {
  longContext: boolean;
  structured: boolean;
  vision: boolean;
  functionCalling: boolean;
  // Additional flags for improved routing logic if needed
  json?: boolean;
}

export interface ModelRegistryEntry {
  id: string; // Canonical Provider ID
  provider: "google" | "groq";
  tier: number;
  rpm: number | null | "unlimited"; // Requests per minute
  rpd: number | null | "unlimited"; // Requests per day
  tpm?: number | null | "unlimited"; // Tokens per minute (new)
  contextWindow?: number;
  latency: number; // Estimated P95 latency in ms
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  capabilities: ModelCapabilities;
  jsonModeSupported?: boolean;
}

// Code defaults, used when the ai_models table has no active rows for a task.
// Model IDs come from lib/ai/models.ts (live-qualified 2026-11-23, env-overridable).
// Removed: gemini-2.0-flash (shut down 2026-06-01), gemini-2.5-flash/pro (deprecated,
// shutdown 2026-12-01), gemma-3-* (no longer served), llama-3.x / qwen3-32b on Groq
// (shut down 2026-07/08), text-embedding-004.
const caps = (structured: boolean): ModelCapabilities => ({
  longContext: true, structured, vision: false, functionCalling: false, json: structured,
});

export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  gemini_fast: {
    id: AI_MODELS.geminiFast().id, provider: "google", tier: 1, rpm: 15, rpd: 1500,
    contextWindow: 1_000_000, latency: 1500, capabilities: caps(true), jsonModeSupported: true,
  },
  gemini_advanced: {
    id: AI_MODELS.geminiAdvanced().id, provider: "google", tier: 1, rpm: 10, rpd: 500,
    contextWindow: 1_000_000, latency: 6000, capabilities: caps(true), jsonModeSupported: true,
  },
  gemini_fallback: {
    id: AI_MODELS.geminiFallback().id, provider: "google", tier: 2, rpm: 15, rpd: 1000,
    contextWindow: 1_000_000, latency: 1500, capabilities: caps(true), jsonModeSupported: true,
  },
  groq_fast: {
    id: AI_MODELS.groqFast().id, provider: "groq", tier: 2, rpm: 30, rpd: 1000,
    contextWindow: 131_072, latency: 1500, capabilities: caps(true), jsonModeSupported: true,
  },
  groq_advanced: {
    id: AI_MODELS.groqAdvanced().id, provider: "groq", tier: 2, rpm: 30, rpd: 1000,
    contextWindow: 131_072, latency: 3000, capabilities: caps(true), jsonModeSupported: true,
  },
  groq_prompt_guard: {
    id: "meta-llama/llama-prompt-guard-2-86m", provider: "groq", tier: 3, rpm: 30, rpd: 14400,
    contextWindow: 512, latency: 150, capabilities: { ...caps(false), longContext: false },
    jsonModeSupported: false,
  },
  gemini_embedding: {
    id: EMBEDDING_MODEL.id(), provider: "google", tier: 1, rpm: 1500, rpd: "unlimited",
    latency: 800, capabilities: { ...caps(false), longContext: false },
  },
};

export interface TaskDefinition {
  priority: string[];
  requiresLongContext: boolean;
  requiresStructured: boolean;
  maxLatency: number;
  description: string;
}

export const TASK_DEFINITIONS: Record<string, TaskDefinition> = {
  // Resume Processing — Groq/Gemma first for JSON tasks, Gemini for explanations only
  parse_resume_full: {
    priority: ["gemini_fast", "gemini_fallback", "groq_fast"],
    requiresLongContext: true,
    requiresStructured: true,
    maxLatency: 60000, // 60s
    description: "Full resume parsing including projects, education, skills",
  },

  parse_resume_fast: {
    priority: ["gemini_fast", "gemini_fallback", "groq_fast"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 10000, // 10s
    description: "Quick extraction of contact info and summary",
  },

  // Content Generation
  generate_questions: {
    priority: ["gemini_advanced", "gemini_fast", "groq_advanced"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 15000,
    description: "Generate interview questions based on context",
  },

  enhance_jd: {
    priority: ["gemini_fast", "gemini_fallback", "groq_fast"],
    requiresLongContext: false, // JD is usually short enough
    requiresStructured: true,
    maxLatency: 20000,
    description: "Enhance and structure job descriptions",
  },

  parse_jd_advanced: {
    priority: ["gemini_fast", "gemini_fallback", "groq_fast"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 30000,
    description: "Deep structural extraction of JD requirements",
  },

  // Utility
  sanitize_input: {
    priority: ["groq_prompt_guard"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 200,
    description: "Detect prompt injection attempts",
  },

  // Embeddings
  embed_profile: {
    priority: ["gemini_embedding"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 3000,
    description: "Generate profile embedding vector via Gemini embedding model",
  },

  embed_jd: {
    priority: ["gemini_embedding"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 3000,
    description: "Generate JD embedding via Gemini embedding model",
  },

  sandbox_feedback: {
    priority: ["gemini_advanced", "gemini_fast", "groq_advanced"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 20000,
    description: "Generate structured resume feedback cards for sandbox",
  },

  career_advice: {
    priority: ["gemini_advanced", "gemini_fast", "groq_advanced"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 25000,
    description: "Generate personalized career roadmap and upskilling advice for students",
  },
};

// ============================================================================
// HEALTH MONITORING — Track Failures & Circuit Breaking
// ============================================================================

interface ModelHealth {
  consecutiveFailures: number;
  lastFailure: number | null;
  totalRequests: number;
  successfulRequests: number;
}

class ModelHealthMonitor {
  private health: Map<string, ModelHealth> = new Map();
  private FAILURE_THRESHOLD = 3;
  private COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  recordFailure(modelKey: string): void {
    const current = this.health.get(modelKey) || {
      consecutiveFailures: 0,
      lastFailure: null,
      totalRequests: 0,
      successfulRequests: 0,
    };

    current.consecutiveFailures++;
    current.lastFailure = Date.now();
    current.totalRequests++;

    this.health.set(modelKey, current);

    if (current.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      console.warn(`[Health] ⚠️ ${modelKey} marked unhealthy after ${current.consecutiveFailures} failures`);
    }
  }

  recordSuccess(modelKey: string): void {
    const current = this.health.get(modelKey) || {
      consecutiveFailures: 0,
      lastFailure: null,
      totalRequests: 0,
      successfulRequests: 0,
    };

    current.consecutiveFailures = 0;
    current.totalRequests++;
    current.successfulRequests++;

    this.health.set(modelKey, current);
  }

  isHealthy(modelKey: string): boolean {
    const current = this.health.get(modelKey);
    if (!current) return true;

    if (current.consecutiveFailures < this.FAILURE_THRESHOLD) return true;

    // Check if cooldown expired
    if (current.lastFailure && Date.now() - current.lastFailure > this.COOLDOWN_MS) {
      // Reset logic could be more complex (e.g., half-open), but resetting entirely for now
      current.consecutiveFailures = 0;
      return true;
    }

    return false;
  }

  getStats(): Record<string, ModelHealth> {
    return Object.fromEntries(this.health);
  }
}

// ============================================================================
// MODEL ROUTER — Intelligent Model Selection + Execution
// ============================================================================

export interface ExecuteOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export interface ExecuteResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
  blocked?: boolean;
}

interface CandidateModel {
  modelKey: string;
  modelId: string;
  provider: "google" | "groq";
  rpmLimit: number;
  rpdLimit: number;
  source: "db" | "registry";
}

/** Tasks whose inputs are already validated by auth + file upload guards.
 *  These skip the Prompt Guard to prevent false positives on resume/JD text. */
const TRUSTED_TASK_TYPES = new Set([
  "parse_resume_full",
  "parse_resume_fast",
  "enhance_jd",
  "parse_jd_advanced",
  "generate_questions",
  "embed_profile",
  "embed_jd",
]);

export class AntigravityRouter {
  private healthMonitor: ModelHealthMonitor;
  private googleAI: GoogleGenerativeAI | null = null;
  private groqClient: Groq | null = null;

  private enableLogging: boolean;

  constructor(config: {
    googleApiKey?: string;
    groqApiKey?: string;
    enableLogging?: boolean;
  }) {
    this.healthMonitor = new ModelHealthMonitor();
    this.enableLogging = config.enableLogging ?? false;

    if (config.googleApiKey) {
      this.googleAI = new GoogleGenerativeAI(config.googleApiKey);
    }

    if (config.groqApiKey) {
      this.groqClient = new Groq({ apiKey: config.groqApiKey });
    }

    // Self-check validation at startup
    this.validateRegistry();
  }

  private validateRegistry() {
    const missing: string[] = [];
    for (const [taskName, task] of Object.entries(TASK_DEFINITIONS)) {
      for (const modelKey of task.priority) {
        if (!MODEL_REGISTRY[modelKey]) missing.push(`${modelKey} (in ${taskName})`);
      }
    }
    if (missing.length) {
      if (this.enableLogging) {
        console.error("MODEL_REGISTRY missing keys:", [...new Set(missing)].join(", "));
      }
      // Strict enforcement could throw here if desired
    }
  }

  private async getCurrentUsage(modelKey: string): Promise<number> {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setSeconds(0, 0);

    try {
      const { db } = await import("@/lib/db");
      const { sql } = await import("drizzle-orm");
      const rows = await db.execute(sql`
        SELECT request_count
        FROM ai_rate_limits
        WHERE model_key = ${modelKey}
          AND window_start = ${windowStart.toISOString()}
        LIMIT 1
      `);

      const usageRows = rows as unknown as Array<{ request_count: number }>;
      return Number(usageRows[0]?.request_count ?? 0);
    } catch {
      return 0;
    }
  }

  private async getExecutionCandidates(taskType: string): Promise<CandidateModel[]> {
    const dbModels = await AntigravityModelCache.getActive(taskType);

    if (dbModels.length > 0) {
      return dbModels
        .filter((m) => m.provider === "google" || m.provider === "groq")
        .map((model) => ({
          modelKey: model.model_key,
          modelId: model.model_key,
          provider: model.provider,
          rpmLimit: model.rpm_limit,
          rpdLimit: model.rpd_limit,
          source: "db" as const,
        }));
    }

    const task = TASK_DEFINITIONS[taskType];
    if (!task) return [];

    const mappedCandidates: Array<CandidateModel | null> = task.priority.map((modelKey) => {
      const model = MODEL_REGISTRY[modelKey];
      if (!model) return null;
      if (task.requiresLongContext && !model.capabilities.longContext) return null;
      if (model.latency > task.maxLatency) return null;

      return {
        modelKey,
        modelId: model.id,
        provider: model.provider,
        rpmLimit:
          typeof model.rpm === "number"
            ? model.rpm
            : model.rpm === "unlimited"
              ? Number.MAX_SAFE_INTEGER
              : 60,
        rpdLimit:
          typeof model.rpd === "number"
            ? model.rpd
            : model.rpd === "unlimited"
              ? Number.MAX_SAFE_INTEGER
              : 10000,
        source: "registry",
      };
    });

    return mappedCandidates.filter((m): m is CandidateModel => m !== null);
  }

  // ── Model Selection ─────────────────────────────────────────────────────

  async selectModel(taskType: string): Promise<string | null> {
    const task = TASK_DEFINITIONS[taskType];
    if (!task) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    const candidates = await this.getExecutionCandidates(taskType);
    for (const candidate of candidates) {
      if (candidate.provider === "google" && !this.googleAI) continue;
      if (candidate.provider === "groq" && !this.groqClient) continue;
      if (!this.healthMonitor.isHealthy(candidate.modelKey)) continue;

      const currentUsage = await this.getCurrentUsage(candidate.modelKey);
      if (currentUsage >= candidate.rpmLimit) {
        if (this.enableLogging) {
          logger.info(`[antigravity] ⚠️ ${candidate.modelKey} rate-limited, skipping`);
        }
        continue;
      }

      if (this.enableLogging) {
        logger.info(`[antigravity] ✅ Selected ${candidate.modelKey} for ${taskType}`);
      }

      return candidate.modelKey;
    }

    // Fallback to legacy static selection path if no DB model is selectable.
    for (const modelKey of task.priority) {
      const model = MODEL_REGISTRY[modelKey];
      if (!model) continue;
      if (task.requiresLongContext && !model.capabilities.longContext) continue;
      if (model.latency > task.maxLatency) continue;
      if (!this.healthMonitor.isHealthy(modelKey)) continue;
      return modelKey;
    }

    return null;
  }

  // ── Task Execution with Fallback ────────────────────────────────────────

  async execute<T = string>(
    taskType: string,
    prompt: string,
    options: ExecuteOptions = {},
  ): Promise<ExecuteResult<T>> {
    const task = TASK_DEFINITIONS[taskType];
    if (!task) {
      return { success: false, error: `Unknown task type: ${taskType}` };
    }

    // Prompt Guard: runs only on untrusted tasks (arbitrary user text).
    // Trusted tasks (resume parsing, JD enhancement) bypass the guard —
    // their inputs are already validated by auth middleware and file upload checks.
    const guardKey = "groq_prompt_guard";
    if (!TRUSTED_TASK_TYPES.has(taskType) && MODEL_REGISTRY[guardKey]) {
      const guardModel = MODEL_REGISTRY[guardKey];

      try {
        // Execute guard - specialized short context call
        // We use ExecuteGroq directly to leverage specific guard model ID
        const guardOut = await this.executeGroq(guardModel.id, prompt, { maxTokens: 32, temperature: 0.0 });

        // Check output for unsafe triggers
        if (typeof guardOut === "string" && /unsafe|block|reject/i.test(guardOut)) {
          if (this.enableLogging) {
            console.warn(`[antigravity] 🛡️ Blocked by Prompt Guard: ${guardOut}`);
          }
          return { success: false, error: "Blocked by Safety Guard", blocked: true };
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        const isAuthError = /401|403|invalid.*key|unauthorized/i.test(e.message ?? "");
        if (isAuthError) {
          console.error(`[antigravity] 🔑 Prompt Guard unavailable — check GROQ_API_KEY: ${e.message}`);
        } else {
          console.warn(`[antigravity] ⚠️ Prompt Guard check failed: ${e.message}`);
        }
        // Strict enforcement: Fail safe if guard cannot verify
        return { success: false, error: "Safety Check Failed (Guard Execution Error)" };
      }
    }


    // 2. Try models in priority chain
    const triedModels = new Set<string>();
    const MAX_ATTEMPTS = Math.max(3, task.priority.length);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidates = await this.getExecutionCandidates(taskType);

      let selectedModel: CandidateModel | null = null;
      for (const candidate of candidates) {
        if (triedModels.has(candidate.modelKey)) continue;
        if (!this.healthMonitor.isHealthy(candidate.modelKey)) {
          triedModels.add(candidate.modelKey);
          continue;
        }
        if (candidate.provider === "google" && !this.googleAI) {
          triedModels.add(candidate.modelKey);
          continue;
        }
        if (candidate.provider === "groq" && !this.groqClient) {
          triedModels.add(candidate.modelKey);
          continue;
        }

        const currentUsage = await this.getCurrentUsage(candidate.modelKey);
        if (currentUsage >= candidate.rpmLimit) {
          triedModels.add(candidate.modelKey);
          continue;
        }

        selectedModel = candidate;
        break;
      }

      if (!selectedModel) {
        return { success: false, error: `All models exhausted for task: ${taskType}` };
      }

      triedModels.add(selectedModel.modelKey);

      try {
        const withinLimit = await checkAndIncrementRateLimit(
          selectedModel.modelKey,
          selectedModel.rpmLimit,
        );
        if (!withinLimit) {
          continue;
        }

        let result: unknown;

        if (selectedModel.provider === "google") {
          if (taskType.startsWith("embed_")) {
            result = await this.embedGoogle(selectedModel.modelId, prompt);
          } else {
            result = await this.executeGoogle(selectedModel.modelId, prompt, options);
          }
        } else if (selectedModel.provider === "groq") {
          // Assume text generation for Groq unless specific embedding support added later
          result = await this.executeGroq(selectedModel.modelId, prompt, options);
        } else {
          continue;
        }

        this.healthMonitor.recordSuccess(selectedModel.modelKey);

        return {
          success: true,
          data: result as T,
          modelUsed: selectedModel.modelKey,
        };

      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (this.enableLogging) {
          console.error(`[antigravity] ❌ ${selectedModel.modelKey} failed: ${msg}`);
        }

        this.healthMonitor.recordFailure(selectedModel.modelKey);

        if (/429|rate|limit/i.test(msg)) {
          if (this.enableLogging) {
            logger.warn(`[antigravity] ${selectedModel.modelKey} returned provider rate limit`);
          }
          continue;
        }

        // Continue to next model in priority chain
        continue;
      }
    }

    return { success: false, error: `Failed after ${MAX_ATTEMPTS} attempts for task: ${taskType}` };
  }

  // ── Provider Implementations ────────────────────────────────────────────

  private async executeGoogle(
    modelId: string,
    prompt: string,
    options: ExecuteOptions,
  ): Promise<string> {
    if (!this.googleAI) {
      throw new Error("Google AI not initialized — missing API key");
    }

    try {
      // Check if this specific model supports JSON mode
      const modelEntry = Object.values(MODEL_REGISTRY).find((m) => m.id === modelId);
      const supportsJsonMode = modelEntry?.jsonModeSupported !== false; // Default true for backwards compat

      const model = this.googleAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
          // ONLY set responseMimeType if model supports it
          ...(options.responseFormat === "json" &&
            supportsJsonMode && {
            responseMimeType: "application/json",
          }),
          // Thinking adds large latency; use the lowest setting this model generation accepts.
          ...({ thinkingConfig: geminiThinkingConfig(modelId) } as object),
        },
        ...(options.systemPrompt && {
          systemInstruction: supportsJsonMode
            ? options.systemPrompt
            : `${options.systemPrompt}\n\nIMPORTANT: Return ONLY valid JSON in your response. No markdown, no explanations.`,
        }),
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text();

      // If JSON requested but model doesn't support native mode, extract manually
      if (options.responseFormat === "json" && !supportsJsonMode) {
        text = this.extractJSON(text);
      }

      return text;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`Google Generation Error: ${e.message}`);
    }
  }

  // Add JSON extraction helper:
  private extractJSON(raw: string): string {
    if (!raw?.trim()) return "{}";

    let text = raw.trim();

    // Remove markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    // Find first complete JSON object
    const start = text.indexOf("{");
    if (start === -1) return "{}";

    let depth = 0,
      inStr = false,
      esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return text.substring(start, i + 1);
      }
    }

    return "{}";
  }

  private async embedGoogle(
    modelId: string,
    text: string,
  ): Promise<number[]> {
    if (!this.googleAI) {
      throw new Error("Google AI not initialized — missing API key");
    }
    try {
      const model = this.googleAI.getGenerativeModel({ model: modelId });
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text: text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        // @ts-expect-error — outputDimensionality is supported but may not be in type defs yet
        outputDimensionality: 768,
      });
      if (!result.embedding || !result.embedding.values) {
        throw new Error("No embedding returned");
      }
      return result.embedding.values;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`Google Embedding Error: ${e.message}`);
    }
  }

  private async executeGroq(
    modelId: string,
    prompt: string,
    options: ExecuteOptions,
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error("Groq client not initialized — missing API key");
    }

    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const completion = await this.groqClient.chat.completions.create({
        model: modelId,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        ...(options.responseFormat === "json" && {
          response_format: { type: "json_object" as const },
        }),
      });

      return completion.choices[0]?.message?.content || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`Groq Error: ${e.message}`);
    }
  }



  // ── Status / Observability ──────────────────────────────────────────────

  getStatus(): Record<
    string,
    {
      model: { id: string; provider: string; tier: number; latency: number };
    }
  > {
    const status: Record<
      string,
      {
        model: { id: string; provider: string; tier: number; latency: number };
      }
    > = {};

    for (const [key, model] of Object.entries(MODEL_REGISTRY)) {
      status[key] = {
        model: {
          id: model.id,
          provider: model.provider,
          tier: model.tier,
          latency: model.latency,
        },
      };
    }

    return status;
  }
}

// ============================================================================
// PLACEMENT COPILOT INTEGRATION HELPERS
// ============================================================================

// Helper to clean JSON
function cleanJSONString(text: string): string {
  let clean = text.trim();
  if (clean.startsWith("```json")) clean = clean.slice(7);
  else if (clean.startsWith("```")) clean = clean.slice(3);
  if (clean.endsWith("```")) clean = clean.slice(0, -3);
  return clean.trim();
}



/**
 * Resume parser with automatic fallback.
 */
export async function parseResumeWithAntigravity(
  router: AntigravityRouter,
  resumeText: string,
): Promise<unknown> {
  const systemPrompt = `You are an expert resume parser for a placement management system.
Extract ALL information from the resume into the following JSON structure:

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedinUrl": "string | null",
  "education": {
    "branch": "string",
    "specialization": "string | null",
    "class10Marks": "number",
    "class12Marks": "number",
    "currentCGPA": "number"
  },
  "skills": [{ "name": "string", "proficiency": "beginner | intermediate | advanced" }],
  "projects": [{
    "title": "string",
    "description": "string",
    "techStack": ["string"],
    "githubUrl": "string | null"
  }],
  "workExperience": [{
    "company": "string",
    "role": "string",
    "duration": "string",
    "description": "string"
  }],
  "certifications": [{
    "name": "string",
    "issuer": "string",
    "dateObtained": "string | null"
  }]
}

Return ONLY valid JSON. No markdown, no explanations.`;

  let cleanedText = resumeText;
  try {
    const { sanitizeInput } = await import("./sanitize");
    cleanedText = sanitizeInput(resumeText);
  } catch (e: unknown) {
    console.warn('[antigravity] JSON extraction error:', e instanceof Error ? e.message : String(e));
  }

  const result = await router.execute(
    "parse_resume_full",
    `Resume content:\n\n${cleanedText}`,
    {
      systemPrompt,
      responseFormat: "json",
      temperature: 0.2,
      maxTokens: 4096,
    },
  );

  if (result.success && result.data) {
    try {
      return JSON.parse(cleanJSONString(result.data as string));
    } catch {
      return result.data;
    }
  }

  throw new Error(result.error || "Failed to parse resume");
}

/**
 * JD enhancer with automatic fallback.
 */
export async function enhanceJDWithAntigravity(
  router: AntigravityRouter,
  jdText: string,
): Promise<unknown> {

  const systemPrompt = `You are a job description enhancement expert.
Structure and enhance the provided JD into this JSON format:

{
  "title": "string",
  "company": "string",
  "description": "string",
  "requirements": {
    "mandatory": ["string"],
    "preferred": ["string"]
  },
  "skills": [{
    "name": "string (normalized)",
    "importance": "critical | important | nice-to-have"
  }],
  "experience": {
    "min": "number (years)",
    "max": "number | null"
  },
  "education": ["string"],
  "location": "string",
  "ctc": {
    "min": "number | null",
    "max": "number | null",
    "currency": "string"
  }
}

Normalize all skill names. Return ONLY valid JSON.`;

  let cleanedJd = jdText;
  try {
    const { sanitizeInput } = await import("./sanitize");
    cleanedJd = sanitizeInput(jdText);
  } catch (e: unknown) {
    console.warn('[antigravity] JSON extraction error:', e instanceof Error ? e.message : String(e));
  }

  const result = await router.execute(
    "enhance_jd",
    `Job Description:\n\n${cleanedJd}`,
    {
      systemPrompt,
      responseFormat: "json",
      temperature: 0.3,
      maxTokens: 3072,
    },
  );

  if (result.success && result.data) {
    try {
      const parsed = JSON.parse(cleanJSONString(result.data as string));
      return parsed;
    } catch {
      return result.data;
    }
  }

  throw new Error(result.error || "Failed to enhance JD");
}

/**
 * Generate embeddings with fallback to API.
 */
export async function generateEmbeddingWithAntigravity(
  router: AntigravityRouter,
  text: string,
  preferQuality: boolean = false,
): Promise<number[]> {
  const taskType = preferQuality ? "embed_jd" : "embed_profile";

  const result = await router.execute<number[]>(taskType, text);

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || "Failed to generate embedding");
}
