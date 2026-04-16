import { describe, expect, it } from "vitest";
import { studentProfileSchema } from "@/lib/validations/student-profile";

describe("profile route PATCH — validation", () => {
  it("rejects invalid SAP ID format", () => {
    const result = studentProfileSchema.partial().safeParse({ sapId: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts valid SAP ID format", () => {
    const result = studentProfileSchema.partial().safeParse({ sapId: "500126666" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid roll number format", () => {
    const result = studentProfileSchema.partial().safeParse({ rollNo: "ABC" });
    expect(result.success).toBe(false);
  });

  it("accepts valid roll number format", () => {
    const result = studentProfileSchema.partial().safeParse({ rollNo: "R2142233333" });
    expect(result.success).toBe(true);
  });

  it("accepts null sapId (clearing the field)", () => {
    const result = studentProfileSchema.partial().safeParse({ sapId: null });
    expect(result.success).toBe(true);
  });

  it("accepts empty partial payload", () => {
    const result = studentProfileSchema.partial().safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects CGPA above 10", () => {
    const result = studentProfileSchema.partial().safeParse({ cgpa: 11 });
    expect(result.success).toBe(false);
  });

  it("rejects skills array exceeding max 50", () => {
    const skills = Array.from({ length: 51 }, (_, i) => ({ name: `Skill${i}`, proficiency: 3 }));
    const result = studentProfileSchema.partial().safeParse({ skills });
    expect(result.success).toBe(false);
  });
});

// Test the lock-field behavior as pure logic (mirrors route.ts lines 70-85)
describe("profile route PATCH — locked field logic", () => {
  function isFieldLocked(currentValue: unknown, incomingValue: unknown): boolean {
    if (incomingValue === undefined || incomingValue === null) return false;
    if (currentValue === null || currentValue === undefined || currentValue === "") return false;
    return incomingValue !== currentValue;
  }

  it("allows setting sapId when current is null", () => {
    expect(isFieldLocked(null, "500126666")).toBe(false);
  });

  it("blocks changing sapId when already set", () => {
    expect(isFieldLocked("500126666", "500126667")).toBe(true);
  });

  it("allows sending same sapId value", () => {
    expect(isFieldLocked("500126666", "500126666")).toBe(false);
  });

  it("allows omitting sapId (undefined)", () => {
    expect(isFieldLocked("500126666", undefined)).toBe(false);
  });
});
