import { describe, it, expect } from "vitest";

describe("ATS scoring null guards", () => {
  function safeLength(arr: unknown[] | null | undefined): number {
    return (arr ?? []).length;
  }

  it("handles null soft_requirements", () => {
    expect(safeLength(null)).toBe(0);
  });

  it("handles undefined technical_skills", () => {
    const jd = { requirements: { soft_requirements: {} } };
    const skills = (jd.requirements?.soft_requirements as Record<string, unknown>)?.technical_skills;
    expect(safeLength(skills as unknown[] | null)).toBe(0);
  });

  it("returns correct length for valid array", () => {
    const skills = [{ skill: "Python" }, { skill: "Docker" }];
    expect(safeLength(skills)).toBe(2);
  });
});

describe("Profile completeness rounding", () => {
  it("rounds 27.5 to 28 (integer)", () => {
    expect(Math.round(27.5)).toBe(28);
  });

  it("rounds 99.9 to 100", () => {
    expect(Math.round(99.9)).toBe(100);
  });

  it("no float sent to integer column", () => {
    const completeness = 27.5;
    const stored = Math.round(completeness);
    expect(Number.isInteger(stored)).toBe(true);
  });
});

describe("SAP derivation formula", () => {
  function deriveSap(email: string): string | null {
    if (!email.toLowerCase().includes("stu.upes.ac.in")) return null;
    const username = email.split("@")[0].toLowerCase();
    const match = username.match(/\.(\d+)$/);
    if (!match) return null;
    const digits = match[1];
    const padded = digits.padStart(6, "0");
    const prefix = digits.length >= 6 ? "500" : "590";
    return prefix + padded;
  }

  it("derives 500-prefix for 6-digit BTech emails", () => {
    expect(deriveSap("aniruddh.125613@stu.upes.ac.in")).toBe("500125613");
    expect(deriveSap("prachi.126504@stu.upes.ac.in")).toBe("500126504");
    expect(deriveSap("Akshat.124372@stu.upes.ac.in")).toBe("500124372");
  });

  it("derives 590-prefix for 5-digit MCA/BCA emails", () => {
    expect(deriveSap("abhigyaan.12135@stu.upes.ac.in")).toBe("590012135");
    expect(deriveSap("Karan.25809@stu.upes.ac.in")).toBe("590025809");
  });

  it("returns null for gmail emails", () => {
    expect(deriveSap("user@gmail.com")).toBeNull();
  });

  it("returns null for emails without dot-number pattern", () => {
    expect(deriveSap("nodigits@stu.upes.ac.in")).toBeNull();
  });
});

describe("placement_type enum", () => {
  const VALID_TYPES = ["placement", "internship", "ppo", "other"];

  it("apprenticeship is NOT in enum", () => {
    expect(VALID_TYPES.includes("apprenticeship")).toBe(false);
  });

  it("all valid types pass", () => {
    for (const t of VALID_TYPES) {
      expect(VALID_TYPES.includes(t)).toBe(true);
    }
  });
});
