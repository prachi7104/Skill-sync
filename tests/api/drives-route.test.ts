import { describe, expect, it } from "vitest";

type Drive = { id: string; collegeId: string; createdBy: string; isActive: boolean };

function createDrive(user: { id: string; collegeId: string | null }, input: { company: string; roleTitle: string; rawJd: string }) {
  if (!user.collegeId) return { status: 403 as const };
  return {
    status: 201 as const,
    drive: {
      id: "new-drive",
      company: input.company,
      roleTitle: input.roleTitle,
      rawJd: input.rawJd,
      collegeId: user.collegeId,
      createdBy: user.id,
    },
  };
}

function listStudentDrives(drives: Drive[], studentCollegeId: string): Drive[] {
  return drives.filter((d) => d.collegeId === studentCollegeId && d.isActive);
}

describe("drives route", () => {
  it("create includes collegeId and createdBy", () => {
    const result = createDrive(
      { id: "faculty-1", collegeId: "college-a" },
      { company: "Acme", roleTitle: "SDE", rawJd: "Long enough JD content" },
    );

    expect(result.status).toBe(201);
    if (result.status === 201) {
      expect(result.drive.collegeId).toBe("college-a");
      expect(result.drive.createdBy).toBe("faculty-1");
    }
  });

  it("list returns only active drives for student college", () => {
    const rows: Drive[] = [
      { id: "1", collegeId: "A", createdBy: "f1", isActive: true },
      { id: "2", collegeId: "A", createdBy: "f1", isActive: false },
      { id: "3", collegeId: "B", createdBy: "f2", isActive: true },
    ];

    expect(listStudentDrives(rows, "A").map((d) => d.id)).toEqual(["1"]);
  });
});
