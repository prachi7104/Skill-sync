import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecute = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { execute: mockExecute },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", collegeId: "college-1" },
  }),
}));

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}));

vi.mock("@/lib/amcat/permissions", () => ({
  hasAmcatManagementPermission: vi.fn().mockResolvedValue(true),
}));

describe("Phase 4 — AMCAT leaderboard", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it("leaderboard query does not contain alpha_count FROM sessions", async () => {
    const fs = await import("fs");

    const files = [
      "app/api/admin/amcat/route.ts",
      "app/api/student/amcat/leaderboard/route.ts",
      "app/(student)/student/leaderboard/page.tsx",
    ];

    for (const file of files) {
      const source = fs.readFileSync(file, "utf-8");
      expect(source).not.toContain("s.alpha_count");
    }
  });

  it("leaderboard query uses COUNT CASE WHEN for category distribution", async () => {
    const fs = await import("fs");
    const adminSource = fs.readFileSync("app/api/admin/amcat/route.ts", "utf-8");
    const studentSource = fs.readFileSync("app/api/student/amcat/leaderboard/route.ts", "utf-8");

    expect(adminSource).toContain("COUNT(CASE WHEN r.final_category = 'alpha'");
    expect(studentSource).toContain("COUNT(CASE WHEN r.final_category = 'alpha'");
  });

  it("GET /api/admin/amcat returns 200", async () => {
    mockExecute.mockResolvedValue([
      {
        id: "session-1",
        session_name: "AMCAT March",
        test_date: "2026-03-01",
        batch_year: 2026,
        academic_year: "2025-26",
        status: "draft",
        total_students: 10,
        score_weights: {},
        category_thresholds: {},
        published_at: null,
        created_at: "2026-03-01T00:00:00.000Z",
        alpha_count: 2,
        beta_count: 5,
        gamma_count: 3,
        matched_count: 10,
      },
    ]);

    const { GET } = await import("@/app/api/admin/amcat/route");
    const res = await GET({} as any);

    expect(res.status).toBe(200);
  });

  it("DELETE /api/admin/amcat removes all sessions for college", async () => {
    mockExecute.mockResolvedValue([
      { id: "session-1" },
      { id: "session-2" },
    ]);

    const { DELETE } = await import("@/app/api/admin/amcat/route");
    const res = await DELETE({} as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.deletedSessions).toBe(2);
  });
});
