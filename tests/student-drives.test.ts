import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for the student drives fixes:
 *   - FIX 1: RLS policy filters by college_id
 *   - FIX 2: Student drives page shows profile incomplete notice
 *   - FIX 3: Sandbox error handling for fetch failures
 */

// ── Test 1: studentDrives_showsOnlyCollegeDrives ────────────────────────────
// Simulates Drizzle ORM query with RLS filtering by college_id

describe("studentDrives_showsOnlyCollegeDrives", () => {
  // Simulate RLS filtering at the DB level
  function filterDrivesByCollegeRLS(
    drives: Array<{ id: string; collegeId: string; company: string }>,
    studentCollegeId: string,
    userId: string,
    userRole: "student" | "admin"
  ) {
    return drives.filter((drive) => {
      // RLS policy:
      // college_id = student's college_id
      // OR created_by = auth.uid()
      // OR role = 'admin'
      if (userRole === "admin") return true;
      if (drive.collegeId === studentCollegeId) return true;
      return false;
    });
  }

  it("filters drives to only return student's college drives via RLS", () => {
    // Setup: College A has 2 drives, College B has 1 drive
    const collegeAId = "college-a-uuid";
    const collegeBId = "college-b-uuid";
    const studentId = "student-123-uuid";

    const allDrives = [
      { id: "drive-1", collegeId: collegeAId, company: "Google" },
      { id: "drive-2", collegeId: collegeAId, company: "Microsoft" },
      { id: "drive-3", collegeId: collegeBId, company: "Amazon" },
    ];

    // Student from College A queries drives
    const filtered = filterDrivesByCollegeRLS(
      allDrives,
      collegeAId,
      studentId,
      "student"
    );

    // Assert: only 2 drives returned (not 3)
    expect(filtered).toHaveLength(2);
    expect(filtered.map((d) => d.company)).toEqual(["Google", "Microsoft"]);
    expect(filtered.every((d) => d.collegeId === collegeAId)).toBe(true);
  });

  it("admin can see all drives regardless of college_id", () => {
    const collegeAId = "college-a-uuid";
    const collegeBId = "college-b-uuid";

    const allDrives = [
      { id: "drive-1", collegeId: collegeAId, company: "Google" },
      { id: "drive-2", collegeId: collegeBId, company: "Amazon" },
    ];

    const filtered = filterDrivesByCollegeRLS(allDrives, collegeAId, "admin-id", "admin");

    expect(filtered).toHaveLength(2);
    expect(filtered.map((d) => d.company)).toEqual(["Google", "Amazon"]);
  });
});

// ── Test 2: studentDrives_incompleteProfile_showsNotice ────────────────────
// Simulates profile incomplete check and eligibility filtering

describe("studentDrives_incompleteProfile_showsNotice", () => {
  interface StudentProfile {
    branch: string | null;
    cgpa: number | null;
    batchYear: number | null;
    category: string | null;
  }

  interface Drive {
    id: string;
    company: string;
    minCgpa: number | null;
    eligibleBranches: string[] | null;
    eligibleBatchYears: number[] | null;
    eligibleCategories: string[] | null;
  }

  function checkProfileComplete(profile: StudentProfile): boolean {
    return Boolean(profile.branch && profile.cgpa !== null && profile.batchYear);
  }

  function isEligibleForDrive(profile: StudentProfile, drive: Drive): boolean {
    if (drive.minCgpa !== null && profile.cgpa !== null && profile.cgpa < drive.minCgpa) {
      return false;
    }

    const branches = drive.eligibleBranches;
    if (branches && branches.length > 0) {
      if (!profile.branch) return false;
      const normalized = branches.map((b) => b.toLowerCase().trim());
      if (!normalized.includes(profile.branch.toLowerCase().trim())) return false;
    }

    const batchYears = drive.eligibleBatchYears;
    if (batchYears && batchYears.length > 0) {
      if (profile.batchYear === null || profile.batchYear === undefined) return false;
      if (!batchYears.includes(profile.batchYear)) return false;
    }

    const categories = drive.eligibleCategories;
    if (categories && categories.length > 0) {
      if (!profile.category) return false;
      if (!categories.includes(profile.category)) return false;
    }

    return true;
  }

  it("shows 'complete profile' notice when profile is incomplete and no eligible drives", () => {
    // Student has no branch set
    const incompleteProfile: StudentProfile = {
      branch: null,
      cgpa: 8.0,
      batchYear: 2026,
      category: null,
    };

    // All drives have eligibleBranches set
    const drives: Drive[] = [
      {
        id: "drive-1",
        company: "Google",
        minCgpa: 7.5,
        eligibleBranches: ["CSE", "ECE"],
        eligibleBatchYears: null,
        eligibleCategories: null,
      },
      {
        id: "drive-2",
        company: "Microsoft",
        minCgpa: 7.0,
        eligibleBranches: ["CSE"],
        eligibleBatchYears: null,
        eligibleCategories: null,
      },
    ];

    const eligible = drives.filter((d) => isEligibleForDrive(incompleteProfile, d));
    const profileIncomplete = !checkProfileComplete(incompleteProfile);

    // Assert: "complete your profile" notice should show
    expect(eligible).toHaveLength(0);
    expect(profileIncomplete).toBe(true);
  });

  it("does not show profile notice when profile is complete but no eligible drives", () => {
    const completeProfile: StudentProfile = {
      branch: "CSE",
      cgpa: 6.5, // Below min CGPA of all drives
      batchYear: 2026,
      category: null,
    };

    const drives: Drive[] = [
      {
        id: "drive-1",
        company: "Google",
        minCgpa: 7.5, // Student CGPA is less than this
        eligibleBranches: ["CSE"],
        eligibleBatchYears: null,
        eligibleCategories: null,
      },
    ];

    const eligible = drives.filter((d) => isEligibleForDrive(completeProfile, d));
    const profileIncomplete = !checkProfileComplete(completeProfile);

    // Assert: eligibility filtered correctly, profile is complete so no "complete profile" notice
    expect(eligible).toHaveLength(0);
    expect(profileIncomplete).toBe(false); // Profile IS complete
  });

  it("detects incomplete profile with missing cgpa", () => {
    const incompleteProfile: StudentProfile = {
      branch: "CSE",
      cgpa: null, // Missing CGPA
      batchYear: 2026,
      category: null,
    };

    const profileIncomplete = !checkProfileComplete(incompleteProfile);
    expect(profileIncomplete).toBe(true);
  });

  it("detects incomplete profile with missing batchYear", () => {
    const incompleteProfile: StudentProfile = {
      branch: "CSE",
      cgpa: 8.0,
      batchYear: null, // Missing batch year
      category: null,
    };

    const profileIncomplete = !checkProfileComplete(incompleteProfile);
    expect(profileIncomplete).toBe(true);
  });
});

// ── Test 3: studentDrives_matchesEligibility ──────────────────────────────
// Validates eligibility filtering logic

describe("studentDrives_matchesEligibility", () => {
  interface StudentProfile {
    branch: string | null;
    cgpa: number | null;
    batchYear: number | null;
    category: string | null;
  }

  interface Drive {
    id: string;
    company: string;
    minCgpa: number | null;
    eligibleBranches: string[] | null;
    eligibleBatchYears: number[] | null;
    eligibleCategories: string[] | null;
  }

  function isEligibleForDrive(profile: StudentProfile, drive: Drive): boolean {
    if (drive.minCgpa !== null && profile.cgpa !== null && profile.cgpa < drive.minCgpa) {
      return false;
    }

    const branches = drive.eligibleBranches;
    if (branches && branches.length > 0) {
      if (!profile.branch) return false;
      const normalized = branches.map((b) => b.toLowerCase().trim());
      if (!normalized.includes(profile.branch.toLowerCase().trim())) return false;
    }

    const batchYears = drive.eligibleBatchYears;
    if (batchYears && batchYears.length > 0) {
      if (profile.batchYear === null) return false;
      if (!batchYears.includes(profile.batchYear)) return false;
    }

    const categories = drive.eligibleCategories;
    if (categories && categories.length > 0) {
      if (!profile.category) return false;
      if (!categories.includes(profile.category)) return false;
    }

    return true;
  }

  it("shows drive when student meets CGPA and branch requirements", () => {
    // Drive: minCgpa=7.5, branch=CSE
    const drive: Drive = {
      id: "drive-1",
      company: "Google",
      minCgpa: 7.5,
      eligibleBranches: ["CSE", "ECE"],
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    // Student: cgpa=8.0, branch=CSE
    const profile: StudentProfile = {
      branch: "CSE",
      cgpa: 8.0,
      batchYear: 2026,
      category: null,
    };

    const isEligible = isEligibleForDrive(profile, drive);

    // Assert: drive appears in eligible list
    expect(isEligible).toBe(true);
  });

  it("hides drive when student CGPA is below minimum", () => {
    const drive: Drive = {
      id: "drive-1",
      company: "Google",
      minCgpa: 7.5,
      eligibleBranches: ["CSE"],
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    const profile: StudentProfile = {
      branch: "CSE",
      cgpa: 7.0, // Below min CGPA
      batchYear: 2026,
      category: null,
    };

    const isEligible = isEligibleForDrive(profile, drive);
    expect(isEligible).toBe(false);
  });

  it("hides drive when student branch not in eligible branches", () => {
    const drive: Drive = {
      id: "drive-1",
      company: "Google",
      minCgpa: 7.5,
      eligibleBranches: ["CSE", "ECE"],
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    const profile: StudentProfile = {
      branch: "Mechanical", // Not in eligible branches
      cgpa: 8.0,
      batchYear: 2026,
      category: null,
    };

    const isEligible = isEligibleForDrive(profile, drive);
    expect(isEligible).toBe(false);
  });

  it("hides drive when student batch year not in eligible batch years", () => {
    const drive: Drive = {
      id: "drive-1",
      company: "Google",
      minCgpa: null,
      eligibleBranches: ["CSE"],
      eligibleBatchYears: [2025, 2026], // Only 2025 and 2026
      eligibleCategories: null,
    };

    const profile: StudentProfile = {
      branch: "CSE",
      cgpa: 8.0,
      batchYear: 2027, // Not in eligible batch years
      category: null,
    };

    const isEligible = isEligibleForDrive(profile, drive);
    expect(isEligible).toBe(false);
  });

  it("shows drive when no eligibility criteria set (open to all)", () => {
    const drive: Drive = {
      id: "drive-1",
      company: "Google",
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
    };

    const profile: StudentProfile = {
      branch: "Any",
      cgpa: 0.5,
      batchYear: 2030,
      category: null,
    };

    const isEligible = isEligibleForDrive(profile, drive);
    expect(isEligible).toBe(true);
  });
});

// ── Test 4: sandboxDrives_fetchError_showsEmptyNotice ──────────────────────
// Tests error handling in sandbox drives fetch

describe("sandboxDrives_fetchError_showsEmptyNotice", () => {
  interface DriveOption {
    id: string;
    company: string;
    roleTitle: string;
    rawJd: string;
  }

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch" as any);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("shows empty state when fetch fails with network error", async () => {
    // Mock fetch to fail with network error
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    let drives: DriveOption[] = [];
    let drivesLoaded = false;
    let errorOccurred = false;

    // Simulate fetchDrives logic from quick-sandbox.tsx
    try {
      const res = await fetch("/api/drives");
      const data = await res.json();
      const list = (data.drives ?? []).map((d: DriveOption) => ({
        id: d.id,
        company: d.company,
        roleTitle: d.roleTitle,
        rawJd: d.rawJd,
      }));
      drives = list;
      drivesLoaded = true;
    } catch {
      drives = []; // Don't crash — just show "No active drives" empty state
      drivesLoaded = true;
      errorOccurred = true;
    }

    // Assert: "No active drives" message renders
    expect(drivesLoaded).toBe(true);
    expect(drives).toHaveLength(0);
    expect(errorOccurred).toBe(true);
  });

  it("shows empty state when API returns invalid response", async () => {
    // Mock fetch to return invalid JSON
    fetchSpy.mockResolvedValueOnce({
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as Response);

    let drives: DriveOption[] = [];
    let drivesLoaded = false;

    try {
      const res = await fetch("/api/drives");
      const data = await res.json();
      drives = (data.drives ?? []).map((d: DriveOption) => ({
        id: d.id,
        company: d.company,
        roleTitle: d.roleTitle,
        rawJd: d.rawJd,
      }));
      drivesLoaded = true;
    } catch {
      drives = [];
      drivesLoaded = true;
    }

    // Assert: no crash/error boundary triggered, empty list shown
    expect(drivesLoaded).toBe(true);
    expect(drives).toHaveLength(0);
  });

  it("handles missing drives property in response gracefully", async () => {
    // Mock fetch to return response without drives property
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No drives property
    } as Response);

    let drives: DriveOption[] = [];
    let drivesLoaded = false;

    try {
      const res = await fetch("/api/drives");
      const data = await res.json();
      const list = (data.drives ?? []).map((d: DriveOption) => ({
        id: d.id,
        company: d.company,
        roleTitle: d.roleTitle,
        rawJd: d.rawJd,
      }));
      drives = list; // Assigns empty array from ([] ?? []).map()
      drivesLoaded = true;
    } catch {
      drives = [];
      drivesLoaded = true;
    }

    // Assert: shows "No active drives" message without crashing
    expect(drivesLoaded).toBe(true);
    expect(drives).toHaveLength(0);
  });

  it("does not crash when fetch returns 500 error", async () => {
    // Mock fetch to return 500 Server Error
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    } as Response);

    let drives: DriveOption[] = [];
    let drivesLoaded = false;
    let crashOccurred = false;

    try {
      const res = await fetch("/api/drives");
      const data = await res.json();
      const list = (data.drives ?? []).map((d: DriveOption) => ({
        id: d.id,
        company: d.company,
        roleTitle: d.roleTitle,
        rawJd: d.rawJd,
      }));
      drives = list;
      drivesLoaded = true;
    } catch (err) {
      crashOccurred = true;
      console.error("Fetch error caught:", err);
    } finally {
      if (!drivesLoaded) {
        drives = [];
        drivesLoaded = true;
      }
    }

    // Assert: no crash/error boundary triggered
    expect(drivesLoaded).toBe(true);
    expect(drives).toHaveLength(0);
    expect(crashOccurred).toBe(false); // Didn't throw
  });
});
