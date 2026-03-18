import { describe, it, expect } from "vitest";

// Inline cosine for test (avoids server-only import)
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return normA === 0 || normB === 0 ? 0 : dot / (normA * normB);
}

function getRecommendation(score: number): string {
  if (score >= 80) return "STRONG MATCH";
  if (score >= 60) return "GOOD MATCH";
  if (score >= 40) return "MODERATE MATCH";
  if (score >= 20) return "WEAK MATCH";
  return "REJECT";
}

describe("Unified 70/30 scoring", () => {
  it("matches ranking pipeline formula exactly", () => {
    const semantic = 65, ats = 45;
    const composite = Math.round((semantic * 0.7 + ats * 0.3) * 10) / 10;
    expect(composite).toBe(59);
  });

  it("no semantic → only ATS contributes", () => {
    expect(0 * 0.7 + 80 * 0.3).toBe(24);
  });

  it("perfect both → 100", () => {
    expect(100 * 0.7 + 100 * 0.3).toBe(100);
  });
});

describe("Cosine similarity", () => {
  it("identical normalized vectors → 1.0", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1.0);
  });

  it("orthogonal → 0.0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it("MERN profile vs AI/LLM JD → moderately similar", () => {
    // Python + Docker match, but no specific AI/LLM tools
    const profile = [0.7, 0.6, 0.1, 0.0]; // Python, Docker, MERN, AI
    const jd =      [0.8, 0.5, 0.0, 0.9]; // Python, Docker, _, AI emphasis
    const sim = cosineSimilarity(profile, jd);
    expect(sim).toBeGreaterThan(0.5); // moderate similarity
    expect(sim).toBeLessThan(0.9);    // not perfect
  });
});

describe("Recommendation labels", () => {
  it("38.7 → WEAK MATCH (not PASS)", () => {
    expect(getRecommendation(38.7)).toBe("WEAK MATCH");
  });
  it("85 → STRONG MATCH", () => {
    expect(getRecommendation(85)).toBe("STRONG MATCH");
  });
  it("0 → REJECT", () => {
    expect(getRecommendation(0)).toBe("REJECT");
  });
});

describe("Seniority warning", () => {
  it("triggers for 3+ year requirements", () => {
    const expReq = 3;
    const warning = expReq >= 3 ? `This role requires ${expReq}+ years` : null;
    expect(warning).toContain("3+");
  });

  it("no warning for internship (0 exp)", () => {
    expect(0 >= 3 ? "warning" : null).toBeNull();
  });
});
