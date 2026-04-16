import { describe, it, expect } from "vitest";

describe("Drive PATCH — validation (MAJ-02)", () => {
  it("route MUST use Zod or z.object for body validation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/drives/[driveId]/route.ts"),
      "utf-8"
    );

    // The PATCH handler should use Zod validation, not raw `as` casting.
    // After the fix, the source should contain a safeParse or parse call
    // for the PATCH body, not just `as { isActive?: boolean }`.
    const hasZodValidation =
      routeSource.includes("safeParse") ||
      routeSource.includes("z.object") && routeSource.includes("PATCH");

    // Also check it does NOT use bare type assertion for the PATCH body
    const usesBareAssertion = routeSource.includes("as { isActive");

    expect(hasZodValidation).toBe(true);
    expect(usesBareAssertion).toBe(false);
  });
});
