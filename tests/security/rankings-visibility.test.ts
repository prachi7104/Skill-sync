import { describe, it, expect } from "vitest";

describe("Rankings Visibility — API enforcement (CRIT-02)", () => {
  it("rankings/me route MUST check rankingsVisible before returning data", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/drives/[driveId]/rankings/me/route.ts"),
      "utf-8"
    );

    // The route must fetch and check rankingsVisible.
    // After Phase 2A fix, it should contain a check like:
    //   if (!drive.rankingsVisible) return 403/404
    const checksVisibility =
      routeSource.includes("rankingsVisible") &&
      (routeSource.includes("403") || routeSource.includes("404") || routeSource.includes("not published"));

    expect(checksVisibility).toBe(true);
  });

  it("analysis/me route MUST check rankingsVisible before returning data", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/drives/[driveId]/analysis/me/route.ts"),
      "utf-8"
    );

    const checksVisibility =
      routeSource.includes("rankingsVisible") &&
      (routeSource.includes("403") || routeSource.includes("404") || routeSource.includes("not published"));

    expect(checksVisibility).toBe(true);
  });
});

describe("Rankings Visibility — Zod default alignment (CRIT-03)", () => {
  it("drive creation Zod schema MUST default rankingsVisible to false", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/drives/route.ts"),
      "utf-8"
    );

    // The Zod schema should NOT default to true.
    // Look for: .default(true) after rankingsVisible — this is the bug.
    // After fix, it should be .default(false) or no default at all.
    const hasWrongDefault =
      routeSource.includes("rankingsVisible") &&
      routeSource.includes(".default(true)");

    expect(hasWrongDefault).toBe(false);
  });

  it("DB schema defaults rankingsVisible to false", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const schemaSource = fs.readFileSync(
      path.resolve("lib/db/schema.ts"),
      "utf-8"
    );

    // Verify: rankings_visible ... .default(false)
    const match = schemaSource.match(
      /rankings_visible.*?\.default\((false|true)\)/s
    );
    expect(match).toBeTruthy();
    expect(match![1]).toBe("false");
  });
});

describe("Rankings Visibility — page-level check exists", () => {
  it("student ranking page checks rankingsVisible", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pageSource = fs.readFileSync(
      path.resolve("app/(student)/student/drives/[driveId]/ranking/page.tsx"),
      "utf-8"
    );

    expect(pageSource).toContain("rankingsVisible");
    expect(pageSource).toContain("not been published");
  });
});
