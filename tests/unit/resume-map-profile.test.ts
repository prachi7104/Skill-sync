import { describe, expect, it } from "vitest";
import { mapParsedResumeToProfile, type ParsedResumeData } from "@/lib/resume/ai-parser";

describe("mapParsedResumeToProfile", () => {
  it("deduplicates repeated resume entities and normalizes coding profile fallbacks", () => {
    const parsed: ParsedResumeData = {
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "+911234567890",
      linkedin_url: "https://linkedin.com/in/jane",
      professional_summary: "summary",
      coding_profiles: [
        {
          platform: "GitHub",
          profile_url: "https://github.com/janedoe",
        },
        {
          platform: "GitHub",
          profile_url: "https://github.com/janedoe",
        },
        {
          platform: "LeetCode",
          profile_url: "",
        },
      ],
      education_history: [],
      experience: [
        {
          company: "Acme",
          role: "Intern",
          duration: "Jan 2024 - Jun 2024",
          description: "Built APIs",
        },
        {
          company: "Acme",
          role: "Intern",
          duration: "Jan 2024 - Jun 2024",
          description: "Built APIs",
        },
      ],
      projects: [
        {
          title: "SkillSync",
          description: "Placement platform",
          tech_stack: ["React", "TypeScript", "React"],
        },
        {
          title: "  SkillSync  ",
          description: "Placement platform",
          tech_stack: ["TypeScript"],
        },
      ],
      skills: [
        { name: "React", category: "framework" },
        { name: " react ", category: "framework" },
        { name: "TypeScript", category: "programming" },
      ],
      research_papers: [
        { title: "Edge AI" },
        { title: " edge ai " },
      ],
      certifications: [
        { certification_name: "AWS Cloud Practitioner", issuer: "AWS" },
        { certification_name: "aws cloud practitioner", issuer: "aws" },
      ],
      achievements: [
        { title: "Hackathon Winner", issuer: "College" },
        { title: "hackathon winner", issuer: "college" },
      ],
      soft_skills: ["Communication", " communication ", "Leadership"],
    };

    const mapped = mapParsedResumeToProfile(parsed);

    expect(mapped.skills).toHaveLength(2);
    expect(mapped.projects).toHaveLength(1);
    expect(mapped.workExperience).toHaveLength(1);
    expect(mapped.codingProfiles).toHaveLength(2);
    expect(mapped.certifications).toHaveLength(1);
    expect(mapped.researchPapers).toHaveLength(1);
    expect(mapped.achievements).toHaveLength(1);
    expect(mapped.softSkills).toEqual(["Communication", "Leadership"]);

    const leetCode = mapped.codingProfiles.find((p) => p.platform === "LeetCode");
    expect(leetCode).toBeDefined();
    expect(leetCode?.username.length).toBeGreaterThan(0);
  });
});
