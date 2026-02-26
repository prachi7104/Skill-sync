import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { incrementModelUsage, hasCapacity } from "./rate-limit-db";
import { env } from "@/lib/env";

export const EMBEDDING_DIMENSION = 768;

// Correct model ID for Gemini Embedding (768-dim)
const EMBEDDING_MODEL = "gemini-embedding-001";

// Max retries for transient errors
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

let googleAI: GoogleGenerativeAI | null = null;

function getGoogleAI(): GoogleGenerativeAI {
  if (!googleAI) {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    googleAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return googleAI;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a 768-dimensional embedding for text using gemini-embedding-001.
 * Retries on transient errors. Throws on rate limit or permanent failure.
 */
export async function generateEmbedding(
  text: string,
  type: "profile" | "jd" = "profile",
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  // Check DB-tracked rate limit before calling API
  const ok = await hasCapacity("gemini_embedding", 1);
  if (!ok) {
    throw new Error(
      "RATE_LIMIT_EXCEEDED: Daily embedding limit reached. Will retry tomorrow.",
    );
  }

  const ai = getGoogleAI();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
  const taskType = type === "jd" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const result = await model.embedContent({
        content: { parts: [{ text: cleaned }], role: "user" },
        taskType: taskType as unknown as undefined,
        outputDimensionality: EMBEDDING_DIMENSION,
      } as Parameters<typeof model.embedContent>[0]);

      if (
        !result.embedding?.values ||
        result.embedding.values.length !== EMBEDDING_DIMENSION
      ) {
        throw new Error(
          `Invalid embedding: got ${result.embedding?.values?.length ?? 0} dims, expected ${EMBEDDING_DIMENSION}`,
        );
      }

      await incrementModelUsage("gemini_embedding", 1);
      return result.embedding.values;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Rate limit — don't retry
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RATE_LIMIT")) {
        await incrementModelUsage("gemini_embedding", 1).catch(() => { });
        throw new Error(`RATE_LIMIT_429: Google API rate limit hit. ${msg}`);
      }

      // Non-retryable errors
      if (msg.includes("403") || msg.includes("API key") || msg.includes("not found")) {
        throw new Error(`Embedding failed: ${msg}`);
      }

      lastError = new Error(`Embedding failed: ${msg}`);

      // Retryable (5xx, timeout, network)
      if (attempt < MAX_RETRIES) {
        console.warn(`[Embedding] Attempt ${attempt + 1} failed, retrying: ${msg}`);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Embedding failed after retries");
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) {
    console.warn(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
