import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock auth helpers ──────────────────────────────────────────────────────
// We mock getCurrentUser / requireRole / requireAuth to simulate
// unauthenticated and wrong-role scenarios.

const mockGetCurrentUser = vi.fn();
const mockRequireRole = vi.fn();
const mockRequireAuth = vi.fn();

vi.mock("@/lib/auth/helpers", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  requireStudentProfile: vi.fn().mockRejectedValue(new Error("Unauthorized")),
  hasComponent: vi.fn().mockResolvedValue(true),
  requireComponent: vi.fn(),
  getCurrentCollegeId: vi.fn().mockResolvedValue("college-1"),
  getStudentProfile: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/auth/session-cache", () => ({
  getCachedSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: { jobs: { findFirst: vi.fn().mockResolvedValue(null) } },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Route Auth — /api/jobs/[id]", () => {
  it("MUST require authentication (currently FAILS — CRIT-01)", async () => {
    // This test documents that /api/jobs/[id] has NO auth check.
    // It should FAIL now and PASS after Phase 2A adds requireAuth().

    // The route handler at app/api/jobs/[id]/route.ts does not call
    // requireAuth, requireRole, or getServerSession.
    // We verify this by reading the source file content.
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/jobs/[id]/route.ts"),
      "utf-8"
    );

    // After Phase 2A fix, this line MUST be present:
    const hasAuthCheck =
      routeSource.includes("requireAuth") ||
      routeSource.includes("requireRole") ||
      routeSource.includes("getServerSession");

    expect(hasAuthCheck).toBe(true);
  });
});

describe("Route Auth — middleware matcher coverage", () => {
  it("middleware matcher MUST include /api/jobs path", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const middlewareSource = fs.readFileSync(
      path.resolve("middleware.ts"),
      "utf-8"
    );

    // The middleware matcher should cover /api/jobs
    const coversJobs =
      middlewareSource.includes('"/api/jobs/:path*"') ||
      middlewareSource.includes('"/api/jobs"');

    expect(coversJobs).toBe(true);
  });

  it("middleware matcher MUST include /api/resources path", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const middlewareSource = fs.readFileSync(
      path.resolve("middleware.ts"),
      "utf-8"
    );

    const coversResources =
      middlewareSource.includes('"/api/resources/:path*"') ||
      middlewareSource.includes('"/api/resources"');

    expect(coversResources).toBe(true);
  });

  it("middleware matcher MUST include /api/seasons path", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const middlewareSource = fs.readFileSync(
      path.resolve("middleware.ts"),
      "utf-8"
    );

    const coversSeasons =
      middlewareSource.includes('"/api/seasons/:path*"') ||
      middlewareSource.includes('"/api/seasons"');

    expect(coversSeasons).toBe(true);
  });
});

describe("Route Auth — /api/drives role enforcement", () => {
  it("should verify drives middleware blocks unauthenticated access", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const middlewareSource = fs.readFileSync(
      path.resolve("middleware.ts"),
      "utf-8"
    );

    // /api/drives is already in the matcher
    expect(middlewareSource).toContain("/api/drives/:path*");
  });
});

describe("Route Auth — /api/db-status requires admin", () => {
  it("db-status route calls requireRole(['admin'])", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/db-status/route.ts"),
      "utf-8"
    );

    expect(routeSource).toContain('requireRole(["admin"])');
  });
});

describe("Route Auth — /api/db-test requires admin", () => {
  it("db-test route calls requireRole(['admin'])", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/db-test/route.ts"),
      "utf-8"
    );

    expect(routeSource).toContain('requireRole(["admin"])');
  });
});
