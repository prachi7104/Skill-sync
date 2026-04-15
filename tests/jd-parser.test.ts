import { describe, it, expect } from "vitest";
import { normalizeJDRequirements } from "@/lib/jd/normalize";

describe("JD normalization — null safety", () => {
  it("creates empty requirement arrays when requirements is missing", () => {
    const result = normalizeJDRequirements(undefined);

    expect(result.hard_requirements.technical_skills).toEqual([]);
    expect(result.soft_requirements.technical_skills).toEqual([]);
    expect(result.hard_requirements.education.degree_level).toBe("Unknown");
    expect(result.hard_requirements.experience.total_years).toBe("0");
  });

  it("preserves valid technical skill arrays", () => {
    const result = normalizeJDRequirements({
      hard_requirements: {
        technical_skills: [{ skill: "Python", proficiency_level: "Expert" }],
        education: { degree_level: "Bachelor's", field: "CS", mandatory: true },
        experience: { total_years: "1" },
      },
      soft_requirements: {
        technical_skills: [{ skill: "Docker", proficiency_level: "Familiar" }],
      },
    });

    expect(result.hard_requirements.technical_skills).toHaveLength(1);
    expect(result.hard_requirements.technical_skills[0]).toMatchObject({
      skill: "Python",
      proficiency_level: "Expert",
    });
    expect(result.soft_requirements.technical_skills).toHaveLength(1);
    expect(result.soft_requirements.technical_skills[0]).toMatchObject({
      skill: "Docker",
      proficiency_level: "Familiar",
    });
  });

  it("coerces malformed technical skill values to arrays", () => {
    const result = normalizeJDRequirements({
      hard_requirements: {
        technical_skills: null as unknown as never,
        education: { degree_level: "Bachelor's", field: "CS", mandatory: true },
        experience: { total_years: "2" },
      },
      soft_requirements: {
        technical_skills: undefined as unknown as never,
      },
    });

    expect(result.hard_requirements.technical_skills).toEqual([]);
    expect(result.soft_requirements.technical_skills).toEqual([]);
  });

  it("converts string technical skill entries into structured objects", () => {
    const result = normalizeJDRequirements({
      hard_requirements: {
        technical_skills: ["Python", "  ", "Docker"] as any,
        education: { degree_level: "Bachelor's", field: "CS", mandatory: true },
        experience: { total_years: "2" },
      },
      soft_requirements: {
        technical_skills: ["Communication"] as any,
      },
    });

    expect(result.hard_requirements.technical_skills).toHaveLength(2);
    expect(result.hard_requirements.technical_skills[0]).toMatchObject({
      skill: "Python",
      proficiency_level: "Unknown",
    });
    expect(result.hard_requirements.technical_skills[1]).toMatchObject({
      skill: "Docker",
      proficiency_level: "Unknown",
    });
    expect(result.soft_requirements.technical_skills[0]).toMatchObject({
      skill: "Communication",
      proficiency_level: "Unknown",
    });
  });
});

describe("Cluster detection — stack alignment scoring", () => {
  const RELATED_CLUSTERS: Record<string, string[]> = {
    "Automation/No-Code": ["Python Web", "MERN Stack", "DevOps/SRE"],
    "AI/LLM Engineering": ["Python ML/AI", "Python Web", "MERN Stack"],
    "MERN Stack": ["Python Web", "Java Enterprise", "AI/LLM Engineering"],
    "Python ML/AI": ["Research/Academic ML", "Data Engineering", "AI/LLM Engineering"],
  };

  function calculateStackAlignment(jdCluster: string, candidatePrimary: string, candidateSecondary?: string): number {
    if (candidatePrimary === jdCluster) return 1.0;
    if (candidateSecondary === jdCluster) return 0.8;
    const related = RELATED_CLUSTERS[jdCluster] || [];
    if (related.includes(candidatePrimary)) return 0.6;
    if (candidateSecondary && related.includes(candidateSecondary)) return 0.5;
    return 0.3;
  }

  it("exact cluster match should return 1.0", () => {
    expect(calculateStackAlignment("MERN Stack", "MERN Stack")).toBe(1.0);
  });

  it("MERN candidate applying to Automation/No-Code role should get 0.6 (related)", () => {
    expect(calculateStackAlignment("Automation/No-Code", "MERN Stack")).toBe(0.6);
  });

  it("MERN candidate applying to AI/LLM Engineering should get 0.6 (related)", () => {
    expect(calculateStackAlignment("AI/LLM Engineering", "MERN Stack")).toBe(0.6);
  });

  it("unrelated cluster should return 0.3", () => {
    expect(calculateStackAlignment("Android Native", "MERN Stack")).toBe(0.3);
  });

  it("empty cluster string should NOT produce NaN or exception", () => {
    const result = calculateStackAlignment("", "MERN Stack");
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
    expect(result).toBe(0.3);
  });
});
