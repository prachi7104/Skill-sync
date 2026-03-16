import { describe, expect, it } from "vitest";

import { computeCompleteness } from "@/lib/profile/completeness";

describe("phases 4-7 feature coverage", () => {
  it("marks required onboarding fields as complete when core sections exist", () => {
    const result = computeCompleteness({
      name: "Student",
      email: "student@example.com",
      branch: "CSE",
      batchYear: 2026,
      tenthPercentage: 91,
      twelfthPercentage: 89,
      skills: [
        { name: "TypeScript", proficiency: 3 },
        { name: "React", proficiency: 3 },
        { name: "Node.js", proficiency: 3 },
        { name: "SQL", proficiency: 3 },
        { name: "Git", proficiency: 3 },
      ],
      projects: [
        { title: "One", description: "A", techStack: ["React"] },
        { title: "Two", description: "B", techStack: ["Node"] },
      ],
      workExperience: [{ company: "X", role: "Intern", description: "D", startDate: "2025-01" }],
      certifications: [{ title: "AWS", issuer: "Amazon" }],
      codingProfiles: [{ platform: "LeetCode", username: "foo", url: "https://leetcode.com/foo" }],
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.missing).not.toContain("Complete academic details (Branch & Batch)");
  });

  it("keeps incomplete profiles below dashboard unlock threshold", () => {
    const result = computeCompleteness({
      name: "Student",
      email: "student@example.com",
      skills: [],
      projects: [],
    });

    expect(result.score).toBeLessThan(80);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
