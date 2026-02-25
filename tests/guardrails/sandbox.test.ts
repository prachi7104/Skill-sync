import { describe, it, expect } from "vitest";

describe("Sandbox limits logic", () => {
    it("daily limit: effective usage resets when date changes", () => {
        // Simulate the SQL CASE logic in TS
        function effectiveDaily(usage: number, resetDate: string, today: string): number {
            return resetDate !== today ? 0 : usage;
        }

        expect(effectiveDaily(5, "2026-01-01", "2026-01-02")).toBe(0); // New day → reset
        expect(effectiveDaily(3, "2026-01-02", "2026-01-02")).toBe(3); // Same day → use stored
        expect(effectiveDaily(5, "2026-01-02", "2026-01-02")).toBe(5); // At limit
    });

    it("monthly limit: effective usage resets when month changes", () => {
        function effectiveMonthly(usage: number, resetMonth: string, currentMonth: string): number {
            return resetMonth !== currentMonth ? 0 : usage;
        }

        expect(effectiveMonthly(30, "2026-01", "2026-02")).toBe(0); // New month → reset
        expect(effectiveMonthly(15, "2026-02", "2026-02")).toBe(15); // Same month → use stored
    });
});
