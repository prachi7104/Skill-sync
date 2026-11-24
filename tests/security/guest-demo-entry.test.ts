// @vitest-environment node
/** The institutional sign-in page links to the separate guest demo only when GUEST_DEMO_URL is a valid https URL. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/session-cache", () => ({ getCachedSession: mocks.session }));
vi.mock("@/lib/auth/helpers", () => ({ getStudentProfile: vi.fn() }));
vi.mock("@/components/auth/root-login-page", () => ({ default: () => null }));

beforeEach(() => { mocks.session.mockResolvedValue(null); mocks.redirect.mockClear(); });
afterEach(() => vi.unstubAllEnvs());

async function guestDemoProp() {
  const { default: Home } = await import("@/app/page");
  const element = await Home();
  return (element as { props: { guestDemoUrl: string | null } }).props.guestDemoUrl;
}

describe("Try Guest Mode entry on the sign-in page", () => {
  it("is hidden when GUEST_DEMO_URL is unset, invalid or not https", async () => {
    expect(await guestDemoProp()).toBeNull();
    vi.stubEnv("GUEST_DEMO_URL", "not a url");
    expect(await guestDemoProp()).toBeNull();
    vi.stubEnv("GUEST_DEMO_URL", "http://demo.example/guest");
    expect(await guestDemoProp()).toBeNull();
  });

  it("links to the configured https demo", async () => {
    vi.stubEnv("GUEST_DEMO_URL", " https://skillsync-guest-demo.vercel.app/guest ");
    expect(await guestDemoProp()).toBe("https://skillsync-guest-demo.vercel.app/guest");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
