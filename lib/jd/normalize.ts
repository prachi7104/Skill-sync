import type { JDRequirements, JDTechnicalSkill, StructuredJD } from "./parser";

type PartialRequirements = Partial<JDRequirements> & {
  hard_requirements?: Partial<JDRequirements["hard_requirements"]> | null;
  soft_requirements?: Partial<JDRequirements["soft_requirements"]> | null;
};

function normalizeTechnicalSkillEntry(entry: unknown): JDTechnicalSkill | null {
  if (typeof entry === "string") {
    const skill = entry.trim();
    if (!skill) return null;

    return {
      skill,
      proficiency_level: "Unknown",
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const skill = (entry as { skill?: unknown }).skill;
  if (typeof skill !== "string" || skill.trim() === "") {
    return null;
  }

  return {
    ...(entry as JDTechnicalSkill),
    skill: skill.trim(),
    proficiency_level: (entry as JDTechnicalSkill).proficiency_level ?? "Unknown",
  };
}

export function normalizeTechnicalSkillsArray(value: unknown): JDTechnicalSkill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeTechnicalSkillEntry)
    .filter((entry): entry is JDTechnicalSkill => Boolean(entry));
}

export function normalizeJDRequirements(requirements: StructuredJD["requirements"] | null | undefined): JDRequirements {
  const rawRequirements = (requirements ?? {}) as PartialRequirements;
  const hardRequirements = (rawRequirements.hard_requirements ?? {}) as Partial<JDRequirements["hard_requirements"]>;
  const softRequirements = (rawRequirements.soft_requirements ?? {}) as Partial<JDRequirements["soft_requirements"]>;

  return {
    hard_requirements: {
      technical_skills: normalizeTechnicalSkillsArray(hardRequirements.technical_skills),
      education: hardRequirements.education ?? {
        degree_level: "Unknown",
        field: "Unknown",
        mandatory: false,
      },
      experience: hardRequirements.experience ?? {
        total_years: "0",
      },
      domain_knowledge: Array.isArray(hardRequirements.domain_knowledge) ? hardRequirements.domain_knowledge : [],
      soft_skills: Array.isArray(hardRequirements.soft_skills) ? hardRequirements.soft_skills : [],
    },
    soft_requirements: {
      technical_skills: normalizeTechnicalSkillsArray(softRequirements.technical_skills),
      experience: Array.isArray(softRequirements.experience) ? softRequirements.experience : [],
    },
  };
}