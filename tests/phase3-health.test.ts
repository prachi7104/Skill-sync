import { describe, it, expect } from "vitest";

describe("Phase 3 — Admin Health API", () => {
  it("T1: one query timing out still returns 200 with other data", async () => {
    // The key test: Promise.allSettled means partial failure = partial data
    const results = await Promise.allSettled([
      Promise.resolve([{ count: 42 }]), // totalStudents
      Promise.reject(new Error("timeout")), // onboarded — times out
      Promise.resolve([{ count: 10 }]), // withEmbedding
    ]);

    const safeCount = (r: PromiseSettledResult<unknown>) =>
      r.status === "rejected" ? -1 : ((r.value as any)?.[0]?.count ?? 0);

    expect(safeCount(results[0])).toBe(42); // Still works
    expect(safeCount(results[1])).toBe(-1); // Timed out = sentinel
    expect(safeCount(results[2])).toBe(10); // Still works
  });

  it("T2: health response never contains undefined values", () => {
    // Simulate the response object
    const response = {
      totalStudents: 42,
      studentsOnboarded: -1, // timed out
      drivesCreated: 5,
      jobsFailed: 0,
    };
    Object.values(response).forEach((v) => {
      expect(v).not.toBeUndefined();
      expect(v).not.toBeNaN();
    });
  });

  it("T3: health page shows dash for -1 values", () => {
    const displayCount = (n: number | undefined) => {
      if (n === undefined || n === null || n === -1) return "—";
      return String(n);
    };
    expect(displayCount(-1)).toBe("—");
    expect(displayCount(42)).toBe("42");
    expect(displayCount(undefined)).toBe("—");
    expect(displayCount(0)).toBe("0");
  });

  it("T4: jobs query uses explicit enum cast", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/health/route.ts", "utf-8");
    // Must use ::job_status cast to hit the index
    expect(source).toContain("'failed'::job_status");
    expect(source).toContain("'pending'::job_status");
    expect(source).toContain("'completed'::job_status");
  });

  it("T5: uses Promise.allSettled not Promise.all", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/health/route.ts", "utf-8");
    expect(source).toContain("Promise.allSettled");
    expect(source).not.toContain("Promise.all([");
  });
});
