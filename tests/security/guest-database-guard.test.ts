// @vitest-environment node
import { NextRequest, type NextFetchEvent } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import middleware from "@/middleware";
import { guestAccessEnabled, guestDatabaseApproved } from "@/lib/demo/config";
import { assertDemoTarget } from "../../scripts/demo/target-guard";

const { institutional, getToken } = vi.hoisted(() => ({ institutional: vi.fn(), getToken: vi.fn() }));
vi.mock("next-auth/middleware", () => ({ withAuth: () => institutional }));
vi.mock("next-auth/jwt", () => ({ getToken }));

// Fictional project refs: guest mode must never run on a database nobody approved for guest data.
const DEMO = "demodemodemodemodemo";
const OTHER = "institutionalrefabcd";
const pooler = (ref: string) => `postgresql://postgres.${ref}:pw@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`; // credential-check: allow
const direct = (ref: string) => `postgresql://postgres:pw@db.${ref}.supabase.co:5432/postgres`; // credential-check: allow

afterEach(() => { vi.unstubAllEnvs(); institutional.mockReset(); getToken.mockReset(); });

describe("guest database guard", () => {
  it("allows loopback databases and an absent database", () => {
    for (const url of [undefined, "", "postgresql://u:p@127.0.0.1:5432/db", "postgresql://u:p@localhost/db", "postgresql://u:p@[::1]:5432/db"]) { // credential-check: allow
      expect(guestDatabaseApproved({ DATABASE_URL: url })).toBe(true);
    }
  });

  it("refuses any hosted database unless its project ref is named as the guest database", () => {
    expect(guestDatabaseApproved({ DATABASE_URL: pooler(OTHER) })).toBe(false);
    expect(guestDatabaseApproved({ DATABASE_URL: direct(OTHER) })).toBe(false);
    expect(guestDatabaseApproved({ DATABASE_URL: "postgresql://u:p@db.example.com/db" })).toBe(false);
    expect(guestDatabaseApproved({ DATABASE_URL: pooler(OTHER), GUEST_DATABASE_PROJECT_REF: DEMO })).toBe(false);
    expect(guestDatabaseApproved({ DATABASE_URL: "not a url", GUEST_DATABASE_PROJECT_REF: DEMO })).toBe(false);
  });

  it("accepts the named demo project through the pooler or a direct connection", () => {
    expect(guestDatabaseApproved({ DATABASE_URL: pooler(DEMO), GUEST_DATABASE_PROJECT_REF: DEMO })).toBe(true);
    expect(guestDatabaseApproved({ DATABASE_URL: direct(DEMO), GUEST_DATABASE_PROJECT_REF: DEMO })).toBe(true);
  });

  it("refuses a guest ref that is malformed or equal to the institutional ref", () => {
    expect(guestDatabaseApproved({ DATABASE_URL: pooler(DEMO), GUEST_DATABASE_PROJECT_REF: "short" })).toBe(false);
    expect(guestDatabaseApproved({
      DATABASE_URL: pooler(DEMO), GUEST_DATABASE_PROJECT_REF: DEMO, INSTITUTIONAL_DATABASE_PROJECT_REF: DEMO,
    })).toBe(false);
  });

  it("always refuses the institutional production project, even when it is named as the guest database", () => {
    const PROD = "egpolgptmeuxxkiqyozp";
    expect(guestDatabaseApproved({ DATABASE_URL: pooler(PROD), GUEST_DATABASE_PROJECT_REF: PROD })).toBe(false);
    expect(guestDatabaseApproved({ DATABASE_URL: direct(PROD), GUEST_DATABASE_PROJECT_REF: PROD.toUpperCase() })).toBe(false);
    expect(guestAccessEnabled({ ENABLE_GUEST_ACCESS: "true", DATABASE_URL: pooler(PROD), GUEST_DATABASE_PROJECT_REF: PROD })).toBe(false);
  });

  it("refuses a deployment whose Supabase URL points at a different project than the guest database", () => {
    const supa = (ref: string) => `https://${ref}.supabase.co`;
    const base = { DATABASE_URL: pooler(DEMO), GUEST_DATABASE_PROJECT_REF: DEMO };
    expect(guestDatabaseApproved({ ...base, SUPABASE_URL: supa(DEMO), NEXT_PUBLIC_SUPABASE_URL: supa(DEMO) })).toBe(true);
    expect(guestDatabaseApproved({ ...base, SUPABASE_URL: supa(OTHER) })).toBe(false);
    expect(guestDatabaseApproved({ ...base, NEXT_PUBLIC_SUPABASE_URL: supa(OTHER) })).toBe(false);
    expect(guestDatabaseApproved({ ...base, SUPABASE_URL: "not a url" })).toBe(false);
  });

  it("keeps guest access off when the flag is set but the database is not approved", () => {
    expect(guestAccessEnabled({ ENABLE_GUEST_ACCESS: "true", DATABASE_URL: pooler(OTHER) })).toBe(false);
    expect(guestAccessEnabled({ ENABLE_GUEST_ACCESS: "true", DATABASE_URL: pooler(DEMO), GUEST_DATABASE_PROJECT_REF: DEMO })).toBe(true);
    expect(guestAccessEnabled({ ENABLE_GUEST_ACCESS: "false", DATABASE_URL: "postgresql://u:p@127.0.0.1/db" })).toBe(false);
  });

  it("the demo migration script only targets the confirmed demo project, never production", () => {
    const PROD = "egpolgptmeuxxkiqyozp";
    expect(() => assertDemoTarget(PROD, PROD, PROD)).toThrow(/institutional production project/);
    expect(() => assertDemoTarget(DEMO, undefined, DEMO)).toThrow(/GUEST_DATABASE_PROJECT_REF/);
    expect(() => assertDemoTarget(DEMO, OTHER, DEMO)).toThrow(/GUEST_DATABASE_PROJECT_REF/);
    expect(() => assertDemoTarget(DEMO, DEMO, undefined)).toThrow(/--confirm-ref/);
    expect(() => assertDemoTarget("127.0.0.1", "127.0.0.1", "127.0.0.1")).toThrow(/not a Supabase project ref/);
    expect(() => assertDemoTarget(DEMO, DEMO, DEMO)).not.toThrow();
  });

  it.each(["/guest", "/guest/student", "/api/demo/overview"])("middleware 404s %s on an unapproved database", async (path) => {
    getToken.mockResolvedValue(null);
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    vi.stubEnv("DATABASE_URL", pooler(OTHER));
    const res = await middleware(new NextRequest(`http://localhost:3000${path}`), {} as NextFetchEvent);
    expect(res?.status).toBe(404);
  });
});
