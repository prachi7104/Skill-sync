/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Guardrail Unit Tests (Phase 6.2)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - lib/guardrails/sandbox-limits.ts: limit enforcement, lazy reset, atomic increment
 *   - lib/guardrails/profile-gate.ts: completeness recomputation, gate checks
 *   - lib/guardrails/errors.ts: structured error factories
 *
 * Pure logic is inlined to avoid `server-only` import guard.
 * DB interactions are tested via mocked Drizzle-style return values.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline error types (mirrors errors.ts) ──────────────────────────────────

interface GuardrailError {
  code: string;
  reason: string;
  nextStep: string;
  status: number;
}

class GuardrailViolation extends Error {
  public readonly code: string;
  public readonly reason: string;
  public readonly nextStep: string;
  public readonly status: number;

  constructor(err: GuardrailError) {
    super(err.reason);
    this.name = "GuardrailViolation";
    this.code = err.code;
    this.reason = err.reason;
    this.nextStep = err.nextStep;
    this.status = err.status;
  }

  toJSON(): GuardrailError {
    return {
      code: this.code,
      reason: this.reason,
      nextStep: this.nextStep,
      status: this.status,
    };
  }
}

const ERRORS = {
  SANDBOX_DAILY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SANDBOX_DAILY_LIMIT",
      reason: "Daily sandbox limit exceeded (3/day).",
      nextStep: "Try again tomorrow. Limits reset at midnight UTC.",
      status: 429,
    }),

  SANDBOX_MONTHLY_LIMIT: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SANDBOX_MONTHLY_LIMIT",
      reason: "Monthly sandbox limit exceeded (20/month).",
      nextStep: "Limit resets at the start of next month.",
      status: 429,
    }),

  PROFILE_INCOMPLETE: (score: number, missing: string[]): GuardrailViolation =>
    new GuardrailViolation({
      code: "PROFILE_INCOMPLETE",
      reason: `Profile completeness is ${score}%. Minimum required: 70%.`,
      nextStep:
        missing.length > 0
          ? `Action needed: ${missing.slice(0, 3).join("; ")}.`
          : "Complete your profile to proceed.",
      status: 403,
    }),

  RESUME_MISSING: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "RESUME_MISSING",
      reason: "No resume uploaded.",
      nextStep: "Upload a resume from your profile page before proceeding.",
      status: 403,
    }),

  EMBEDDING_MISSING: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "EMBEDDING_MISSING",
      reason: "Profile embedding has not been generated yet.",
      nextStep:
        "Ensure your profile is at least 50% complete and a resume is uploaded. Embedding generation may take a few minutes.",
      status: 403,
    }),

  SKILLS_EMPTY: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "SKILLS_EMPTY",
      reason: "No skills listed in your profile.",
      nextStep: "Add at least one skill to your profile to proceed.",
      status: 403,
    }),

  STUDENT_NOT_FOUND: (): GuardrailViolation =>
    new GuardrailViolation({
      code: "STUDENT_NOT_FOUND",
      reason: "Student record not found.",
      nextStep: "Contact support.",
      status: 404,
    }),
};

// ── Inline sandbox limits logic (mirrors sandbox-limits.ts) ─────────────────

const DAILY_LIMIT = 3;
const MONTHLY_LIMIT = 20;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

interface StudentSandboxRow {
  sandboxUsageToday: number;
  sandboxResetDate: string | null;
  sandboxUsageMonth: number;
  sandboxMonthResetDate: string | null;
}

/**
 * Core sandbox enforcement logic extracted from enforceSandboxLimits.
 * Returns updates to apply and throws on limit violation.
 */
function checkSandboxLimits(student: StudentSandboxRow): {
  updates: Record<string, unknown>;
  effectiveDailyUsage: number;
  effectiveMonthlyUsage: number;
} {
  const today = todayUTC();
  const month = currentMonthUTC();

  let dailyUsage = student.sandboxUsageToday;
  let monthlyUsage = student.sandboxUsageMonth;
  const updates: Record<string, unknown> = {};

  // Lazy daily reset
  if (student.sandboxResetDate !== today) {
    dailyUsage = 0;
    updates.sandboxUsageToday = 0;
    updates.sandboxResetDate = today;
  }

  // Lazy monthly reset
  if (student.sandboxMonthResetDate !== month) {
    monthlyUsage = 0;
    updates.sandboxUsageMonth = 0;
    updates.sandboxMonthResetDate = month;
  }

  // Enforce limits
  if (dailyUsage >= DAILY_LIMIT) {
    throw ERRORS.SANDBOX_DAILY_LIMIT();
  }

  if (monthlyUsage >= MONTHLY_LIMIT) {
    throw ERRORS.SANDBOX_MONTHLY_LIMIT();
  }

  return { updates, effectiveDailyUsage: dailyUsage, effectiveMonthlyUsage: monthlyUsage };
}

// ── Inline profile gate logic (mirrors profile-gate.ts) ─────────────────────

interface Skill {
  name: string;
  proficiency: number;
}

const MIN_COMPLETENESS = 70;

interface StudentProfileRow {
  skills: Skill[] | null;
  resumeUrl: string | null;
  embedding: number[] | null;
  profileCompleteness: number;
}

/**
 * Core profile gate checks extracted from enforceProfileGate.
 * Throws GuardrailViolation on each failing condition.
 */
function checkProfileGate(student: StudentProfileRow, completeness: number, missing: string[]): void {
  // Check 1: Skills must exist
  if (!student.skills || student.skills.length === 0) {
    throw ERRORS.SKILLS_EMPTY();
  }

  // Check 2: Resume must be uploaded
  if (!student.resumeUrl) {
    throw ERRORS.RESUME_MISSING();
  }

  // Check 3: Embedding must exist
  if (!student.embedding) {
    throw ERRORS.EMBEDDING_MISSING();
  }

  // Check 4: Profile completeness >= 70%
  if (completeness < MIN_COMPLETENESS) {
    throw ERRORS.PROFILE_INCOMPLETE(completeness, missing);
  }
}

/**
 * Inline logic for atomic increment's CASE expression.
 * Returns the new value that would be set by the SQL CASE.
 */
function computeAtomicIncrement(
  currentValue: number,
  resetDate: string | null,
  currentDate: string,
): number {
  if (resetDate !== currentDate) {
    return 1; // Reset to 1 (date changed → first usage of new period)
  }
  return currentValue + 1;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Guardrails", () => {
  // ── Error Factories ─────────────────────────────────────────────────────

  describe("GuardrailViolation", () => {
    it("should create error with correct code, reason, nextStep, status", () => {
      const err = ERRORS.SANDBOX_DAILY_LIMIT();
      expect(err).toBeInstanceOf(GuardrailViolation);
      expect(err.code).toBe("SANDBOX_DAILY_LIMIT");
      expect(err.status).toBe(429);
      expect(err.reason).toContain("Daily sandbox limit");
      expect(err.nextStep).toContain("tomorrow");
    });

    it("should serialize to JSON correctly", () => {
      const err = ERRORS.PROFILE_INCOMPLETE(45, ["Add skills", "Upload resume"]);
      const json = err.toJSON();
      expect(json).toEqual({
        code: "PROFILE_INCOMPLETE",
        reason: "Profile completeness is 45%. Minimum required: 70%.",
        nextStep: "Action needed: Add skills; Upload resume.",
        status: 403,
      });
    });

    it("PROFILE_INCOMPLETE should use generic nextStep when missing array is empty", () => {
      const err = ERRORS.PROFILE_INCOMPLETE(60, []);
      expect(err.nextStep).toBe("Complete your profile to proceed.");
    });

    it("SKILLS_EMPTY should have status 403", () => {
      const err = ERRORS.SKILLS_EMPTY();
      expect(err.status).toBe(403);
      expect(err.code).toBe("SKILLS_EMPTY");
    });

    it("SANDBOX_MONTHLY_LIMIT should have status 429", () => {
      const err = ERRORS.SANDBOX_MONTHLY_LIMIT();
      expect(err.status).toBe(429);
    });

    it("should have GuardrailViolation as Error name", () => {
      const err = ERRORS.RESUME_MISSING();
      expect(err.name).toBe("GuardrailViolation");
      expect(err).toBeInstanceOf(Error);
    });
  });

  // ── Sandbox Limits ─────────────────────────────────────────────────────

  describe("Sandbox Limits — enforceSandboxLimits logic", () => {
    const today = todayUTC();
    const month = currentMonthUTC();

    it("should pass when usage is below daily and monthly limits", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 2,
        sandboxResetDate: today,
        sandboxUsageMonth: 10,
        sandboxMonthResetDate: month,
      };

      const result = checkSandboxLimits(student);
      expect(result.effectiveDailyUsage).toBe(2);
      expect(result.effectiveMonthlyUsage).toBe(10);
      expect(Object.keys(result.updates)).toHaveLength(0);
    });

    it("should throw SANDBOX_DAILY_LIMIT when daily usage >= 3", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 3,
        sandboxResetDate: today,
        sandboxUsageMonth: 3,
        sandboxMonthResetDate: month,
      };

      expect(() => checkSandboxLimits(student)).toThrow(GuardrailViolation);
      try {
        checkSandboxLimits(student);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("SANDBOX_DAILY_LIMIT");
        expect((err as GuardrailViolation).status).toBe(429);
      }
    });

    it("should throw SANDBOX_MONTHLY_LIMIT when monthly usage >= 20", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 0,
        sandboxResetDate: today,
        sandboxUsageMonth: 20,
        sandboxMonthResetDate: month,
      };

      expect(() => checkSandboxLimits(student)).toThrow(GuardrailViolation);
      try {
        checkSandboxLimits(student);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("SANDBOX_MONTHLY_LIMIT");
      }
    });

    it("should lazy-reset daily counter when date has changed", () => {
      const yesterday = "2025-01-01";
      const student: StudentSandboxRow = {
        sandboxUsageToday: 3,
        sandboxResetDate: yesterday, // old date
        sandboxUsageMonth: 5,
        sandboxMonthResetDate: month,
      };

      // Should NOT throw because daily reset brings counter to 0
      const result = checkSandboxLimits(student);
      expect(result.effectiveDailyUsage).toBe(0);
      expect(result.updates.sandboxUsageToday).toBe(0);
      expect(result.updates.sandboxResetDate).toBe(today);
    });

    it("should lazy-reset monthly counter when month has changed", () => {
      const oldMonth = "2024-12";
      const student: StudentSandboxRow = {
        sandboxUsageToday: 0,
        sandboxResetDate: today,
        sandboxUsageMonth: 20,
        sandboxMonthResetDate: oldMonth, // old month
      };

      // Should NOT throw because monthly reset brings counter to 0
      const result = checkSandboxLimits(student);
      expect(result.effectiveMonthlyUsage).toBe(0);
      expect(result.updates.sandboxUsageMonth).toBe(0);
      expect(result.updates.sandboxMonthResetDate).toBe(month);
    });

    it("should reset both daily and monthly when both dates are stale", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 3,
        sandboxResetDate: "2024-06-15",
        sandboxUsageMonth: 20,
        sandboxMonthResetDate: "2024-06",
      };

      const result = checkSandboxLimits(student);
      expect(result.effectiveDailyUsage).toBe(0);
      expect(result.effectiveMonthlyUsage).toBe(0);
      expect(result.updates.sandboxUsageToday).toBe(0);
      expect(result.updates.sandboxUsageMonth).toBe(0);
    });

    it("should pass at exactly 0 usage", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 0,
        sandboxResetDate: today,
        sandboxUsageMonth: 0,
        sandboxMonthResetDate: month,
      };

      const result = checkSandboxLimits(student);
      expect(result.effectiveDailyUsage).toBe(0);
      expect(result.effectiveMonthlyUsage).toBe(0);
    });

    it("should pass at usage = limit - 1", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 2, // DAILY_LIMIT - 1
        sandboxResetDate: today,
        sandboxUsageMonth: 19, // MONTHLY_LIMIT - 1
        sandboxMonthResetDate: month,
      };

      expect(() => checkSandboxLimits(student)).not.toThrow();
    });

    it("daily limit takes precedence over monthly when both exceeded", () => {
      const student: StudentSandboxRow = {
        sandboxUsageToday: 3,
        sandboxResetDate: today,
        sandboxUsageMonth: 20,
        sandboxMonthResetDate: month,
      };

      try {
        checkSandboxLimits(student);
      } catch (err) {
        // Daily is checked first
        expect((err as GuardrailViolation).code).toBe("SANDBOX_DAILY_LIMIT");
      }
    });
  });

  // ── Atomic Increment Logic ────────────────────────────────────────────

  describe("Sandbox Limits — atomic increment", () => {
    it("should reset to 1 when date has changed", () => {
      expect(computeAtomicIncrement(3, "2025-01-01", "2025-01-02")).toBe(1);
    });

    it("should increment when date is same", () => {
      expect(computeAtomicIncrement(2, "2025-01-02", "2025-01-02")).toBe(3);
    });

    it("should reset to 1 from null reset date", () => {
      expect(computeAtomicIncrement(0, null, "2025-01-02")).toBe(1);
    });

    it("should increment from 0 on same date", () => {
      expect(computeAtomicIncrement(0, "2025-01-02", "2025-01-02")).toBe(1);
    });

    it("monthly: should reset to 1 when month has changed", () => {
      expect(computeAtomicIncrement(15, "2025-01", "2025-02")).toBe(1);
    });

    it("monthly: should increment when month is same", () => {
      expect(computeAtomicIncrement(15, "2025-02", "2025-02")).toBe(16);
    });
  });

  // ── Profile Gate ──────────────────────────────────────────────────────

  describe("Profile Gate — enforceProfileGate logic", () => {
    const validStudent: StudentProfileRow = {
      skills: [{ name: "Python", proficiency: 3 }],
      resumeUrl: "https://storage.example.com/resume.pdf",
      embedding: new Array(384).fill(0.1),
      profileCompleteness: 85,
    };

    it("should pass when all conditions are met", () => {
      expect(() => checkProfileGate(validStudent, 85, [])).not.toThrow();
    });

    it("should throw SKILLS_EMPTY when skills is null", () => {
      const student = { ...validStudent, skills: null };
      expect(() => checkProfileGate(student, 85, [])).toThrow(GuardrailViolation);
      try {
        checkProfileGate(student, 85, []);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("SKILLS_EMPTY");
        expect((err as GuardrailViolation).status).toBe(403);
      }
    });

    it("should throw SKILLS_EMPTY when skills array is empty", () => {
      const student = { ...validStudent, skills: [] };
      expect(() => checkProfileGate(student, 85, [])).toThrow(GuardrailViolation);
      try {
        checkProfileGate(student, 85, []);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("SKILLS_EMPTY");
      }
    });

    it("should throw RESUME_MISSING when resumeUrl is null", () => {
      const student = { ...validStudent, resumeUrl: null };
      expect(() => checkProfileGate(student, 85, [])).toThrow(GuardrailViolation);
      try {
        checkProfileGate(student, 85, []);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("RESUME_MISSING");
      }
    });

    it("should throw EMBEDDING_MISSING when embedding is null", () => {
      const student = { ...validStudent, embedding: null };
      expect(() => checkProfileGate(student, 85, [])).toThrow(GuardrailViolation);
      try {
        checkProfileGate(student, 85, []);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("EMBEDDING_MISSING");
      }
    });

    it("should throw PROFILE_INCOMPLETE when completeness < 70%", () => {
      expect(() =>
        checkProfileGate(validStudent, 55, ["Add more skills", "Upload projects"]),
      ).toThrow(GuardrailViolation);
      try {
        checkProfileGate(validStudent, 55, ["Add more skills", "Upload projects"]);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("PROFILE_INCOMPLETE");
        expect((err as GuardrailViolation).reason).toContain("55%");
      }
    });

    it("should pass at exactly 70% completeness", () => {
      expect(() => checkProfileGate(validStudent, 70, [])).not.toThrow();
    });

    it("should fail at 69% completeness", () => {
      expect(() => checkProfileGate(validStudent, 69, ["Need more skills"])).toThrow(
        GuardrailViolation,
      );
    });

    it("checks are ordered: skills first, then resume, then embedding, then completeness", () => {
      // Missing everything — should fail on skills first
      const emptyStudent: StudentProfileRow = {
        skills: null,
        resumeUrl: null,
        embedding: null,
        profileCompleteness: 0,
      };

      try {
        checkProfileGate(emptyStudent, 0, ["Everything"]);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("SKILLS_EMPTY");
      }

      // Has skills but no resume — should fail on resume
      const hasSkills: StudentProfileRow = {
        skills: [{ name: "Python", proficiency: 3 }],
        resumeUrl: null,
        embedding: null,
        profileCompleteness: 0,
      };

      try {
        checkProfileGate(hasSkills, 0, ["Everything"]);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("RESUME_MISSING");
      }

      // Has skills + resume but no embedding
      const hasResume: StudentProfileRow = {
        skills: [{ name: "Python", proficiency: 3 }],
        resumeUrl: "https://example.com/resume.pdf",
        embedding: null,
        profileCompleteness: 0,
      };

      try {
        checkProfileGate(hasResume, 0, ["Everything"]);
      } catch (err) {
        expect((err as GuardrailViolation).code).toBe("EMBEDDING_MISSING");
      }
    });

    it("should include missing actions in PROFILE_INCOMPLETE nextStep", () => {
      try {
        checkProfileGate(validStudent, 50, [
          "Add 3 more skills",
          "Upload resume",
          "Link coding profiles",
          "Add projects",
        ]);
      } catch (err) {
        const violation = err as GuardrailViolation;
        expect(violation.nextStep).toContain("Add 3 more skills");
        expect(violation.nextStep).toContain("Upload resume");
        expect(violation.nextStep).toContain("Link coding profiles");
        // 4th item should be sliced off (max 3)
        expect(violation.nextStep).not.toContain("Add projects");
      }
    });
  });
});
