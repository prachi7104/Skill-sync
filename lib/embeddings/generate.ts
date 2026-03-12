import { GoogleGenerativeAI } from "@google/generative-ai";

export const EMBEDDING_DIMENSION = 768;

/**
 * Generate a 768-dim embedding vector.
 * Fallback chain:
 *   1. Gemini gemini-embedding-001 (primary, 768-dim native)
 *   2. Zero vector — app doesn't crash, logs error, semantic scoring skipped
 *
 * NOTE: To add a local fallback, install @xenova/transformers and add
 * all-mpnet-base-v2 (768-dim) as tier 2 before the zero vector.
 */
export async function generateEmbedding(
  text: string,
  _type: "profile" | "jd" = "profile"
): Promise<number[]> {
  if (!text || text.trim().length === 0) return [];
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  // ── 1. Gemini gemini-embedding-001 ──────────────────────────────────────
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (googleKey) {
    try {
      const genAI = new GoogleGenerativeAI(googleKey);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(cleaned);
      const vec = result.embedding.values;
      if (vec.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Unexpected dimension: ${vec.length}`);
      }
      return vec;
    } catch (err) {
      console.warn("[embeddings] Gemini failed:", err);
    }
  }

  // ── 2. Zero vector fallback — never crashes the app ─────────────────────
  console.error("[embeddings] All providers failed. Returning zero vector. Semantic scoring will be skipped.");
  return new Array(EMBEDDING_DIMENSION).fill(0);
}

/**
 * Cosine similarity between two vectors. Returns 0 on mismatch or zero vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
