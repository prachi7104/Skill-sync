import { describe, it, expect } from "vitest";

describe("Nightly Cleanup — duplicate deletion (MIN-01)", () => {
  it("cleanup route should NOT have duplicate job deletion queries", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/cron/nightly-cleanup/route.ts"),
      "utf-8"
    );

    // Count occurrences of the completed/failed job deletion pattern
    const matches = routeSource.match(
      /DELETE FROM jobs WHERE status IN.*completed.*failed/g
    );

    // After fix: should appear at most once
    const occurrences = matches ? matches.length : 0;

    // Also count the drizzle-style deletion
    const drizzleDeletes = (routeSource.match(/db\.delete\(jobs\)/g) || []).length;

    // Total deletion operations for completed jobs should be exactly 1
    expect(occurrences + drizzleDeletes).toBeLessThanOrEqual(1);
  });
});
