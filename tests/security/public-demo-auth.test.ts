// @vitest-environment node
/**
 * Auth configuration with guest mode off and on. The institutional assertions
 * (providers, Microsoft domain admission, staff password and role checks) must
 * hold either way; the guest provider must exist only behind the flag and must
 * never yield an institutional or admin identity.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { encode } from "next-auth/jwt";
import { guestCredentialsProvider, applyGuestJwt, isLiveGuestToken, type GuestDirectory } from "@/lib/demo/guest-auth";

const { database, comparePassword, writeWhere, insertValues } = vi.hoisted(() => {
  const writeWhere = vi.fn();
  const insertValues = vi.fn();
  return {
    writeWhere,
    insertValues,
    comparePassword: vi.fn(),
    database: {
      query: { users: { findFirst: vi.fn() }, students: { findFirst: vi.fn() } },
      execute: vi.fn(),
      insert: vi.fn(() => ({ values: insertValues })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: writeWhere })) })),
    },
  };
});

vi.mock("@/lib/db", () => ({ db: database }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/request-context", () => ({ incrementDbQuery: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: comparePassword } }));
vi.mock("@/lib/demo/workspace", () => ({ provisionDemoWorkspace: vi.fn(), switchDemoIdentity: vi.fn() }));

const SECRET = "test-secret-for-guest-tokens-0123456789";

function account(provider: string): Account {
  return { provider, type: provider === "azure-ad" ? "oauth" : "credentials", providerAccountId: "mock-provider-id" };
}

function effectiveProviders(options: NextAuthOptions) {
  return options.providers.map((provider) => provider.type === "credentials"
    ? { ...provider, ...provider.options }
    : provider);
}

/** authOptions is built at import time from the flag, so re-import per case. */
async function loadAuth(guestFlag: string | undefined) {
  vi.resetModules();
  vi.stubEnv("ENABLE_GUEST_ACCESS", guestFlag);
  return (await import("@/lib/auth/config")).authOptions;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXTAUTH_SECRET", SECRET);
  writeWhere.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe.each([
  ["off", undefined],
  ["set to a non-exact value", "TRUE"],
  ["on", "true"],
])("Institutional auth with guest mode %s", (_label, flag) => {
  const guestExpected = flag === "true";

  it("keeps the institutional providers, pages and session lifetime", async () => {
    const options = await loadAuth(flag);
    expect(effectiveProviders(options).map((provider) => provider.id))
      .toEqual(guestExpected ? ["azure-ad", "staff-credentials", "guest"] : ["azure-ad", "staff-credentials"]);
    // The login page lives at "/" (there is no /login route).
    expect(options.pages).toEqual({ signIn: "/", error: "/" });
    expect(options.session).toEqual({ strategy: "jwt", maxAge: 30 * 24 * 60 * 60 });
  });

  it("keeps Microsoft domain admission, student provisioning and JWT onboarding", async () => {
    const { signIn, jwt } = (await loadAuth(flag)).callbacks!;
    const user = { id: "oauth-id", email: "Student.123456@STU.UPES.AC.IN", name: "Student" };
    const oauth = account("azure-ad");
    database.query.users.findFirst.mockResolvedValueOnce(undefined);
    database.execute.mockResolvedValueOnce([]);
    await expect(signIn!({ user, account: oauth })).resolves.toBe("/?error=NotAuthorized");
    expect(database.insert).not.toHaveBeenCalled();

    const identity = { ...user, id: "institutional-user", email: user.email.toLowerCase(), collegeId: "institutional-college", role: "student" };
    database.query.users.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(identity);
    database.execute.mockResolvedValueOnce([{ id: identity.collegeId }]);
    insertValues.mockReturnValueOnce({ returning: vi.fn().mockResolvedValue([identity]) });
    await expect(signIn!({ user, account: oauth })).resolves.toBe(true);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ role: "student", collegeId: identity.collegeId }));
    expect(insertValues).toHaveBeenCalledWith({ id: identity.id, collegeId: identity.collegeId, sapId: "500123456" });
    database.query.students.findFirst.mockResolvedValue({ rollNo: "123", cgpa: 8, branch: "CSE", batchYear: 2026, tenthPercentage: 80, twelfthPercentage: 85 });
    await expect(jwt!({ token: {} as JWT, user, account: oauth })).resolves.toMatchObject({ id: identity.id, role: "student", collegeId: identity.collegeId, onboardingComplete: true });
  });

  it("keeps password checks and role restrictions for staff", async () => {
    const options = await loadAuth(flag);
    const staff = effectiveProviders(options).find((provider) => provider.id === "staff-credentials");
    if (!staff || staff.type !== "credentials") throw new Error("Missing staff provider");
    const user = { id: "staff-id", email: "staff@example.invalid", name: "Staff", passwordHash: "hash" };
    const login = { email: ` ${user.email.toUpperCase()} `, password: "password" };
    const request = {};
    database.query.users.findFirst.mockResolvedValueOnce({ ...user, role: "student" });
    await expect(staff.authorize(login, request)).resolves.toBeNull();
    expect(comparePassword).not.toHaveBeenCalled();
    database.query.users.findFirst.mockResolvedValue({ ...user, role: "faculty" });
    comparePassword.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(staff.authorize(login, request)).resolves.toBeNull();
    await expect(staff.authorize(login, request)).resolves.toEqual({ id: user.id, email: user.email, name: user.name, role: "faculty" });
    expect(comparePassword).toHaveBeenCalledWith(login.password, user.passwordHash);
    expect(database.update).toHaveBeenCalledTimes(1);
    await expect(options.callbacks!.signIn!({ user, account: account("staff-credentials") })).resolves.toBe(true);
  });

  it("does not accept guest sign-ins or guest tokens unless the flag is on", async () => {
    const { signIn, jwt } = (await loadAuth(flag)).callbacks!;
    const expiresAt = Date.now() + 60_000;
    const guestUser = { id: "g1", collegeId: "c1", role: "student", isGuest: true, guestExpiresAt: expiresAt, email: "student@c1.demo.invalid", name: "Guest" } as User;
    await expect(signIn!({ user: guestUser, account: account("guest") })).resolves.toBe(guestExpected);
    const token = await jwt!({ token: {} as JWT, user: guestUser, account: account("guest") });
    if (guestExpected) expect(token).toMatchObject({ id: "g1", isGuest: true, guestExpiresAt: expiresAt });
    else expect(token).toEqual({});
    // A guest token never triggers institutional lookups.
    expect(database.query.users.findFirst).not.toHaveBeenCalled();
  });
});

describe("Guest credential provider", () => {
  const now = Date.now();
  const identity = (n: number) => ({ id: `guest-${n}`, collegeId: `college-${n}`, email: `student@college-${n}.demo.invalid`, name: "Guest", expiresAt: now + 60_000 });
  const directory = () => ({
    provision: vi.fn<GuestDirectory["provision"]>(),
    switchTo: vi.fn<GuestDirectory["switchTo"]>(),
  });
  const authorize = (dir: GuestDirectory, credentials: Record<string, string>, cookie?: string) => {
    const provider = guestCredentialsProvider(dir);
    const opts = provider.options as unknown as { authorize: (c: Record<string, string>, r: unknown) => Promise<User | null> };
    return opts.authorize(credentials, { headers: cookie ? { cookie } : {} });
  };

  it("only accepts student or recruiter and ignores submitted role or college", async () => {
    const dir = directory();
    dir.provision.mockResolvedValueOnce(identity(1)).mockResolvedValueOnce(identity(2));
    await expect(authorize(dir, { kind: "admin" })).resolves.toBeNull();
    expect(dir.provision).not.toHaveBeenCalled();
    const recruiter = await authorize(dir, { kind: "recruiter", role: "admin", collegeId: "institutional-college" });
    const student = await authorize(dir, { kind: "student" });
    expect(recruiter).toMatchObject({ id: "guest-1", collegeId: "college-1", role: "faculty", isGuest: true });
    expect(student).toMatchObject({ id: "guest-2", collegeId: "college-2", role: "student", isGuest: true });
    expect(dir.provision.mock.calls).toEqual([["recruiter"], ["student"]]);
  });

  it("rejects identities that are not guest-domain, expired or too long-lived", async () => {
    const dir = directory();
    dir.provision
      .mockResolvedValueOnce({ ...identity(1), email: "real@stu.upes.ac.in" })
      .mockResolvedValueOnce({ ...identity(1), expiresAt: now - 1 })
      .mockResolvedValueOnce({ ...identity(1), expiresAt: now + 48 * 60 * 60 * 1000 })
      .mockResolvedValueOnce(null);
    for (let i = 0; i < 4; i++) await expect(authorize(dir, { kind: "student" })).resolves.toBeNull();
  });

  it("switches role only from a live guest cookie, using the cookie's workspace", async () => {
    const dir = directory();
    dir.switchTo.mockResolvedValue(identity(1));
    // No cookie, or an institutional cookie: refused without a lookup.
    await expect(authorize(dir, { kind: "recruiter", switch: "true" })).resolves.toBeNull();
    const staffCookie = await encode({ token: { id: "staff", role: "admin", collegeId: "inst" } as JWT, secret: SECRET });
    await expect(authorize(dir, { kind: "recruiter", switch: "true" }, `next-auth.session-token=${staffCookie}`)).resolves.toBeNull();
    const expired = await encode({ token: { id: "guest-1", collegeId: "college-1", role: "student", isGuest: true, guestExpiresAt: now - 1 } as JWT, secret: SECRET });
    await expect(authorize(dir, { kind: "recruiter", switch: "true" }, `next-auth.session-token=${expired}`)).resolves.toBeNull();
    expect(dir.switchTo).not.toHaveBeenCalled();

    const live = await encode({ token: { id: "guest-1", collegeId: "college-1", role: "student", isGuest: true, guestExpiresAt: now + 60_000 } as JWT, secret: SECRET });
    const switched = await authorize(dir, { kind: "recruiter", switch: "true", collegeId: "other" }, `next-auth.session-token=${live}`);
    expect(switched).toMatchObject({ role: "faculty", collegeId: "college-1" });
    expect(dir.switchTo).toHaveBeenCalledWith("recruiter", { id: "guest-1", collegeId: "college-1" });
    expect(dir.provision).not.toHaveBeenCalled();
  });

  it("guest JWTs lapse at the workspace expiry and the session carries that expiry", async () => {
    vi.useFakeTimers();
    const options = await loadAuth("true");
    const { jwt, session } = options.callbacks!;
    const expiry = Date.now() + 60_000;
    const user = { id: "guest-1", collegeId: "college-1", role: "faculty", isGuest: true, guestExpiresAt: expiry, email: "recruiter@college-1.demo.invalid", name: "Guest" } as User;
    const token = await jwt!({ token: {} as JWT, user, account: account("guest") });
    await expect(session!({ session: { user: {} } as Session, token } as Parameters<NonNullable<typeof session>>[0])).resolves.toMatchObject({
      user: { id: "guest-1", role: "faculty", collegeId: "college-1", isGuest: true },
      expires: new Date(expiry).toISOString(),
    });
    vi.setSystemTime(expiry);
    await expect(jwt!({ token } as Parameters<NonNullable<typeof jwt>>[0])).resolves.toEqual({});
  });

  it("isLiveGuestToken and applyGuestJwt refuse tampered roles", () => {
    const base = { id: "g", collegeId: "c", isGuest: true, guestExpiresAt: Date.now() + 1000 };
    expect(isLiveGuestToken({ ...base, role: "student" })).toBe(true);
    expect(isLiveGuestToken({ ...base, role: "admin" } as unknown as JWT)).toBe(false);
    expect(applyGuestJwt({ ...base, role: "admin" } as unknown as JWT, undefined)).toBeNull();
    // Institutional tokens pass through untouched.
    const staff = { id: "s", role: "admin" } as unknown as JWT;
    expect(applyGuestJwt(staff, undefined)).toBe(staff);
  });
});
