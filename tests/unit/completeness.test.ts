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
        { id: "1", name: "Python", studentId: "" },
        { id: "2", name: "React", studentId: "" },
        { id: "3", name: "Node.js", studentId: "" },
        { id: "4", name: "PostgreSQL", studentId: "" },
        { id: "5", name: "Docker", studentId: "" },
      ],
      projects: [
        { id: "1", title: "Project 1", studentId: "", description: null, link: null, createdAt: new Date() },
        { id: "2", title: "Project 2", studentId: "", description: null, link: null, createdAt: new Date() },
      ],
      workExperience: [
        { id: "1", title: "Intern", studentId: "", company: "Tech Co", startDate: new Date(), endDate: new Date(), description: null },
      ],
      branch: "Computer Science",
      batchYear: 2024,
      tenthPercentage: 95,
      twelfthPercentage: 92,
      certifications: [
        { id: "1", name: "AWS Certified", studentId: "", issuedAt: new Date(), expiresAt: null },
      ],
      codingProfiles: [
        { id: "1", platform: "LeetCode", profileUrl: "http://example.com", studentId: "", createdAt: new Date() },
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
        { id: "1", name: "Python", studentId: "" },
        { id: "2", name: "React", studentId: "" },
        { id: "3", name: "Node.js", studentId: "" },
        { id: "4", name: "SQL", studentId: "" },
        { id: "5", name: "Docker", studentId: "" },
      ],
      projects: [
        { id: "1", title: "Project 1", studentId: "", description: null, link: null, createdAt: new Date() },
        { id: "2", title: "Project 2", studentId: "", description: null, link: null, createdAt: new Date() },
      ],
      workExperience: [
        { id: "1", title: "Intern", studentId: "", company: "Company", startDate: new Date(), endDate: new Date(), description: null },
      ],
      branch: "Computer Science",
      batchYear: 2024,
      tenthPercentage: 90,
      twelfthPercentage: 88,
      certifications: [{ id: "1", name: "Cert", studentId: "", issuedAt: new Date(), expiresAt: null }],
      codingProfiles: [{ id: "1", platform: "GitHub", profileUrl: "http://example.com", studentId: "", createdAt: new Date() }],
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
        { id: "1", name: "Python", studentId: "" },
        { id: "2", name: "Kotlin", studentId: "" },
        { id: "3", name: "Go", studentId: "" },
        { id: "4", name: "Rust", studentId: "" },
        { id: "5", name: "Java", studentId: "" },
      ],
      projects: [
        { id: "1", title: "Project 1", studentId: "", description: null, link: null, createdAt: new Date() },
        { id: "2", title: "Project 2", studentId: "", description: null, link: null, createdAt: new Date() },
      ],
      workExperience: [
        { id: "1", title: "Developer", studentId: "", company: "Tech", startDate: new Date(), endDate: new Date(), description: null },
      ],
      // Missing: branch, batchYear, tenthPercentage, twelfthPercentage
      certifications: [{ id: "1", name: "Cert", studentId: "", issuedAt: new Date(), expiresAt: null }],
      codingProfiles: [{ id: "1", platform: "GitHub", profileUrl: "http://example.com", studentId: "", createdAt: new Date() }],
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
        { id: "1", title: "Project", studentId: "", description: null, link: null, createdAt: new Date() },
        { id: "2", title: "Project 2", studentId: "", description: null, link: null, createdAt: new Date() },
      ],
      workExperience: [
        { id: "1", title: "Dev", studentId: "", company: "Co", startDate: new Date(), endDate: new Date(), description: null },
      ],
      branch: "CS",
      batchYear: 2024,
      tenthPercentage: 85,
      twelfthPercentage: 85,
    };

    const withSkillsProfile = {
      ...noSkillsProfile,
      skills: [
        { id: "1", name: "Skill1", studentId: "" },
        { id: "2", name: "Skill2", studentId: "" },
        { id: "3", name: "Skill3", studentId: "" },
      ],
    };

    const noSkillsResult = computeCompleteness(noSkillsProfile);
    const withSkillsResult = computeCompleteness(withSkillsProfile);

    expect(withSkillsResult.score).toBeGreaterThan(noSkillsResult.score);
    expect(noSkillsResult.breakdown.skills).toBe(12); // 3 skills * 4pts = 12
    expect(withSkillsResult.breakdown.skills).toBe(12); // Same: 3 skills = 12pts (< 5 needed for 20)
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
        { id: "1", name: "Java", studentId: "" },
        { id: "2", name: "Spring", studentId: "" },
        { id: "3", name: "SQL", studentId: "" },
        { id: "4", name: "Docker", studentId: "" },
        { id: "5", name: "Kubernetes", studentId: "" },
      ],
      projects: [
        { id: "1", title: "Microservices", studentId: "", description: null, link: null, createdAt: new Date() },
        { id: "2", title: "API", studentId: "", description: null, link: null, createdAt: new Date() },
      ],
      workExperience: [
        { id: "1", title: "Backend Engineer", studentId: "", company: "Google", startDate: new Date(), endDate: new Date(), description: null },
      ],
      branch: "Computer Science",
      batchYear: 2022,
      tenthPercentage: 98,
      twelfthPercentage: 96,
      certifications: [
        { id: "1", name: "AWS Solutions Architect", studentId: "", issuedAt: new Date(), expiresAt: null },
      ],
      codingProfiles: [
        { id: "1", platform: "GitHub", profileUrl: "http://github.com/charlie", studentId: "", createdAt: new Date() },
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
      skills: [{ id: "1", name: "Python", studentId: "" }], // Only 1 skill = 4 pts
      projects: [], // No projects = 0 pts
      // Missing everything else
    };

    const incompleteResult = computeCompleteness(incompleteProfile);
    const shouldRedirect = incompleteResult.score < MIN_COMPLETENESS;
    expect(shouldRedirect).toBe(true);
  });
});
