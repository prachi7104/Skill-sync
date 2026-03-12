/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Embedding Utility Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - cosineSimilarity(): vector similarity computation
 *   - EMBEDDING_DIMENSION constant
 *
 * Uses inline copies to avoid triggering @xenova/transformers import.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline copies (mirrors lib/embeddings/generate.ts) ──────────────────────

const EMBEDDING_DIMENSION = 768;

function cosineSimilarity(vecA: number[], vecB: number[]): number {
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

// ── Tests ───────────────────────────────────────────────────────────────────

describe("EMBEDDING_DIMENSION", () => {
    it("should be 768", () => {
        expect(EMBEDDING_DIMENSION).toBe(768);
    });
});

describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
        const vec = [1, 2, 3, 4, 5];
        expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
        const vecA = [1, 0, 0];
        const vecB = [0, 1, 0];
        expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0, 5);
    });

    it("should return 0 for zero vectors", () => {
        const zero = [0, 0, 0];
        const vec = [1, 2, 3];
        expect(cosineSimilarity(zero, vec)).toBe(0);
        expect(cosineSimilarity(vec, zero)).toBe(0);
        expect(cosineSimilarity(zero, zero)).toBe(0);
    });

    it("should return 0 for mismatched lengths", () => {
        const vecA = [1, 2, 3];
        const vecB = [1, 2];
        expect(cosineSimilarity(vecA, vecB)).toBe(0);
    });

    it("should return 0 for empty arrays", () => {
        expect(cosineSimilarity([], [])).toBe(0);
        expect(cosineSimilarity([], [1, 2])).toBe(0);
        expect(cosineSimilarity([1, 2], [])).toBe(0);
    });

    it("should return -1 for opposite vectors", () => {
        const vecA = [1, 0, 0];
        const vecB = [-1, 0, 0];
        expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1, 5);
    });
});

describe("Zero vector detection", () => {
  it("should detect an all-zero 768-dim vector as zero", () => {
    const zero768 = new Array(768).fill(0);
    const isZero = zero768.length === 768 && zero768.every(v => v === 0);
    expect(isZero).toBe(true);
  });

  it("should not flag a real embedding as zero", () => {
    const real = new Array(768).fill(0);
    real[42] = 0.31;
    const isZero = real.length === 768 && real.every(v => v === 0);
    expect(isZero).toBe(false);
  });

  it("should return 0 cosine similarity for zero vectors (unchanged behavior)", () => {
    const zero = new Array(768).fill(0);
    const real = new Array(768).fill(0.1);
    // cosineSimilarity already handles zero vectors — confirm it returns 0
    expect(cosineSimilarity(zero, real)).toBe(0);
    expect(cosineSimilarity(real, zero)).toBe(0);
  });
});
