/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Embedding Generation Service
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-only module for generating 384-dimensional vector embeddings using
 * the all-MiniLM-L6-v2 model via @xenova/transformers (ONNX runtime).
 *
 * Model:      Xenova/all-MiniLM-L6-v2
 * Dimension:  384
 * Use cases:  Student profiles, Job descriptions
 *
 * Rules:
 *  - No caching
 *  - No retries
 *  - Fail fast on error
 *  - Never expose model/client to frontend
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

// Model name locked to all-MiniLM-L6-v2 (384 dimensions)
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSION = 384;

// Lazy-loaded pipeline to avoid loading the model on every import.
// Uses a promise-based singleton to prevent concurrent model loading.
let pipelinePromise: Promise<any> | null = null;

/**
 * Lazily initializes and returns the embedding pipeline.
 * Uses a promise-based singleton: the first call starts loading,
 * subsequent concurrent calls await the same promise instead of
 * triggering parallel model loads.
 */
async function getEmbeddingPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      try {
        const { pipeline } = await import("@xenova/transformers");
        return await pipeline("feature-extraction", MODEL_NAME, {
          progress_callback: undefined,
        });
      } catch (err) {
        // Reset so next call retries instead of returning failed promise
        pipelinePromise = null;
        throw err;
      }
    })();
  }
  return pipelinePromise;
}

/**
 * Generates a 384-dimensional embedding vector for the given text.
 *
 * @param text - The input text to embed (student profile or JD content)
 * @returns A 384-dimensional number array representing the text embedding
 * @throws Error if the embedding generation fails or produces invalid dimensions
 *
 * @example
 * ```ts
 * const embedding = await generateEmbedding("React TypeScript Node.js");
 * console.log(embedding.length); // 384
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const pipe = await getEmbeddingPipeline();

  // Generate embedding using the model
  // The output is a tensor that we need to convert to a regular array
  const output = await pipe(text, {
    pooling: "mean", // Mean pooling for sentence-level embedding
    normalize: true, // L2 normalize the output for cosine similarity
  });

  // Extract the embedding data from the tensor
  const embedding: number[] = Array.from(output.data);

  // Validate dimension
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSION}-dimensional embedding, got ${embedding.length}`
    );
  }

  return embedding;
}

/**
 * Computes the cosine similarity between two embedding vectors.
 *
 * Since embeddings are L2-normalized during generation, cosine similarity
 * is equivalent to the dot product of the vectors.
 *
 * @param a - First embedding vector (384 dimensions)
 * @param b - Second embedding vector (384 dimensions)
 * @returns Cosine similarity score between 0 and 1
 * @throws Error if vectors have different dimensions
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  // Dot product (since vectors are L2-normalized, this equals cosine similarity)
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  // Clamp to [0, 1] to handle floating-point precision issues
  // Note: cosine similarity can be [-1, 1] but for our normalized embeddings
  // it should be [0, 1] since all text is semantically "positive"
  return Math.max(0, Math.min(1, dotProduct));
}

export { EMBEDDING_DIMENSION };
