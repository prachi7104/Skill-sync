import { describe, expect, it } from "vitest";
import { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";

describe("P1.2 deriveSapFromEmailPublic", () => {
  it("derives SAP with 500 prefix when username suffix has 6+ digits", () => {
    expect(deriveSapFromEmailPublic("name.123456@stu.upes.ac.in")).toBe("500123456");
    expect(deriveSapFromEmailPublic("name.126666@stu.upes.ac.in")).toBe("500126666");
  });

  it("derives SAP with 590 prefix and left-padding when suffix has < 6 digits", () => {
    expect(deriveSapFromEmailPublic("name.1@stu.upes.ac.in")).toBe("590000001");
    expect(deriveSapFromEmailPublic("name.99999@stu.upes.ac.in")).toBe("590099999");
  });

  it("returns null for non-UPES domains and malformed usernames", () => {
    expect(deriveSapFromEmailPublic("name.123456@gmail.com")).toBeNull();
    expect(deriveSapFromEmailPublic("name@stu.upes.ac.in")).toBeNull();
  });
});
