/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Text Composition for Embeddings
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Deterministic text composition functions for generating embedding inputs
 * from structured student profiles and job descriptions.
 *
 * These functions produce consistent text representations that can be
 * embedded using the current semantic embedding model for similarity matching.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import type {
  Skill,
  Project,
  WorkExperience,
  Certification,
  ParsedJD,
} from "@/lib/db/schema";

/**
 * Maximum character length for embedding text input.
 * Tuned to keep inputs within typical embedding model limits.
 * Prioritizes skills and project titles over long descriptions.
 */
const MAX_EMBEDDING_TEXT_LENGTH = 1500;

/**
 * Composes embedding text from a student profile.
 *
 * Includes (priority order for truncation):
 * 1. Skills (names only) — highest signal
 * 2. Project titles + tech stacks
 * 3. Work experience roles + companies
 * 4. Certifications (names only)
 * 5. Project descriptions (lowest priority, trimmed first)
 *
 * Truncates to MAX_EMBEDDING_TEXT_LENGTH characters.
 *
 * @param profile - Student profile data
 * @returns Deterministic text representation for embedding generation
 */
export function composeStudentEmbeddingText(profile: {
  skills?: Skill[] | null;
  projects?: Project[] | null;
  workExperience?: WorkExperience[] | null;
  certifications?: Certification[] | null;
}): string {
  const parts: string[] = [];

  // 1. Skills (names only) — highest priority
  if (profile.skills && profile.skills.length > 0) {
    const skillNames = profile.skills.map((s) => s.name).join(", ");
    parts.push(`Skills: ${skillNames}`);
  }

  // 2. Projects (titles + tech stacks first, descriptions added later if space allows)
  const projectTitles: string[] = [];
  const projectDescriptions: string[] = [];
  if (profile.projects && profile.projects.length > 0) {
    for (const p of profile.projects) {
      const techStack = p.techStack?.length > 0 ? ` (${p.techStack.join(", ")})` : "";
      projectTitles.push(`${p.title}${techStack}`);
      if (p.description) {
        projectDescriptions.push(`${p.title}: ${p.description}`);
      }
    }
    parts.push(`Projects: ${projectTitles.join("; ")}`);
  }

  // 3. Work experience (roles + companies)
  if (profile.workExperience && profile.workExperience.length > 0) {
    const workTexts = profile.workExperience.map(
      (w) => `${w.role} at ${w.company}`,
    );
    parts.push(`Experience: ${workTexts.join("; ")}`);
  }

  // 4. Certifications (names only)
  if (profile.certifications && profile.certifications.length > 0) {
    const certNames = profile.certifications.map((c) => c.title).join(", ");
    parts.push(`Certifications: ${certNames}`);
  }

  let text = parts.join(". ");

  // 5. If under budget, append project descriptions for richer context
  if (text.length < MAX_EMBEDDING_TEXT_LENGTH && projectDescriptions.length > 0) {
    const remaining = MAX_EMBEDDING_TEXT_LENGTH - text.length - 2; // ". " separator
    const descText = projectDescriptions.join("; ").slice(0, remaining);
    text += `. ${descText}`;
  }

  // Final truncation guard
  if (text.length > MAX_EMBEDDING_TEXT_LENGTH) {
    text = text.slice(0, MAX_EMBEDDING_TEXT_LENGTH);
  }

  return text;
}

/**
 * Composes embedding text from a job description.
 *
 * For parsed JDs, focuses on HIGH-SIGNAL fields only:
 * - Role title (what the job is)
 * - Responsibilities (what the job does)
 * - Required skills (must-have technical skills)
 * - Preferred skills (nice-to-have)
 * - Qualifications (education / experience requirements)
 *
 * EXCLUDED (noise that hurts matching quality):
 * - Company name (irrelevant to candidate skills)
 * - Location / logistics
 * - Generic summary / boilerplate
 *
 * For raw JDs, returns the raw text with the role title prefix.
 *
 * @param jd - Job description data (parsed or raw)
 * @returns Deterministic text representation for embedding generation
 */
export function composeJDEmbeddingText(jd: {
  parsedJd?: ParsedJD | null;
  rawJd: string;
  roleTitle: string;
  company: string;
}): string {
  // If we have a parsed JD, use structured data (no company / summary)
  if (jd.parsedJd) {
    const parts: string[] = [];

    // Role title only (no company)
    if (jd.parsedJd.title) {
      parts.push(`Role: ${jd.parsedJd.title}`);
    }

    // Responsibilities — what they'll actually do
    if (jd.parsedJd.responsibilities && jd.parsedJd.responsibilities.length > 0) {
      parts.push(`Responsibilities: ${jd.parsedJd.responsibilities.join("; ")}`);
    }

    // Requirements (required skills) — highest signal
    if (jd.parsedJd.requiredSkills && jd.parsedJd.requiredSkills.length > 0) {
      parts.push(`Required Skills: ${jd.parsedJd.requiredSkills.join(", ")}`);
    }

    // Preferred skills
    if (jd.parsedJd.preferredSkills && jd.parsedJd.preferredSkills.length > 0) {
      parts.push(`Preferred Skills: ${jd.parsedJd.preferredSkills.join(", ")}`);
    }

    // Qualifications
    if (jd.parsedJd.qualifications && jd.parsedJd.qualifications.length > 0) {
      parts.push(`Qualifications: ${jd.parsedJd.qualifications.join("; ")}`);
    }

    // NOTE: Intentionally omitting jd.parsedJd.company and jd.parsedJd.summary

    return parts.join(". ");
  }

  // Fallback to raw JD with role title prefix only (no company)
  return `${jd.roleTitle}. ${jd.rawJd}`;
}

/**
 * Extracts skill names from a student profile's skills array.
 *
 * @param skills - Array of skill objects
 * @returns Array of skill name strings (lowercase, trimmed)
 */
export function extractStudentSkillNames(skills: Skill[] | null | undefined): string[] {
  if (!skills || skills.length === 0) {
    return [];
  }
  return skills.map((s) => s.name.toLowerCase().trim());
}

/**
 * Extracts required skill names from a parsed JD.
 *
 * @param parsedJd - Parsed job description
 * @returns Array of required skill name strings (lowercase, trimmed)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractJDRequiredSkills(parsedJd: any | null | undefined): string[] {
  if (!parsedJd) return [];

  // New StructuredJD shape (v2 parser output)
  if (parsedJd.requirements?.hard_requirements?.technical_skills) {
    return parsedJd.requirements.hard_requirements.technical_skills
      .map((s: { skill: string }) => s.skill.toLowerCase().trim())
      .filter(Boolean);
  }

  // Legacy EnhancedJD shape (old cron output) — backward compat
  if (Array.isArray(parsedJd.requiredSkills)) {
    return parsedJd.requiredSkills.map((s: string) => s.toLowerCase().trim());
  }

  return [];
}

/**
 * Extracts preferred skill names from a parsed JD.
 *
 * @param parsedJd - Parsed job description
 * @returns Array of preferred skill name strings (lowercase, trimmed)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractJDPreferredSkills(parsedJd: any | null | undefined): string[] {
  if (!parsedJd) return [];

  // New StructuredJD shape
  if (parsedJd.requirements?.soft_requirements?.technical_skills) {
    return parsedJd.requirements.soft_requirements.technical_skills
      .map((s: { skill: string }) => s.skill.toLowerCase().trim())
      .filter(Boolean);
  }

  // Legacy shape
  if (Array.isArray(parsedJd.preferredSkills)) {
    return parsedJd.preferredSkills.map((s: string) => s.toLowerCase().trim());
  }

  return [];
}
