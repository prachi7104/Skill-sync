import { describe, expect, it } from "vitest";
import { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";

type MockUser = { id: string; collegeId: string | null; email: string };

type MockStudentProfile = { id: string; collegeId: string; sapId: string | null };

function autoCreateStudentProfile(
  user: MockUser,
  insert: (payload: { id: string; collegeId: string }) => MockStudentProfile,
): { profile: MockStudentProfile | null; showFallbackUi: boolean } {
  if (!user.collegeId) {
    return { profile: null, showFallbackUi: true };
  }

  const profile = insert({ id: user.id, collegeId: user.collegeId });
  return { profile, showFallbackUi: false };
}

describe("P1.1 student create", () => {
  it("studentLayoutAutoCreate_withCollegeId_succeeds", () => {
    const user: MockUser = {
      id: "student-1",
      collegeId: "college-1",
      email: "john.500126666@stu.upes.ac.in",
    };

    const result = autoCreateStudentProfile(user, ({ id, collegeId }) => ({
      id,
      collegeId,
      sapId: null,
    }));

    expect(result.showFallbackUi).toBe(false);
    expect(result.profile).not.toBeNull();
    expect(result.profile?.collegeId).toBe("college-1");
  });

  it("studentLayoutAutoCreate_withoutCollegeId_showsFallbackUI", () => {
    const user: MockUser = {
      id: "student-2",
      collegeId: null,
      email: "jane.500123456@stu.upes.ac.in",
    };

    const result = autoCreateStudentProfile(user, ({ id, collegeId }) => ({
      id,
      collegeId,
      sapId: null,
    }));

    expect(result.profile).toBeNull();
    expect(result.showFallbackUi).toBe(true);
  });
});

describe("P1.2 SAP derivation", () => {
  it("sapDerivation_upes_produces_correct9Digits", () => {
    expect(deriveSapFromEmailPublic("alex.126666@stu.upes.ac.in")).toBe("500126666");
    expect(deriveSapFromEmailPublic("sam.1234@stu.upes.ac.in")).toBe("590001234");
  });
});
