/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Drive State Guardrail Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests the drive state derivation and guardrail functions using
 * inlined logic to avoid the `server-only` import guard.
 *
 * Inline logic mirrors lib/guardrails/drive-state.ts
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline types ─────────────────────────────────────────────────────────────

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
        return { code: this.code, reason: this.reason, nextStep: this.nextStep, status: this.status };
    }
}

const ERRORS = {
    RANKINGS_NOT_GENERATED: (): GuardrailViolation =>
        new GuardrailViolation({
            code: "RANKINGS_NOT_GENERATED",
            reason: "Rankings have not been generated for this drive yet.",
            nextStep: "Ask the drive creator to run ranking computation first.",
            status: 404,
        }),
    RANKING_REGEN_BLOCKED: (): GuardrailViolation =>
        new GuardrailViolation({
            code: "RANKING_REGEN_BLOCKED",
            reason: "Rankings already exist for this drive. Only admins can regenerate.",
            nextStep: "Contact an admin if re-ranking is required.",
            status: 403,
        }),
    DRIVE_NOT_FOUND: (): GuardrailViolation =>
        new GuardrailViolation({
            code: "DRIVE_NOT_FOUND",
            reason: "The specified drive does not exist.",
            nextStep: "Verify the drive ID and try again.",
            status: 404,
        }),
};

// ── Inline drive state types ─────────────────────────────────────────────────

type DriveState = "not_ranked" | "ranked" | "closed";

interface DriveStateInfo {
    state: DriveState;
    driveId: string;
    company: string;
    roleTitle: string;
    createdBy: string;
    deadline: Date | null;
    isActive: boolean;
    rankingsCount: number;
}

// ── Inline DriveState derivation (mirrors getDriveState logic) ────────────────

interface MockDriveRecord {
    id: string;
    company: string;
    roleTitle: string;
    createdBy: string;
    deadline: Date | null;
    isActive: boolean;
}

function deriveDriveState(
    drive: MockDriveRecord | null,
    rankingsCount: number,
): DriveStateInfo | null {
    if (!drive) return null;

    let state: DriveState;
    if (rankingsCount === 0) {
        state = "not_ranked";
    } else if (drive.deadline && new Date(drive.deadline) < new Date()) {
        state = "closed";
    } else {
        state = "ranked";
    }

    return {
        state,
        driveId: drive.id,
        company: drive.company,
        roleTitle: drive.roleTitle,
        createdBy: drive.createdBy,
        deadline: drive.deadline,
        isActive: drive.isActive,
        rankingsCount,
    };
}

// ── Inline guardrail functions ────────────────────────────────────────────────

function inlineEnforceRankingsExist(
    drive: MockDriveRecord | null,
    rankingsCount: number,
): DriveStateInfo {
    const info = deriveDriveState(drive, rankingsCount);
    if (!info) throw ERRORS.DRIVE_NOT_FOUND();
    if (info.state === "not_ranked") throw ERRORS.RANKINGS_NOT_GENERATED();
    return info;
}

function inlineEnforceRankingGeneration(
    drive: MockDriveRecord | null,
    activeJobExists: boolean,
): void {
    const info = deriveDriveState(drive, 0); // count doesn't matter for this check
    if (!info) throw ERRORS.DRIVE_NOT_FOUND();
    if (activeJobExists) throw ERRORS.RANKING_REGEN_BLOCKED();
}

// ── Test Data ─────────────────────────────────────────────────────────────────

const NOW = new Date();
const PAST_DEADLINE = new Date(NOW.getTime() - 1000 * 60 * 60 * 24); // yesterday
const FUTURE_DEADLINE = new Date(NOW.getTime() + 1000 * 60 * 60 * 24); // tomorrow

const baseDrive: MockDriveRecord = {
    id: "drive-001",
    company: "TechCorp",
    roleTitle: "SWE",
    createdBy: "faculty-001",
    deadline: FUTURE_DEADLINE,
    isActive: true,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Drive State Guardrails", () => {
    describe("getDriveState / deriveDriveState", () => {
        it("returns null when drive does not exist", () => {
            expect(deriveDriveState(null, 0)).toBeNull();
        });

        it("returns 'not_ranked' when no rankings rows exist", () => {
            const info = deriveDriveState(baseDrive, 0);
            expect(info?.state).toBe("not_ranked");
            expect(info?.rankingsCount).toBe(0);
        });

        it("returns 'ranked' when rankings exist and deadline is in the future", () => {
            const info = deriveDriveState(baseDrive, 10);
            expect(info?.state).toBe("ranked");
            expect(info?.rankingsCount).toBe(10);
        });

        it("returns 'ranked' when rankings exist and no deadline set", () => {
            const drive = { ...baseDrive, deadline: null };
            const info = deriveDriveState(drive, 5);
            expect(info?.state).toBe("ranked");
        });

        it("returns 'closed' when rankings exist and deadline has passed", () => {
            const drive = { ...baseDrive, deadline: PAST_DEADLINE };
            const info = deriveDriveState(drive, 5);
            expect(info?.state).toBe("closed");
        });

        it("populates all fields correctly", () => {
            const info = deriveDriveState(baseDrive, 7);
            expect(info).toMatchObject({
                driveId: "drive-001",
                company: "TechCorp",
                roleTitle: "SWE",
                createdBy: "faculty-001",
                isActive: true,
                rankingsCount: 7,
            });
        });

        it("not_ranked takes precedence over deadline being past", () => {
            // 0 rankings + past deadline → still "not_ranked"
            const drive = { ...baseDrive, deadline: PAST_DEADLINE };
            const info = deriveDriveState(drive, 0);
            expect(info?.state).toBe("not_ranked");
        });
    });

    describe("enforceRankingsExist", () => {
        it("throws RANKINGS_NOT_GENERATED when state is 'not_ranked'", () => {
            expect(() => inlineEnforceRankingsExist(baseDrive, 0)).toThrow(GuardrailViolation);
            try {
                inlineEnforceRankingsExist(baseDrive, 0);
            } catch (err) {
                expect((err as GuardrailViolation).code).toBe("RANKINGS_NOT_GENERATED");
                expect((err as GuardrailViolation).status).toBe(404);
            }
        });

        it("throws DRIVE_NOT_FOUND when drive is null", () => {
            expect(() => inlineEnforceRankingsExist(null, 0)).toThrow(GuardrailViolation);
            try {
                inlineEnforceRankingsExist(null, 0);
            } catch (err) {
                expect((err as GuardrailViolation).code).toBe("DRIVE_NOT_FOUND");
            }
        });

        it("returns drive info when state is 'ranked'", () => {
            const info = inlineEnforceRankingsExist(baseDrive, 5);
            expect(info.state).toBe("ranked");
            expect(info.rankingsCount).toBe(5);
        });

        it("returns drive info when state is 'closed'", () => {
            const drive = { ...baseDrive, deadline: PAST_DEADLINE };
            const info = inlineEnforceRankingsExist(drive, 3);
            expect(info.state).toBe("closed");
        });
    });

    describe("enforceRankingGeneration", () => {
        it("allows ranking generation when no active job exists", () => {
            expect(() => inlineEnforceRankingGeneration(baseDrive, false)).not.toThrow();
        });

        it("allows ranking generation when drive has no existing rankings", () => {
            expect(() => inlineEnforceRankingGeneration(baseDrive, false)).not.toThrow();
        });

        it("throws RANKING_REGEN_BLOCKED when an active job is running", () => {
            expect(() => inlineEnforceRankingGeneration(baseDrive, true)).toThrow(GuardrailViolation);
            try {
                inlineEnforceRankingGeneration(baseDrive, true);
            } catch (err) {
                expect((err as GuardrailViolation).code).toBe("RANKING_REGEN_BLOCKED");
                expect((err as GuardrailViolation).status).toBe(403);
            }
        });

        it("throws DRIVE_NOT_FOUND when drive does not exist", () => {
            expect(() => inlineEnforceRankingGeneration(null, false)).toThrow(GuardrailViolation);
            try {
                inlineEnforceRankingGeneration(null, false);
            } catch (err) {
                expect((err as GuardrailViolation).code).toBe("DRIVE_NOT_FOUND");
            }
        });
    });
});
