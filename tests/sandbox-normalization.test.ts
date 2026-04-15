import { describe, expect, it } from "vitest";
import { normalizeJDRequirements } from "@/lib/jd/normalize";
import { matchSkills } from "@/lib/ats/matching";
import { performDetailedAnalysis } from "@/lib/ats/detailed-analysis";

const malformedJD = {
  role_metadata: {
    job_title: "Backend Engineer",
    role_type: "Engineering",
  },
  requirements: {
    hard_requirements: {
      education: { degree_level: "Bachelor's", field: "CS", mandatory: true },
      experience: { total_years: "2" },
    },
    soft_requirements: {
      technical_skills: null,
    },
  },
  responsibilities: { primary_tasks: [] },
  tech_stack_cluster: {
    primary_cluster: "Backend",
    related_clusters: [],
    core_technologies: [],
    secondary_technologies: [],
    complementary_skills: [],
  },
  normalized_skills: { programming_languages: [], frameworks: [], concepts: [], tools: [], methodologies: [], domains: [] },
  matching_keywords: { critical: [], important: [], context: [] },
} as any;

const resumeFixture = {
  full_name: "Candidate",
  email: null,
  phone: null,
  linkedin_url: null,
  professional_summary: "Built backend APIs with Python and Docker.",
  coding_profiles: [],
  education_history: [],
  experience: [],
  projects: [
    {
      title: "API Platform",
      description: "Built REST endpoints with Python and PostgreSQL",
      tech_stack: ["Python", "PostgreSQL"],
    },
  ],
  skills: [
    { name: "Python", category: "General" },
    { name: "Docker", category: "General" },
  ],
  research_papers: [],
  certifications: [],
  achievements: [],
  soft_skills: ["Communication"],
  computed_stack: { primary: { cluster: "Backend", confidence: 0, evidence: [] } },
  computed_seniority: { level: "Unknown", years: 0, rationale: "N/A", is_student: true },
  research_score: 0,
  implicit_skills: [],
} as any;

const parsedResume = {
  full_name: "Candidate",
  email: null,
  phone: null,
  linkedin_url: null,
  professional_summary: "Built backend APIs with Python and Docker.",
  coding_profiles: [],
  education_history: [],
  experience: [],
  projects: [
    {
      title: "API Platform",
      description: "Built REST endpoints with Python and PostgreSQL",
      tech_stack: ["Python", "PostgreSQL"],
    },
  ],
  skills: [
    { name: "Python", category: "General" },
    { name: "Docker", category: "General" },
  ],
  research_papers: [],
  certifications: [],
  achievements: [],
  soft_skills: ["Communication"],
} as any;

const studentProfile = {
  skills: [{ name: "Python" }],
  projects: [{ title: "API Platform", description: "Built REST endpoints", techStack: ["Python"] }],
  workExperience: [{ role: "Intern", company: "Acme", description: "Built APIs" }],
  softSkills: ["Communication"],
  certifications: [],
  codingProfiles: [],
} as any;

describe("Sandbox normalization regression", () => {
  it("normalizes malformed JD skill arrays before analysis", () => {
    const normalized = normalizeJDRequirements(malformedJD.requirements);

    expect(Array.isArray(normalized.hard_requirements.technical_skills)).toBe(true);
    expect(Array.isArray(normalized.soft_requirements.technical_skills)).toBe(true);
    expect(normalized.hard_requirements.technical_skills).toEqual([]);
    expect(normalized.soft_requirements.technical_skills).toEqual([]);
  });

  it("does not throw in matcher when preferred skills are malformed", () => {
    expect(() => matchSkills(malformedJD as any, resumeFixture)).not.toThrow();

    const result = matchSkills(malformedJD as any, resumeFixture);
    expect(result).toHaveProperty("matched");
    expect(Array.isArray(result.missing_critical)).toBe(true);
  });

  it("does not throw in detailed sandbox analysis when JD skills are malformed", async () => {
    await expect(
      performDetailedAnalysis(
        malformedJD as any,
        null,
        "Resume text",
        parsedResume,
        studentProfile,
        null
      )
    ).resolves.toHaveProperty("recommendation");
  });
});