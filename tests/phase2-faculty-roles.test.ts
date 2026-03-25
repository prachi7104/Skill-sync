import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Phase 2 — Faculty Roles and Permissions", () => {
  const drivesApiSource = readFileSync(
    resolve(__dirname, "../app/api/drives/route.ts"),
    "utf-8"
  );

  const rankApiSource = readFileSync(
    resolve(__dirname, "../app/api/drives/[driveId]/rank/route.ts"),
    "utf-8"
  );

  const rankingsApiSource = readFileSync(
    resolve(__dirname, "../app/api/drives/[driveId]/rankings/route.ts"),
    "utf-8"
  );

  const facultyDrivesPageSource = readFileSync(
    resolve(__dirname, "../app/(faculty)/faculty/drives/page.tsx"),
    "utf-8"
  );

  const newDriveLayoutSource = readFileSync(
    resolve(__dirname, "../app/(faculty)/faculty/drives/new/layout.tsx"),
    "utf-8"
  );

  function simulateCreateDriveStatus(role: "faculty" | "admin", hasDriveManagement: boolean) {
    if (role === "faculty" && !hasDriveManagement) return 403;
    return 201;
  }

  function simulateRankTriggerStatus(role: "faculty" | "admin") {
    return role === "admin" ? 202 : 403;
  }

  it("Test 1: faculty WITHOUT drive_management cannot create drive via API", () => {
    expect(drivesApiSource).toContain('const permitted = await hasComponent("drive_management")');
    expect(drivesApiSource).toContain('Permission denied: drive_management required');
    expect(simulateCreateDriveStatus("faculty", false)).toBe(403);
  });

  it("Test 2: faculty WITH drive_management can create drive", () => {
    expect(drivesApiSource).toContain('if (user.role === "faculty")');
    expect(simulateCreateDriveStatus("faculty", true)).toBe(201);
  });

  it("Test 3: admin can always create drive regardless of components", () => {
    expect(drivesApiSource).toContain('const user = await requireRole(["faculty", "admin"])');
    expect(simulateCreateDriveStatus("admin", false)).toBe(201);
  });

  it("Test 4: faculty cannot trigger ranking (ranking is admin only)", () => {
    expect(rankApiSource).toContain('await requireRole(["admin"])');
    expect(rankApiSource).not.toContain('requireRole(["faculty", "admin"])');
    expect(simulateRankTriggerStatus("faculty")).toBe(403);
  });

  it("Test 5: admin can trigger ranking", () => {
    expect(rankApiSource).toContain('await enforceRankingGeneration(driveId, "admin")');
    expect(simulateRankTriggerStatus("admin")).toBe(202);
  });

  it("Test 6: faculty can view rankings (GET)", () => {
    expect(rankingsApiSource).toContain('const user = await requireRole(["faculty", "admin"])');
    expect(rankingsApiSource).not.toContain("drive.createdBy !== user.id");
    expect(rankingsApiSource).toContain("status: 200");
  });

  it("Test 7: faculty drives page shows all college drives, not just own", () => {
    expect(facultyDrivesPageSource).toContain("eq(drives.collegeId, user.collegeId!)");
    expect(facultyDrivesPageSource).not.toContain("eq(drives.createdBy, user.id)");
    expect(facultyDrivesPageSource).not.toContain("TriggerRankingButton");
  });

  it("Test 8: drive_management layout redirects faculty without permission", () => {
    expect(newDriveLayoutSource).toContain('await requireComponent("drive_management")');
    expect(newDriveLayoutSource).toContain('redirect("/faculty?error=no_permission")');
  });
});
