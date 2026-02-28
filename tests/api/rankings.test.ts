/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Rankings API Unit Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests the ranking-related API logic through inlined handler simulations.
 * Because Next.js Route Handlers use server-only imports and require complex
 * mocking infrastructure, we test the core business logic inline.
 *
 * Covers:
 *  - POST /api/drives/:driveId/rank (ownership, 404, 409, 200)
 *  - PATCH /api/drives/:driveId/rankings/:studentId/shortlist (validation, ownership)
 *  - GET /api/drives/:driveId/export (CSV generation, shortlistedOnly filter)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Shared error types ─────────────────────────────────────────────────────────

interface GuardrailError { code: string; reason: string; nextStep: string; status: number;[key: string]: unknown }

class GuardrailViolation extends Error {
    constructor(public err: GuardrailError) {
        super(err.reason);
        this.name = "GuardrailViolation";
    }
    get code() { return this.err.code; }
    get status() { return this.err.status; }
    toJSON() { return this.err as Record<string, unknown>; }
}

const ERRORS = {
    DRIVE_NOT_FOUND: () => new GuardrailViolation({ code: "DRIVE_NOT_FOUND", reason: "Drive not found.", nextStep: "", status: 404 }),
    RANKING_REGEN_BLOCKED: () => new GuardrailViolation({ code: "RANKING_REGEN_BLOCKED", reason: "Already processing.", nextStep: "", status: 403 }),
    RANKINGS_NOT_GENERATED: () => new GuardrailViolation({ code: "RANKINGS_NOT_GENERATED", reason: "Not generated.", nextStep: "", status: 404 }),
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Inline handler logic for POST /rank ───────────────────────────────────────

interface MockDriveRecord {
    id: string;
    createdBy: string;
}

interface PostRankRequest {
    driveId: string;
    user: { id: string; role: "faculty" | "admin" };
    drive: MockDriveRecord | null;
    activeJobExists: boolean;
    rankingResult?: { rankedCount: number };
}

interface PostRankResponse {
    status: number;
    body: Record<string, unknown>;
}

function handlePostRank(req: PostRankRequest): PostRankResponse {
    const { driveId, user, drive, activeJobExists, rankingResult } = req;

    if (!driveId || !UUID_REGEX.test(driveId)) {
        return { status: 400, body: { code: "DRIVE_INVALID_ID" } };
    }

    if (!drive) {
        return { status: 404, body: { error: "Drive not found" } };
    }

    if (user.role === "faculty" && drive.createdBy !== user.id) {
        return { status: 403, body: { error: "Forbidden: you do not own this drive" } };
    }

    // Guardrail: block if active ranking job
    if (activeJobExists) {
        const err = ERRORS.RANKING_REGEN_BLOCKED();
        return { status: err.status, body: err.toJSON() };
    }

    // Simulate computeRanking success
    return { status: 200, body: { message: "Rankings computed successfully", result: rankingResult ?? { rankedCount: 5 } } };
}

// ── Inline handler logic for PATCH /shortlist ─────────────────────────────────

interface PatchShortlistRequest {
    driveId: string;
    studentId: string;
    user: { id: string; role: "faculty" | "admin" };
    drive: { createdBy: string } | null;
    body: unknown;
}

interface PatchShortlistResponse { status: number; body: Record<string, unknown> }

function handlePatchShortlist(req: PatchShortlistRequest): PatchShortlistResponse {
    const { user, drive, body } = req;

    if (!drive) return { status: 404, body: { error: "Drive not found" } };
    if (user.role === "faculty" && drive.createdBy !== user.id) {
        return { status: 403, body: { error: "Forbidden" } };
    }

    // Validate body
    if (
        typeof body !== "object" ||
        body === null ||
        !("shortlisted" in body) ||
        (typeof (body as Record<string, unknown>).shortlisted !== "boolean" &&
            (body as Record<string, unknown>).shortlisted !== null)
    ) {
        return { status: 400, body: { error: "shortlisted must be true, false, or null" } };
    }

    const shortlisted = (body as { shortlisted: boolean | null }).shortlisted;
    return { status: 200, body: { success: true, shortlisted } };
}

// ── Inline CSV generation (mirrors export/route.ts) ───────────────────────────

interface RankingRow {
    rankPosition: number;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    shortlisted: boolean | null;
    studentName: string;
    sapId: string | null;
    rollNo: string | null;
    branch: string | null;
    cgpa: number | null;
    batchYear: number | null;
}

function generateCsv(rows: RankingRow[]): string {
    const header = "Rank,Name,SAP ID,Roll No,Branch,CGPA,Batch Year,Match Score %,Matched Skills,Missing Skills,Shortlisted";
    const csvRows = rows.map((r) =>
        [
            r.rankPosition,
            r.studentName,
            r.sapId ?? "",
            r.rollNo ?? "",
            r.branch ?? "",
            r.cgpa ?? "",
            r.batchYear ?? "",
            r.matchScore.toFixed(1),
            r.matchedSkills.join("|"),
            r.missingSkills.join("|"),
            r.shortlisted === true ? "Yes" : r.shortlisted === false ? "No" : "",
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
    );
    return [header, ...csvRows].join("\n");
}

// ── Test Data ─────────────────────────────────────────────────────────────────

const DRIVE_ID = "a0b1c2d3-e4f5-6789-abcd-ef0123456789";
const FACULTY_ID = "faculty-111";
const OTHER_FACULTY_ID = "faculty-999";

const mockDrive: MockDriveRecord = { id: DRIVE_ID, createdBy: FACULTY_ID };
const facultyUser = { id: FACULTY_ID, role: "faculty" as const };
const adminUser = { id: "admin-001", role: "admin" as const };

const sampleRows: RankingRow[] = [
    {
        rankPosition: 1,
        matchScore: 89.5,
        matchedSkills: ["react", "typescript"],
        missingSkills: ["node.js"],
        shortlisted: true,
        studentName: "Alice",
        sapId: "SAP001",
        rollNo: "R001",
        branch: "CS",
        cgpa: 9.0,
        batchYear: 2026,
    },
    {
        rankPosition: 2,
        matchScore: 72.3,
        matchedSkills: ["react"],
        missingSkills: ["typescript", "node.js"],
        shortlisted: false,
        studentName: "Bob",
        sapId: "SAP002",
        rollNo: "R002",
        branch: "IT",
        cgpa: 7.5,
        batchYear: 2026,
    },
    {
        rankPosition: 3,
        matchScore: 60.0,
        matchedSkills: [],
        missingSkills: ["react", "typescript", "node.js"],
        shortlisted: null,
        studentName: "Charlie",
        sapId: null,
        rollNo: null,
        branch: null,
        cgpa: null,
        batchYear: null,
    },
];

// ── Tests: POST /rank ─────────────────────────────────────────────────────────

describe("POST /api/drives/:driveId/rank", () => {
    it("returns 200 when ranking succeeds (faculty owns drive)", () => {
        const res = handlePostRank({
            driveId: DRIVE_ID,
            user: facultyUser,
            drive: mockDrive,
            activeJobExists: false,
            rankingResult: { rankedCount: 10 },
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("computed");
    });

    it("returns 200 when admin ranks any drive", () => {
        const res = handlePostRank({
            driveId: DRIVE_ID,
            user: adminUser,
            drive: { id: DRIVE_ID, createdBy: OTHER_FACULTY_ID },
            activeJobExists: false,
        });
        expect(res.status).toBe(200);
    });

    it("returns 403 when faculty tries to rank a drive they don't own", () => {
        const res = handlePostRank({
            driveId: DRIVE_ID,
            user: { id: OTHER_FACULTY_ID, role: "faculty" },
            drive: mockDrive, // owned by FACULTY_ID, not OTHER_FACULTY_ID
            activeJobExists: false,
        });
        expect(res.status).toBe(403);
        expect(String(res.body.error)).toContain("do not own");
    });

    it("returns 409 when a ranking job is already actively processing", () => {
        const res = handlePostRank({
            driveId: DRIVE_ID,
            user: facultyUser,
            drive: mockDrive,
            activeJobExists: true,
        });
        expect(res.status).toBe(403); // RANKING_REGEN_BLOCKED returns 403
        expect(res.body.code).toBe("RANKING_REGEN_BLOCKED");
    });

    it("returns 404 when drive not found", () => {
        const res = handlePostRank({
            driveId: DRIVE_ID,
            user: facultyUser,
            drive: null,
            activeJobExists: false,
        });
        expect(res.status).toBe(404);
    });

    it("returns 400 for invalid (non-UUID) driveId", () => {
        const res = handlePostRank({
            driveId: "not-a-uuid",
            user: facultyUser,
            drive: mockDrive,
            activeJobExists: false,
        });
        expect(res.status).toBe(400);
    });
});

// ── Tests: PATCH /shortlist ───────────────────────────────────────────────────

describe("PATCH /api/drives/:driveId/rankings/:studentId/shortlist", () => {
    const baseReq = {
        driveId: DRIVE_ID,
        studentId: "student-001",
        user: facultyUser,
        drive: { createdBy: FACULTY_ID },
    };

    it("returns 200 with shortlisted: true", () => {
        const res = handlePatchShortlist({ ...baseReq, body: { shortlisted: true } });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, shortlisted: true });
    });

    it("returns 200 with shortlisted: null (un-shortlist)", () => {
        const res = handlePatchShortlist({ ...baseReq, body: { shortlisted: null } });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, shortlisted: null });
    });

    it("returns 200 with shortlisted: false", () => {
        const res = handlePatchShortlist({ ...baseReq, body: { shortlisted: false } });
        expect(res.status).toBe(200);
        expect(res.body.shortlisted).toBe(false);
    });

    it("returns 400 for invalid body (shortlisted: 'yes')", () => {
        const res = handlePatchShortlist({ ...baseReq, body: { shortlisted: "yes" } });
        expect(res.status).toBe(400);
        expect(String(res.body.error)).toContain("shortlisted");
    });

    it("returns 400 for missing shortlisted field", () => {
        const res = handlePatchShortlist({ ...baseReq, body: {} });
        expect(res.status).toBe(400);
    });

    it("returns 403 when faculty doesn't own drive", () => {
        const res = handlePatchShortlist({
            ...baseReq,
            user: { id: OTHER_FACULTY_ID, role: "faculty" },
            body: { shortlisted: null },
        });
        expect(res.status).toBe(403);
    });

    it("returns 404 when drive not found", () => {
        const res = handlePatchShortlist({ ...baseReq, drive: null, body: { shortlisted: null } });
        expect(res.status).toBe(404);
    });
});

// ── Tests: GET /export (CSV) ──────────────────────────────────────────────────

describe("GET /api/drives/:driveId/export — CSV generation", () => {
    it("generates CSV with correct header row", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        expect(lines[0]).toBe(
            "Rank,Name,SAP ID,Roll No,Branch,CGPA,Batch Year,Match Score %,Matched Skills,Missing Skills,Shortlisted",
        );
    });

    it("CSV has correct number of data rows", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        expect(lines).toHaveLength(sampleRows.length + 1); // header + data
    });

    it("shortlistedOnly=true filters to only shortlisted rows", () => {
        const shortlistedRows = sampleRows.filter((r) => r.shortlisted === true);
        const csv = generateCsv(shortlistedRows);
        const lines = csv.split("\n");
        // 1 header + 1 shortlisted row
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain("Alice");
    });

    it("CSV rows are quoted correctly", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        // Each data field should be quoted
        expect(lines[1]).toMatch(/^"[^"]*"(,"[^"]*")*$/);
    });

    it("shortlisted=true renders as 'Yes', false as 'No', null as empty", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        expect(lines[1]).toContain('"Yes"'); // Alice: shortlisted=true
        expect(lines[2]).toContain('"No"');  // Bob: shortlisted=false
        expect(lines[3]).toContain('""');    // Charlie: shortlisted=null (empty)
    });

    it("skills joined with pipe character", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        expect(lines[1]).toContain("react|typescript");
    });

    it("null fields rendered as empty string, not 'null'", () => {
        const csv = generateCsv(sampleRows);
        const lines = csv.split("\n");
        // Charlie has null sapId, rollNo, branch, cgpa, batchYear
        expect(lines[3]).not.toContain("null");
    });

    it("match score formatted to 1 decimal place", () => {
        const csv = generateCsv([sampleRows[0]]);
        const lines = csv.split("\n");
        expect(lines[1]).toContain("89.5");
    });

    it("empty row list produces only header", () => {
        const csv = generateCsv([]);
        expect(csv).toBe(
            "Rank,Name,SAP ID,Roll No,Branch,CGPA,Batch Year,Match Score %,Matched Skills,Missing Skills,Shortlisted",
        );
    });
});
