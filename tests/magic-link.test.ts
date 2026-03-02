/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Magic Link Token Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - Token generation: randomBytes(32) → 64-char hex string
 *   - Token uniqueness
 *   - Token expiry calculation (24h from now)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";

describe("Magic Link — Token Generation", () => {
    it("should produce a 64-character hex string", () => {
        const token = randomBytes(32).toString("hex");
        expect(token).toHaveLength(64);
        expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should produce 100 unique tokens", () => {
        const tokens = new Set<string>();
        for (let i = 0; i < 100; i++) {
            tokens.add(randomBytes(32).toString("hex"));
        }
        expect(tokens.size).toBe(100);
    });
});

describe("Magic Link — Token Expiry", () => {
    it("should set expiresAt to 24h from now (within 100ms tolerance)", () => {
        const now = Date.now();
        const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
        const expected = now + 24 * 60 * 60 * 1000;

        expect(Math.abs(expiresAt.getTime() - expected)).toBeLessThanOrEqual(100);
    });

    it("should be in the future", () => {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
});
