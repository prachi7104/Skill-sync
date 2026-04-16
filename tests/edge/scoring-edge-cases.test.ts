import { describe, it, expect } from "vitest";
import {
  checkEligibility,
  computeSkillOverlap,
  computeSemanticScore,
  computeStructuredScore,
  computeMatchScore,
  computeAllScores,
  round2,
} from "@/lib/matching/scoring";

describe("Scoring — edge cases", () => {
  it("round2 handles very small numbers", () => {
    expect(round2(0.001)).toBe(0);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(99.999)).toBe(100);
  });

  it("computeSkillOverlap with empty arrays returns 0", () => {
    const result = computeSkillOverlap([], ["python", "java"]);
    expect(result.overlapRatio).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(["python", "java"]);
  });

  it("computeSkillOverlap with empty required skills returns perfect match", () => {
    const result = computeSkillOverlap(["python", "java"], []);
    expect(result.overlapRatio).toBe(1);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual([]);
  });

  it("computeSemanticScore with identical embeddings returns ~1", () => {
    const emb = Array.from({ length: 768 }, () => 0.5);
    const score = computeSemanticScore(emb, emb);
    expect(score).toBeGreaterThan(0.99);
  });

  it("computeSemanticScore with orthogonal embeddings returns ~0", () => {
    const embA = Array.from({ length: 768 }, (_, i) => (i % 2 === 0 ? 1 : 0));
    const embB = Array.from({ length: 768 }, (_, i) => (i % 2 === 0 ? 0 : 1));
    const score = computeSemanticScore(embA, embB);
    expect(score).toBeLessThan(0.01);
  });

  it("computeMatchScore respects 70/30 weight split", () => {
    const match = computeMatchScore(100, 0);
    expect(match).toBeCloseTo(70, 0);
    const match2 = computeMatchScore(0, 100);
    expect(match2).toBeCloseTo(30, 0);
  });

  it("checkEligibility passes when all criteria are null", () => {
    const result = checkEligibility(
      { cgpa: null, branch: null, batchYear: null, category: null, skillNames: [], projectKeywords: [] },
      { minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null }
    );
    expect(result.isEligible).toBe(true);
  });

  it("checkEligibility fails on CGPA below minimum", () => {
    const result = checkEligibility(
      { cgpa: 5.0, branch: null, batchYear: null, category: null, skillNames: [], projectKeywords: [] },
      { minCgpa: 7.0, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null }
    );
    expect(result.isEligible).toBe(false);
  });

  it("scoring is deterministic (idempotent)", () => {
    const studentEmb = Array.from({ length: 768 }, (_, i) => Math.sin(i));
    const jdEmb = Array.from({ length: 768 }, (_, i) => Math.cos(i));
    const profile = {
      cgpa: 8.0,
      branch: "CS",
      batchYear: 2026,
      category: "alpha" as const,
      skillNames: ["python", "react", "docker"],
      projectKeywords: ["api", "frontend"],
    };
    const required = ["python", "react", "java"];
    const preferred = ["docker", "kubernetes"];
    const criteria = { minCgpa: 7.0, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null };

    const result1 = computeAllScores(studentEmb, jdEmb, profile, required, preferred, criteria);
    const result2 = computeAllScores(studentEmb, jdEmb, profile, required, preferred, criteria);

    expect(result1.matchScore).toBe(result2.matchScore);
    expect(result1.semanticScore).toBe(result2.semanticScore);
    expect(result1.structuredScore).toBe(result2.structuredScore);
    expect(result1.matchedSkills).toEqual(result2.matchedSkills);
    expect(result1.missingSkills).toEqual(result2.missingSkills);
  });
});

describe("Completeness — edge cases", () => {
  // Import real completeness function
  it("computeCompleteness with empty student returns 0 for all sections", async () => {
    const { computeCompleteness } = await import("@/lib/profile/completeness");
    const result = computeCompleteness({});
    expect(result.score).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("computeCompleteness with full student returns high score", async () => {
    const { computeCompleteness } = await import("@/lib/profile/completeness");
    const result = computeCompleteness({
      name: "Test User",
      email: "test@example.com",
      skills: Array.from({ length: 5 }, (_, i) => ({ name: `skill${i}`, proficiency: 3 as const })),
      projects: [
        { title: "P1", description: "D1", techStack: ["React"] },
        { title: "P2", description: "D2", techStack: ["Node"] },
      ],
      workExperience: [{ company: "Acme", role: "Intern", description: "Worked", startDate: "2024-06" }],
      certifications: [{ title: "AWS", issuer: "Amazon" }],
      codingProfiles: [{ platform: "LeetCode", username: "user1" }],
      branch: "Computer Science",
      batchYear: 2026,
      tenthPercentage: 92,
      twelfthPercentage: 88,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});
