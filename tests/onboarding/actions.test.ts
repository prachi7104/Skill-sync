/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Onboarding Actions Unit Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests the step-validation and completion logic from app/actions/onboarding.ts.
 * Since server actions import server-only modules (DB, auth), we test the
 * pure logic inline — transition rules and step guards.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline constants & helpers (mirrors onboarding.ts) ───────────────────────

const TOTAL_ONBOARDING_STEPS = 10;

/**
 * Valid onboarding step transitions.
 * Each key is the current step; the value is the ONLY allowed next step.
 */
const VALID_TRANSITIONS: Record<number, number> = {
    0: 1,
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10,
};

/**
 * Inline step-validation logic matching the production `updateOnboardingStep`.
 * Returns { success: true } or throws.
 */
function validateStepTransition(
    currentStep: number,
    requestedStep: number,
): { success: true } {
    // Idempotent: already on requested step
    if (requestedStep === currentStep) {
        return { success: true };
    }

    // Allow regression (going backwards is fine)
    if (requestedStep < currentStep) {
        return { success: true };
    }

    // For forward moves, only allow the immediately next step
    const allowedNextStep = VALID_TRANSITIONS[currentStep];
    if (requestedStep !== allowedNextStep) {
        throw new Error(
            `Invalid step transition: cannot skip from step ${currentStep} to step ${requestedStep}. ` +
            `Must go to ${allowedNextStep}.`,
        );
    }

    return { success: true };
}

/**
 * Inline completeOnboarding validation (mirrors completeOnboarding).
 */
function validateCompletion(currentStep: number): { success: true } {
    // Idempotent: already complete
    if (currentStep === TOTAL_ONBOARDING_STEPS) {
        return { success: true };
    }

    if (currentStep !== 9) {
        throw new Error(
            `Cannot complete onboarding from step ${currentStep}. Must be at step 9 (Review).`,
        );
    }

    return { success: true };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Onboarding — step transitions (updateOnboardingStep logic)", () => {
    it("step 0 → 1 should succeed", () => {
        expect(() => validateStepTransition(0, 1)).not.toThrow();
        expect(validateStepTransition(0, 1)).toEqual({ success: true });
    });

    it("step 1 → 2 should succeed", () => {
        expect(validateStepTransition(1, 2)).toEqual({ success: true });
    });

    it("all sequential forward steps (0→1 through 9→10) should succeed", () => {
        for (let from = 0; from <= 9; from++) {
            const to = from + 1;
            expect(() => validateStepTransition(from, to)).not.toThrow();
        }
    });

    it("skipping from step 0 to step 3 should throw", () => {
        expect(() => validateStepTransition(0, 3)).toThrow("cannot skip");
    });

    it("skipping from step 0 to step 5 should throw", () => {
        expect(() => validateStepTransition(0, 5)).toThrow("Must go to");
    });

    it("regression from step 3 to step 0 should succeed", () => {
        expect(() => validateStepTransition(3, 0)).not.toThrow();
        expect(validateStepTransition(3, 0)).toEqual({ success: true });
    });

    it("regression from step 9 to step 5 should succeed", () => {
        expect(validateStepTransition(9, 5)).toEqual({ success: true });
    });

    it("idempotent: requesting current step should succeed", () => {
        expect(validateStepTransition(4, 4)).toEqual({ success: true });
    });

    it("jump from step 0 to step 10 should throw (must go through each step)", () => {
        expect(() => validateStepTransition(0, 10)).toThrow();
    });

    it("error message includes both current and requested step", () => {
        try {
            validateStepTransition(0, 5);
        } catch (err) {
            expect((err as Error).message).toContain("0");
            expect((err as Error).message).toContain("5");
        }
    });
});

describe("Onboarding — completion (completeOnboarding logic)", () => {
    it("completes successfully from step 9", () => {
        expect(validateCompletion(9)).toEqual({ success: true });
    });

    it("throws when current step is not 9 (e.g., step 5)", () => {
        expect(() => validateCompletion(5)).toThrow("Must be at step 9");
    });

    it("throws when current step is 0", () => {
        expect(() => validateCompletion(0)).toThrow();
    });

    it("throws when current step is 8 (one before review)", () => {
        expect(() => validateCompletion(8)).toThrow();
    });

    it("is idempotent when already at step 10 (complete)", () => {
        // Already complete → should return success without throwing
        expect(validateCompletion(10)).toEqual({ success: true });
    });

    it("calling completion twice via idempotency path succeeds both times", () => {
        // Simulate: first call moves from 9→10 (success), second call at 10 (idempotent)
        const firstResult = validateCompletion(9);
        const simulatedCurrentStep = 10; // after first call
        const secondResult = validateCompletion(simulatedCurrentStep);
        expect(firstResult).toEqual({ success: true });
        expect(secondResult).toEqual({ success: true });
    });

    it("error includes current step number", () => {
        try {
            validateCompletion(3);
        } catch (err) {
            expect((err as Error).message).toContain("3");
        }
    });
});

describe("Onboarding — VALID_TRANSITIONS map", () => {
    it("all transitions form a linear chain 0 → 10", () => {
        let step = 0;
        while (step < TOTAL_ONBOARDING_STEPS) {
            const next = VALID_TRANSITIONS[step];
            expect(next).toBe(step + 1);
            step = next;
        }
        expect(step).toBe(TOTAL_ONBOARDING_STEPS);
    });

    it("no step can jump more than 1 at a time", () => {
        for (const [from, to] of Object.entries(VALID_TRANSITIONS)) {
            expect(Number(to) - Number(from)).toBe(1);
        }
    });

    it("all steps 0-9 have a valid transition", () => {
        for (let i = 0; i <= 9; i++) {
            expect(VALID_TRANSITIONS[i]).toBeDefined();
        }
    });
});
