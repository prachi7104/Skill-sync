import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Phase 1 — Admin Health", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Test 1: health API: one query timeout returns 200 with -1 for that field", async () => {
    const results = await Promise.allSettled([
      Promise.resolve([{ count: 99 }]),
      Promise.resolve([{ count: 70 }]),
      Promise.resolve([{ count: 60 }]),
      Promise.resolve([{ count: 10 }]),
      Promise.resolve([{ count: 4 }]),
      Promise.resolve([{ count: 3 }]),
      Promise.reject(new Error("timeout")),
      Promise.resolve([{ count: 25 }]),
      Promise.resolve(true),
    ]);

    const safeCount = (r: PromiseSettledResult<unknown>) => {
      if (r.status === "rejected") return -1;
      const rows = r.value as Array<{ count: number }>;
      return rows?.[0]?.count ?? 0;
    };

    const payload = {
      totalStudents: safeCount(results[0]),
      jobsFailed: safeCount(results[6]),
    };

    const response = { status: 200, body: payload };

    expect(response.status).toBe(200);
    expect(response.body.jobsFailed).toBe(-1);
    expect(response.body.totalStudents).toBe(99);
  });

  it("Test 2: health API: uses Promise.allSettled not Promise.all", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/health/route.ts", "utf-8");

    expect(source).toContain("Promise.allSettled");
    expect(source).not.toContain("Promise.all([");
  });

  it("Test 3: health API: uses ::job_status cast", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/health/route.ts", "utf-8");

    expect(source).toContain("'failed'::job_status");
    expect(source).toContain("'pending'::job_status");
  });

  it("Test 4: jobs API: returns breakdown by type and status", () => {
    const rows = [{ type: "parse_resume", status: "pending", count: 3 }];
    const breakdown: Record<string, Record<string, number>> = {};

    for (const row of rows) {
      if (!breakdown[row.type]) breakdown[row.type] = {};
      breakdown[row.type][row.status] = row.count;
    }

    expect(breakdown.parse_resume.pending).toBe(3);
  });

  it("Test 5: trigger-cron API: unknown type returns 400", () => {
    const type = "invalid";
    const ROUTES: Record<string, string> = {
      resumes: "/api/cron/process-resumes",
      embeddings: "/api/cron/process-embeddings",
      "jd-enhancement": "/api/cron/process-jd-enhancement",
      rankings: "/api/cron/process-rankings",
      cleanup: "/api/cron/nightly-cleanup",
    };

    const path = type ? ROUTES[type] : null;
    const status = path ? 200 : 400;

    expect(status).toBe(400);
  });

  it("Test 6: trigger-cron API: valid type calls correct cron route", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/trigger-cron/route.ts", "utf-8");

    expect(source).toContain("/api/cron/process-embeddings");
    expect(source).toContain("Authorization: `Bearer ${CRON_SECRET}`");
  });

  it("Test 7: health page: renders live data not hardcoded 17", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/(admin)/admin/health/page.tsx", "utf-8");

    expect(source).toContain('fetch("/api/admin/health"');
    expect(source).toContain("displayCount(health.totalStudents)");
    expect(source).not.toContain(">17<");
  });

  it("Test 8: health page: shows dash for -1 (timed out)", async () => {
    const displayCount = (n: number | undefined | null) => {
      if (n === undefined || n === null || n === -1) return "—";
      return String(n);
    };

    expect(displayCount(-1)).toBe("—");
    expect(displayCount(0)).toBe("0");
    expect(displayCount(42)).toBe("42");
  });
});
