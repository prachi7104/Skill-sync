import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({ del: vi.fn().mockResolvedValue(1) })),
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PUT } from "@/app/api/admin/staff/[userId]/permissions/route";

const getServerSessionMock = vi.mocked(getServerSession);
const executeMock = vi.mocked(db.execute);

describe("Phase 4c — Staff Permissions Fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue([] as never);
  });

  it("Test 1: PUT permissions returns 200 with updated components", async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: "admin", collegeId: "college-1" } } as never);

    const req = new NextRequest("http://localhost/api/admin/staff/u1/permissions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grantedComponents: ["drive_management", "amcat_management"],
      }),
    });

    const res = await PUT(req, { params: { userId: "u1" } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.grantedComponents).toContain("drive_management");
    expect(body.grantedComponents).toContain("amcat_management");
    expect(body.grantedComponents).toContain("sandbox_access");
  });

  it("Test 2: PUT permissions always includes sandbox_access", async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: "admin", collegeId: "college-1" } } as never);

    const req = new NextRequest("http://localhost/api/admin/staff/u1/permissions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grantedComponents: [] }),
    });

    const res = await PUT(req, { params: { userId: "u1" } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.grantedComponents).toContain("sandbox_access");
  });

  it("Test 3: PUT permissions forbidden for non-admin", async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: "faculty", collegeId: "college-1" } } as never);

    const req = new NextRequest("http://localhost/api/admin/staff/u1/permissions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grantedComponents: ["drive_management"] }),
    });

    const res = await PUT(req, { params: { userId: "u1" } });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("Test 4: source does NOT contain ::staff_component[] pattern", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/api/admin/staff/[userId]/permissions/route.ts", "utf-8");

    expect(source).not.toContain("::staff_component[]");
    expect(source).toContain("ARRAY[");
  });

  it("Test 5: PUT permissions with invalid grantedComponents returns 400", async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: "admin", collegeId: "college-1" } } as never);

    const req = new NextRequest("http://localhost/api/admin/staff/u1/permissions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grantedComponents: "not_an_array" }),
    });

    const res = await PUT(req, { params: { userId: "u1" } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("grantedComponents must be an array");
  });
});
