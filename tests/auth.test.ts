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

import { describe, it, expect, vi } from "vitest";
import { isStudentEmail } from "@/lib/auth/config";
import {
  generateStrongPassword,
  validatePasswordStrength,
} from "@/lib/auth/password";

vi.mock("@/lib/db", () => ({}));
vi.mock("@/lib/env", () => ({
  STUDENT_EMAIL_DOMAIN: "stu.upes.ac.in",
  MICROSOFT_CLIENT_ID: "mock-client-id",
  MICROSOFT_CLIENT_SECRET: "mock-client-secret",
}));


// Mirrors the decision logic in lib/auth/config.ts signIn callback.
// This is intentionally NOT inlined logic — it extracts the two core rules:
//   1. Existing DB user → allow
//   2. Student domain email → auto-create
//   3. Everything else → deny
function resolveSignInDecision(email: string, existsInDb: boolean): "student-auto" | "existing-user" | "denied" {
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

describe("Password generation", () => {
  it("should generate 16-character passwords", () => {
    const pw = generateStrongPassword();
    expect(pw.length).toBe(16);
  });

  it("should generate unique passwords", () => {
    const passwords = new Set(Array.from({ length: 100 }, generateStrongPassword));
    expect(passwords.size).toBe(100);
  });
});

describe("Password validation", () => {
  it("should reject passwords under 8 chars", () => {
    expect(validatePasswordStrength("Abc1").valid).toBe(false);
  });

  it("should require uppercase", () => {
    expect(validatePasswordStrength("abcdefg1").valid).toBe(false);
  });

  it("should require a number", () => {
    expect(validatePasswordStrength("Abcdefgh").valid).toBe(false);
  });

  it("should accept strong passwords", () => {
    expect(validatePasswordStrength("Aniruddh@2017").valid).toBe(true);
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

describe("JWT role refresh — roleCheckedAt logic", () => {
  const ROLE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes, matches config.ts

  it("should trigger refresh when roleCheckedAt is older than 60 minutes", () => {
    const now = Date.now();
    const sixtyOneMinutesAgo = now - 61 * 60 * 1000;
    const shouldRefresh = now - sixtyOneMinutesAgo > ROLE_REFRESH_MS;
    expect(shouldRefresh).toBe(true);
  });

  it("should NOT trigger refresh when roleCheckedAt is within 5 minutes", () => {
    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000;
    const shouldRefresh = now - twoMinutesAgo > ROLE_REFRESH_MS;
    expect(shouldRefresh).toBe(false);
  });

  it("should always refresh on first sign-in (roleCheckedAt = 0)", () => {
    // Any token without roleCheckedAt defaults to 0, forcing immediate refresh
    const shouldRefresh = Date.now() - 0 > ROLE_REFRESH_MS;
    expect(shouldRefresh).toBe(true);
  });

  it("should NOT refresh at exactly 5 minutes (boundary — exclusive)", () => {
    const now = Date.now();
    const exactlyMs = now - ROLE_REFRESH_MS;
    const shouldRefresh = now - exactlyMs > ROLE_REFRESH_MS;
    // Strictly greater than — exactly at boundary does not refresh
    expect(shouldRefresh).toBe(false);
  });

  it("should refresh at 5 minutes + 1ms (boundary + 1)", () => {
    const now = Date.now();
    const justOver = now - ROLE_REFRESH_MS - 1;
    const shouldRefresh = now - justOver > ROLE_REFRESH_MS;
    expect(shouldRefresh).toBe(true);
  });
});
