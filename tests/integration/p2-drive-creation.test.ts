import { describe, expect, it } from "vitest";

type DriveInput = {
  company: string;
  roleTitle: string;
  rawJd: string;
};

type User = {
  id: string;
  role: "faculty" | "admin";
  collegeId: string | null;
};

function createDrive(user: User, payload: DriveInput) {
  if (!user.collegeId) {
    return { status: 403 as const, message: "Your account must be associated with a college to create drives" };
  }

  return {
    status: 201 as const,
    drive: {
      ...payload,
      createdBy: user.id,
      collegeId: user.collegeId,
      isActive: true,
    },
  };
}

describe("P2.1 drive creation", () => {
  it("creates drive with creator collegeId", () => {
    const result = createDrive(
      { id: "f1", role: "faculty", collegeId: "college-a" },
      { company: "Google", roleTitle: "SDE", rawJd: "A valid JD with enough content" },
    );

    expect(result.status).toBe(201);
    if (result.status === 201) {
      expect(result.drive.collegeId).toBe("college-a");
      expect(result.drive.createdBy).toBe("f1");
    }
  });

  it("rejects drive creation when collegeId is missing", () => {
    const result = createDrive(
      { id: "f2", role: "faculty", collegeId: null },
      { company: "Microsoft", roleTitle: "SWE", rawJd: "A valid JD with enough content" },
    );

    expect(result.status).toBe(403);
  });
});
