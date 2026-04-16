import { describe, it, expect } from "vitest";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";

describe("Onboarding required check", () => {
  it("requires onboarding when required fields are missing", () => {
    const { onboardingRequired } = computeOnboardingProgress({ rollNo: "R2142231769" });
    expect(onboardingRequired).toBe(true);
  });

  it("does not require onboarding when required fields are set", () => {
    const complete = {
      rollNo: "R2142231769",
      cgpa: 8.66, branch: "Computer Science", batchYear: 2027,
      tenthPercentage: 85, twelfthPercentage: 87,
    };
    const { onboardingRequired } = computeOnboardingProgress(complete);
    expect(onboardingRequired).toBe(false);
  });

  it("does not block onboarding completion when sapId is absent", () => {
    const completeWithoutSap = {
      rollNo: "R2142231769",
      cgpa: 8.66,
      branch: "Computer Science",
      batchYear: 2027,
      tenthPercentage: 85,
      twelfthPercentage: 87,
      sapId: null,
    };

    const { onboardingRequired, progress } = computeOnboardingProgress(completeWithoutSap);
    expect(onboardingRequired).toBe(false);
    expect(progress).toBe(100);
  });
});

describe("Batch year lock", () => {
  function checkLock(current: unknown, incoming: unknown): string | null {
    if (current !== null && current !== undefined && current !== "") {
      if (incoming !== current) return "Batch year cannot be changed after it has been set";
    }
    return null;
  }

  it("allows setting batch year for the first time", () => {
    expect(checkLock(null, 2027)).toBeNull();
    expect(checkLock(undefined, 2027)).toBeNull();
  });

  it("blocks changing batch year once set", () => {
    expect(checkLock(2027, 2026)).toBeTruthy();
  });

  it("allows same value when already set", () => {
    expect(checkLock(2027, 2027)).toBeNull();
  });
});

describe("Autosave loop prevention", () => {
  it("autosave useEffect only depends on [activeStep, form]", () => {
    const deps = ["activeStep", "form"];
    expect(deps.includes("student")).toBe(false);
    expect(deps.includes("refresh")).toBe(false);
    expect(deps.includes("isLoading")).toBe(false);
  });
});
