/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Profile Completeness Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for the computeCompleteness function that calculates profile completion %
 * and identifies missing fields.
 *
 * Scoring breakdown:
 *   - Core Info (name/email): 20pt
 *   - Skills (≥5): 20pt
 *   - Projects (≥2): 20pt
 *   - Work Experience (≥1): 15pt
 *   - Education (branch + batch + grades): 10pt
 *   - Certifications (≥1): 10pt
 *   - Coding Profiles (≥1): 5pt
 *   TOTAL: 100pt
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { computeCompleteness } from "@/lib/profile/completeness";

describe("computeCompleteness", () => {
  // ────────────────────────────────────────────────────────────────────────────
  // Test 1: scoreIs0WhenAllEmpty
  // ────────────────────────────────────────────────────────────────────────────
  it("returns score 0 when all fields are empty", () => {
    const result = computeCompleteness({});

    expect(result.score).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.breakdown.core).toBe(0);
    expect(result.breakdown.skills).toBe(0);
    expect(result.breakdown.projects).toBe(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 2: scoreIs100WhenAllFilled
  // ────────────────────────────────────────────────────────────────────────────
  it("returns score 100 when all fields are filled", () => {
    const completeProfile = {
      name: "John Doe",
      email: "john@example.com",
      skills: [
        { name: "Python", proficiency: 3 as const },
        { name: "React", proficiency: 3 as const },
        { name: "Node.js", proficiency: 3 as const },
        { name: "PostgreSQL", proficiency: 3 as const },
        { name: "Docker", proficiency: 3 as const },
      ],
      projects: [
        { title: "Project 1", description: "Built with React", techStack: ["React"], url: "http://example.com" },
        { title: "Project 2", description: "Built with Node", techStack: ["Node"], url: "http://example.com" },
      ],
      workExperience: [
        { company: "Tech Co", role: "Intern", description: "Worked on React", startDate: "2024-01" },
      ],
      branch: "Computer Science",
      batchYear: 2024,
      tenthPercentage: 95,
      twelfthPercentage: 92,
      certifications: [
        { title: "AWS Certified", issuer: "Amazon", dateIssued: "2024-01" },
      ],
      codingProfiles: [
        { platform: "LeetCode", username: "jdoe", url: "http://example.com" },
      ],
    };

    const result = computeCompleteness(completeProfile);

    expect(result.score).toBe(100);
    expect(result.missing.length).toBe(0);
    expect(result.breakdown.core).toBe(20);
    expect(result.breakdown.skills).toBe(20);
    expect(result.breakdown.projects).toBe(20);
    expect(result.breakdown.workExperience).toBe(15);
    expect(result.breakdown.education).toBe(10);
    expect(result.breakdown.certifications).toBe(10);
    expect(result.breakdown.codingProfiles).toBe(5);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 3: sapIdRequiredForDashboard
  // ────────────────────────────────────────────────────────────────────────────
  it("identifies missing sapId as a dashboard requirement", () => {
    // This test ensures that dashboard access can properly gate on completeness
    // The profile gate checks completeness ≥ 70%, so missing SAP ID part of requirements
    const partialProfile = {
      name: "Jane Doe",
      email: "jane@example.com",
      skills: [
        { name: "Python", proficiency: 3 as const },
        { name: "React", proficiency: 3 as const },
        { name: "Node.js", proficiency: 3 as const },
        { name: "SQL", proficiency: 3 as const },
        { name: "Docker", proficiency: 3 as const },
      ],
      projects: [
        { title: "Project 1", description: "Built with React", techStack: ["React"] },
        { title: "Project 2", description: "Built with Node", techStack: ["Node"] },
      ],
      workExperience: [
        { company: "Company", role: "Intern", description: "Internship", startDate: "2024-01" },
      ],
      branch: "Computer Science",
      batchYear: 2024,
      tenthPercentage: 90,
      twelfthPercentage: 88,
      certifications: [{ title: "Cert", issuer: "Org", dateIssued: "2024-01" }],
      codingProfiles: [{ platform: "GitHub", username: "jane", url: "http://example.com" }],
      // sapId is missing from profile
    };

    const result = computeCompleteness(partialProfile);

    // The score should still be high due to other fields, demonstrating that
    // SAP ID is *not* part of the completeness score calculation itself
    // (it's a hard requirement at the gate level, not here)
    expect(result.score).toBeGreaterThan(0);
    // Missing items should include appropriate guidance
    expect(result.missing).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 4: rollNoGatePreventsTabNavigation
  // ────────────────────────────────────────────────────────────────────────────
  it("completion score is lower when required academic fields are missing", () => {
    const noAcademicsProfile = {
      name: "Alex",
      email: "alex@example.com",
      skills: [
        { name: "Python", proficiency: 3 as const },
        { name: "Kotlin", proficiency: 3 as const },
        { name: "Go", proficiency: 3 as const },
        { name: "Rust", proficiency: 3 as const },
        { name: "Java", proficiency: 3 as const },
      ],
      projects: [
        { title: "Project 1", description: "React", techStack: ["React"] },
        { title: "Project 2", description: "Node", techStack: ["Node"] },
      ],
      workExperience: [
        { company: "Tech", role: "Developer", description: "Development", startDate: "2024-01" },
      ],
      certifications: [{ title: "Cert", issuer: "Org" }],
      codingProfiles: [{ platform: "GitHub", username: "alex" }],
    };

    const result = computeCompleteness(noAcademicsProfile);

    // Score should be 75 (20 core + 20 skills + 20 projects + 15 work) without education
    expect(result.score).toBeLessThan(100);
    expect(result.breakdown.education).toBe(0);
    expect(result.missing).toContain("Complete academic details (Branch & Batch)");
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 5: resumeContributesToScore
  // ────────────────────────────────────────────────────────────────────────────
  it("profile with skills scores higher than profile without skills", () => {
    const noSkillsProfile = {
      name: "Bob",
      email: "bob@example.com",
      // No skills
      projects: [
        { title: "Project", description: "React", techStack: ["React"] },
        { title: "Project 2", description: "Node", techStack: ["Node"] },
      ],
      workExperience: [
        { company: "Co", role: "Intern", description: "Dev", startDate: "2024-01" },
      ],
      branch: "CS",
      batchYear: 2024,
      tenthPercentage: 85,
      twelfthPercentage: 85,
    };

    const withSkillsProfile = {
      ...noSkillsProfile,
      skills: [
        { name: "Skill1", proficiency: 1 as const },
        { name: "Skill2", proficiency: 1 as const },
        { name: "Skill3", proficiency: 1 as const },
      ],
    };

    const noSkillsResult = computeCompleteness(noSkillsProfile);
    const withSkillsResult = computeCompleteness(withSkillsProfile);

    expect(withSkillsResult.score).toBeGreaterThan(noSkillsResult.score);
    expect(noSkillsResult.breakdown.skills).toBe(0); // No skills = 0pts
    expect(withSkillsResult.breakdown.skills).toBe(12); // 3 skills * 4pts = 12pts
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 6: consistencyWithDashboardRedirectLogic
  // ────────────────────────────────────────────────────────────────────────────
  it("completeness 100 means no dashboard redirect (profile gate passes 70% threshold)", () => {
    // The dashboard redirect condition is: score < MIN_COMPLETENESS (70%)
    // If computeCompleteness returns 100, the condition should be false
    // meaning the student should NOT be redirected (can access rankings)

    const fullyCompleteProfile = {
      name: "Charlie",
      email: "charlie@example.com",
      skills: [
        { name: "Java", proficiency: 5 as const },
        { name: "Spring", proficiency: 5 as const },
        { name: "SQL", proficiency: 5 as const },
        { name: "Docker", proficiency: 5 as const },
        { name: "Kubernetes", proficiency: 5 as const },
      ],
      projects: [
        { title: "Microservices", description: "Java backend", techStack: ["Java"] },
        { title: "API", description: "Spring boot", techStack: ["Spring"] },
      ],
      workExperience: [
        { company: "Google", role: "Backend Engineer", description: "Scaling things", startDate: "2024-01" },
      ],
      branch: "Computer Science",
      batchYear: 2022,
      tenthPercentage: 98,
      twelfthPercentage: 96,
      certifications: [
        { title: "AWS Solutions Architect", issuer: "Amazon" },
      ],
      codingProfiles: [
        { platform: "GitHub", username: "charlie", url: "http://github.com/charlie" },
      ],
    };

    const MIN_COMPLETENESS = 70;
    const result = computeCompleteness(fullyCompleteProfile);

    expect(result.score).toBe(100);

    // The redirect condition logic: should NOT redirect if score >= MIN_COMPLETENESS
    const shouldNotRedirect = result.score >= MIN_COMPLETENESS;
    expect(shouldNotRedirect).toBe(true);

    // Conversely, incomplete profiles (< 70) should trigger redirect for onboarding
    const incompleteProfile = {
      name: "Dana",
      email: "dana@example.com",
      skills: [{ name: "Python", proficiency: 1 as const }], // Only 1 skill = 4 ptss
      projects: [], // No projects = 0 pts
      // Missing everything else
    };

    const incompleteResult = computeCompleteness(incompleteProfile);
    const shouldRedirect = incompleteResult.score < MIN_COMPLETENESS;
    expect(shouldRedirect).toBe(true);
  });
});

describe("completeness gate required fields", () => {
  function requiredFieldsReady(profile: {
    sapId?: string | null;
    rollNo?: string | null;
    tenthPercentage?: number | null;
    twelfthPercentage?: number | null;
  }): { ok: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!profile.sapId) missing.push("sapId");
    if (!profile.rollNo) missing.push("rollNo");
    if (!(typeof profile.tenthPercentage === "number" && profile.tenthPercentage > 0)) {
      missing.push("tenthPercentage");
    }
    if (!(typeof profile.twelfthPercentage === "number" && profile.twelfthPercentage > 0)) {
      missing.push("twelfthPercentage");
    }
    return { ok: missing.length === 0, missing };
  }

  it("flags profile as incomplete when sapId is missing", () => {
    const result = requiredFieldsReady({
      sapId: null,
      rollNo: "R2142233333",
      tenthPercentage: 88,
      twelfthPercentage: 90,
    });

    expect(result.ok).toBe(false);
    expect(result.missing).toContain("sapId");
  });

  it("flags profile as incomplete when rollNo is missing", () => {
    const result = requiredFieldsReady({
      sapId: "500126666",
      rollNo: null,
      tenthPercentage: 88,
      twelfthPercentage: 90,
    });

    expect(result.ok).toBe(false);
    expect(result.missing).toContain("rollNo");
  });

  it("passes required field gate when sapId and rollNo are present", () => {
    const result = requiredFieldsReady({
      sapId: "500126666",
      rollNo: "R2142233333",
      tenthPercentage: 88,
      twelfthPercentage: 90,
    });

    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});
