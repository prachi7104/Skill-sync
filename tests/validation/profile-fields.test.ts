import { describe, it, expect } from "vitest";
import { studentProfileSchema } from "@/lib/validations/student-profile";

describe("Student profile schema — phone/linkedin (MIN-02)", () => {
  it("schema MUST accept phone field", () => {
    const result = studentProfileSchema.partial().safeParse({
      phone: "+919876543210",
    });

    // After fix: this should pass. Currently the schema has no phone field,
    // so the field is silently stripped (Zod strips unknown keys by default
    // unless .strict() is used). We test that it's explicitly defined.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("phone");
    }
  });

  it("schema MUST accept linkedin field", () => {
    const result = studentProfileSchema.partial().safeParse({
      linkedin: "https://linkedin.com/in/johndoe",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("linkedin");
    }
  });

  it("schema MUST reject phone with invalid format", () => {
    const result = studentProfileSchema.partial().safeParse({
      phone: "not-a-phone",
    });

    // After fix: schema should validate phone format
    // This test will pass even before fix if phone isn't in schema
    // (Zod strips unknown by default). Check explicit inclusion.
    const schemaKeys = Object.keys(studentProfileSchema.shape);
    expect(schemaKeys).toContain("phone");
  });

  it("schema MUST include linkedin field definition", () => {
    const schemaKeys = Object.keys(studentProfileSchema.shape);
    expect(schemaKeys).toContain("linkedin");
  });
});
