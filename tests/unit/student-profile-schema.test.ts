import { describe, expect, it } from "vitest";
import { studentProfileSchema } from "@/lib/validations/student-profile";

describe("student profile schema - coding profiles", () => {
  it("accepts coding profile when URL is omitted", () => {
    const result = studentProfileSchema.safeParse({
      codingProfiles: [
        {
          platform: "LeetCode",
          username: "coder123",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts coding profile when URL is empty string", () => {
    const result = studentProfileSchema.safeParse({
      codingProfiles: [
        {
          platform: "GitHub",
          username: "octocat",
          url: "",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects coding profile when URL is non-empty but invalid", () => {
    const result = studentProfileSchema.safeParse({
      codingProfiles: [
        {
          platform: "Codeforces",
          username: "tourist",
          url: "not-a-url",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
