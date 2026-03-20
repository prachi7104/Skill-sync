import { describe, expect, it } from "vitest";

type Profile = {
  collegeId: string;
  branch: string | null;
  cgpa: number | null;
  batchYear: number | null;
  category: string | null;
};

type Drive = {
  id: string;
  collegeId: string;
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: string[] | null;
};

function rlsFilter(drives: Drive[], collegeId: string): Drive[] {
  return drives.filter((d) => d.collegeId === collegeId);
}

function eligibilityFilter(drives: Drive[], profile: Profile): Drive[] {
  return drives.filter((drive) => {
    if (drive.minCgpa !== null && (profile.cgpa === null || profile.cgpa < drive.minCgpa)) return false;
    if (drive.eligibleBranches?.length && (!profile.branch || !drive.eligibleBranches.includes(profile.branch))) return false;
    if (drive.eligibleBatchYears?.length && (profile.batchYear === null || !drive.eligibleBatchYears.includes(profile.batchYear))) return false;
    if (drive.eligibleCategories?.length && (!profile.category || !drive.eligibleCategories.includes(profile.category))) return false;
    return true;
  });
}

describe("P3.1 student drives visibility", () => {
  it("studentDrives_showsOnlyCollegeDrives", () => {
    const drives: Drive[] = [
      { id: "a1", collegeId: "A", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
      { id: "a2", collegeId: "A", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
      { id: "b1", collegeId: "B", minCgpa: null, eligibleBranches: null, eligibleBatchYears: null, eligibleCategories: null },
    ];
    expect(rlsFilter(drives, "A")).toHaveLength(2);
  });

  it("studentDrives_incompleteProfile_showsNotice", () => {
    const profile: Profile = { collegeId: "A", branch: null, cgpa: 8, batchYear: 2026, category: null };
    const drives: Drive[] = [
      { id: "a1", collegeId: "A", minCgpa: 7, eligibleBranches: ["CSE"], eligibleBatchYears: null, eligibleCategories: null },
    ];

    const visible = eligibilityFilter(drives, profile);
    const hasIncompleteProfile = !profile.branch || !profile.cgpa || !profile.batchYear;

    expect(visible).toHaveLength(0);
    expect(hasIncompleteProfile).toBe(true);
  });

  it("studentDrives_matchesEligibility", () => {
    const profile: Profile = { collegeId: "A", branch: "CSE", cgpa: 8, batchYear: 2026, category: null };
    const drives: Drive[] = [
      { id: "a1", collegeId: "A", minCgpa: 7.5, eligibleBranches: ["CSE"], eligibleBatchYears: null, eligibleCategories: null },
    ];

    expect(eligibilityFilter(drives, profile).map((d) => d.id)).toEqual(["a1"]);
  });
});
