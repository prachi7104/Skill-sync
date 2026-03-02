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

function isStudentEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return domain === STUDENT_EMAIL_DOMAIN;
}

/**
 * Simulates the sign-in decision logic from lib/auth/config.ts.
 * Returns: "student-auto" | "existing-user" | "denied"
 */
function resolveSignInDecision(
  email: string,
  existsInDb: boolean,
): "student-auto" | "existing-user" | "denied" {
  if (existsInDb) return "existing-user";
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

  // ── Faculty email domains (should all return false) ─────────────────────

  it("should return false for @outlook.com", () => {
    expect(isStudentEmail("faculty@outlook.com")).toBe(false);
  });

  it("should return false for @hotmail.com", () => {
    expect(isStudentEmail("faculty@hotmail.com")).toBe(false);
  });

  it("should return false for @upes.ac.in (non-student UPES domain)", () => {
    expect(isStudentEmail("admin@upes.ac.in")).toBe(false);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("should handle fully uppercase input (case insensitive)", () => {
    expect(isStudentEmail("JOHN@STU.UPES.AC.IN")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(isStudentEmail("")).toBe(false);
  });
});

describe("Auth — sign-in decision logic", () => {
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
  });
});
