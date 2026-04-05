import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase 4 Health Telemetry Contract", () => {
  it("health route returns degraded telemetry fields", () => {
    const src = read("app/api/admin/health/route.ts");

    expect(src).toContain("Promise.allSettled");
    expect(src).toContain("failedChecks");
    expect(src).toContain("degraded");
    expect(src).toContain("queryTimeoutMs");
  });

  it("health page shows partial-data warning", () => {
    const src = read("app/(admin)/admin/health/page.tsx");
    expect(src).toContain("Partial health data");
  });
});
