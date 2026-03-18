import type { ParsedJD, Skill } from "@/lib/db/schema";

export type CompanyExperienceStatus = "pending" | "ai_approved" | "ai_flagged" | "published" | "rejected";
export type CompanyDriveType = "placement" | "internship" | "ppo";
export type CompanyOutcome = "selected" | "rejected" | "not_disclosed";
export type ResourceSection = "technical" | "softskills";

export const TECHNICAL_RESOURCE_CATEGORIES = [
  "dsa",
  "system_design",
  "web_dev",
  "data_science",
  "devops",
  "programming",
  "databases",
  "networking",
  "os",
  "security",
] as const;

export const SOFTSKILLS_RESOURCE_CATEGORIES = [
  "communication",
  "aptitude",
  "resume_tips",
  "interview_prep",
  "group_discussion",
  "personality_development",
] as const;

export type ResourceCategory = (typeof TECHNICAL_RESOURCE_CATEGORIES)[number] | (typeof SOFTSKILLS_RESOURCE_CATEGORIES)[number];

export function formatCategoryLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function extractRequiredSkills(parsedJd: ParsedJD | null): string[] {
  if (!parsedJd) return [];
  return Array.from(new Set([...(parsedJd.requiredSkills ?? []), ...(parsedJd.preferredSkills ?? [])])).filter(Boolean);
}

export function buildSkillGapFrequency({
  studentSkills,
  parsedJds,
}: {
  studentSkills: Array<Skill | { name: string }>;
  parsedJds: Array<ParsedJD | null>;
}): Record<string, number> {
  const normalizedStudentSkills = studentSkills.map((skill) => skill.name.toLowerCase());
  const frequencies: Record<string, number> = {};

  for (const parsedJd of parsedJds) {
    for (const skill of extractRequiredSkills(parsedJd)) {
      if (normalizedStudentSkills.includes(skill.toLowerCase())) continue;
      frequencies[skill] = (frequencies[skill] ?? 0) + 1;
    }
  }

  return frequencies;
}