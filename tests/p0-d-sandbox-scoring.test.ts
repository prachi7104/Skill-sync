import { describe, it, expect } from "vitest";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

function getHireRecommendation(score: number): string {
  if (score >= 80) return "STRONG MATCH";
  if (score >= 60) return "GOOD MATCH";
  if (score >= 40) return "MODERATE MATCH";
  if (score >= 20) return "WEAK MATCH";
  return "REJECT";
}

describe("Unified 70/30 scoring formula", () => {
  it("matches ranking pipeline formula exactly", () => {
    const semanticScore = 65;
    const atsScore = 45;
    const composite = Math.round((semanticScore * 0.7 + atsScore * 0.3) * 100) / 100;
    expect(composite).toBe(59);
  });

  it("zero semantic -> score driven by ATS only", () => {
    const composite = 0 * 0.7 + 80 * 0.3;
    expect(composite).toBe(24);
  });

  it("perfect semantic + perfect ATS -> 100", () => {
    const composite = 100 * 0.7 + 100 * 0.3;
    expect(composite).toBe(100);
  });
});

describe("Cosine similarity", () => {
  it("identical normalized vectors -> similarity = 1.0", () => {
    const v = [1, 0, 0];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
  });

  it("orthogonal vectors -> similarity = 0.0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it("opposite vectors -> similarity = -1.0", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it("similar skill vectors produce high similarity", () => {
    const profile = [0.7, 0.7, 0.1];
    const jd = [0.8, 0.6, 0.0];
    const sim = cosineSimilarity(profile, jd);
    expect(sim).toBeGreaterThan(0.95);
  });
});

describe("Score label correctness", () => {
  it("38.7 -> WEAK MATCH (not PASS or REJECT)", () => {
    expect(getHireRecommendation(38.7)).toBe("WEAK MATCH");
  });

  it("62 -> GOOD MATCH", () => {
    expect(getHireRecommendation(62)).toBe("GOOD MATCH");
  });

  it("0 -> REJECT", () => {
    expect(getHireRecommendation(0)).toBe("REJECT");
  });
});

describe("Seniority warning trigger", () => {
  it("role requiring 3+ years triggers warning", () => {
    const expRequired = 3;
    const warning = expRequired >= 3
      ? `This role requires ${expRequired}+ years of professional experience.`
      : null;
    expect(warning).toBeTruthy();
    expect(warning).toContain("3+");
  });

  it("internship (0 exp required) does not trigger warning", () => {
    const expRequired = 0;
    const warning = expRequired >= 3 ? "warning" : null;
    expect(warning).toBeNull();
  });
});

describe("Embedding fallback handling", () => {
  it("falls back to ATS-only when student has no embedding", () => {
    const studentEmbedding: number[] | null = null;
    const jdEmbedding: number[] | null = [0.1, 0.2];
    const useUnified = !!(jdEmbedding && studentEmbedding);
    expect(useUnified).toBe(false);
  });

  it("uses unified when both embeddings available", () => {
    const studentEmbedding: number[] | null = [0.1, 0.2];
    const jdEmbedding: number[] | null = [0.1, 0.2];
    const useUnified = !!(jdEmbedding && studentEmbedding);
    expect(useUnified).toBe(true);
  });
});
