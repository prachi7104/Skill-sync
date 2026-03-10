/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Drives API Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for the drives API logic:
 *   - POST: drive creation + validation (rawJd length, required fields)
 *   - GET: faculty vs student filtering, eligibility criteria
 *
 * Uses inlined logic + Zod validation to avoid server-only imports.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Inline Zod schema (mirrors app/api/drives/route.ts) ─────────────────────

const createDriveSchema = z.object({
    company: z.string().min(1, "Company name is required").max(255),
    roleTitle: z.string().min(1, "Role title is required").max(255),
    location: z.string().max(255).optional().nullable(),
    packageOffered: z.string().max(100).optional().nullable(),
    rawJd: z.string().min(10, "Job description must be at least 10 characters"),
    minCgpa: z.number().min(0).max(10).optional().nullable(),
    eligibleBranches: z.array(z.string()).optional().nullable(),
    eligibleBatchYears: z.array(z.number().int()).optional().nullable(),
    eligibleCategories: z
        .array(z.enum(["alpha", "beta", "gamma"]))
        .optional()
        .nullable(),
    deadline: z.string().datetime().optional().nullable(),
});

// ── Inline eligibility filter (mirrors app/api/drives/route.ts GET) ─────────

interface DriveRow {
    id: string;
    isActive?: boolean;
    minCgpa?: number | null;
    eligibleBranches?: string[] | null;
    eligibleBatchYears?: number[] | null;
    eligibleCategories?: string[] | null;
}

interface StudentProfile {
    cgpa: number | null;
    branch: string | null;
    batchYear: number | null;
    category: string | null;
}

function isStudentEligible(drive: DriveRow, student: StudentProfile): boolean {
    if (drive.minCgpa != null) {
        if (student.cgpa == null || student.cgpa < drive.minCgpa) return false;
    }
    if (drive.eligibleBranches && drive.eligibleBranches.length > 0) {
        if (!student.branch || !drive.eligibleBranches.includes(student.branch)) return false;
    }
    if (drive.eligibleBatchYears && drive.eligibleBatchYears.length > 0) {
        if (!student.batchYear || !drive.eligibleBatchYears.includes(student.batchYear)) return false;
    }
    if (drive.eligibleCategories && drive.eligibleCategories.length > 0) {
        if (!student.category || !drive.eligibleCategories.includes(student.category)) return false;
    }
    return true;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Drives API", () => {
    describe("POST /api/drives — Input Validation", () => {
        it("should accept valid drive creation data", () => {
            const data = {
                company: "Google",
                roleTitle: "SWE",
                rawJd: "This is a long enough job description for testing.",
            };
            const result = createDriveSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it("should reject rawJd under 10 characters", () => {
            const data = { company: "Test", roleTitle: "SE", rawJd: "too short" };
            const result = createDriveSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                const rawJdError = result.error.issues.find(i => i.path[0] === "rawJd");
                expect(rawJdError).toBeDefined();
            }
        });

        it("should reject missing company", () => {
            const data = { roleTitle: "SE", rawJd: "long enough jd string here" };
            const result = createDriveSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                const companyError = result.error.issues.find(i => i.path[0] === "company");
                expect(companyError).toBeDefined();
            }
        });

        it("should reject missing roleTitle", () => {
            const data = { company: "Google", rawJd: "long enough jd string here" };
            const result = createDriveSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it("should accept optional nullable fields", () => {
            const data = {
                company: "Google",
                roleTitle: "SWE",
                rawJd: "A full job description with enough characters",
                minCgpa: 7.5,
                eligibleBranches: ["CS", "IT"],
                eligibleBatchYears: [2024, 2025],
                eligibleCategories: ["alpha", "beta"],
                location: "Bangalore",
            };
            const result = createDriveSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    describe("GET /api/drives — Student Eligibility Filtering", () => {
        it("should filter drives based on CGPA", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "CS", batchYear: 2024, category: "alpha" };
            const drives: DriveRow[] = [
                { id: "d1", minCgpa: 8.5 },  // Ineligible
                { id: "d2", minCgpa: 7.5 },  // Eligible
                { id: "d3", minCgpa: null },  // No restriction → eligible
            ];

            const eligible = drives.filter(d => isStudentEligible(d, student));
            expect(eligible.map(d => d.id)).toEqual(["d2", "d3"]);
        });

        it("should filter drives based on branch", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "CS", batchYear: 2024, category: "alpha" };
            const drives: DriveRow[] = [
                { id: "d1", eligibleBranches: ["IT"] },         // Ineligible
                { id: "d2", eligibleBranches: ["CS", "IT"] },   // Eligible
                { id: "d3", eligibleBranches: null },            // No restriction
            ];

            const eligible = drives.filter(d => isStudentEligible(d, student));
            expect(eligible.map(d => d.id)).toEqual(["d2", "d3"]);
        });

        it("should exclude students with null CGPA from drives requiring minCgpa", () => {
            const student: StudentProfile = { cgpa: null, branch: "CS", batchYear: 2024, category: null };
            const drives: DriveRow[] = [
                { id: "d1", minCgpa: 7.0 },   // Ineligible (null CGPA)
                { id: "d2", minCgpa: null },   // Eligible
            ];

            const eligible = drives.filter(d => isStudentEligible(d, student));
            expect(eligible.map(d => d.id)).toEqual(["d2"]);
        });

        it("should filter by batch year", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "CS", batchYear: 2024, category: null };
            const drives: DriveRow[] = [
                { id: "d1", eligibleBatchYears: [2025] },          // Ineligible
                { id: "d2", eligibleBatchYears: [2024, 2025] },    // Eligible
            ];

            const eligible = drives.filter(d => isStudentEligible(d, student));
            expect(eligible.map(d => d.id)).toEqual(["d2"]);
        });

        it("should filter by category", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "CS", batchYear: 2024, category: "beta" };
            const drives: DriveRow[] = [
                { id: "d1", eligibleCategories: ["alpha"] },          // Ineligible
                { id: "d2", eligibleCategories: ["alpha", "beta"] },  // Eligible
            ];

            const eligible = drives.filter(d => isStudentEligible(d, student));
            expect(eligible.map(d => d.id)).toEqual(["d2"]);
        });

        it("should pass all criteria simultaneously", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "CS", batchYear: 2024, category: "alpha" };
            const drive: DriveRow = {
                id: "d1",
                minCgpa: 7.5,
                eligibleBranches: ["CS"],
                eligibleBatchYears: [2024],
                eligibleCategories: ["alpha"],
            };

            expect(isStudentEligible(drive, student)).toBe(true);
        });

        it("should fail if any one criterion is unmet", () => {
            const student: StudentProfile = { cgpa: 8.0, branch: "IT", batchYear: 2024, category: "alpha" };
            const drive: DriveRow = {
                id: "d1",
                minCgpa: 7.5,
                eligibleBranches: ["CS"], // Fails here
                eligibleBatchYears: [2024],
                eligibleCategories: ["alpha"],
            };

            expect(isStudentEligible(drive, student)).toBe(false);
        });
    });
});
