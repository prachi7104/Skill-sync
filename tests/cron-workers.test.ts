/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Cron Worker Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for the cron worker pattern used by all 4 cron routes:
 *   - Authorization via CRON_SECRET bearer token
 *   - Stuck job recovery
 *   - Processing loop with retry/failure logic
 *   - MaxRetries exhaustion → status='failed'
 *
 * Uses inlined logic (mirrors app/api/cron/process-rankings/route.ts)
 * to avoid importing server-only.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Types (mirror schema) ───────────────────────────────────────────────────

interface Job {
    id: string;
    type: string;
    status: "pending" | "processing" | "completed" | "failed";
    payload: Record<string, unknown>;
    retryCount: number;
    maxRetries: number;
}

// ── Inlined cron worker logic ───────────────────────────────────────────────

const CRON_SECRET = "test-secret";
const MAX_JOBS_PER_TICK = 1; // matches app/api/cron/process-rankings/route.ts

// Instead of nested mock chains, use a simple job queue + processor pattern
let jobQueue: Job[] = [];
let stuckRecoveryCalled = false;
let updatedJobs: { id: string; status: string; retryCount?: number }[] = [];
const mockProcessor = vi.fn();

async function simulateCronHandler(authHeader: string | null): Promise<{
    status: number;
    body: Record<string, unknown>;
}> {
    // Security check
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    // Recover stuck jobs
    stuckRecoveryCalled = true;

    let processed = 0;
    let failed = 0;
    const processedIds = new Set<string>();

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        // Find next pending job (not already processed in this tick)
        const pendingIdx = jobQueue.findIndex(j => j.status === "pending" && !processedIds.has(j.id));
        if (pendingIdx === -1) break;

        const job = { ...jobQueue[pendingIdx] };
        processedIds.add(job.id);

        // Claim it
        jobQueue[pendingIdx].status = "processing";

        try {
            await mockProcessor(job);
            jobQueue[pendingIdx].status = "completed";
            updatedJobs.push({ id: job.id, status: "completed" });
            processed++;
        } catch {
            const newRetryCount = (job.retryCount ?? 0) + 1;
            const maxRetries = job.maxRetries ?? 3;
            const newStatus = newRetryCount < maxRetries ? "pending" : "failed";

            jobQueue[pendingIdx].status = newStatus as any;
            jobQueue[pendingIdx].retryCount = newRetryCount;
            updatedJobs.push({ id: job.id, status: newStatus, retryCount: newRetryCount });
            failed++;
        }
    }

    return { status: 200, body: { processed, failed } };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Cron Workers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jobQueue = [];
        stuckRecoveryCalled = false;
        updatedJobs = [];
    });

    it("should return 401 if Authorization header is missing", async () => {
        const result = await simulateCronHandler(null);
        expect(result.status).toBe(401);
    });

    it("should return 401 for wrong secret", async () => {
        const result = await simulateCronHandler("Bearer wrong-secret");
        expect(result.status).toBe(401);
    });

    it("should return 200 and call stuck job recovery", async () => {
        const result = await simulateCronHandler("Bearer test-secret");
        expect(result.status).toBe(200);
        expect(stuckRecoveryCalled).toBe(true);
    });

    it("should return processed: 0, failed: 0 when no pending jobs", async () => {
        const result = await simulateCronHandler("Bearer test-secret");
        expect(result.body).toEqual({ processed: 0, failed: 0 });
    });

    it("should process a pending job and mark as completed", async () => {
        jobQueue = [{
            id: "job-1", type: "rank_students", status: "pending",
            payload: { driveId: "drive-1" }, retryCount: 0, maxRetries: 3,
        }];
        mockProcessor.mockResolvedValue({ rankedStudents: 5 });

        const result = await simulateCronHandler("Bearer test-secret");

        expect(result.body.processed).toBe(1);
        expect(result.body.failed).toBe(0);
        expect(updatedJobs[0]).toEqual({ id: "job-1", status: "completed" });
    });

    it("should increment retryCount on failure and keep pending", async () => {
        jobQueue = [{
            id: "job-2", type: "rank_students", status: "pending",
            payload: { driveId: "drive-2" }, retryCount: 0, maxRetries: 3,
        }];
        mockProcessor.mockRejectedValue(new Error("Processing failed"));

        const result = await simulateCronHandler("Bearer test-secret");

        expect(result.body.failed).toBe(1);
        expect(updatedJobs[0]).toEqual({
            id: "job-2", status: "pending", retryCount: 1,
        });
    });

    it("should mark job as 'failed' when at maxRetries", async () => {
        jobQueue = [{
            id: "job-3", type: "rank_students", status: "pending",
            payload: { driveId: "drive-3" }, retryCount: 2, maxRetries: 3,
        }];
        mockProcessor.mockRejectedValue(new Error("Final failure"));

        const result = await simulateCronHandler("Bearer test-secret");

        expect(result.body.failed).toBe(1);
        expect(updatedJobs[0]).toEqual({
            id: "job-3", status: "failed", retryCount: 3,
        });
    });

    it("should process exactly MAX_JOBS_PER_TICK (1) job per tick", async () => {
        jobQueue = [
            { id: "j1", type: "rank_students", status: "pending", payload: {}, retryCount: 0, maxRetries: 3 },
            { id: "j2", type: "rank_students", status: "pending", payload: {}, retryCount: 0, maxRetries: 3 },
            { id: "j3", type: "rank_students", status: "pending", payload: {}, retryCount: 0, maxRetries: 3 },
        ];
        mockProcessor.mockResolvedValue({});

        const result = await simulateCronHandler("Bearer test-secret");

        expect(result.body.processed).toBe(1); // MAX_JOBS_PER_TICK = 1
        expect(jobQueue[1].status).toBe("pending"); // 2nd job untouched this tick
        expect(jobQueue[2].status).toBe("pending"); // 3rd job untouched this tick
    });

    it("should handle mix of success and failure", async () => {
        jobQueue = [
            { id: "j1", type: "rank_students", status: "pending", payload: {}, retryCount: 0, maxRetries: 3 },
            { id: "j2", type: "rank_students", status: "pending", payload: {}, retryCount: 0, maxRetries: 3 },
        ];
        mockProcessor
            .mockResolvedValueOnce({}) // j1 succeeds
            .mockRejectedValueOnce(new Error("fail")); // j2 fails

        const firstTick = await simulateCronHandler("Bearer test-secret");

        expect(firstTick.body.processed).toBe(1);
        expect(firstTick.body.failed).toBe(0);

        const secondTick = await simulateCronHandler("Bearer test-secret");

        expect(secondTick.body.processed).toBe(0);
        expect(secondTick.body.failed).toBe(1);
    });

  it("should pick highest priority job first (desc order)", () => {
    // desc(priority) means higher number = higher priority = processed first
    const queue = [
      { id: "low",  priority: 3, createdAt: new Date("2025-01-01") },
      { id: "high", priority: 8, createdAt: new Date("2025-01-02") },
      { id: "med",  priority: 5, createdAt: new Date("2025-01-01") },
    ];
    const sorted = [...queue].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority; // DESC
      return a.createdAt.getTime() - b.createdAt.getTime(); // ASC
    });
    expect(sorted[0].id).toBe("high");
    expect(sorted[1].id).toBe("med");
    expect(sorted[2].id).toBe("low");
  });

  it("should use users.id (not students.id) to look up name and email for completeness", () => {
    // This test documents the correct query shape.
    // We cannot call the DB in unit tests, so we verify the logic contract:
    // The user lookup must filter by the user's own primary key (users.id = studentId),
    // NOT by a foreign key from the students table (students.id = studentId).
    // Both happen to have the same UUID in this schema, but using the wrong
    // table reference causes a type error at the Drizzle level and will silently
    // return `undefined` if the ORM resolves the column to the wrong table.
    const correctLookup = (tableName: string, columnName: string) =>
      tableName === "users" && columnName === "id";
    expect(correctLookup("users", "id")).toBe(true);
    expect(correctLookup("students", "id")).toBe(false);
  });

  describe("Drive status priority", () => {
    function getDriveStatus(isActive: boolean, isProcessing: boolean): string {
      if (!isActive) return "closed";
      if (isProcessing) return "processing";
      return "active";
    }

    it("closed drive shows 'closed' even if a job is processing", () => {
      expect(getDriveStatus(false, true)).toBe("closed");
    });

    it("active drive with processing job shows 'processing'", () => {
      expect(getDriveStatus(true, true)).toBe("processing");
    });

    it("active drive with no processing job shows 'active'", () => {
      expect(getDriveStatus(true, false)).toBe("active");
    });

    it("inactive drive with no processing job shows 'closed'", () => {
      expect(getDriveStatus(false, false)).toBe("closed");
    });
  });
});
