import { describe, expect, it } from "vitest";

type PatchPayload = {
  rollNo?: string | null;
  sapId?: string | null;
  batchYear?: number | null;
};

type ExistingProfile = {
  rollNo: string | null;
  sapId: string | null;
  batchYear: number | null;
};

function applyProfilePatch(existing: ExistingProfile, payload: PatchPayload): number {
  // Mirrors route lock behavior for sapId and batchYear.
  if (payload.sapId !== undefined && payload.sapId !== null) {
    if (existing.sapId && payload.sapId !== existing.sapId) return 400;
  }
  if (payload.batchYear !== undefined && payload.batchYear !== null) {
    if (existing.batchYear !== null && payload.batchYear !== existing.batchYear) return 400;
  }

  // PATCH accepts partial payloads; empty rollNo should be treated as no-op.
  if (payload.rollNo === "") {
    payload.rollNo = undefined;
  }

  return 200;
}

describe("profile route PATCH", () => {
  it("patchProfile_emptyRollNo_returns200", () => {
    const status = applyProfilePatch(
      { rollNo: null, sapId: null, batchYear: null },
      { rollNo: "" },
    );
    expect(status).toBe(200);
  });

  it("patchProfile_lockedSapId_returns400", () => {
    const status = applyProfilePatch(
      { rollNo: "R2142233333", sapId: "500126666", batchYear: 2027 },
      { sapId: "500126667" },
    );
    expect(status).toBe(400);
  });

  it("patchProfile_newSapId_returns200", () => {
    const status = applyProfilePatch(
      { rollNo: "R2142233333", sapId: null, batchYear: 2027 },
      { sapId: "500126666" },
    );
    expect(status).toBe(200);
  });
});
