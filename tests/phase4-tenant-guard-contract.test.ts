import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase 4 Tenant Guard Contract", () => {
  it("reset-password route enforces same-college targeting", () => {
    const src = read("app/api/admin/faculty/[userId]/reset-password/route.ts");
    expect(src).toContain("eq(users.collegeId, session.user.collegeId)");
    expect(src).toContain("Cannot reset another admin's password");
  });

  it("drive admin mutation routes include college checks", () => {
    const driveSrc = read("app/api/drives/[driveId]/route.ts");
    const exportSrc = read("app/api/drives/[driveId]/export/route.ts");
    const rankStatusSrc = read("app/api/drives/[driveId]/rank/status/route.ts");
    const shortlistSrc = read("app/api/drives/[driveId]/rankings/[studentId]/shortlist/route.ts");

    expect(driveSrc).toContain("and(eq(drives.id, driveId), eq(drives.collegeId, user.collegeId))");
    expect(driveSrc).toContain("Account not linked to a college");
    expect(exportSrc).toMatch(/drive\.college(Id|_id)\s*!==\s*user\.collegeId/);
    expect(rankStatusSrc).toMatch(/drive\.college(Id|_id)\s*!==\s*user\.collegeId/);
    expect(shortlistSrc).toMatch(/drive\.college(Id|_id)\s*!==\s*user\.collegeId/);
  });

  it("resources endpoints enforce college scoping", () => {
    const listSrc = read("app/api/resources/route.ts");
    const manageSrc = read("app/api/resources/[resourceId]/route.ts");

    expect(listSrc).toContain("r.college_id = ${user.collegeId}");
    expect(manageSrc).toContain("AND college_id = ${collegeId}");
  });

  it("admin dashboard metrics are college scoped", () => {
    const dashboardSrc = read("app/(admin)/admin/page.tsx");
    expect(dashboardSrc).toContain("eq(students.collegeId, user.collegeId)");
    expect(dashboardSrc).toContain("eq(drives.collegeId, user.collegeId)");
    expect(dashboardSrc).toContain("eq(users.collegeId, user.collegeId)");
  });
});
