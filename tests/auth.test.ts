/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Auth Flow Tests (Updated)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - isStudentEmail(): domain-based student detection
 *   - Sign-in logic: students auto-create, faculty/admin must be in DB
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline isStudentEmail (mirrors lib/auth/config.ts) ──────────────────────

const STUDENT_EMAIL_DOMAIN = "stu.upes.ac.in";
const ADMIN_EMAIL = "admin@upes.ac.in";

function isStudentEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return domain === STUDENT_EMAIL_DOMAIN;
}

function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Simulates the sign-in decision logic from lib/auth/config.ts.
 * Returns: "admin-auto" | "student-auto" | "existing-user" | "denied"
 */
function resolveSignInDecision(
  email: string,
  existsInDb: boolean,
): "admin-auto" | "student-auto" | "existing-user" | "denied" {
  if (existsInDb) return "existing-user";
  if (isAdminEmail(email)) return "admin-auto";
  if (isStudentEmail(email)) return "student-auto";
  return "denied";
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Auth — isStudentEmail", () => {
  it("should return true for @stu.upes.ac.in domain", () => {
    expect(isStudentEmail("student123@stu.upes.ac.in")).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(isStudentEmail("Student@STU.UPES.AC.IN")).toBe(true);
  });

  it("should return false for non-student domains", () => {
    expect(isStudentEmail("prof@upes.ac.in")).toBe(false);
  });

  it("should return false for gmail", () => {
    expect(isStudentEmail("user@gmail.com")).toBe(false);
  });

  it("should not match subdomain of student domain", () => {
    expect(isStudentEmail("user@sub.stu.upes.ac.in")).toBe(false);
  });

  it("should not match a domain ending with same suffix", () => {
    expect(isStudentEmail("user@notstu.upes.ac.in")).toBe(false);
  });
});

describe("Auth — isAdminEmail", () => {
  it("should return true for the admin email", () => {
    expect(isAdminEmail("admin@upes.ac.in")).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(isAdminEmail("ADMIN@UPES.AC.IN")).toBe(true);
  });

  it("should return false for other emails", () => {
    expect(isAdminEmail("notadmin@upes.ac.in")).toBe(false);
  });
});

describe("Auth — sign-in decision logic", () => {
  describe("admin auto-creation", () => {
    it("should auto-create admin for admin email not in DB", () => {
      expect(
        resolveSignInDecision("admin@upes.ac.in", false),
      ).toBe("admin-auto");
    });

    it("should allow existing admin to sign in", () => {
      expect(
        resolveSignInDecision("admin@upes.ac.in", true),
      ).toBe("existing-user");
    });
  });

  describe("student auto-creation", () => {
    it("should auto-create student for @stu.upes.ac.in email not in DB", () => {
      expect(
        resolveSignInDecision("newstudent@stu.upes.ac.in", false),
      ).toBe("student-auto");
    });

    it("should allow existing student to sign in", () => {
      expect(
        resolveSignInDecision("existing@stu.upes.ac.in", true),
      ).toBe("existing-user");
    });
  });

  describe("faculty/admin — must be pre-registered", () => {
    it("should allow faculty/admin already in DB", () => {
      expect(
        resolveSignInDecision("prof@upes.ac.in", true),
      ).toBe("existing-user");
    });

    it("should deny non-student email not in DB", () => {
      expect(
        resolveSignInDecision("prof@upes.ac.in", false),
      ).toBe("denied");
    });

    it("should deny random email not in DB", () => {
      expect(
        resolveSignInDecision("random@gmail.com", false),
      ).toBe("denied");
    });
  });

  describe("edge cases", () => {
    it("should allow any existing DB user regardless of domain", () => {
      expect(resolveSignInDecision("admin@outlook.com", true)).toBe("existing-user");
    });

    it("should deny unknown external email", () => {
      expect(resolveSignInDecision("hacker@evil.com", false)).toBe("denied");
    });

    it("should handle case-insensitive student domain check", () => {
      expect(
        resolveSignInDecision("STUDENT@STU.UPES.AC.IN", false),
      ).toBe("student-auto");
    });

    it("should handle case-insensitive admin email check", () => {
      expect(
        resolveSignInDecision("ADMIN@UPES.AC.IN", false),
      ).toBe("admin-auto");
    });
  });
});

