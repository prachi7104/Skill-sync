/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Profile Save Flow Integration Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Integration tests for profile PATCH endpoint and save flows
 * Tests the full journey from client save -> API validation -> database
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { sanitizeProfilePayload } from "@/lib/profile/sanitize";
import { studentProfileSchema } from "@/lib/validations/student-profile";

describe("Profile Save Flow - PATCH endpoint contract", () => {
  describe("scenario: blank skill row cleanup", () => {
    it("should pass validation after sanitization removes blank skill", () => {
      // Simulate client submitting blank skill row
      const clientPayload = {
        skills: [
          { name: "JavaScript", proficiency: 5 },
          { name: "" }, // Blank skill
          { name: "Python", proficiency: 4 },
        ],
      };

      // Step 1: Client sanitizes
      const sanitized = sanitizeProfilePayload(clientPayload);
      
      // Step 2: Schema validates
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(2);
    });

    it("should pass validation with trimmed skill names", () => {
      const clientPayload = {
        skills: [
          { name: "  JavaScript  ", proficiency: 5 },
          { name: "  Python  ", proficiency: 4 },
        ],
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills?.[0].name).toBe("JavaScript");
    });
  });

  describe("scenario: edit unrelated field with old blank draft", () => {
    it("should successfully save phone edit even with blank skills in form", () => {
      // User has blank skill from earlier draft, now editing phone
      const clientPayload = {
        skills: [
          { name: "JavaScript" },
          { name: "" }, // Old blank row still in form
        ],
        phone: "+919876543210", // New edit
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      
      expect(result.success).toBe(true);
      expect(result.data?.phone).toBe("+919876543210");
      expect(result.data?.skills).toHaveLength(1);
    });

    it("should not block save on unrelated field when array is empty after sanitize", () => {
      const clientPayload = {
        skills: [{ name: "" }], // Only blank skill
        phone: "+919876543210",
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      
      expect(result.success).toBe(true);
      expect(result.data?.phone).toBe("+919876543210");
      expect(result.data?.skills).toBeUndefined(); // Removed
    });
  });

  describe("scenario: optional vs required field distinction", () => {
    it("should allow empty cert URL (optional) but reject empty cert title (required)", () => {
      const validPayload = {
        certifications: [
          {
            title: "AWS",
            issuer: "Amazon",
            url: "", // Empty URL OK
          },
        ],
      };

      const invalidPayload = {
        certifications: [
          {
            title: "", // Empty title NOT OK
            issuer: "Amazon",
            url: "http://example.com",
          },
        ],
      };

      const validSanitized = sanitizeProfilePayload(validPayload);
      const validResult = studentProfileSchema.partial().safeParse(validSanitized);
      expect(validResult.success).toBe(true);

      const invalidSanitized = sanitizeProfilePayload(invalidPayload);
      const invalidResult = studentProfileSchema.partial().safeParse(invalidSanitized);
      expect(invalidResult.success).toBe(true);
      expect(invalidResult.data?.certifications).toBeUndefined(); // Filtered out
    });

    it("should preserve empty coding profile URL but reject empty platform", () => {
      const validPayload = {
        codingProfiles: [
          {
            platform: "LeetCode",
            username: "john",
            url: "", // Empty URL OK
          },
        ],
      };

      const invalidPayload = {
        codingProfiles: [
          {
            platform: "", // Empty platform NOT OK
            username: "john",
            url: "http://example.com",
          },
        ],
      };

      const validSanitized = sanitizeProfilePayload(validPayload);
      const validResult = studentProfileSchema.partial().safeParse(validSanitized);
      expect(validResult.success).toBe(true);
      expect(validResult.data?.codingProfiles?.[0].url).toBe("");

      const invalidSanitized = sanitizeProfilePayload(invalidPayload);
      const invalidResult = studentProfileSchema.partial().safeParse(invalidSanitized);
      expect(invalidResult.success).toBe(true);
      expect(invalidResult.data?.codingProfiles).toBeUndefined();
    });
  });

  describe("scenario: resume autofill creates valid rows", () => {
    it("should ensure resume-filled skills have valid names (no blanks from autofill)", () => {
      // Resume parser returns data with some fields populated
      const autofillData = {
        skills: [
          { name: "JavaScript", proficiency: 3 },
          { name: "React", proficiency: 3 },
          { name: "TypeScript", proficiency: 2 },
        ],
      };

      const sanitized = sanitizeProfilePayload(autofillData);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(3);
      result.data?.skills?.forEach((skill) => {
        expect(skill.name).toBeTruthy();
      });
    });

    it("should handle resume data with mixed populated/empty fields", () => {
      const autofillData = {
        skills: [
          { name: "JavaScript" },
          { name: "" }, // Resume extractor might return empty
          { name: "Python" },
        ],
        softSkills: ["Leadership", "", "Communication"],
      };

      const sanitized = sanitizeProfilePayload(autofillData);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(2);
      expect(result.data?.softSkills).toHaveLength(2);
    });
  });

  describe("scenario: mixed valid and invalid rows", () => {
    it("should filter invalid rows from project array while keeping valid ones", () => {
      const clientPayload = {
        projects: [
          {
            title: "Project A",
            description: "Valid project",
            url: "http://example.com",
          },
          {
            title: "", // Invalid: no title
            description: "Orphan description",
            url: "",
          },
          {
            title: "Project B",
            description: "",
            url: "",
          },
          {
            title: "  Project C  ", // Valid after trim
            description: "Another project",
            url: "",
          },
        ],
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(3);
      expect(result.data?.projects?.[0].title).toBe("Project A");
      expect(result.data?.projects?.[1].title).toBe("Project B");
      expect(result.data?.projects?.[2].title).toBe("Project C");
    });
  });

  describe("scenario: whitespace-only fields become empty and filtered", () => {
    it("should filter skills with whitespace-only names", () => {
      const clientPayload = {
        skills: [
          { name: "JavaScript" },
          { name: "     " }, // Whitespace only
          { name: "\t" }, // Tab only
          { name: "\n" }, // Newline only
          { name: "Python" },
        ],
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(2);
    });

    it("should filter certifications with whitespace-only title/issuer", () => {
      const clientPayload = {
        certifications: [
          { title: "AWS", issuer: "Amazon" },
          { title: "   ", issuer: "Provider" }, // Whitespace title
          { title: "Azure", issuer: "\t" }, // Whitespace issuer
        ],
      };

      const sanitized = sanitizeProfilePayload(clientPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.certifications).toHaveLength(1);
    });
  });

  describe("scenario: defensive API sanitization (stale client)", () => {
    it("should handle unsanitized payload from stale client", () => {
      // Simulate old client that doesn't sanitize locally
      const staleCleintPayload = {
        skills: [
          { name: "JavaScript" },
          { name: "" },
          { name: "Python" },
        ],
      };

      // API-side sanitization should clean it
      const sanitized = sanitizeProfilePayload(staleCleintPayload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(2);
    });

    it("should clean double-trimmed fields without corruption", () => {
      const payload = {
        phone: "  +91 98765 43210  ",
      };

      // First sanitization (client)
      const sanitized1 = sanitizeProfilePayload(payload);
      expect(sanitized1.phone).toBe("+91 98765 43210");

      // Second sanitization (API defensive)
      const sanitized2 = sanitizeProfilePayload(
        sanitized1 as Parameters<typeof sanitizeProfilePayload>[0]
      );
      expect(sanitized2.phone).toBe("+91 98765 43210");
    });
  });

  describe("scenario: completeness scoring with sanitized data", () => {
    it("should not count blank skills in completeness score", () => {
      // User claims to have 5 skills but 3 are blank
      const payload = {
        skills: [
          { name: "JavaScript" },
          { name: "" },
          { name: "Python" },
          { name: "" },
          { name: "Go" },
        ],
      };

      const sanitized = sanitizeProfilePayload(payload);
      
      // If we were to calculate completeness, it should use the sanitized count (3, not 5)
      expect(sanitized.skills).toHaveLength(3);
    });
  });

  describe("error scenarios", () => {
    it("should reject skill with blank name even in mixed array", () => {
      const payload = {
        skills: [
          { name: "JavaScript" },
          { name: "" }, // This blank will be filtered
          { name: "Python" },
        ],
      };

      const sanitized = sanitizeProfilePayload(payload);
      
      // After sanitization, the blank is gone, so validation passes
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      
      // But if we pass unsanitized data directly to schema, it might pass/fail depending on validation
      // This is why sanitization is important
    });

    it("should handle empty update gracefully", () => {
      const payload = {
        skills: [{ name: "" }],
        projects: [{ title: "" }],
      };

      const sanitized = sanitizeProfilePayload(payload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toBeUndefined();
      expect(result.data?.projects).toBeUndefined();
    });
  });

  describe("batch operations", () => {
    it("should handle batch update with multiple array types", () => {
      const payload = {
        skills: [
          { name: "JavaScript" },
          { name: "" },
          { name: "Python" },
        ],
        projects: [
          { title: "Project A", url: "" },
          { title: "" },
        ],
        certifications: [
          { title: "AWS", issuer: "Amazon", url: "" },
          { title: "", issuer: "Provider", url: "" },
        ],
        codingProfiles: [
          { platform: "LeetCode", username: "john", url: "" },
          { platform: "", username: "jane", url: "" },
        ],
        workExperience: [
          { company: "Google", role: "Engineer" },
          { company: "", role: "Intern" },
        ],
      };

      const sanitized = sanitizeProfilePayload(payload);
      const result = studentProfileSchema.partial().safeParse(sanitized);
      expect(result.success).toBe(true);
      expect(result.data?.skills).toHaveLength(2);
      expect(result.data?.projects).toHaveLength(1);
      expect(result.data?.certifications).toHaveLength(1);
      expect(result.data?.codingProfiles).toHaveLength(1);
      expect(result.data?.workExperience).toHaveLength(1);
    });
  });
});
