/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Profile Sanitization Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Unit tests for sanitizeProfilePayload function
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { sanitizeProfilePayload } from "@/lib/profile/sanitize";
import type { StudentProfileInput } from "@/lib/validations/student-profile";

describe("sanitizeProfilePayload", () => {
  describe("string field trimming", () => {
    it("should trim whitespace from sapId", () => {
      const payload = { sapId: "  500126666  " };
      const result = sanitizeProfilePayload(payload);
      expect(result.sapId).toBe("500126666");
    });

    it("should trim whitespace from rollNo", () => {
      const payload = { rollNo: "  R2142233333  " };
      const result = sanitizeProfilePayload(payload);
      expect(result.rollNo).toBe("R2142233333");
    });

    it("should trim whitespace from phone", () => {
      const payload = { phone: "  +919876543210  " };
      const result = sanitizeProfilePayload(payload);
      expect(result.phone).toBe("+919876543210");
    });

    it("should trim whitespace from linkedin", () => {
      const payload = { linkedin: "  https://linkedin.com/in/johndoe  " };
      const result = sanitizeProfilePayload(payload);
      expect(result.linkedin).toBe("https://linkedin.com/in/johndoe");
    });

    it("should preserve null values for optional string fields", () => {
      const payload = { phone: null, linkedin: null };
      const result = sanitizeProfilePayload(payload);
      expect(result.phone).toBeNull();
      expect(result.linkedin).toBeNull();
    });

    it("should preserve undefined values", () => {
      const payload = { phone: undefined };
      const result = sanitizeProfilePayload(payload);
      expect(result.phone).toBeUndefined();
    });
  });

  describe("array field filtering - skills", () => {
    it("should remove skill with empty name", () => {
      const payload = {
        skills: [
          { name: "JavaScript", proficiency: 5 },
          { name: "", proficiency: 3 },
          { name: "Python", proficiency: 4 },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills).toHaveLength(2);
      expect(result.skills?.[0].name).toBe("JavaScript");
      expect(result.skills?.[1].name).toBe("Python");
    });

    it("should remove skill with whitespace-only name", () => {
      const payload = {
        skills: [
          { name: "JavaScript" },
          { name: "   " },
          { name: "Python" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills).toHaveLength(2);
      expect(result.skills?.[0].name).toBe("JavaScript");
      expect(result.skills?.[1].name).toBe("Python");
    });

    it("should trim skill names", () => {
      const payload = {
        skills: [{ name: "  JavaScript  " }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills?.[0].name).toBe("JavaScript");
    });

    it("should remove all blank skills from array of 3 blanks", () => {
      const payload = {
        skills: [{ name: "" }, { name: "  " }, { name: null as any }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills).toBeUndefined();
    });

    it("should preserve skill proficiency and category", () => {
      const payload = {
        skills: [
          { name: "JavaScript", proficiency: 5, category: "Frontend" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills?.[0]).toEqual({
        name: "JavaScript",
        proficiency: 5,
        category: "Frontend",
      });
    });
  });

  describe("array field filtering - projects", () => {
    it("should remove project with empty title", () => {
      const payload = {
        projects: [
          { title: "Project A", description: "Desc", url: "" },
          { title: "", description: "Desc", url: "" },
          { title: "Project B", description: "Desc", url: "" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.projects).toHaveLength(2);
    });

    it("should preserve optional empty project.url", () => {
      const payload = {
        projects: [{ title: "Project A", url: "" }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.projects?.[0].url).toBe("");
    });

    it("should trim project title and description", () => {
      const payload = {
        projects: [
          {
            title: "  Project A  ",
            description: "  Awesome project  ",
            url: "",
          },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.projects?.[0].title).toBe("Project A");
      expect(result.projects?.[0].description).toBe("Awesome project");
    });
  });

  describe("array field filtering - certifications", () => {
    it("should remove cert with empty title or issuer", () => {
      const payload = {
        certifications: [
          { title: "AWS", issuer: "Amazon" },
          { title: "", issuer: "Provider" },
          { title: "GCP", issuer: "" },
          { title: "Azure", issuer: "Microsoft" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.certifications).toHaveLength(2);
      expect(result.certifications?.[0].title).toBe("AWS");
      expect(result.certifications?.[1].title).toBe("Azure");
    });

    it("should preserve optional empty cert.url", () => {
      const payload = {
        certifications: [{ title: "AWS", issuer: "Amazon", url: "" }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.certifications?.[0].url).toBe("");
    });

    it("should trim cert title and issuer", () => {
      const payload = {
        certifications: [
          { title: "  AWS Solutions Architect  ", issuer: "  Amazon  " },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.certifications?.[0].title).toBe("AWS Solutions Architect");
      expect(result.certifications?.[0].issuer).toBe("Amazon");
    });
  });

  describe("array field filtering - coding profiles", () => {
    it("should remove profile with empty platform or username", () => {
      const payload = {
        codingProfiles: [
          { platform: "LeetCode", username: "john_doe" },
          { platform: "", username: "jane_doe" },
          { platform: "CodeChef", username: "" },
          { platform: "HackerRank", username: "hacker_john" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.codingProfiles).toHaveLength(2);
      expect(result.codingProfiles?.[0].platform).toBe("LeetCode");
      expect(result.codingProfiles?.[1].platform).toBe("HackerRank");
    });

    it("should preserve optional empty url", () => {
      const payload = {
        codingProfiles: [
          { platform: "LeetCode", username: "john_doe", url: "" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.codingProfiles?.[0].url).toBe("");
    });

    it("should trim platform and username", () => {
      const payload = {
        codingProfiles: [
          { platform: "  LeetCode  ", username: "  john_doe  " },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.codingProfiles?.[0].platform).toBe("LeetCode");
      expect(result.codingProfiles?.[0].username).toBe("john_doe");
    });
  });

  describe("array field filtering - work experience", () => {
    it("should remove exp with empty company or role", () => {
      const payload = {
        workExperience: [
          { company: "Company A", role: "Engineer" },
          { company: "", role: "Manager" },
          { company: "Company B", role: "" },
          { company: "Company C", role: "Intern" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.workExperience).toHaveLength(2);
    });

    it("should trim company and role", () => {
      const payload = {
        workExperience: [
          { company: "  Google  ", role: "  Software Engineer  " },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.workExperience?.[0].company).toBe("Google");
      expect(result.workExperience?.[0].role).toBe("Software Engineer");
    });
  });

  describe("array field filtering - achievements", () => {
    it("should remove achievement with empty title", () => {
      const payload = {
        achievements: [
          { title: "First Prize" },
          { title: "" },
          { title: "Finalist" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.achievements).toHaveLength(2);
    });

    it("should trim achievement title", () => {
      const payload = {
        achievements: [{ title: "  First Prize  " }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.achievements?.[0].title).toBe("First Prize");
    });
  });

  describe("array field filtering - research papers", () => {
    it("should remove paper with empty title", () => {
      const payload = {
        researchPapers: [
          { title: "Deep Learning Survey" },
          { title: "" },
          { title: "ML Applications" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.researchPapers).toHaveLength(2);
    });

    it("should preserve optional empty url", () => {
      const payload = {
        researchPapers: [
          { title: "Deep Learning Survey", url: "" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.researchPapers?.[0].url).toBe("");
    });

    it("should trim paper title and abstract", () => {
      const payload = {
        researchPapers: [
          {
            title: "  Deep Learning Survey  ",
            abstract: "  A comprehensive review  ",
          },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.researchPapers?.[0].title).toBe("Deep Learning Survey");
      expect(result.researchPapers?.[0].abstract).toBe("A comprehensive review");
    });
  });

  describe("soft skills string array", () => {
    it("should remove empty soft skills", () => {
      const payload = {
        softSkills: ["Leadership", "", "Communication", "  "],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.softSkills).toEqual(["Leadership", "Communication"]);
    });

    it("should trim soft skill strings", () => {
      const payload = {
        softSkills: ["  Leadership  ", "  Communication  "],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.softSkills).toEqual(["Leadership", "Communication"]);
    });

    it("should remove all soft skills if all are blank", () => {
      const payload = {
        softSkills: ["", "  ", "   "],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.softSkills).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty input object", () => {
      const payload = {};
      const result = sanitizeProfilePayload(payload);
      expect(result).toEqual({});
    });

    it("should handle null input", () => {
      const payload = null as unknown as Partial<StudentProfileInput>;
      const result = sanitizeProfilePayload(payload);
      expect(result).toEqual({});
    });

    it("should preserve numeric fields unchanged", () => {
      const payload = {
        cgpa: 8.5,
        batchYear: 2025,
        semester: 4,
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.cgpa).toBe(8.5);
      expect(result.batchYear).toBe(2025);
      expect(result.semester).toBe(4);
    });

    it("should not mutate input object", () => {
      const payload = {
        skills: [{ name: "  JavaScript  " }],
      };
      const payloadCopy = JSON.parse(JSON.stringify(payload));
      sanitizeProfilePayload(payload);
      expect(payload).toEqual(payloadCopy);
    });

    it("should handle mixed valid and invalid rows", () => {
      const payload = {
        skills: [
          { name: "JavaScript" },
          { name: "" },
          { name: "Python" },
          { name: "  " },
          { name: "Go" },
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills).toHaveLength(3);
      expect(result.skills?.[0].name).toBe("JavaScript");
      expect(result.skills?.[1].name).toBe("Python");
      expect(result.skills?.[2].name).toBe("Go");
    });

    it("should return undefined for empty arrays (removed)", () => {
      const payload = {
        skills: [],
        projects: [{ title: "" }],
        certifications: [{ title: "", issuer: "" }],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.skills).toBeUndefined();
      expect(result.projects).toBeUndefined();
      expect(result.certifications).toBeUndefined();
    });

    it("should handle branch field trim", () => {
      const payload = {
        branch: "  CSE  ",
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.branch).toBe("CSE");
    });
  });

  describe("real-world scenario: blank skill row blocks unrelated edit", () => {
    it("should sanitize partial patch with blank skill + valid phone edit", () => {
      const payload = {
        skills: [
          { name: "JavaScript", proficiency: 5 },
          { name: "" }, // Blank skill that would block save
          { name: "Python", proficiency: 4 },
        ],
        phone: "+919876543210", // Unrelated field edit
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.phone).toBe("+919876543210");
      expect(result.skills).toHaveLength(2);
      // Should succeed because blank skill was filtered out
      expect(result).toBeDefined();
    });

    it("should sanitize optional cert url field separately from required title", () => {
      const payload = {
        certifications: [
          { title: "AWS", issuer: "Amazon", url: "" }, // Empty URL OK (optional)
          { title: "", issuer: "Provider", url: "http://example.com" }, // Empty title NOT OK
        ],
      };
      const result = sanitizeProfilePayload(payload);
      expect(result.certifications).toHaveLength(1);
      expect(result.certifications?.[0].title).toBe("AWS");
      expect(result.certifications?.[0].url).toBe("");
    });
  });

  describe("idempotency", () => {
    it("should produce same result when sanitized twice", () => {
      const payload = {
        skills: [
          { name: "  JavaScript  " },
          { name: "" },
          { name: "Python" },
        ],
      };
      const result1 = sanitizeProfilePayload(payload);
      const result2 = sanitizeProfilePayload(result1 as Partial<StudentProfileInput>);
      expect(result1).toEqual(result2);
    });
  });
});
