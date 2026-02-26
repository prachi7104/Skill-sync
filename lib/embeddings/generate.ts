import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { incrementModelUsage, hasCapacity } from "./rate-limit-db";
import { env } from "@/lib/env";

export const EMBEDDING_DIMENSION = 768;
// Correct model ID for Gemini Embedding (free tier, 768-dim)
const EMBEDDING_MODEL = "gemini-embedding-001";

let googleAI: GoogleGenerativeAI | null = null;
let huggingFaceExtractor: any = null;

function getGoogleAI(): GoogleGenerativeAI {
  if (!googleAI) {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    googleAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return googleAI;
}

async function getHuggingFaceExtractor() {
  if (!huggingFaceExtractor) {
    const { pipeline } = await import("@huggingface/transformers");
    huggingFaceExtractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
    });
  }
  return huggingFaceExtractor;
}

/**
 * Adjusts vector dimensions to strictly match DESIRED_DIM (768).
 * - Truncates if too large (e.g. 3072 -> 768)
 * - Pads with zeros if too small (e.g. 384 -> 768)
 */
function adjustDimensions(vector: number[]): number[] {
  if (vector.length === EMBEDDING_DIMENSION) return vector;

  if (vector.length > EMBEDDING_DIMENSION) {
    console.log(`[Embeddings] Truncating vector from ${vector.length} to ${EMBEDDING_DIMENSION}`);
    return vector.slice(0, EMBEDDING_DIMENSION);
  }

  console.log(`[Embeddings] Padding vector from ${vector.length} to ${EMBEDDING_DIMENSION}`);
  const padded = new Array(EMBEDDING_DIMENSION).fill(0);
  for (let i = 0; i < vector.length; i++) {
    padded[i] = vector[i];
  }
  return padded;
}

/**
 * Generate a 768-dimensional embedding for text.
 * Primary: Gemini API
 * Fallback: Local Xenova/all-MiniLM-L6-v2 (padded to 768)
 */
export async function generateEmbedding(
  text: string,
  type: "profile" | "jd" = "profile",
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  // 1. Try Gemini Primary
  try {
    const ok = await hasCapacity("gemini_embedding", 1);
    if (!ok) throw new Error("GEMINI_LIMIT_REACHED");

    const ai = getGoogleAI();
    const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
    const taskType = type === "jd" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY";

    const result = await model.embedContent({
      content: { parts: [{ text: cleaned }], role: "user" },
      taskType: taskType as any,
    });

    if (result.embedding?.values) {
      await incrementModelUsage("gemini_embedding", 1);
      return adjustDimensions(result.embedding.values);
    }
    throw new Error("Empty Gemini response");
  } catch (err: any) {
    console.warn(`[Embeddings] Gemini Primary failed, falling back to local: ${err.message}`);

    // 2. Local Fallback (Xenova)
    try {
      const extractor = await getHuggingFaceExtractor();
      const output = await extractor(cleaned, { pooling: "mean", normalize: true });
      const vector = Array.from(output.data) as number[];
      return adjustDimensions(vector);
    } catch (fallbackErr: any) {
      console.error(`[Embeddings] Local fallback also failed: ${fallbackErr.message}`);
      throw new Error(`Embedding generation failed completely: ${fallbackErr.message}`);
    }
  }
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;

  // Dimensions must match for mathematical operation
  // If they don't, we adjust them on the fly (though they should already be 768)
  const a = vecA.length !== EMBEDDING_DIMENSION ? adjustDimensions(vecA) : vecA;
  const b = vecB.length !== EMBEDDING_DIMENSION ? adjustDimensions(vecB) : vecB;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
