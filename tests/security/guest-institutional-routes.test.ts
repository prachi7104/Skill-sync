// @vitest-environment node
/**
 * Institutional routes that read the NextAuth session directly must refuse a
 * guest session themselves, not rely on the middleware alone.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), select: vi.fn(), rateLimit: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/lib/redis", () => ({ redisRateLimit: mocks.rateLimit }));
vi.mock("@/lib/guardrails", () => ({ enforceSandboxLimits: vi.fn(), enforceProfileGate: vi.fn(), incrementSandboxUsage: vi.fn() }));

const guest = { user: { id: "g", email: "recruiter@x.demo.invalid", role: "faculty", isGuest: true } };
const post = (path: string) =>
  new NextRequest(`http://localhost:3000${path}`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });

beforeEach(() => vi.resetAllMocks());

describe("institutional routes refuse guest sessions", () => {
  it("change-password returns 403 before touching the database or rate limiter", async () => {
    mocks.session.mockResolvedValue(guest);
    const { POST } = await import("@/app/api/auth/change-password/route");
    expect((await POST(post("/api/auth/change-password"))).status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("student sandbox returns 403 before touching the database", async () => {
    mocks.session.mockResolvedValue({ user: { ...guest.user, role: "student", email: "student@x.demo.invalid" } });
    const { POST } = await import("@/app/api/student/sandbox/route");
    expect((await POST(post("/api/student/sandbox"))).status).toBe(403);
    expect(mocks.select).not.toHaveBeenCalled();
  });
});
