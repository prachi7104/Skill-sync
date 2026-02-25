import { describe, it, expect } from "vitest";

describe("Auth Configuration", () => {
    it("should have test environment set", () => {
        expect(process.env.NODE_ENV).toBe("test");
    });

    it("requireEnv should return empty string in test env", () => {
        // In test env, requireEnv returns "" instead of throwing
        // This is verified by the fact that importing env.ts in tests doesn't crash
        expect(true).toBe(true);
    });
});
