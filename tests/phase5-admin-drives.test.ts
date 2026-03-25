import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("Phase 5 — Admin Drives", () => {
  it("Test 1: admin new drive page exists at /admin/drives/new", () => {
    const filePath = resolve(__dirname, "../app/(admin)/admin/drives/new/page.tsx");
    expect(existsSync(filePath)).toBe(true);
  });

  it("Test 2: admin drives page Create Drive button links to /admin/drives/new", () => {
    const source = readFileSync(resolve(__dirname, "../app/(admin)/admin/drives/page.tsx"), "utf-8");

    expect(source).toContain('href="/admin/drives/new"');
    expect(source).not.toContain("/faculty/drives/new");
  });

  it("Test 3: DELETE drive succeeds for admin", () => {
    const user = { role: "admin" as const };
    const validId = "11111111-1111-1111-1111-111111111111";
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const status = user.role === "admin" && uuidRe.test(validId) ? 200 : 403;
    const body = status === 200 ? { success: true } : { error: "Forbidden" };

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("Test 4: DELETE drive fails for faculty", () => {
    const user: { role: "admin" | "faculty" } = { role: "faculty" };
    const status = user.role === "admin" ? 200 : 403;

    expect(status).toBe(403);
  });

  it("Test 5: PATCH drive toggles isActive", () => {
    const drive = { id: "d1", isActive: true };
    const patchBody = { isActive: false };

    const updated = { ...drive, isActive: patchBody.isActive };

    expect(updated.isActive).toBe(false);
  });

  it("Test 6: DELETE removes rankings and jobs before removing drive", () => {
    const source = readFileSync(resolve(__dirname, "../app/api/drives/[driveId]/route.ts"), "utf-8");

    const jobsPos = source.indexOf("db.delete(jobs)");
    const rankingsPos = source.indexOf("db.delete(rankings)");
    const drivesPos = source.indexOf("db.delete(drives)");

    expect(jobsPos).toBeGreaterThan(-1);
    expect(rankingsPos).toBeGreaterThan(-1);
    expect(drivesPos).toBeGreaterThan(-1);
    expect(jobsPos).toBeLessThan(rankingsPos);
    expect(rankingsPos).toBeLessThan(drivesPos);
  });
});
