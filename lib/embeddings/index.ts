/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Embeddings Module
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-only module for generating and working with vector embeddings.
 *
 * Exports:
 * - generateEmbedding: Generate 768-dim embedding from text
 * - cosineSimilarity: Compute cosine similarity between embeddings
 * - composeStudentEmbeddingText: Compose student profile for embedding
 * - composeJDEmbeddingText: Compose JD for embedding
 * - extractStudentSkillNames: Extract skill names from profile
 * - extractJDRequiredSkills: Extract required skills from JD
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export {
  generateEmbedding,
  cosineSimilarity,
  EMBEDDING_DIMENSION,
} from "./generate";

export {
  composeStudentEmbeddingText,
  composeJDEmbeddingText,
  extractStudentSkillNames,
  extractJDRequiredSkills,
} from "./compose";
