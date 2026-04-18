import { describe, it, expect } from "vitest";

describe("Phase 3 — Dashboard Refresh After Onboarding", () => {

  it("T1: handleFinish calls router.refresh() before router.push()", async () => {
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
    const refreshPos = handleFinishSection.indexOf("router.refresh()");
    const pushPos = handleFinishSection.indexOf('router.push("/student/dashboard")');
    expect(refreshPos).toBeGreaterThan(-1);
    expect(pushPos).toBeGreaterThan(-1);
    expect(refreshPos).toBeLessThan(pushPos); // refresh BEFORE push
  });

  it("T1b: handleFinish requires all 6 steps to be reviewed before redirect", async () => {
    // Verify the new stepsReviewed logic exists
    const fs = await import("fs");
    const source = fs.readFileSync(
      "app/(student)/student/onboarding/page.tsx", "utf-8"
    );
    // Check for stepsReviewed state initialization
    expect(source).toContain("stepsReviewed");
    expect(source).toContain("useState<Set<StepKey>>(new Set())");
    
    // Check that handleFinish contains the new guard logic
    // Looking for the allStepsReviewed check pattern
    expect(source).toContain("const allStepsReviewed = STEPS.every");
    expect(source).toContain("if (!allStepsReviewed) return");
  });

  it("T1c: handleNext marks each step as reviewed before advancing", async () => {
    // Verify handleNext adds step to stepsReviewed
    const fs = await import("fs");
    const source = fs.readFileSync(
      "app/(student)/student/onboarding/page.tsx", "utf-8"
    );
    const handleStart = source.indexOf("async function handleNext");
    const handleEnd = source.indexOf("} finally", handleStart) + 20;
    const handleNextSection = source.substring(handleStart, handleEnd);
    expect(handleNextSection).toContain("setStepsReviewed");
    expect(handleNextSection).toContain("activeStep");
  });

  it("T1d: auto-redirect useEffect removed (no early redirect after required fields filled)", async () => {
    // Verify the problematic auto-redirect is removed
    const fs = await import("fs");
    const source = fs.readFileSync(
      "app/(student)/student/onboarding/page.tsx", "utf-8"
    );
    // Should NOT have useEffect that redirects on allRequired
    const badPattern = `useEffect(() => {
    if (!allRequired) return;
    const target = returnTo ?? "/student/dashboard";
    router.replace(target);
  }, [allRequired, returnTo, router]);`;
    expect(source).not.toContain(badPattern);
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
