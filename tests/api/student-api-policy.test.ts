import { describe, expect, it } from "vitest";
import {
  resolveStudentApiOnboardingPolicy,
  STUDENT_API_ONBOARDING_POLICY_MATRIX,
} from "@/lib/onboarding/api-policy";

describe("student API onboarding policy matrix", () => {
  it("allows onboarding-critical profile and resume endpoints during onboarding", () => {
    expect(resolveStudentApiOnboardingPolicy("/api/student/profile")).toBe(
      "allow-during-onboarding",
    );
    expect(resolveStudentApiOnboardingPolicy("/api/student/resume")).toBe(
      "allow-during-onboarding",
    );
    expect(
      resolveStudentApiOnboardingPolicy("/api/student/resume/preview"),
    ).toBe("allow-during-onboarding");
  });

  it("requires completed onboarding for workspace endpoints", () => {
    expect(resolveStudentApiOnboardingPolicy("/api/student/career-coach")).toBe(
      "require-complete",
    );
    expect(resolveStudentApiOnboardingPolicy("/api/student/drives")).toBe(
      "require-complete",
    );
    expect(resolveStudentApiOnboardingPolicy("/api/student/amcat")).toBe(
      "require-complete",
    );
  });

  it("keeps matrix sorted by specific prefixes first when resolving", () => {
    const profileMerge = resolveStudentApiOnboardingPolicy(
      "/api/student/profile/merge",
    );
    expect(profileMerge).toBe("allow-during-onboarding");

    const hasSpecificEntries = STUDENT_API_ONBOARDING_POLICY_MATRIX.some(
      (entry) => entry.prefix === "/api/student/profile/merge",
    );
    expect(hasSpecificEntries).toBe(true);
  });
});
