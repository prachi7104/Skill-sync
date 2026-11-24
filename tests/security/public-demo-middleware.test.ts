// @vitest-environment node
import { NextRequest, type NextFetchEvent } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import middleware from "@/middleware";
import { isGuestAllowedPath } from "@/lib/demo/config";

const { institutional, getToken } = vi.hoisted(() => ({ institutional: vi.fn(), getToken: vi.fn() }));
vi.mock("next-auth/middleware", () => ({ withAuth: () => institutional }));
vi.mock("next-auth/jwt", () => ({ getToken }));

const route = (path: string) => middleware(new NextRequest(`http://localhost:3000${path}`), {} as NextFetchEvent);
const guestToken = (role: "student" | "faculty") => ({ id: "g", collegeId: "c", role, isGuest: true, guestExpiresAt: Date.now() + 60_000 });
const passes = (res: unknown) => res instanceof Response &&
  res.headers.get("x-middleware-next") === "1";

beforeEach(() => getToken.mockResolvedValue(null));
afterEach(() => { vi.unstubAllEnvs(); institutional.mockReset(); getToken.mockReset(); });

describe("Guest middleware", () => {
  it.each(["/guest", "/guest/student", "/guest/recruiter", "/api/demo/overview"])("404s %s unless the flag is exactly true", async (path) => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", undefined);
    expect((await route(path))?.status).toBe(404);
    vi.stubEnv("ENABLE_GUEST_ACCESS", "TRUE");
    expect((await route(path))?.status).toBe(404);
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    expect(passes(await route(path))).toBe(true);
    expect(institutional).not.toHaveBeenCalled();
  });

  it.each([
    "/api/auth/change-password", "/api/admin/ai-models", "/api/admin/students", "/api/drives", "/api/drives/x.js",
    "/api/drives/logo.png", "/api/cron/nightly-cleanup", "/api/student/resume", "/api/faculty/drives",
    "/api/jobs/123", "/api/resources",
  ])("answers 403 to a guest calling institutional API %s", async (path) => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    getToken.mockResolvedValue(guestToken("student"));
    expect((await route(path))?.status).toBe(403);
    expect(institutional).not.toHaveBeenCalled();
  });

  it.each([
    ["/student/profile", "student", "/guest/student"],
    ["/dashboard", "student", "/guest/student"],
    ["/admin", "faculty", "/guest/recruiter"],
    ["/faculty/drives", "faculty", "/guest/recruiter"],
  ] as const)("redirects a guest away from page %s", async (path, role, target) => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    getToken.mockResolvedValue(guestToken(role));
    const res = await route(path) as Response;
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe(target);
    expect(institutional).not.toHaveBeenCalled();
  });

  it.each(["/", "/guest/student", "/api/demo/resume", "/api/auth/session", "/api/auth/csrf", "/api/auth/callback/guest",
    "/api/auth/signout", "/favicon.ico", "/manifest.json", "/icons/icon-192.png"])("lets a guest reach %s", async (path) => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    getToken.mockResolvedValue(guestToken("student"));
    expect(passes(await route(path))).toBe(true);
  });

  it.each(["/api/drives", "/api/jobs/123", "/api/resources", "/api/seasons/123", "/api/admin/ai-models", "/student/profile"])(
    "delegates %s to institutional authentication for non-guests", async (path) => {
      vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
      await route(path);
      expect(institutional).toHaveBeenCalledTimes(1);
    });

  it("leaves institutional routes untouched when guest mode is off", async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", undefined);
    await route("/student/profile");
    await route("/api/admin/ai-models");
    expect(institutional).toHaveBeenCalledTimes(2);
    expect(passes(await route("/api/auth/change-password"))).toBe(true);
  });
});

describe("isGuestAllowedPath", () => {
  it.each(["/api/auth/change-password", "/api/auth/reset", "/api/authx/session", "/api/drives/x.js", "/api/x.png",
    "/icons/../api/admin.png", "/guestx", "/api/demox"])("blocks %s", (path) => {
    expect(isGuestAllowedPath(path)).toBe(false);
  });
});
