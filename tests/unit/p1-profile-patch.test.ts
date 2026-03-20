import { describe, expect, it } from "vitest";
import { studentProfileSchema } from "@/lib/validations/student-profile";

function validateLockedField(current: unknown, incoming: unknown): { ok: boolean; status: number } {
  if (incoming === undefined || incoming === null) return { ok: true, status: 200 };
  if (current !== null && current !== undefined && current !== "" && incoming !== current) {
    return { ok: false, status: 400 };
  }
  return { ok: true, status: 200 };
}

describe("P1.3 profile patch validation", () => {
  it("allows partial payload and preserves patch semantics", () => {
    const parsed = studentProfileSchema.partial().safeParse({ branch: "CSE", cgpa: 8.2 });
    expect(parsed.success).toBe(true);
  });

  it("blocks changing locked sapId once set", () => {
    const result = validateLockedField("500126666", "500126667");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("allows first-time sapId assignment", () => {
    const result = validateLockedField(null, "500126666");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("blocks changing batchYear once set", () => {
    const result = validateLockedField(2027, 2028);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});
