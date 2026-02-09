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
// MODEL REGISTRY — Single Source of Truth
// ============================================================================

interface ModelCapabilities {
  longContext?: boolean;
  structured?: boolean;
  fast?: boolean;
  reliable?: boolean;
  lightweight?: boolean;
  reasoning?: boolean;
  deterministic?: boolean;
  highThroughput?: boolean;
  veryFast?: boolean;
  versatile?: boolean;
  ultraFast?: boolean;
  simple?: boolean;
  complexReasoning?: boolean;
  edgeCases?: boolean;
  security?: boolean;
  offline?: boolean;
  unlimited?: boolean;
  highQuality?: boolean;
  multilingual?: boolean;
}

interface ModelRegistryEntry {
  id: string;
  provider: "google" | "groq" | "local";
  tier: number;
  rpm: number;
  rpd: number;
  contextWindow?: number;
  dimensions?: number;
  latency: number;
  costPerRequest: number;
  bestFor: readonly string[];
  capabilities: ModelCapabilities;
}

export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // TIER 1: Primary Models (Fast, Long-Context, Free-Tier Friendly)
  gemini_3_flash: {
    id: "gemini-3.0-flash-exp",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1048576,
    latency: 500,
    costPerRequest: 0,
    bestFor: [
      "resume_parsing",
      "resume_to_json",
      "long_jd_ingestion",
      "full_profile_extraction",
    ],
    capabilities: {
      longContext: true,
      structured: true,
      fast: true,
      reliable: true,
    },
  },

  gemini_2_5_flash_lite: {
    id: "gemini-2.5-flash-lite",
    provider: "google",
    tier: 1,
    rpm: 10,
    rpd: 20,
    contextWindow: 1000000,
    latency: 375,
    costPerRequest: 0,
    bestFor: [
      "jd_enhancement",
      "skill_normalization",
      "light_explanations",
      "quick_summaries",
    ],
    capabilities: {
      longContext: true,
      structured: true,
      fast: true,
      lightweight: true,
    },
  },

  // TIER 2: Secondary / Balanced Models (Quota-Safe)
  gemini_2_5_flash: {
    id: "gemini-2.5-flash",
    provider: "google",
    tier: 2,
    rpm: 5,
    rpd: 20,
    contextWindow: 1000000,
    latency: 600,
    costPerRequest: 0,
    bestFor: [
      "explanation_generation",
      "resume_jd_comparison",
      "detailed_narratives",
      "match_reasoning",
    ],
    capabilities: {
      longContext: true,
      structured: true,
      reasoning: true,
    },
  },

  gemma_3_27b: {
    id: "gemma-3-27b-it",
    provider: "google",
    tier: 2,
    rpm: 30,
    rpd: 14400,
    contextWindow: 128000,
    latency: 1350,
    costPerRequest: 0,
    bestFor: [
      "deterministic_reasoning",
      "structured_extraction_fallback",
      "batch_processing",
      "reliable_parsing",
    ],
    capabilities: {
      deterministic: true,
      structured: true,
      highThroughput: true,
    },
  },

  // TIER 3: Heavy-Duty / High-Throughput (Groq)
  groq_llama_3_3_70b: {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    tier: 3,
    rpm: 30,
    rpd: 12000,
    contextWindow: 100000,
    latency: 200,
    costPerRequest: 0,
    bestFor: [
      "batch_resume_processing",
      "large_scale_explanations",
      "complex_reasoning",
      "multi_student_ranking",
    ],
    capabilities: {
      veryFast: true,
      highThroughput: true,
      versatile: true,
      reasoning: true,
    },
  },

  groq_llama_3_1_8b: {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    tier: 3,
    rpm: 30,
    rpd: 6000,
    contextWindow: 500000,
    latency: 100,
    costPerRequest: 0,
    bestFor: [
      "simple_extractions",
      "scoring_explanations",
      "quick_classifications",
      "field_validation",
    ],
    capabilities: {
      ultraFast: true,
      longContext: true,
      simple: true,
    },
  },

  groq_gpt_oss_120b: {
    id: "gpt-oss-120b",
    provider: "groq",
    tier: 3,
    rpm: 30,
    rpd: 8000,
    contextWindow: 200000,
    latency: 300,
    costPerRequest: 0,
    bestFor: [
      "complex_reasoning",
      "edge_case_explanations",
      "nuanced_matching",
      "advanced_analytics",
    ],
    capabilities: {
      veryFast: true,
      complexReasoning: true,
      edgeCases: true,
    },
  },

  // TIER 4: Safety / Guard (Mandatory)
  groq_prompt_guard: {
    id: "llama-prompt-guard-2-86m",
    provider: "groq",
    tier: 4,
    rpm: 30,
    rpd: 15000,
    contextWindow: 500000,
    latency: 65,
    costPerRequest: 0,
    bestFor: [
      "prompt_injection_detection",
      "resume_sanitization",
      "jd_sanitization",
      "input_validation",
    ],
    capabilities: {
      ultraFast: true,
      security: true,
      highThroughput: true,
    },
  },

  // EMBEDDINGS
  local_minilm: {
    id: "all-MiniLM-L6-v2",
    provider: "local",
    tier: 0,
    rpm: Infinity,
    rpd: Infinity,
    dimensions: 384,
    latency: 65,
    costPerRequest: 0,
    bestFor: [
      "student_profile_embedding",
      "resume_embedding",
      "skill_embedding",
      "offline_mode",
    ],
    capabilities: {
      offline: true,
      unlimited: true,
      fast: true,
    },
  },

  gemini_embedding: {
    id: "embedding-001",
    provider: "google",
    tier: 1,
    rpm: 100,
    rpd: 1000,
    dimensions: 768,
    latency: 150,
    costPerRequest: 0,
    bestFor: [
      "jd_embedding",
      "cross_language_embedding",
      "high_quality_semantic_search",
    ],
    capabilities: {
      highQuality: true,
      multilingual: true,
    },
  },
};

// ============================================================================
// TASK DEFINITIONS — Map Tasks to Model Preferences
// ============================================================================

interface TaskDefinition {
  priority: readonly string[];
  requiresLongContext: boolean;
  requiresStructured: boolean;
  maxLatency: number;
  description: string;
}

export const TASK_DEFINITIONS: Record<string, TaskDefinition> = {
  // Resume Processing
  parse_resume_full: {
    priority: ["gemini_3_flash", "gemma_3_27b", "groq_llama_3_3_70b"],
    requiresLongContext: true,
    requiresStructured: true,
    maxLatency: 2000,
    description: "Parse full resume PDF/DOCX to structured JSON",
  },

  parse_resume_quick: {
    priority: ["gemini_2_5_flash_lite", "groq_llama_3_1_8b", "gemini_3_flash"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 500,
    description: "Quick resume field extraction",
  },

  // JD Processing
  enhance_jd: {
    priority: ["gemini_2_5_flash_lite", "gemini_2_5_flash", "gemini_3_flash"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 1000,
    description: "Enhance and structure job description",
  },

  parse_jd_long: {
    priority: ["gemini_3_flash", "gemini_2_5_flash", "groq_llama_3_3_70b"],
    requiresLongContext: true,
    requiresStructured: true,
    maxLatency: 2000,
    description: "Parse lengthy JD documents",
  },

  // Matching & Ranking
  generate_match_explanation: {
    priority: [
      "gemini_2_5_flash",
      "groq_llama_3_3_70b",
      "gemini_2_5_flash_lite",
    ],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 1500,
    description: "Generate detailed match reasoning",
  },

  rank_students_batch: {
    priority: ["groq_llama_3_3_70b", "gemma_3_27b", "gemini_3_flash"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 3000,
    description: "Rank multiple students against JD",
  },

  // Skill Processing
  normalize_skills: {
    priority: ["gemini_2_5_flash_lite", "groq_llama_3_1_8b", "gemma_3_27b"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 500,
    description: "Standardize skill names",
  },

  // Explanations
  explain_score: {
    priority: [
      "groq_llama_3_1_8b",
      "gemini_2_5_flash_lite",
      "groq_llama_3_3_70b",
    ],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 800,
    description: "Explain match score components",
  },

  explain_complex_mismatch: {
    priority: ["groq_gpt_oss_120b", "gemini_2_5_flash", "groq_llama_3_3_70b"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 1500,
    description: "Explain complex edge cases",
  },

  // Security
  sanitize_input: {
    priority: ["groq_prompt_guard"],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 200,
    description: "Detect prompt injection attempts",
  },

  // Embeddings
  embed_profile: {
    priority: ["local_minilm", "gemini_embedding"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 300,
    description: "Generate profile embedding vector",
  },

  embed_jd: {
    priority: ["gemini_embedding", "local_minilm"],
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

  canMakeRequest(modelKey: string): boolean {
    const model = MODEL_REGISTRY[modelKey];
    if (!model) return false;

    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const oneDayAgo = now - 86_400_000;

    const rpmTimestamps = (this.state.rpm.get(modelKey) || []).filter(
      (t) => t > oneMinuteAgo,
    );
    const rpdTimestamps = (this.state.rpd.get(modelKey) || []).filter(
      (t) => t > oneDayAgo,
    );

    if (rpmTimestamps.length >= model.rpm) return false;
    if (rpdTimestamps.length >= model.rpd) return false;

    return true;
  }

  recordRequest(modelKey: string): void {
    const now = Date.now();

    const rpmTimestamps = this.state.rpm.get(modelKey) || [];
    rpmTimestamps.push(now);
    this.state.rpm.set(modelKey, rpmTimestamps);

    const rpdTimestamps = this.state.rpd.get(modelKey) || [];
    rpdTimestamps.push(now);
    this.state.rpd.set(modelKey, rpdTimestamps);
  }

  getAvailableCapacity(modelKey: string): { rpm: number; rpd: number } {
    const model = MODEL_REGISTRY[modelKey];
    if (!model) return { rpm: 0, rpd: 0 };

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
      rpm: model.rpm - rpmUsed,
      rpd: model.rpd - rpdUsed,
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
  }

  // ── Model Selection ─────────────────────────────────────────────────────

  /**
   * Select the best available model for a task.
   * Walks the priority list, checking capabilities and rate limits.
   * Returns null if no model is available.
   */
  async selectModel(taskType: string): Promise<string | null> {
    const task = TASK_DEFINITIONS[taskType];
    if (!task) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    for (const modelKey of task.priority) {
      const model = MODEL_REGISTRY[modelKey];
      if (!model) continue;

      // Capability check
      if (task.requiresLongContext && !model.capabilities.longContext) continue;

      // Latency check
      if (model.latency > task.maxLatency) continue;

      // Rate limit check
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

  /**
   * Execute a task with automatic fallback across the priority chain.
   * Tries each model in order; on failure, moves to the next.
   */
  async execute<T = string>(
    taskType: string,
    prompt: string,
    options: ExecuteOptions = {},
  ): Promise<ExecuteResult<T>> {
    const task = TASK_DEFINITIONS[taskType];
    if (!task) {
      return { success: false, error: `Unknown task type: ${taskType}` };
    }

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
          result = await this.executeGoogle(model.id, prompt, options);
        } else if (model.provider === "groq") {
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
          const msg =
            error instanceof Error ? error.message : String(error);
          console.error(`[antigravity] ❌ ${modelKey} failed: ${msg}`);
        }
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
    return result.response.text();
  }

  private async executeGroq(
    modelId: string,
    prompt: string,
    options: ExecuteOptions,
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error("Groq client not initialized — missing API key");
    }

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
  }

  private async executeLocal(text: string): Promise<number[]> {
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
  }

  // ── Status / Observability ──────────────────────────────────────────────

  /**
   * Returns current rate-limit capacity for every registered model.
   */
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

  /**
   * Reset all internal rate-limit counters.
   * Useful for testing.
   */
  resetRateLimits(): void {
    this.rateLimiter.resetStats();
  }
}

// ============================================================================
// PLACEMENT COPILOT INTEGRATION HELPERS
// ============================================================================

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

  // Sanitize user input before passing to AI
  const { sanitizeInput } = await import("./sanitize");
  const cleanedText = sanitizeInput(resumeText);

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
      return JSON.parse(result.data as string);
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

  // Sanitize user input before passing to AI
  const { sanitizeInput } = await import("./sanitize");
  const cleanedJd = sanitizeInput(jdText);

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
      return JSON.parse(result.data as string);
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
