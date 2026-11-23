// @vitest-environment node
/**
 * Auth redirect targets must point at the real sign-in page.
 *
 * The sign-in page is the root route ("/"); /login does not exist and returns 404.
 * These tests exercise the real authOptions and requireAuth (not inlined copies),
 * so a stale path in lib/auth/config.ts or lib/auth/helpers.ts fails here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

const { mockDb, mockGetCachedSession, mockRedirect } = vi.hoisted(() => ({
  mockDb: {
    query: { users: { findFirst: vi.fn() } },
    execute: vi.fn(),
  },
  mockGetCachedSession: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/env", () => ({
  STUDENT_EMAIL_DOMAIN: "stu.upes.ac.in",
  MICROSOFT_CLIENT_ID: "mock-client-id",
  MICROSOFT_CLIENT_SECRET: "mock-client-secret",
}));
vi.mock("@/lib/auth/session-cache", () => ({ getCachedSession: mockGetCachedSession }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

import { authOptions } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";

type SignInArgs = Parameters<NonNullable<NonNullable<typeof authOptions.callbacks>["signIn"]>>[0];
const signIn = (email: string) =>
  authOptions.callbacks!.signIn!({
    user: { id: "u1", email, name: "Test User" },
    account: { provider: "azure-ad", type: "oauth", providerAccountId: "ms-1" },
  } as SignInArgs);

const appRoot = path.resolve(__dirname, "../../app");
const hasPage = (route: string) =>
  existsSync(path.join(appRoot, route, "page.tsx")) || existsSync(path.join(appRoot, route, "page.ts"));

describe("auth redirect targets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("serves the sign-in page at / and has no /login page", () => {
    expect(hasPage("")).toBe(true);
    expect(hasPage("login")).toBe(false);
  });

  it("sends NextAuth sign-in and error pages to the root sign-in page", () => {
    expect(authOptions.pages).toEqual({ signIn: "/", error: "/" });
  });

  it("rejects a Microsoft account from an unknown domain back to / with NotAuthorized", async () => {
    mockDb.query.users.findFirst.mockResolvedValue(undefined);
    mockDb.execute.mockResolvedValue([]); // no college for this domain
    await expect(signIn("someone@unknown.example")).resolves.toBe("/?error=NotAuthorized");
  });

  it("sends a sign-in database failure back to / with DatabaseError", async () => {
    mockDb.query.users.findFirst.mockRejectedValue(new Error("db down"));
    await expect(signIn("student.1@stu.upes.ac.in")).resolves.toBe("/?error=DatabaseError");
  });

  it("redirects an unauthenticated server request to /", async () => {
    mockGetCachedSession.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("does not redirect an authenticated user", async () => {
    mockGetCachedSession.mockResolvedValue({
      user: { id: "u1", email: "a@b.c", name: "A", role: "admin", collegeId: null },
    });
    await expect(requireAuth()).resolves.toMatchObject({ id: "u1", role: "admin" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
