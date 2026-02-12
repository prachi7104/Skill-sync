
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
 *   - Local (@xenova/transformers — all-MiniLM-L6-v2)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

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
  provider: "google" | "groq" | "local";
  tier: number;
  rpm: number | null | "unlimited"; // Requests per minute
  rpd: number | null | "unlimited"; // Requests per day
  contextWindow?: number;
  latency: number; // Estimated P95 latency in ms
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  capabilities: ModelCapabilities;
}

export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // TIER 1: Primary Models (Fast, Long-Context, Free-Tier Friendly)
  gemini_2_0_flash: {
    id: "gemini-2.0-flash",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 600,
    capabilities: {
      longContext: true,
      structured: true,
      vision: true,
      functionCalling: true,
      json: true,
    },
  },

  gemini_2_5_flash_lite: {
    id: "gemini-2.5-flash-lite",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 400,
    capabilities: {
      longContext: true,
      structured: true,
      vision: false,
      functionCalling: false,
      json: true,
    },
  },

  gemini_2_5_flash: {
    id: "gemini-2.5-flash",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 500,
    capabilities: {
      longContext: true,
      structured: true,
      vision: true,
      functionCalling: true,
      json: true,
    },
  },

  // GEMMA 3 FAMILY (As requested)
  gemma_3_27b: {
    id: "gemma-3-27b-it",
    provider: "google",
    tier: 2,
    rpm: 30,
    rpd: 500,
    contextWindow: 8192, // Standardizing to known limit or safe default
    latency: 800,
    capabilities: {
      longContext: false, // 8k isn't considered "long" in this system (usually >32k)
      structured: true,
      vision: true,
      functionCalling: false,
      json: true,
    },
  },

  gemma_3_12b: {
    id: "gemma-3-12b-it",
    provider: "google",
    tier: 2,
    rpm: 30,
    rpd: 500,
    contextWindow: 8192,
    latency: 600,
    capabilities: {
      longContext: false,
      structured: true,
      vision: true,
      functionCalling: false,
      json: true,
    },
  },

  gemma_3_4b: {
    id: "gemma-3-4b-it",
    provider: "google",
    tier: 3,
    rpm: 30,
    rpd: 500,
    contextWindow: 8192,
    latency: 300,
    capabilities: {
      longContext: false,
      structured: true,
      vision: true,
      functionCalling: false,
      json: true,
    },
  },

  gemma_3_1b: {
    id: "gemma-3-1b-it",
    provider: "google",
    tier: 3,
    rpm: 30,
    rpd: 500,
    contextWindow: 8192,
    latency: 150,
    capabilities: {
      longContext: false,
      structured: false, // Smaller models struggle with complex JSON
      vision: true,
      functionCalling: false,
      json: true,
    },
  },

  gemma_3_270m: {
    id: "gemma-3-270m-it",
    provider: "google",
    tier: 3,
    rpm: 30,
    rpd: 500,
    contextWindow: 8192,
    latency: 100,
    capabilities: {
      longContext: false,
      structured: false,
      vision: true, // Assuming vision capabilities across the family
      functionCalling: false,
      json: false, // Too small for reliable JSON
    },
  },

  // TIER 2: Secondary / Specialized Models (Groq Llama)
  groq_llama_3_3_70b: {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 14400,
    contextWindow: 32768,
    latency: 400,
    capabilities: {
      longContext: false,
      structured: true,
      vision: false,
      functionCalling: true,
      json: true,
    },
  },

  groq_llama_3_1_8b: {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 14400,
    contextWindow: 8000,
    latency: 250,
    capabilities: {
      longContext: false,
      structured: true,
      vision: false,
      functionCalling: true,
      json: true,
    },
  },

  // FALLBACK / SPECIALTY
  groq_gpt_oss_120b: {
    id: "gpt-oss-120b",
    provider: "groq",
    tier: 3,
    rpm: 10,
    rpd: 1000,
    contextWindow: 4096,
    latency: 1200,
    capabilities: {
      longContext: false,
      structured: false,
      vision: false,
      functionCalling: false,
      json: false,
    },
  },

  // GUARD
  groq_prompt_guard: {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    tier: 1,
    rpm: 100,
    rpd: 100000,
    contextWindow: 2048,
    latency: 150,
    capabilities: {
      longContext: false,
      structured: false,
      vision: false,
      functionCalling: false,
      json: false,
    },
  },

  // EMBEDDINGS
  gemini_embedding: {
    id: "gemini-embedding-1",
    provider: "google",
    tier: 1,
    rpm: 1500,
    rpd: 100000,
    contextWindow: 2048,
    latency: 100,
    capabilities: {
      longContext: false,
      structured: false,
      vision: false,
      functionCalling: false,
      json: false,
    },
  },

  local_minilm: {
    id: "Xenova/all-MiniLM-L6-v2",
    provider: "local",
    tier: 3,
    rpm: "unlimited",
    rpd: "unlimited",
    contextWindow: 512,
    latency: 50,
    capabilities: {
      longContext: false,
      structured: false,
      vision: false,
      functionCalling: false,
      json: false,
    },
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
    priority: ["groq_llama_3_3_70b", "gemma_3_27b", "gemini_2_0_flash", "gemini_2_5_flash_lite"],
    requiresLongContext: true,
    requiresStructured: true,
    maxLatency: 60000, // 60s
    description: "Full resume parsing including projects, education, skills",
  },

  parse_resume_fast: {
    priority: ["groq_llama_3_1_8b", "gemma_3_27b", "gemini_2_5_flash_lite"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 10000, // 10s
    description: "Quick extraction of contact info and summary",
  },

  // Content Generation
  generate_questions: {
    priority: ["gemini_2_0_flash", "groq_llama_3_3_70b"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 15000,
    description: "Generate interview questions based on context",
  },

  enhance_jd: {
    priority: ["groq_llama_3_3_70b", "gemma_3_27b", "gemini_2_0_flash"],
    requiresLongContext: false, // JD is usually short enough
    requiresStructured: true,
    maxLatency: 20000,
    description: "Enhance and structure job descriptions",
  },

  parse_jd_advanced: {
    priority: ["groq_llama_3_3_70b", "gemma_3_27b", "gemini_2_0_flash"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 30000,
    description: "Deep structural extraction of JD requirements",
  },

  // Utility
  sanitize_input: {
    priority: ["groq_prompt_guard", "groq_llama_3_1_8b"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 200,
    description: "Detect prompt injection attempts",
  },

  // Embeddings
  embed_profile: {
    priority: ["local_minilm"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 300,
    description: "Generate profile embedding vector",
  },

  embed_jd: {
    priority: ["local_minilm"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 500,
    description: "Generate JD embedding (prefer quality)",
  },
};

// ============================================================================
// RATE LIMITER — Track Usage Across All Models
// ============================================================================

interface RateLimitState {
  rpm: Map<string, number[]>;
  rpd: Map<string, number[]>;
}

class RateLimiter {
  private state: RateLimitState = {
    rpm: new Map(),
    rpd: new Map(),
  };

  private getLimit(value: number | null | "unlimited" | undefined): number {
    if (value === "unlimited" || value === null || value === undefined) {
      return Infinity;
    }
    return Number.isFinite(value) ? value : Infinity;
  }

  canMakeRequest(modelKey: string): boolean {
    const model = MODEL_REGISTRY[modelKey];
    if (!model) return false;

    // Explicitly handle "unlimited" and null
    const rpmLimit = this.getLimit(model.rpm);
    const rpdLimit = this.getLimit(model.rpd);

    // If limits are infinite, always allow
    if (rpmLimit === Infinity && rpdLimit === Infinity) return true;

    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const oneDayAgo = now - 86_400_000;

    const rpmTimestamps = (this.state.rpm.get(modelKey) || []).filter(
      (t) => t > oneMinuteAgo,
    );
    const rpdTimestamps = (this.state.rpd.get(modelKey) || []).filter(
      (t) => t > oneDayAgo,
    );

    if (rpmTimestamps.length >= rpmLimit) return false;
    if (rpdTimestamps.length >= rpdLimit) return false;

    return true;
  }

  recordRequest(modelKey: string): void {
    const now = Date.now();

    // Clean up old timestamps while we are at it to avoid memory leaks
    const oneMinuteAgo = now - 60_000;
    const oneDayAgo = now - 86_400_000;

    let rpmTimestamps = this.state.rpm.get(modelKey) || [];
    rpmTimestamps = rpmTimestamps.filter((t) => t > oneMinuteAgo);
    rpmTimestamps.push(now);
    this.state.rpm.set(modelKey, rpmTimestamps);

    let rpdTimestamps = this.state.rpd.get(modelKey) || [];
    rpdTimestamps = rpdTimestamps.filter((t) => t > oneDayAgo);
    rpdTimestamps.push(now);
    this.state.rpd.set(modelKey, rpdTimestamps);
  }

  getAvailableCapacity(modelKey: string): { rpm: number; rpd: number } {
    const model = MODEL_REGISTRY[modelKey];
    if (!model) return { rpm: 0, rpd: 0 };

    const rpmLimit = this.getLimit(model.rpm);
    const rpdLimit = this.getLimit(model.rpd);

    if (rpmLimit === Infinity && rpdLimit === Infinity) {
      return { rpm: 999999, rpd: 999999 };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const oneDayAgo = now - 86_400_000;

    const rpmUsed = (this.state.rpm.get(modelKey) || []).filter(
      (t) => t > oneMinuteAgo,
    ).length;
    const rpdUsed = (this.state.rpd.get(modelKey) || []).filter(
      (t) => t > oneDayAgo,
    ).length;

    return {
      rpm: rpmLimit - rpmUsed,
      rpd: rpdLimit - rpdUsed,
    };
  }

  resetStats(): void {
    this.state = { rpm: new Map(), rpd: new Map() };
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

export class AntigravityRouter {
  private rateLimiter: RateLimiter;
  private googleAI: GoogleGenerativeAI | null = null;
  private groqClient: Groq | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private embeddingPipeline: any = null;
  private enableLogging: boolean;

  constructor(config: {
    googleApiKey?: string;
    groqApiKey?: string;
    enableLogging?: boolean;
  }) {
    this.rateLimiter = new RateLimiter();
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

  // ── Model Selection ─────────────────────────────────────────────────────

  async selectModel(taskType: string): Promise<string | null> {
    const task = TASK_DEFINITIONS[taskType];
    if (!task) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    for (const modelKey of task.priority) {
      const model = MODEL_REGISTRY[modelKey];
      if (!model) continue;

      if (task.requiresLongContext && !model.capabilities.longContext) continue;
      if (model.latency > task.maxLatency) continue;

      if (!this.rateLimiter.canMakeRequest(modelKey)) {
        if (this.enableLogging) {
          console.log(`[antigravity] ⚠️ ${modelKey} rate-limited, skipping`);
        }
        continue;
      }

      if (this.enableLogging) {
        console.log(`[antigravity] ✅ Selected ${modelKey} for ${taskType}`);
      }

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

    // 1. Mandatory Prompt Guard
    // (Skipped only if the task IS 'sanitize_input', to avoid recursion loop)
    const guardKey = "groq_prompt_guard";
    if (taskType !== "sanitize_input" && MODEL_REGISTRY[guardKey]) {
      const guardModel = MODEL_REGISTRY[guardKey];

      // Strict: Guard must be available and allowed
      if (!this.rateLimiter.canMakeRequest(guardKey)) {
        console.warn(`[antigravity] ⚠️ Prompt Guard rate-limited.`);
        return { success: false, error: "Safety Guard Unavailable (Rate Limit)" };
      }

      this.rateLimiter.recordRequest(guardKey);

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
      } catch (e: any) {
        console.warn(`[antigravity] ⚠️ Prompt Guard check failed: ${e.message}`);
        // Strict enforcement: Fail safe if guard cannot verify
        return { success: false, error: "Safety Check Failed (Guard Execution Error)" };
      }
    }


    // 2. Try models in priority chain
    for (const modelKey of task.priority) {
      const model = MODEL_REGISTRY[modelKey];
      if (!model) continue;

      // Rate limit check
      if (!this.rateLimiter.canMakeRequest(modelKey)) continue;

      try {
        // Record request before execution
        this.rateLimiter.recordRequest(modelKey);

        let result: unknown;

        if (model.provider === "google") {
          if (taskType.startsWith("embed_")) {
            result = await this.embedGoogle(model.id, prompt);
          } else {
            result = await this.executeGoogle(model.id, prompt, options);
          }
        } else if (model.provider === "groq") {
          // Assume text generation for Groq unless specific embedding support added later
          result = await this.executeGroq(model.id, prompt, options);
        } else if (model.provider === "local") {
          result = await this.executeLocal(prompt);
        } else {
          continue;
        }

        return {
          success: true,
          data: result as T,
          modelUsed: modelKey,
        };

      } catch (error: unknown) {
        if (this.enableLogging) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[antigravity] ❌ ${modelKey} failed: ${msg}`);
        }
        // Continue to next model in priority chain
        continue;
      }
    }

    return { success: false, error: "All models failed or rate limited" };
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
      const model = this.googleAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
          ...(options.responseFormat === "json" && {
            responseMimeType: "application/json",
          }),
        },
        ...(options.systemPrompt && {
          systemInstruction: options.systemPrompt,
        }),
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (e: any) {
      throw new Error(`Google Generation Error: ${e.message}`);
    }
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
      const result = await model.embedContent(text);
      if (!result.embedding || !result.embedding.values) {
        throw new Error("No embedding returned");
      }
      return result.embedding.values;
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
    } catch (e: any) {
      throw new Error(`Groq Error: ${e.message}`);
    }
  }

  private async executeLocal(text: string): Promise<number[]> {
    try {
      if (!this.embeddingPipeline) {
        const { pipeline } = await import("@xenova/transformers");
        this.embeddingPipeline = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
        );
      }

      const output = await this.embeddingPipeline(text, {
        pooling: "mean",
        normalize: true,
      });

      return Array.from(output.data) as number[];
    } catch (e: any) {
      throw new Error(`Local Embedding Error: ${e.message}`);
    }
  }

  // ── Status / Observability ──────────────────────────────────────────────

  getStatus(): Record<
    string,
    {
      available: { rpm: number; rpd: number };
      model: { id: string; provider: string; tier: number; latency: number };
    }
  > {
    const status: Record<
      string,
      {
        available: { rpm: number; rpd: number };
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
        available: this.rateLimiter.getAvailableCapacity(key),
      };
    }

    return status;
  }

  resetRateLimits(): void {
    this.rateLimiter.resetStats();
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
  } catch (e) {
    // Safe to proceed if sanitizer missing, guard will catch strict issues
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
  } catch (e) {
    // Safe fallback
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
      return JSON.parse(cleanJSONString(result.data as string));
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
