import { describe, it, expect } from "vitest";

// Inline cosineSimilarity to avoid importing from generate.ts
// which has "server-only" imports that fail in vitest jsdom env
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0) return 0;
    if (vecA.length !== vecB.length) return 0;

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

describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
        const v = [1, 0, 0, 1];
        expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
    });

    it("should return 0 for orthogonal vectors", () => {
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
    });

    it("should return 0 for mismatched dimensions", () => {
        expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    });

    it("should return 0 for zero vectors", () => {
        expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    });

    it("should return -1 for opposite vectors", () => {
        expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
    });

    it("should return 0 for empty vectors", () => {
        expect(cosineSimilarity([], [])).toBe(0);
    });

    it("should handle normalized vectors", () => {
        const a = [0.6, 0.8];
        const b = [0.8, 0.6];
        const sim = cosineSimilarity(a, b);
        expect(sim).toBeGreaterThan(0.9);
        expect(sim).toBeLessThanOrEqual(1.0);
    });
});
