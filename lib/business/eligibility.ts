/**
 * SkillSync — Drive Eligibility (Phase 4.2 / 4.14)
 *
 * Single source of truth for student ↔ drive eligibility checks.
 * Used in both:
 *   - API route: app/api/drives/route.ts (student GET)
 *   - Client page: app/(student)/student/drives/page.tsx
 *
 * Keeps client and server in sync; a fix here propagates everywhere.
 */

import { expandBranches } from "@/lib/constants/branches";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DriveEligibilityCriteria {
  minCgpa?: number | null;
  eligibleBranches?: string[] | null;
  eligibleBatchYears?: number[] | null;
  eligibleCategories?: string[] | null;
}

export interface StudentEligibilityProfile {
  cgpa?: number | null;
  branch?: string | null;
  batchYear?: number | null;
  category?: string | null;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

// ── Core check ────────────────────────────────────────────────────────────────

/**
 * Returns whether a student profile satisfies a drive's eligibility criteria.
 *
 * All criteria are AND-combined. A missing/null criterion means "no restriction".
 */
export function checkDriveEligibility(
  student: StudentEligibilityProfile,
  drive: DriveEligibilityCriteria
): EligibilityResult {
  // CGPA check
  if (drive.minCgpa !== null && drive.minCgpa !== undefined && drive.minCgpa > 0) {
    if (student.cgpa === null || student.cgpa === undefined) {
      return { eligible: false, reason: "CGPA not set" };
    }
    if (student.cgpa < drive.minCgpa) {
      return { eligible: false, reason: `Minimum CGPA ${drive.minCgpa} required` };
    }
  }

  // Branch check
  const branches = drive.eligibleBranches;
  if (branches && branches.length > 0) {
    if (!student.branch) {
      return { eligible: false, reason: "Branch not set" };
    }
    const normalizedBranches = expandBranches(branches).map((b) =>
      b.toLowerCase().trim()
    );
    if (!normalizedBranches.includes(student.branch.toLowerCase().trim())) {
      return { eligible: false, reason: "Branch not in eligible list" };
    }
  }

  // Batch year check
  const batchYears = drive.eligibleBatchYears;
  if (batchYears && batchYears.length > 0) {
    if (student.batchYear === null || student.batchYear === undefined) {
      return { eligible: false, reason: "Batch year not set" };
    }
    if (!batchYears.includes(student.batchYear)) {
      return { eligible: false, reason: "Batch year not in eligible list" };
    }
  }

  // Category check
  const categories = drive.eligibleCategories;
  if (categories && categories.length > 0) {
    if (!student.category) {
      return { eligible: false, reason: "Category not set" };
    }
    if (!categories.includes(student.category)) {
      return { eligible: false, reason: "Category not in eligible list" };
    }
  }

  return { eligible: true };
}

/**
 * Filters an array of drives to only those a student is eligible for.
 * Convenience wrapper around checkDriveEligibility.
 */
export function filterEligibleDrives<T extends DriveEligibilityCriteria>(
  drives: T[],
  student: StudentEligibilityProfile
): T[] {
  return drives.filter((drive) => checkDriveEligibility(student, drive).eligible);
}
