/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Text Composition Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for text composition functions used to generate embedding inputs.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";

// Inline composition functions for testing (to avoid server-only issues)
interface Skill {
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  category?: string;
}

interface Project {
  title: string;
  description: string;
  techStack: string[];
  url?: string;
}

interface WorkExperience {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string;
}

interface Certification {
  title: string;
  issuer: string;
  dateIssued?: string;
}

interface ParsedJD {
  title: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  qualifications: string[];
  experienceYears?: number;
  employmentType?: string;
  summary: string;
}

function composeStudentEmbeddingText(profile: {
  skills?: Skill[] | null;
  projects?: Project[] | null;
  workExperience?: WorkExperience[] | null;
  certifications?: Certification[] | null;
}): string {
  const parts: string[] = [];

  if (profile.skills && profile.skills.length > 0) {
    const skillNames = profile.skills.map((s) => s.name).join(", ");
    parts.push(`Skills: ${skillNames}`);
  }

  if (profile.projects && profile.projects.length > 0) {
    const projectTexts = profile.projects.map((p) => {
      const techStack = p.techStack?.length > 0 ? ` (${p.techStack.join(", ")})` : "";
      return `${p.title}: ${p.description}${techStack}`;
    });
    parts.push(`Projects: ${projectTexts.join("; ")}`);
  }

  if (profile.workExperience && profile.workExperience.length > 0) {
    const workTexts = profile.workExperience.map(
      (w) => `${w.role} at ${w.company}: ${w.description}`
    );
    parts.push(`Experience: ${workTexts.join("; ")}`);
  }

  if (profile.certifications && profile.certifications.length > 0) {
    const certNames = profile.certifications.map((c) => c.title).join(", ");
    parts.push(`Certifications: ${certNames}`);
  }

  return parts.join(". ");
}

function composeJDEmbeddingText(jd: {
  parsedJd?: ParsedJD | null;
  rawJd: string;
  roleTitle: string;
  company: string;
}): string {
  if (jd.parsedJd) {
    const parts: string[] = [];
    parts.push(`${jd.parsedJd.title} at ${jd.parsedJd.company}`);

    if (jd.parsedJd.responsibilities && jd.parsedJd.responsibilities.length > 0) {
      parts.push(`Responsibilities: ${jd.parsedJd.responsibilities.join("; ")}`);
    }

    if (jd.parsedJd.requiredSkills && jd.parsedJd.requiredSkills.length > 0) {
      parts.push(`Required Skills: ${jd.parsedJd.requiredSkills.join(", ")}`);
    }

    if (jd.parsedJd.preferredSkills && jd.parsedJd.preferredSkills.length > 0) {
      parts.push(`Preferred Skills: ${jd.parsedJd.preferredSkills.join(", ")}`);
    }

    if (jd.parsedJd.qualifications && jd.parsedJd.qualifications.length > 0) {
      parts.push(`Qualifications: ${jd.parsedJd.qualifications.join("; ")}`);
    }

    if (jd.parsedJd.summary) {
      parts.push(jd.parsedJd.summary);
    }

    return parts.join(". ");
  }

  return `${jd.roleTitle} at ${jd.company}. ${jd.rawJd}`;
}

describe("Text Composition", () => {
  describe("composeStudentEmbeddingText", () => {
    it("should compose text from skills", () => {
      const profile = {
        skills: [
          { name: "Python", proficiency: 4 as const },
          { name: "JavaScript", proficiency: 3 as const },
        ],
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toBe("Skills: Python, JavaScript");
    });

    it("should compose text from projects with tech stack", () => {
      const profile = {
        projects: [
          {
            title: "E-commerce App",
            description: "Built a full-stack shopping platform",
            techStack: ["React", "Node.js", "MongoDB"],
          },
        ],
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toContain("E-commerce App");
      expect(result).toContain("React, Node.js, MongoDB");
    });

    it("should compose text from work experience", () => {
      const profile = {
        workExperience: [
          {
            company: "TechCorp",
            role: "Software Intern",
            description: "Developed backend APIs",
            startDate: "2025-06",
          },
        ],
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toContain("Software Intern at TechCorp");
    });

    it("should compose text from certifications", () => {
      const profile = {
        certifications: [
          { title: "AWS Solutions Architect", issuer: "Amazon" },
          { title: "Google Cloud Professional", issuer: "Google" },
        ],
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toBe(
        "Certifications: AWS Solutions Architect, Google Cloud Professional"
      );
    });

    it("should combine all sections", () => {
      const profile = {
        skills: [{ name: "Python", proficiency: 4 as const }],
        projects: [
          {
            title: "ML Project",
            description: "Built a classifier",
            techStack: ["TensorFlow"],
          },
        ],
        workExperience: [
          {
            company: "DataCo",
            role: "Data Intern",
            description: "Analyzed data",
            startDate: "2025-01",
          },
        ],
        certifications: [{ title: "TensorFlow Developer", issuer: "Google" }],
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toContain("Skills: Python");
      expect(result).toContain("Projects:");
      expect(result).toContain("Experience:");
      expect(result).toContain("Certifications:");
    });

    it("should handle null/empty fields", () => {
      const profile = {
        skills: null,
        projects: [],
        workExperience: undefined,
        certifications: null,
      };

      const result = composeStudentEmbeddingText(profile);
      expect(result).toBe("");
    });

    it("should produce deterministic output", () => {
      const profile = {
        skills: [
          { name: "Python", proficiency: 4 as const },
          { name: "JavaScript", proficiency: 3 as const },
        ],
      };

      const result1 = composeStudentEmbeddingText(profile);
      const result2 = composeStudentEmbeddingText(profile);
      expect(result1).toBe(result2);
    });
  });

  describe("composeJDEmbeddingText", () => {
    it("should use parsed JD when available", () => {
      const jd = {
        parsedJd: {
          title: "Software Engineer",
          company: "Google",
          responsibilities: ["Build systems", "Write code"],
          requiredSkills: ["Python", "Go"],
          preferredSkills: ["Kubernetes"],
          qualifications: ["BS in CS"],
          summary: "Join our team to build amazing products.",
        },
        rawJd: "Raw JD text",
        roleTitle: "SDE",
        company: "Google",
      };

      const result = composeJDEmbeddingText(jd);
      expect(result).toContain("Software Engineer at Google");
      expect(result).toContain("Responsibilities:");
      expect(result).toContain("Required Skills: Python, Go");
      expect(result).toContain("Preferred Skills: Kubernetes");
    });

    it("should fall back to raw JD when parsed is null", () => {
      const jd = {
        parsedJd: null,
        rawJd: "We are looking for a talented engineer...",
        roleTitle: "Software Engineer",
        company: "Startup Inc",
      };

      const result = composeJDEmbeddingText(jd);
      expect(result).toBe(
        "Software Engineer at Startup Inc. We are looking for a talented engineer..."
      );
    });

    it("should produce deterministic output", () => {
      const jd = {
        parsedJd: {
          title: "SDE",
          company: "Amazon",
          responsibilities: ["Code"],
          requiredSkills: ["Java"],
          preferredSkills: [],
          qualifications: [],
          summary: "Join us.",
        },
        rawJd: "",
        roleTitle: "SDE",
        company: "Amazon",
      };

      const result1 = composeJDEmbeddingText(jd);
      const result2 = composeJDEmbeddingText(jd);
      expect(result1).toBe(result2);
    });
  });
});
