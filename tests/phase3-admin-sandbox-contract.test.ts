import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase 3 Admin Sandbox Contract", () => {
  it("admin sandbox route executes through antigravity router", () => {
    const src = read("app/api/admin/sandbox/route.ts");

    expect(src).toContain("getRouter");
    expect(src).toContain("router.execute");
    expect(src).toContain("sandboxMode: \"admin-live\"");
  });

  it("admin sandbox route keeps explicit diagnostics-only mode", () => {
    const src = read("app/api/admin/sandbox/route.ts");
    expect(src).toContain("diagnosticsOnly");
    expect(src).toContain("sandboxMode: \"admin-diagnostics\"");
  });
});
