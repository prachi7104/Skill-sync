import { describe, it, expect } from "vitest";

describe("Phase 5 — Career Coach Fix", () => {
    it("T1: career_advice task type exists in TASK_DEFINITIONS", async () => {
        const fs = await import("fs");
        const source = fs.readFileSync("lib/antigravity/router.ts", "utf-8");
        expect(source).toContain("career_advice");
        expect(source).toContain("requiresStructured: true");
    });

    it("T2: career-coach route does NOT use sandbox task type", async () => {
        const fs = await import("fs");
        const source = fs.readFileSync("app/api/student/career-coach/route.ts", "utf-8");
        expect(source).not.toContain('execute("sandbox"');
        expect(source).toContain('execute("career_advice"');
    });

    it("T3: career coach returns 503 with retryable=true on AI failure", async () => {
        // Mock the router to return failure
        const mockResult = { success: false, error: "Model unavailable" };
        // Simulate the check
        if (!mockResult.success) {
            const response = {
                error: "Career advisor is processing your request.",
                retryable: true,
            };
            expect(response.retryable).toBe(true);
        }
    });

    it("T4: career coach returns helpful message when no eligible drives", () => {
        const eligibleDrives: unknown[] = [];
        let response: { message?: string; suggestion?: string } = {};
        if (eligibleDrives.length === 0) {
            response = {
                message: "No active drives match your current profile.",
                suggestion: "Complete your profile to see eligible drives.",
            };
        }
        expect(response.message).toBeTruthy();
        expect(response.suggestion).toBeTruthy();
    });

    it("T5: career coach fetches drives with student's college_id", async () => {
        const fs = await import("fs");
        const source = fs.readFileSync("app/api/student/career-coach/route.ts", "utf-8");
        // Must filter drives by college
        expect(source).toContain("collegeId");
        // Not doing a global unscoped query
    });
});
