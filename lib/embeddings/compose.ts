/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Text Composition for Embeddings
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Deterministic text composition functions for generating embedding inputs
 * from structured student profiles and job descriptions.
 *
 * These functions produce consistent text representations that can be
 * embedded using all-MiniLM-L6-v2 for semantic similarity matching.
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
 * all-MiniLM-L6-v2 has a 256 word-piece token limit (~1500 chars).
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
 * For parsed JDs:
 * - Job title
 * - Company
 * - Responsibilities
 * - Requirements (required + preferred skills)
 * - Tech stack (from skills)
 *
 * For raw JDs, returns the raw text directly.
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
  // If we have a parsed JD, use structured data
  if (jd.parsedJd) {
    const parts: string[] = [];

    // Title and company
    parts.push(`${jd.parsedJd.title} at ${jd.parsedJd.company}`);

    // Responsibilities
    if (jd.parsedJd.responsibilities && jd.parsedJd.responsibilities.length > 0) {
      parts.push(`Responsibilities: ${jd.parsedJd.responsibilities.join("; ")}`);
    }

    // Requirements (required skills)
    if (jd.parsedJd.requiredSkills && jd.parsedJd.requiredSkills.length > 0) {
      parts.push(`Required Skills: ${jd.parsedJd.requiredSkills.join(", ")}`);
    }

    // Preferred skills (tech stack)
    if (jd.parsedJd.preferredSkills && jd.parsedJd.preferredSkills.length > 0) {
      parts.push(`Preferred Skills: ${jd.parsedJd.preferredSkills.join(", ")}`);
    }

    // Qualifications
    if (jd.parsedJd.qualifications && jd.parsedJd.qualifications.length > 0) {
      parts.push(`Qualifications: ${jd.parsedJd.qualifications.join("; ")}`);
    }

    // Summary
    if (jd.parsedJd.summary) {
      parts.push(jd.parsedJd.summary);
    }

    return parts.join(". ");
  }

  // Fallback to raw JD with title and company prefix
  return `${jd.roleTitle} at ${jd.company}. ${jd.rawJd}`;
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
export function extractJDRequiredSkills(parsedJd: ParsedJD | null | undefined): string[] {
  if (!parsedJd || !parsedJd.requiredSkills || parsedJd.requiredSkills.length === 0) {
    return [];
  }
  return parsedJd.requiredSkills.map((s) => s.toLowerCase().trim());
}
