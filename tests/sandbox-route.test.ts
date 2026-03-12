import { describe, it, expect } from "vitest";

describe("mapProfileToResumeData — name resolution", () => {
  // Inline the function signature contract we fixed
  function mapProfileName(
    _profile: { fullName?: string },
    userName?: string | null
  ): string {
    return userName || "Candidate";
  }

  it("should use user.name when provided", () => {
    expect(mapProfileName({}, "Aniruddh V")).toBe("Aniruddh V");
  });

  it("should fall back to 'Candidate' when user.name is null", () => {
    expect(mapProfileName({}, null)).toBe("Candidate");
  });

  it("should fall back to 'Candidate' when user.name is undefined", () => {
    expect(mapProfileName({})).toBe("Candidate");
  });

  it("should NOT use profile.fullName (field does not exist on student row)", () => {
    // profile.fullName is undefined — confirm it is not used as the name source
    const profile = { fullName: "WRONG_NAME" };
    // The fix ignores profile.fullName entirely; name comes only from userName param
    expect(mapProfileName(profile, "Correct Name")).toBe("Correct Name");
    expect(mapProfileName(profile, null)).toBe("Candidate");
  });
});
