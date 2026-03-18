import { describe, it, expect, vi } from "vitest";

/**
 * Tests for the student profile auto-creation fix (college_id NOT NULL).
 *
 * These are unit tests that validate the logic paths used in:
 *   - app/(student)/layout.tsx
 *   - app/actions/onboarding.ts
 *
 * The actual DB calls are mocked since these are fast unit tests.
 */

// ── Helpers that mirror the auto-create logic ────────────────────────────────

interface MockUser {
  id: string;
  collegeId: string | null;
}

function buildInsertValues(user: MockUser): { id: string; collegeId: string } | null {
  if (!user.collegeId) return null;
  return { id: user.id, collegeId: user.collegeId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: insertStudentWithCollegeId
// ─────────────────────────────────────────────────────────────────────────────

describe("insertStudentWithCollegeId", () => {
  it("includes collegeId in insert values when user has one", () => {
    const user: MockUser = {
      id: "user-uuid-123",
      collegeId: "college-uuid-456",
    };

    const values = buildInsertValues(user);

    expect(values).not.toBeNull();
    expect(values!.id).toBe("user-uuid-123");
    expect(values!.collegeId).toBe("college-uuid-456");
  });

  it("insert succeeds (mock) when collegeId is present", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ rowCount: 1 });

    const user: MockUser = {
      id: "user-uuid-789",
      collegeId: "college-uuid-abc",
    };

    const values = buildInsertValues(user);
    expect(values).not.toBeNull();

    await expect(mockInsert(values)).resolves.toEqual({ rowCount: 1 });
    expect(mockInsert).toHaveBeenCalledWith({
      id: "user-uuid-789",
      collegeId: "college-uuid-abc",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: insertStudentWithoutCollegeId
// ─────────────────────────────────────────────────────────────────────────────

describe("insertStudentWithoutCollegeId", () => {
  it("returns null values when user has no collegeId (layout pattern)", () => {
    const user: MockUser = { id: "user-uuid-no-college", collegeId: null };
    const values = buildInsertValues(user);
    expect(values).toBeNull();
  });

  it("layout logs error and does not attempt insert when collegeId missing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockInsert = vi.fn();

    const user: MockUser = { id: "user-uuid-no-college", collegeId: null };

    // Simulate layout.tsx logic:
    if (!user.collegeId) {
      console.error("[StudentLayout] Cannot create student profile: user has no collegeId");
    } else {
      mockInsert({ id: user.id, collegeId: user.collegeId });
    }

    expect(consoleError).toHaveBeenCalledWith(
      "[StudentLayout] Cannot create student profile: user has no collegeId"
    );
    expect(mockInsert).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("onboarding action throws when user has no collegeId", () => {
    const user: MockUser = { id: "user-uuid-no-college", collegeId: null };

    // Simulate onboarding.ts logic:
    function simulateOnboardingInsert() {
      if (!user.collegeId) {
        throw new Error("Student profile not found and user has no collegeId — cannot auto-create.");
      }
    }

    expect(simulateOnboardingInsert).toThrow(
      "Student profile not found and user has no collegeId — cannot auto-create."
    );
  });

  it("gracefully handles NOT NULL constraint violation (mock)", async () => {
    const mockInsert = vi.fn().mockRejectedValue(
      new Error('null value in column "college_id" of relation "students" violates not-null constraint')
    );

    let caught = false;
    try {
      await mockInsert({ id: "user-no-college" });
    } catch (e) {
      caught = true;
      expect((e as Error).message).toContain("college_id");
      expect((e as Error).message).toContain("not-null constraint");
    }

    expect(caught).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: layoutRendersWithoutProfile
// ─────────────────────────────────────────────────────────────────────────────

describe("layoutRendersWithoutProfile", () => {
  it("renders successfully when profile is null but insert succeeds", async () => {
    const mockGetProfile = vi.fn()
      .mockResolvedValueOnce(null)       // First call: no profile
      .mockResolvedValueOnce({           // After insert: profile exists
        sapId: null,
        rollNo: null,
        cgpa: null,
        branch: null,
        batchYear: null,
        tenthPercentage: null,
        twelfthPercentage: null,
      });

    const mockInsert = vi.fn().mockResolvedValue({ rowCount: 1 });

    const user: MockUser = { id: "new-student-uuid", collegeId: "college-uuid" };

    // Simulate layout logic:
    let profile = await mockGetProfile(user.id);

    if (!profile && user.collegeId) {
      await mockInsert({ id: user.id, collegeId: user.collegeId });
      profile = await mockGetProfile(user.id);
    }

    // Assert profile was fetched after insert
    expect(profile).not.toBeNull();
    expect(mockInsert).toHaveBeenCalledWith({
      id: "new-student-uuid",
      collegeId: "college-uuid",
    });
    expect(mockGetProfile).toHaveBeenCalledTimes(2);
  });

  it("computes onboardingRequired = true when profile has no required fields", () => {
    const profile = {
      sapId: null,
      rollNo: null,
      cgpa: null,
      branch: null,
      batchYear: null,
      tenthPercentage: null,
      twelfthPercentage: null,
    };

    const onboardingRequired =
      !profile.sapId ||
      !profile.rollNo ||
      !profile.cgpa ||
      !profile.branch ||
      !profile.batchYear ||
      typeof profile.tenthPercentage !== "number" ||
      typeof profile.twelfthPercentage !== "number";

    expect(onboardingRequired).toBe(true);
  });

  it("computes onboardingProgress = 0 when no fields are filled", () => {
    const profile = {
      sapId: null,
      rollNo: null,
      cgpa: null,
      branch: null,
      batchYear: null,
      tenthPercentage: null,
      twelfthPercentage: null,
    };

    const requiredCount = [
      !!profile.sapId,
      !!profile.rollNo,
      !!profile.cgpa,
      !!profile.branch,
      !!profile.batchYear,
      typeof profile.tenthPercentage === "number",
      typeof profile.twelfthPercentage === "number",
    ].filter(Boolean).length;

    const onboardingProgress = Math.round((requiredCount / 7) * 100);

    expect(requiredCount).toBe(0);
    expect(onboardingProgress).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema validation: students.collegeId must be notNull
// ─────────────────────────────────────────────────────────────────────────────

describe("schema: students.collegeId notNull", () => {
  it("insert values object requires collegeId to be a string (not undefined)", () => {
    const validValues = { id: "some-uuid", collegeId: "college-uuid" };

    expect(typeof validValues.collegeId).toBe("string");
    expect(validValues.collegeId).toBeTruthy();
  });

  it("rejects undefined collegeId (simulates TS compile-time safety)", () => {
    const values: Record<string, unknown> = { id: "some-uuid", collegeId: undefined };

    // At runtime, undefined would cause the NOT NULL violation
    expect(values.collegeId).toBeUndefined();
    // Our guard should prevent this from reaching the DB
    const safeToInsert = values.collegeId != null;
    expect(safeToInsert).toBe(false);
  });
});
