import re

new_registry = """export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // --- PRIMARY GROQ ---
  groq_llama_4_scout: {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    provider: "groq",
    tier: 1,
    rpm: 30,
    rpd: 500000,
    contextWindow: 128000,
    latency: 500,
    capabilities: { longContext: true, structured: true, vision: false, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  groq_llama_3_3_70b: {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    tier: 1,
    rpm: 30,
    rpd: 14400,
    contextWindow: 32768,
    latency: 400,
    capabilities: { longContext: false, structured: true, vision: false, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  groq_llama_3_1_8b: {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 14400,
    contextWindow: 8000,
    latency: 250,
    capabilities: { longContext: false, structured: true, vision: false, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  groq_gpt_oss_120b: {
    id: process.env.GROQ_GPT_OSS_MODEL_ID || "openai/gpt-oss-120b",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 200000,
    contextWindow: 8192,
    latency: 800,
    capabilities: { longContext: false, structured: true, vision: false, functionCalling: false, json: true },
    jsonModeSupported: true,
  },
  groq_gpt_oss_20b: {
    id: process.env.GROQ_GPT_OSS_20B_MODEL_ID || "openai/gpt-oss-20b",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 200000,
    contextWindow: 8192,
    latency: 400,
    capabilities: { longContext: false, structured: true, vision: false, functionCalling: false, json: true },
    jsonModeSupported: true,
  },
  groq_kimi_k2: {
    id: "moonshotai/kimi-k2-instruct-0905",
    provider: "groq",
    tier: 2,
    rpm: 30,
    rpd: 200000,
    contextWindow: 8192,
    latency: 500,
    capabilities: { longContext: false, structured: true, vision: false, functionCalling: false, json: true },
    jsonModeSupported: true,
  },
  groq_prompt_guard: {
    id: "openai/gpt-oss-safeguard-20b",
    provider: "groq",
    tier: 1,
    rpm: 100,
    rpd: 100000,
    contextWindow: 2048,
    latency: 150,
    capabilities: { longContext: false, structured: false, vision: false, functionCalling: false, json: false },
  },

  // --- GEMINI ---
  gemini_1_5_pro: {
    id: "gemini-1.5-pro",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 2000000,
    latency: 800,
    capabilities: { longContext: true, structured: true, vision: true, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  gemini_1_5_flash: {
    id: "gemini-1.5-flash",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 400,
    capabilities: { longContext: true, structured: true, vision: true, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  gemini_2_0_flash: {
    id: process.env.GEMINI_FREE_TIER_MODEL_ID || "gemini-2.0-flash",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 600,
    capabilities: { longContext: true, structured: true, vision: true, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  gemini_2_5_pro: {
    id: "gemini-2.5-pro",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 2000000,
    latency: 800,
    capabilities: { longContext: true, structured: true, vision: true, functionCalling: true, json: true },
    jsonModeSupported: true,
  },
  gemini_2_5_flash: {
    id: "gemini-2.5-flash",
    provider: "google",
    tier: 1,
    rpm: 15,
    rpd: 1500,
    contextWindow: 1000000,
    latency: 500,
    capabilities: { longContext: true, structured: true, vision: true, functionCalling: true, json: true },
    jsonModeSupported: true,
  },

  // --- EMBEDDINGS ---
  gemini_embedding: {
    id: "gemini-embedding-001",
    provider: "google",
    tier: 1,
    rpm: 1500,
    rpd: 100000,
    contextWindow: 2048,
    latency: 200,
    capabilities: { longContext: false, structured: false, vision: false, functionCalling: false, json: false },
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
  parse_resume_full: {
    priority: [
      "groq_llama_4_scout",
      "gemini_2_5_pro",
      "groq_llama_3_3_70b",
      "groq_gpt_oss_120b",
      "gemini_2_0_flash"
    ],
    requiresLongContext: true,
    requiresStructured: true,
    maxLatency: 60000,
    description: "Full resume parsing including projects, education, skills",
  },
  parse_resume_fast: {
    priority: [
      "groq_llama_4_scout", 
      "groq_llama_3_1_8b", 
      "gemini_2_5_flash", 
      "gemini_1_5_flash",
      "groq_kimi_k2"
    ],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 10000,
    description: "Quick extraction of contact info and summary",
  },
  generate_questions: {
    priority: [
      "gemini_2_0_flash", 
      "groq_llama_4_scout", 
      "groq_llama_3_3_70b",
      "gemini_2_5_pro",
      "groq_gpt_oss_120b"
    ],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 15000,
    description: "Generate interview questions based on context",
  },
  enhance_jd: {
    priority: [
      "groq_llama_4_scout",
      "gemini_2_5_pro",
      "groq_llama_3_3_70b",
      "gemini_1_5_pro"
    ],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 20000,
    description: "Enhance and structure job descriptions",
  },
  parse_jd_advanced: {
    priority: [
      "groq_llama_4_scout",
      "groq_llama_3_3_70b",
      "gemini_2_5_pro",
      "groq_gpt_oss_120b",
      "gemini_2_5_flash"
    ],
    requiresLongContext: false,
    requiresStructured: true,
    maxLatency: 30000,
    description: "Deep structural extraction of JD requirements",
  },
  sanitize_input: {
    priority: [
      "groq_prompt_guard", 
      "groq_llama_3_1_8b"
    ],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 200,
    description: "Detect prompt injection attempts",
  },
  embed_profile: {
    priority: ["gemini_embedding"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 3000,
    description: "Generate profile embedding vector",
  },
  embed_jd: {
    priority: ["gemini_embedding"],
    requiresLongContext: false,
    requiresStructured: false,
    maxLatency: 3000,
    description: "Generate JD embedding",
  },
};
"""

with open("d://Skillsync//lib//antigravity//router.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Replace between "export const MODEL_REGISTRY" and the end of TASK_DEFINITIONS
pattern = re.compile(r"export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = \{.*?};\s*export interface TaskDefinition.*?};\s*", re.DOTALL)
text = pattern.sub(new_registry, text)

with open("d://Skillsync//lib//antigravity//router.ts", "w", encoding="utf-8") as f:
    f.write(text)
