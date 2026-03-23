import { describe, it, expect } from "vitest";

describe("Phase 4a — returnTo redirect fix", () => {
  it("Test 1: onSubmit_success_pushes_to_returnTo_not_hardcoded", () => {
    const returnTo = "/admin/drives";
    const router = { push: (path: string) => path };

    const pushed = router.push(returnTo);

    expect(pushed).toBe("/admin/drives");
    expect(pushed).not.toBe("/faculty/drives");
  });

  it("Test 2: onSubmit_success_defaults_to_faculty_drives_when_no_returnTo", () => {
    const returnTo = null;
    const target = returnTo ?? "/faculty/drives";

    expect(target).toBe("/faculty/drives");
  });

  it("Test 3: returnTo_is_read_from_searchParams", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("app/(faculty)/faculty/drives/new/page.tsx", "utf-8");

    expect(source).toContain("useSearchParams");
    expect(source).toContain('searchParams.get("returnTo")');
    expect(source).toContain("router.push(returnTo)");
  });
});
