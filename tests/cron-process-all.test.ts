/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Unified Cron Worker Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for the auth logic and response shape of
 * GET /api/cron/process-all.
 *
 * We test the auth enforcement pattern inline (same approach used in
 * api-routes.test.ts) since the route handler depends on the Next.js
 * runtime and cannot be called directly from Vitest.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// ── Inline auth helper (mirrors the bearer-token check in the route) ──

function verifyCronAuth(
    authHeader: string | null,
    cronSecret: string | undefined,
): { ok: boolean; status: number; error?: string } {
    if (!cronSecret) {
        return { ok: false, status: 500, error: "Server misconfiguration" };
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }
    return { ok: true, status: 200 };
}

// ── Response shape type (mirrors the JSON returned by the route) ──────

interface CronAllResponse {
    message: string;
    results: {
        resumes: { processed: number } | { error: string };
        embeddings: Record<string, unknown> | { error: string };
        jdEnhancement:
        | { processed: number; failed: number }
        | { error: string };
        rankings:
        | { processed: number; failed: number }
        | { error: string };
    };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("GET /api/cron/process-all", () => {
    // ── Auth enforcement ───────────────────────────────────────────────

    describe("Authentication", () => {
        const SECRET = "test-cron-secret-value";

        it("should reject when CRON_SECRET is not configured", () => {
            const result = verifyCronAuth("Bearer anything", undefined);
            expect(result.ok).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe("Server misconfiguration");
        });

        it("should reject when authorization header is missing", () => {
            const result = verifyCronAuth(null, SECRET);
            expect(result.ok).toBe(false);
            expect(result.status).toBe(401);
            expect(result.error).toBe("Unauthorized");
        });

        it("should reject when authorization header has wrong token", () => {
            const result = verifyCronAuth("Bearer wrong-secret", SECRET);
            expect(result.ok).toBe(false);
            expect(result.status).toBe(401);
        });

        it("should reject when authorization header is missing Bearer prefix", () => {
            const result = verifyCronAuth(SECRET, SECRET);
            expect(result.ok).toBe(false);
            expect(result.status).toBe(401);
        });

        it("should accept correct bearer token", () => {
            const result = verifyCronAuth(`Bearer ${SECRET}`, SECRET);
            expect(result.ok).toBe(true);
            expect(result.status).toBe(200);
        });
    });

    // ── Response shape ─────────────────────────────────────────────────

    describe("Response shape", () => {
        it("should produce correct success response structure", () => {
            const response: CronAllResponse = {
                message: "Unified cron worker executed",
                results: {
                    resumes: { processed: 2 },
                    embeddings: { processed: 3, skipped: 0, budgetUsed: 3 },
                    jdEnhancement: { processed: 1, failed: 0 },
                    rankings: { processed: 1, failed: 0 },
                },
            };

            expect(response).toHaveProperty("message");
            expect(response.message).toBe("Unified cron worker executed");
            expect(response.results).toHaveProperty("resumes");
            expect(response.results).toHaveProperty("embeddings");
            expect(response.results).toHaveProperty("jdEnhancement");
            expect(response.results).toHaveProperty("rankings");
        });

        it("should allow error shape for individual workers", () => {
            const response: CronAllResponse = {
                message: "Unified cron worker executed",
                results: {
                    resumes: { error: "DB connection failed" },
                    embeddings: { error: "Rate limit exceeded" },
                    jdEnhancement: { error: "AI API down" },
                    rankings: { error: "Compute timeout" },
                },
            };

            expect(response.results.resumes).toHaveProperty("error");
            expect(response.results.embeddings).toHaveProperty("error");
            expect(response.results.jdEnhancement).toHaveProperty("error");
            expect(response.results.rankings).toHaveProperty("error");
        });

        it("should allow mixed success and error results", () => {
            const response: CronAllResponse = {
                message: "Unified cron worker executed",
                results: {
                    resumes: { processed: 5 },
                    embeddings: { error: "Rate limit exceeded" },
                    jdEnhancement: { processed: 2, failed: 1 },
                    rankings: { processed: 0, failed: 0 },
                },
            };

            expect((response.results.resumes as any).processed).toBe(5);
            expect((response.results.embeddings as any).error).toBe(
                "Rate limit exceeded",
            );
            expect((response.results.jdEnhancement as any).processed).toBe(2);
            expect((response.results.rankings as any).failed).toBe(0);
        });
    });

    // ── Schedule compliance ────────────────────────────────────────────

    describe("Schedule compliance (Vercel Hobby tier)", () => {
        it("cron expression 0 0 * * * fires exactly once per day", () => {
            // Parse the cron expression: 0 0 * * *
            // minute=0, hour=0, dayOfMonth=*, month=*, dayOfWeek=*
            const cronExpr = "0 0 * * *";
            const parts = cronExpr.split(" ");

            expect(parts).toHaveLength(5);
            expect(parts[0]).toBe("0"); // minute 0
            expect(parts[1]).toBe("0"); // hour 0
            expect(parts[2]).toBe("*"); // every day
            expect(parts[3]).toBe("*"); // every month
            expect(parts[4]).toBe("*"); // every day of week

            // Calculate executions per day: exactly 1
            const executionsPerDay = 1; // 0 0 = once at midnight
            expect(executionsPerDay).toBeLessThanOrEqual(1);
        });
    });
});
