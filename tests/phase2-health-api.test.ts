import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
const mockExecute = vi.fn();
vi.mock("@/lib/db", () => ({ db: { execute: mockExecute } }));
vi.mock("@/lib/redis", () => ({ getRedis: () => null }));
vi.mock("@/lib/auth/helpers", () => ({
  requireRole: vi.fn().mockResolvedValue({ id: "admin-1", role: "admin" }),
}));

describe("Phase 2 — Admin Health API", () => {

  beforeEach(() => {
    mockExecute.mockResolvedValue([{ count: 5 }]);
  });

  it("T1: returns 200 with all required fields", async () => {
    const { GET } = await import("@/app/api/admin/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("totalStudents");
    expect(data).toHaveProperty("studentsOnboarded");
    expect(data).toHaveProperty("studentsWithEmbeddings");
    expect(data).toHaveProperty("drivesCreated");
    expect(data).toHaveProperty("drivesRanked");
    expect(data).toHaveProperty("jobsPending");
    expect(data).toHaveProperty("jobsFailed");
    expect(data).toHaveProperty("jobsCompletedToday");
    expect(data).toHaveProperty("timestamp");
  });

  it("T2: ONE query timing out still returns 200 with other data", async () => {
    // Make the jobs/failed query (index 6) hang then timeout
    let callCount = 0;
    mockExecute.mockImplementation(async () => {
      callCount++;
      if (callCount === 7) {
        // Simulate the slow query that always times out
        await new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 50));
      }
      return [{ count: 3 }];
    });

    const { GET } = await import("@/app/api/admin/health/route");
    const res = await GET();
    // Must still be 200, not 500
    expect(res.status).toBe(200);
    const data = await res.json();
    // Other fields still have real values
    expect(data.totalStudents).toBe(3);
    expect(data.drivesCreated).toBe(3);
    // The timed-out field is -1 (sentinel)
    expect(data.jobsFailed).toBe(-1);
  });

  it("T3: uses ::job_status cast in failed jobs query", async () => {
    const capturedQueries: string[] = [];
    mockExecute.mockImplementation(async (q: any) => {
      const queryStr = q.queryChunks?.map((c: any) => c.value ?? "").join("") ?? "";
      capturedQueries.push(queryStr);
      return [{ count: 0 }];
    });

    const { GET } = await import("@/app/api/admin/health/route");
    await GET();

    const failedQuery = capturedQueries.find(q => q.includes("failed"));
    expect(failedQuery).toBeDefined();
    expect(failedQuery).toContain("job_status");
  });

  it("T4: all values are numbers (never undefined/NaN)", async () => {
    mockExecute.mockResolvedValue([{ count: 7 }]);
    const { GET } = await import("@/app/api/admin/health/route");
    const res = await GET();
    const data = await res.json();
    const numFields = ["totalStudents","studentsOnboarded","drivesCreated","jobsPending"];
    for (const f of numFields) {
      expect(typeof data[f]).toBe("number");
      expect(isNaN(data[f])).toBe(false);
    }
  });

  it("T5: redis not configured returns redisOk=false without throwing", async () => {
    const { GET } = await import("@/app/api/admin/health/route");
    const res = await GET();
    const data = await res.json();
    expect(data.redisOk).toBe(false); // Redis not mocked = null = false
    expect(res.status).toBe(200);
  });
});
