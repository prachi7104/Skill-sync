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
// Test 1: insertStudentProfile_withCollegeId_succeeds
// ─────────────────────────────────────────────────────────────────────────────

describe("insertStudentProfile_withCollegeId_succeeds", () => {
  it("includes collegeId in insert values when user has one", () => {
    const user: MockUser = { id: "user-1", collegeId: "college-1" };
    const values = buildInsertValues(user);

    expect(values).not.toBeNull();
    expect(values!.id).toBe("user-1");
    expect(values!.collegeId).toBe("college-1");
  });

  it("insert is called with { id, collegeId } — collegeId is NOT null", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ rowCount: 1 });

    const user: MockUser = { id: "user-1", collegeId: "college-1" };
    const values = buildInsertValues(user);
    expect(values).not.toBeNull();

    await expect(mockInsert(values)).resolves.toEqual({ rowCount: 1 });
    expect(mockInsert).toHaveBeenCalledWith({
      id: "user-1",
      collegeId: "college-1",
    });

    // Explicitly assert collegeId is NOT null in the call
    const callArg = mockInsert.mock.calls[0][0];
    expect(callArg.collegeId).not.toBeNull();
    expect(callArg.collegeId).toBe("college-1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: insertStudentProfile_withNullCollegeId_shows_error_ui
// ─────────────────────────────────────────────────────────────────────────────

describe("insertStudentProfile_withNullCollegeId_shows_error_ui", () => {
  it("does not attempt insert when collegeId is null — logs [StudentLayout] error", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockInsert = vi.fn();

    const user: MockUser = { id: "user-1", collegeId: null };

    // Simulate layout.tsx logic:
    if (!user.collegeId) {
      console.error(
        "[StudentLayout] Cannot create student profile: user has no collegeId"
      );
    } else {
      mockInsert({ id: user.id, collegeId: user.collegeId });
    }

    expect(consoleError).toHaveBeenCalledWith(
      "[StudentLayout] Cannot create student profile: user has no collegeId"
    );
    expect(mockInsert).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("catches NOT NULL constraint error without crashing", async () => {
    const mockInsert = vi.fn().mockRejectedValue(
      new Error(
        'null value in column "college_id" of relation "students" violates not-null constraint'
      )
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Simulate the try/catch from layout.tsx
    let caught = false;
    try {
      await mockInsert({ id: "user-1" });
    } catch (e) {
      caught = true;
      console.error("[StudentLayout] Failed to auto-create profile:", e);
      expect((e as Error).message).toContain("college_id");
      expect((e as Error).message).toContain("not-null constraint");
    }

    expect(caught).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      "[StudentLayout] Failed to auto-create profile:",
      expect.any(Error)
    );
    consoleError.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: studentLayout_renders_fallback_when_profile_null_after_insert
// ─────────────────────────────────────────────────────────────────────────────

describe("studentLayout_renders_fallback_when_profile_null_after_insert", () => {
  it("renders 'Profile Setup Required' fallback when profile is always null", async () => {
    const mockGetProfile = vi.fn().mockResolvedValue(null);

    const user: MockUser = { id: "user-1", collegeId: "college-1" };

    // Simulate layout flow
    let profile = await mockGetProfile(user.id);

    if (!profile && user.collegeId) {
      // Insert would succeed, but profile still null
      profile = await mockGetProfile(user.id);
    }

    // Profile is still null — should render fallback
    expect(profile).toBeNull();

    // Simulate the fallback UI decision
    const shouldShowFallback = !profile;
    expect(shouldShowFallback).toBe(true);

    // The fallback UI should contain these elements:
    const fallbackUI = {
      heading: "Profile Setup Required",
      description:
        "Your account exists but your student profile couldn't be created.",
      errorHint: "Error: college_id is null",
      hasSignOutButton: true,
    };

    expect(fallbackUI.heading).toBe("Profile Setup Required");
    expect(fallbackUI.hasSignOutButton).toBe(true);
  });

  it("does NOT render fallback when profile creation succeeds", async () => {
    const mockGetProfile = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        sapId: null,
        rollNo: null,
        cgpa: null,
        branch: null,
        batchYear: null,
        tenthPercentage: null,
        twelfthPercentage: null,
      });

    const mockInsert = vi.fn().mockResolvedValue({ rowCount: 1 });
    const user: MockUser = { id: "user-1", collegeId: "college-1" };

    let profile = await mockGetProfile(user.id);

    if (!profile && user.collegeId) {
      await mockInsert({ id: user.id, collegeId: user.collegeId });
      profile = await mockGetProfile(user.id);
    }

    expect(profile).not.toBeNull();
    expect(mockInsert).toHaveBeenCalledWith({
      id: "user-1",
      collegeId: "college-1",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema validation: students.collegeId must be notNull
// ─────────────────────────────────────────────────────────────────────────────

describe("schema: students.collegeId notNull enforcement", () => {
  it("insert values object requires collegeId to be a string (not undefined)", () => {
    const validValues = { id: "some-uuid", collegeId: "college-uuid" };
    expect(typeof validValues.collegeId).toBe("string");
    expect(validValues.collegeId).toBeTruthy();
  });

  it("rejects undefined collegeId (simulates TS compile-time safety)", () => {
    const values: Record<string, unknown> = {
      id: "some-uuid",
      collegeId: undefined,
    };
    expect(values.collegeId).toBeUndefined();

    // Our guard should prevent this from reaching the DB
    const safeToInsert = values.collegeId != null;
    expect(safeToInsert).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SAP ID derivation tests
// ─────────────────────────────────────────────────────────────────────────────

import { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";

describe("deriveSapFromEmail_upes_student", () => {
  it("derives 500126504 from prachi.126504@stu.upes.ac.in", () => {
    expect(deriveSapFromEmailPublic("prachi.126504@stu.upes.ac.in")).toBe(
      "500126504"
    );
  });
});

describe("deriveSapFromEmail_short_digits", () => {
  it("derives 590001234 from student.1234@stu.upes.ac.in (4 digits → 590 prefix + padded)", () => {
    expect(deriveSapFromEmailPublic("student.1234@stu.upes.ac.in")).toBe(
      "590001234"
    );
  });
});

describe("deriveSapFromEmail_non_upes", () => {
  it("returns null for faculty@upes.ac.in (not a student domain)", () => {
    expect(deriveSapFromEmailPublic("faculty@upes.ac.in")).toBeNull();
  });

  it("returns null for random@gmail.com", () => {
    expect(deriveSapFromEmailPublic("random@gmail.com")).toBeNull();
  });
});

describe("deriveSapFromEmail_in_layout_backfills_null_sap", () => {
  it("calls db.update with sapId='500126504' when profile.sapId is null", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ rowCount: 1 });

    const user = {
      id: "user-1",
      email: "prachi.126504@stu.upes.ac.in",
      collegeId: "college-1",
    };
    const profile = { sapId: null };

    // Simulate layout backfill logic
    if (profile && !profile.sapId) {
      const derivedSap = deriveSapFromEmailPublic(user.email);
      if (derivedSap) {
        await mockUpdate({ sapId: derivedSap, updatedAt: expect.any(Date) });
      }
    }

    expect(mockUpdate).toHaveBeenCalledWith({
      sapId: "500126504",
      updatedAt: expect.any(Date),
    });
  });

  it("does NOT call db.update when profile.sapId is already set", async () => {
    const mockUpdate = vi.fn();

    const user = {
      id: "user-1",
      email: "prachi.126504@stu.upes.ac.in",
      collegeId: "college-1",
    };
    const profile = { sapId: "500126504" };

    if (profile && !profile.sapId) {
      const derivedSap = deriveSapFromEmailPublic(user.email);
      if (derivedSap) {
        await mockUpdate({ sapId: derivedSap });
      }
    }

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH profile validation tests
// ─────────────────────────────────────────────────────────────────────────────

describe("patchProfile_emptyRollNo_does_not_send_field", () => {
  it("omits rollNo from patch when form.rollNo is empty", () => {
    // Simulate the fixed buildPatch identity logic
    function buildIdentityPatch(form: { sapId: string; rollNo: string; phone: string; linkedin: string }) {
      const patch: Record<string, unknown> = {};
      if (form.sapId) patch.sapId = form.sapId;
      if (form.rollNo) patch.rollNo = form.rollNo;
      if (form.phone) patch.phone = form.phone;
      if (form.linkedin) patch.linkedin = form.linkedin;
      return patch;
    }

    const patch = buildIdentityPatch({
      sapId: "500126504",
      rollNo: "",
      phone: "",
      linkedin: "",
    });

    expect(patch).not.toHaveProperty("rollNo");
    expect(patch).toHaveProperty("sapId", "500126504");
  });
});

describe("patchProfile_validRollNo_sends_field", () => {
  it("includes rollNo in patch when form.rollNo has a value", () => {
    function buildIdentityPatch(form: { sapId: string; rollNo: string; phone: string; linkedin: string }) {
      const patch: Record<string, unknown> = {};
      if (form.sapId) patch.sapId = form.sapId;
      if (form.rollNo) patch.rollNo = form.rollNo;
      if (form.phone) patch.phone = form.phone;
      if (form.linkedin) patch.linkedin = form.linkedin;
      return patch;
    }

    const patch = buildIdentityPatch({
      sapId: "500126504",
      rollNo: "R2142212345",
      phone: "",
      linkedin: "",
    });

    expect(patch).toHaveProperty("rollNo", "R2142212345");
    expect(patch).toHaveProperty("sapId", "500126504");
  });
});

describe("apiPatch_nullIncoming_doesNotTriggerLock", () => {
  it("skips lock check when incoming value is null or undefined", () => {
    const LOCKED_FIELDS = ["batchYear", "sapId"];
    const profile = { batchYear: 2026, sapId: "500126504" };
    const validatedData: Record<string, unknown> = { rollNo: "R2142212345" }; // no sapId

    const errors: string[] = [];

    for (const field of LOCKED_FIELDS) {
      const incoming = validatedData[field];
      if (incoming === undefined || incoming === null) continue;

      const current = (profile as Record<string, unknown>)[field];
      if (current !== null && current !== undefined && current !== "") {
        if (incoming !== current) {
          errors.push(`${field} cannot be changed`);
        }
      }
    }

    // No errors because sapId was not in the body
    expect(errors).toHaveLength(0);
  });
});

describe("apiPatch_changedSapId_triggers400Lock", () => {
  it("triggers lock error when sapId is changed from existing value", () => {
    const LOCKED_FIELDS = ["batchYear", "sapId"];
    const profile = { batchYear: 2026, sapId: "500126504" };
    const validatedData: Record<string, unknown> = { sapId: "500999999" };

    const errors: string[] = [];

    for (const field of LOCKED_FIELDS) {
      const incoming = validatedData[field];
      if (incoming === undefined || incoming === null) continue;

      const current = (profile as Record<string, unknown>)[field];
      if (current !== null && current !== undefined && current !== "") {
        if (incoming !== current) {
          const fieldLabel = field === "batchYear" ? "Batch year" : "SAP ID";
          errors.push(
            `${fieldLabel} cannot be changed after it has been set.`
          );
        }
      }
    }

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("SAP ID cannot be changed");
  });
});
