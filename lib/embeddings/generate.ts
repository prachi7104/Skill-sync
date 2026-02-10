
import { AntigravityRouter } from "@/lib/antigravity/router";
import { env } from "@/lib/env";

export const EMBEDDING_DIMENSION = 384;


// Initialize Router
const router = new AntigravityRouter({
  googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  groqApiKey: env.GROQ_API_KEY, // Not used for embeddings but good to have
  enableLogging: true,
});

/**
 * Generate an embedding vector for the given text.
 * Uses Antigravity Router to select the best model (Gemini -> Local).
 * 
 * @param text The text to embed
 * @param type Context type ("profile" or "jd") to optimize model selection
 * @returns Array of numbers representing the vector
 */
export async function generateEmbedding(
  text: string,
  type: "profile" | "jd" = "profile"
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean text to avoid token wastage
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  const taskType = type === "jd" ? "embed_jd" : "embed_profile";

  console.log(`[Embeddings] Generating for ${type} via Router...`);

  const result = await router.execute<number[]>(taskType, cleaned);

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(`Embedding generation failed: ${result.error}`);
}

/**
 * Calculate cosine similarity between two vectors.
 * Used for matching candidates to JDs.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    // Handle dimension mismatch (e.g. padding or truncation) if necessary
    // For now, strict check
    console.warn(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
