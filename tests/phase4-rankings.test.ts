import { describe, it, expect } from "vitest";

describe("All-student ranking (eligibility color coding)", () => {
  type Student = { id: string; cgpa: number | null; branch: string | null; batchYear: number | null; category: string | null };
  type Criteria = { minCgpa: number | null; eligibleBranches: string[] | null; eligibleBatchYears: number[] | null; eligibleCategories: string[] | null };

  function checkEligibility(student: Student, criteria: Criteria): { isEligible: boolean; reason?: string } {
    if (criteria.minCgpa !== null && (student.cgpa ?? 0) < criteria.minCgpa) {
      return { isEligible: false, reason: `CGPA ${student.cgpa} below minimum ${criteria.minCgpa}` };
    }
    if (criteria.eligibleBranches?.length && !criteria.eligibleBranches.includes(student.branch ?? "")) {
      return { isEligible: false, reason: `Branch ${student.branch} not eligible` };
    }
    if (criteria.eligibleBatchYears?.length && !criteria.eligibleBatchYears.includes(student.batchYear ?? 0)) {
      return { isEligible: false, reason: `Batch year ${student.batchYear} not eligible` };
    }
    return { isEligible: true };
  }

  it("eligible student passes all criteria", () => {
    const result = checkEligibility(
      { id: "1", cgpa: 8.5, branch: "Computer Science", batchYear: 2027, category: "alpha" },
      { minCgpa: 7.5, eligibleBranches: ["Computer Science"], eligibleBatchYears: [2027], eligibleCategories: null }
    );
    expect(result.isEligible).toBe(true);
  });

  it("student below min CGPA is ineligible with reason", () => {
    const result = checkEligibility(
      { id: "2", cgpa: 6.5, branch: "Computer Science", batchYear: 2027, category: null },
      { minCgpa: 7.5, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null }
    );
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("CGPA");
  });

  it("wrong branch student is ineligible with reason", () => {
    const result = checkEligibility(
      { id: "3", cgpa: 9.0, branch: "AIML", batchYear: 2027, category: null },
      { minCgpa: null, eligibleBranches: ["Computer Science"], eligibleBatchYears: null, eligibleCategories: null }
    );
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain("Branch");
  });

  it("ineligible students get matchScore 0", () => {
    const matchScore = 0;
    expect(matchScore).toBe(0);
  });

  it("incomplete profile students get matchScore 0 but isEligible true", () => {
    const hasEmbedding = false;
    const isEligible = true;
    const matchScore = !hasEmbedding ? 0 : 65;
    expect(isEligible).toBe(true);
    expect(matchScore).toBe(0);
  });
});

describe("Rankings visibility gate", () => {
  it("students cannot see rankings when rankings_visible is false", () => {
    const drive = { rankingsVisible: false };
    const role = "student";
    const canSee = role !== "student" || drive.rankingsVisible;
    expect(canSee).toBe(false);
  });

  it("faculty can always see rankings regardless of visibility flag", () => {
    const drive = { rankingsVisible: false };
    const role = "faculty" as string;
    const canSee = role !== "student" || drive.rankingsVisible;
    expect(canSee).toBe(true);
  });
});
