import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { incrementModelUsage, hasCapacity } from "./rate-limit-db";
import { env } from "@/lib/env";

export const EMBEDDING_DIMENSION = 768;
// Correct model ID for Gemini Embedding (free tier, 768-dim)
const EMBEDDING_MODEL = "text-embedding-004";

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

/**
 * Generate a 768-dimensional embedding for text.
 * Uses DB-backed rate limiting to respect real API limits.
 *
 * Throws if:
 * - API key missing
 * - Daily limit exhausted
 * - Google API returns error
 */
export async function generateEmbedding(
  text: string,
  type: "profile" | "jd" = "profile",
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  // Clean and truncate (embedding model has 2048 token limit)
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

  // Task type hints improve embedding quality
  const taskType =
    type === "jd" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY";

  try {
    const result = await model.embedContent({
      content: { parts: [{ text: cleaned }], role: "user" },
      ...(taskType ? { taskType: taskType as unknown as undefined } : {}),
    } as Parameters<typeof model.embedContent>[0]);

    if (
      !result.embedding?.values ||
      result.embedding.values.length !== EMBEDDING_DIMENSION
    ) {
      throw new Error(
        `Invalid embedding: got ${result.embedding?.values?.length ?? 0} dims, expected ${EMBEDDING_DIMENSION}`,
      );
    }

    // Record successful request in DB
    await incrementModelUsage("gemini_embedding", 1);

    return result.embedding.values;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // If it's a 429, mark in DB anyway to avoid hammering
    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate")
    ) {
      await incrementModelUsage("gemini_embedding", 1).catch(() => { });
      throw new Error(`RATE_LIMIT_429: Google API rate limit hit. ${msg}`);
    }

    throw new Error(`Embedding failed: ${msg}`);
  }
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) {
    console.warn(
      `Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`,
    );
    return 0;
  }

  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
