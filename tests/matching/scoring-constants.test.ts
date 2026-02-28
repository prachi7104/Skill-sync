/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Scoring Constants Self-Consistency Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Ensures exported scoring constants are internally consistent and valid.
 * Fails loud if someone changes a constant without updating the others.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import {
    SEMANTIC_WEIGHT,
    STRUCTURED_WEIGHT,
    REQUIRED_SKILLS_PTS,
    PREFERRED_SKILLS_PTS,
    PROJECT_KEYWORD_PTS,
} from "../../lib/matching/scoring-constants";

describe("scoring-constants self-consistency", () => {
    it("structured sub-weights must sum to exactly 100", () => {
        expect(REQUIRED_SKILLS_PTS + PREFERRED_SKILLS_PTS + PROJECT_KEYWORD_PTS).toBe(100);
    });

    it("SEMANTIC_WEIGHT + STRUCTURED_WEIGHT must equal 1.0", () => {
        expect(SEMANTIC_WEIGHT + STRUCTURED_WEIGHT).toBeCloseTo(1.0);
    });

    it("all constants must be positive numbers", () => {
        for (const [name, value] of Object.entries({
            SEMANTIC_WEIGHT,
            STRUCTURED_WEIGHT,
            REQUIRED_SKILLS_PTS,
            PREFERRED_SKILLS_PTS,
            PROJECT_KEYWORD_PTS,
        })) {
            expect(typeof value, `${name} should be a number`).toBe("number");
            expect(value, `${name} should be positive`).toBeGreaterThan(0);
        }
    });

    it("weights must be between 0 and 1", () => {
        expect(SEMANTIC_WEIGHT).toBeGreaterThan(0);
        expect(SEMANTIC_WEIGHT).toBeLessThan(1);
        expect(STRUCTURED_WEIGHT).toBeGreaterThan(0);
        expect(STRUCTURED_WEIGHT).toBeLessThan(1);
    });

    it("sub-weights must be between 0 and 100", () => {
        expect(REQUIRED_SKILLS_PTS).toBeGreaterThan(0);
        expect(REQUIRED_SKILLS_PTS).toBeLessThan(100);
        expect(PREFERRED_SKILLS_PTS).toBeGreaterThan(0);
        expect(PREFERRED_SKILLS_PTS).toBeLessThan(100);
        expect(PROJECT_KEYWORD_PTS).toBeGreaterThan(0);
        expect(PROJECT_KEYWORD_PTS).toBeLessThan(100);
    });

    it("REQUIRED_SKILLS_PTS should be the dominant structured component", () => {
        // Required skills should outweigh preferred and keyword components
        expect(REQUIRED_SKILLS_PTS).toBeGreaterThan(PREFERRED_SKILLS_PTS);
        expect(REQUIRED_SKILLS_PTS).toBeGreaterThan(PROJECT_KEYWORD_PTS);
    });
});
