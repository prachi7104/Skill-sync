import { describe, it, expect } from "vitest";
import { checkDriveEligibility, filterEligibleDrives } from "@/lib/business/eligibility";

describe("College Isolation — eligibility filtering", () => {
  const studentCollegeA = {
    cgpa: 8.0,
    branch: "Computer Science",
    batchYear: 2026,
    category: "alpha" as const,
  };

  const driveCollegeA = {
    minCgpa: 7.0,
    eligibleBranches: ["Computer Science"],
    eligibleBatchYears: [2026],
    eligibleCategories: ["alpha" as const],
  };

  it("eligible student passes all criteria", () => {
    const result = checkDriveEligibility(studentCollegeA, driveCollegeA);
    expect(result.eligible).toBe(true);
  });

  it("student below CGPA is ineligible", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, cgpa: 6.0 },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("CGPA");
  });

  it("student with null CGPA is ineligible when drive requires it", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, cgpa: null },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
  });

  it("student with wrong branch is ineligible", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, branch: "Mechanical" },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("Branch");
  });

  it("student with null branch is ineligible when drive restricts branches", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, branch: null },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
  });

  it("student with wrong batch year is ineligible", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, batchYear: 2025 },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
  });

  it("student with wrong category is ineligible", () => {
    const result = checkDriveEligibility(
      { ...studentCollegeA, category: "gamma" as const },
      driveCollegeA
    );
    expect(result.eligible).toBe(false);
  });

  it("filterEligibleDrives returns only matching drives", () => {
    const drives = [
      { ...driveCollegeA, id: "d1" },
      { ...driveCollegeA, id: "d2", minCgpa: 9.5 }, // student won't qualify
    ];
    const eligible = filterEligibleDrives(drives, studentCollegeA);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe("d1");
  });

  it("drive with no restrictions allows all students", () => {
    const openDrive = {
      minCgpa: null,
      eligibleBranches: null,
      eligibleBatchYears: null,
      eligibleCategories: null,
    };
    const emptyStudent = {
      cgpa: null,
      branch: null,
      batchYear: null,
      category: null,
    };
    const result = checkDriveEligibility(emptyStudent, openDrive);
    expect(result.eligible).toBe(true);
  });
});
