import { describe, it, expect } from "vitest";
import { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";

describe("SAP Derivation — real function", () => {
  it("derives SAP from standard 6-digit UPES email", () => {
    expect(deriveSapFromEmailPublic("john.123456@stu.upes.ac.in")).toBe("500123456");
  });

  it("derives SAP from short digit UPES email with 590 prefix", () => {
    expect(deriveSapFromEmailPublic("jane.12345@stu.upes.ac.in")).toBe("590012345");
  });

  it("returns null for non-UPES email", () => {
    expect(deriveSapFromEmailPublic("user@gmail.com")).toBeNull();
  });

  it("returns null for UPES staff email", () => {
    expect(deriveSapFromEmailPublic("prof@upes.ac.in")).toBeNull();
  });

  it("returns null for email without trailing digits", () => {
    expect(deriveSapFromEmailPublic("john@stu.upes.ac.in")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(deriveSapFromEmailPublic("JOHN.123456@STU.UPES.AC.IN")).toBe("500123456");
  });

  it("handles very long digit sequences", () => {
    const result = deriveSapFromEmailPublic("x.1234567890@stu.upes.ac.in");
    expect(result).toBeTruthy();
    expect(result!.length).toBe(9); // Always 9 digits
    expect(result!.startsWith("500")).toBe(true);
  });

  it("handles 1-digit email (edge case)", () => {
    const result = deriveSapFromEmailPublic("x.5@stu.upes.ac.in");
    expect(result).toBe("590000005");
  });
});
