import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

export const EMBEDDING_DIMENSION = 768;

function normalizeEmbedding(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

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
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text: cleaned }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        // No outputDimensionality — let the model return its native 3072 dims
      });
      const vec = result.embedding.values;
      // Truncate to 768: MRL technique makes prefix truncation safe (Google docs confirm this)
      const truncated = vec.length > 768 ? vec.slice(0, 768) : vec;
      if (truncated.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Unexpected dimension after truncation: ${truncated.length}`);
      }
      return normalizeEmbedding(truncated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[embeddings] Gemini failed:", msg);
      // Re-throw so the worker captures the real error instead of seeing zeros
      throw new Error(`Gemini embedding failed: ${msg}`);
    }
  }

  // ── 2. If we get here, key was missing entirely ──
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set in environment");
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

/**
 * Validates that an embedding is a real, non-zero vector.
 * Returns false for null, empty, or all-zeros vectors.
 * Use this before writing embeddings to the DB to prevent caching broken vectors.
 */
export function isValidEmbedding(embedding: number[] | null | undefined): boolean {
  if (!embedding || embedding.length === 0) return false;
  // An all-zero vector is not a real embedding — it means generation failed
  const hasNonZero = embedding.some(v => v !== 0);
  return hasNonZero;
}
