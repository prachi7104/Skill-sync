// @vitest-environment node
/** A guest-only demo deployment sends its root page to the institutional site. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`REDIRECT ${url}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/session-cache", () => ({ getCachedSession: mocks.session }));
vi.mock("@/lib/auth/helpers", () => ({ getStudentProfile: vi.fn() }));
vi.mock("@/components/auth/root-login-page", () => ({ default: () => null }));

beforeEach(() => { vi.resetModules(); mocks.redirect.mockClear(); mocks.session.mockResolvedValue(null); });
afterEach(() => vi.unstubAllEnvs());

async function home() {
  const { default: Home } = await import("@/app/page");
  return Home();
}

describe("root page on a guest demo deployment", () => {
  it("redirects signed-out visitors to the institutional site when guest access is on", async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@127.0.0.1/db"); // credential-check: allow
    vi.stubEnv("INSTITUTIONAL_SITE_URL", "https://skill-sync-iota-three.vercel.app/");
    await expect(home()).rejects.toThrow("REDIRECT https://skill-sync-iota-three.vercel.app/");
  });

  it("keeps a signed-in guest in the guest portal", async () => {
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    vi.stubEnv("INSTITUTIONAL_SITE_URL", "https://skill-sync-iota-three.vercel.app/");
    mocks.session.mockResolvedValue({ user: { isGuest: true, role: "faculty" } });
    await expect(home()).rejects.toThrow("REDIRECT /guest/recruiter");
  });

  it("renders the normal sign-in page on the institutional deployment", async () => {
    vi.stubEnv("INSTITUTIONAL_SITE_URL", "https://skill-sync-iota-three.vercel.app/");
    await expect(home()).resolves.toBeTruthy();
    vi.stubEnv("ENABLE_GUEST_ACCESS", "true");
    vi.stubEnv("INSTITUTIONAL_SITE_URL", "http://insecure.example");
    await expect(home()).resolves.toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
