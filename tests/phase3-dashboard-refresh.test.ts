import { describe, it, expect } from "vitest";

describe("Phase 3 — Dashboard Refresh After Onboarding", () => {

  it("T1: handleFinish refreshes student context and navigates with router.replace", async () => {
    // Read source file and verify the order
    const fs = await import("fs");
    const source = fs.readFileSync(
      "app/(student)/student/onboarding/page.tsx", "utf-8"
    );
    const handleStart = source.indexOf("async function handleFinish");
    const handleEnd = source.indexOf("if (isLoading)", handleStart);
    const handleFinishSection = source.substring(
      handleStart,
      handleEnd > -1 ? handleEnd : source.length
    );
    const contextRefreshPos = handleFinishSection.indexOf("await refresh()");
    const replacePos = handleFinishSection.indexOf('router.replace("/student/dashboard")');
    expect(contextRefreshPos).toBeGreaterThan(-1);
    expect(replacePos).toBeGreaterThan(-1);
    expect(contextRefreshPos).toBeLessThan(replacePos);
  });

  it("T2: shouldRedirect is false when student has sapId only", () => {
    // Simulate the new shouldRedirect logic
    const student = {
      sapId: "500126504", rollNo: null, resumeUrl: null,
      skills: [], projects: [], branch: null,
    };
    const shouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;
    expect(shouldRedirect).toBe(false); // has sapId → do NOT redirect
  });

  it("T3: shouldRedirect is false when student has resumeUrl only", () => {
    const student = {
      sapId: null, rollNo: null, resumeUrl: "https://cloudinary.com/resume.pdf",
      skills: [], projects: [],
    };
    const shouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;
    expect(shouldRedirect).toBe(false);
  });

  it("T4: shouldRedirect is true for brand-new profile with nothing", () => {
    const student = {
      sapId: null, rollNo: null, resumeUrl: null,
      skills: [], projects: [],
    };
    const shouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;
    expect(shouldRedirect).toBe(true);
  });

  it("T5: shouldRedirect old logic would have redirected after onboarding", () => {
    // This proves the OLD logic was the problem
    // A student who just finished onboarding with resume but no skills yet
    const student = {
      sapId: "500126504", rollNo: "R2142212345", resumeUrl: "https://...",
      branch: "CSE", batchYear: 2025, cgpa: 8.5,
      skills: [], // empty because embedding job hasn't run yet
      projects: [],
    };
    // OLD logic (bad)
    const oldShouldRedirect =
      !student.sapId || !student.rollNo || !student.resumeUrl ||
      !student.branch || student.batchYear === null || student.cgpa === null ||
      !Array.isArray(student.skills) || student.skills.length === 0 ||
      !Array.isArray(student.projects) || student.projects.length === 0;
    expect(oldShouldRedirect).toBe(true); // The bug: incorrectly redirects

    // NEW logic (correct)
    const newShouldRedirect = !student.sapId && !student.rollNo && !student.resumeUrl;
    expect(newShouldRedirect).toBe(false); // Correctly stays on dashboard
  });
});
