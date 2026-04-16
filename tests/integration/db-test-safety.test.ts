import { describe, it, expect } from "vitest";

describe("DB Test Route — safety (MAJ-01)", () => {
  it("db-test route should NOT insert real users or should use a transaction", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeSource = fs.readFileSync(
      path.resolve("app/api/db-test/route.ts"),
      "utf-8"
    );

    // After fix: the route should either:
    //   1. Use db.transaction() for the CRUD test, OR
    //   2. Only do SELECT 1 (no INSERT/DELETE), OR
    //   3. Be removed entirely
    const usesTransaction = routeSource.includes("transaction");
    const noInsert = !routeSource.includes("db.insert(users)");
    const justSelect = routeSource.includes("SELECT 1") || routeSource.includes("SELECT NOW()");

    // At least one safety mechanism must be present
    expect(usesTransaction || noInsert || justSelect).toBe(true);
  });
});
