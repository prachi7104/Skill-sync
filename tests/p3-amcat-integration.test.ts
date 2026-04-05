import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getStudentLeaderboard } from "@/app/api/student/amcat/leaderboard/route";
import { POST as publishSession } from "@/app/api/admin/amcat/[sessionId]/publish/route";
import { PUT as overrideResult } from "@/app/api/admin/amcat/[sessionId]/route";

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/amcat/permissions", () => ({
  hasAmcatManagementPermission: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({
  requireRole: vi.fn(),
}));

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { hasAmcatManagementPermission } from "@/lib/amcat/permissions";
import { requireRole } from "@/lib/auth/helpers";

const executeMock = vi.mocked(db.execute);
const getServerSessionMock = vi.mocked(getServerSession);
const hasAmcatPermissionMock = vi.mocked(hasAmcatManagementPermission);
const requireRoleMock = vi.mocked(requireRole);

describe("Phase 3 AMCAT API integration behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/student/amcat/leaderboard should return hasData=false when no published session exists", async () => {
    requireRoleMock.mockResolvedValue({ id: "student-1", role: "student", collegeId: "college-1" } as never);
    executeMock.mockResolvedValueOnce([] as never);

    const req = new NextRequest("http://localhost/api/student/amcat/leaderboard");
    const res = await getStudentLeaderboard(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasData).toBe(false);
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it("GET /api/student/amcat/leaderboard should return top50 + myRank payload", async () => {
    requireRoleMock.mockResolvedValue({ id: "student-1", role: "student", collegeId: "college-1" } as never);

    executeMock
      .mockResolvedValueOnce([
        {
          id: "session-1",
          session_name: "AMCAT Oct 2025",
          total_students: 300,
          alpha_count: 120,
          beta_count: 110,
          gamma_count: 70,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "session-1",
          session_name: "AMCAT Oct 2025",
          total_students: 300,
          alpha_count: 120,
          beta_count: 110,
          gamma_count: 70,
        },
      ] as never)
      .mockResolvedValueOnce([
        { rank: 1, name: "Top Student", branch: "CSE", score: 95, category: "alpha" },
      ] as never)
      .mockResolvedValueOnce([{ rank: 74, score: 51, category: "beta" }] as never)
      .mockResolvedValueOnce([{ branch: "CSE" }, { branch: "AIML" }] as never)
      .mockResolvedValueOnce([
        { id: "session-1", session_name: "AMCAT Oct 2025", batch_year: 2026 },
      ] as never);

    const req = new NextRequest("http://localhost/api/student/amcat/leaderboard");
    const res = await getStudentLeaderboard(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasData).toBe(true);
    expect(body.top50).toHaveLength(1);
    expect(body.myRank.rank).toBe(74);
    expect(body.isInTop50).toBe(false);
    expect(executeMock).toHaveBeenCalledTimes(6);
  });

  it("POST /api/admin/amcat/[sessionId]/publish should reject when permission missing", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin-1", collegeId: "college-1" } } as never);
    hasAmcatPermissionMock.mockResolvedValue(false);

    const req = new NextRequest("http://localhost/api/admin/amcat/session-1/publish", { method: "POST" });
    const res = await publishSession(req, { params: { sessionId: "session-1" } });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("Forbidden");
  });

  it("POST /api/admin/amcat/[sessionId]/publish should return conflict for already-published sessions", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin-1", collegeId: "college-1" } } as never);
    hasAmcatPermissionMock.mockResolvedValue(true);
    executeMock.mockResolvedValueOnce([{ id: "session-1", status: "published" }] as never);

    const req = new NextRequest("http://localhost/api/admin/amcat/session-1/publish", { method: "POST" });
    const res = await publishSession(req, { params: { sessionId: "session-1" } });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain("already published");
  });

  it("PUT /api/admin/amcat/[sessionId] should validate override payload", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "admin-1", collegeId: "college-1" } } as never);
    hasAmcatPermissionMock.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/admin/amcat/session-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ finalCategory: "alpha" }),
    });

    const res = await overrideResult(req, { params: { sessionId: "session-1" } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("resultId");
  });
});
