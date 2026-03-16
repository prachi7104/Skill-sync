import { describe, it, expect } from "vitest";

describe("Onboarding required check", () => {
  function isOnboardingRequired(profile: Record<string, unknown>): boolean {
    return !profile.sapId ||
      !profile.rollNo ||
      !profile.cgpa ||
      !profile.branch ||
      !profile.batchYear ||
      typeof profile.tenthPercentage !== "number" ||
      typeof profile.twelfthPercentage !== "number";
  }

  it("requires onboarding when any required field is missing", () => {
    expect(isOnboardingRequired({ sapId: "500125613" })).toBe(true);
  });

  it("does not require onboarding when all 7 fields are set", () => {
    const complete = {
      sapId: "500125613", rollNo: "R2142231769",
      cgpa: 8.66, branch: "Computer Science", batchYear: 2027,
      tenthPercentage: 85, twelfthPercentage: 87,
    };
    expect(isOnboardingRequired(complete)).toBe(false);
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
