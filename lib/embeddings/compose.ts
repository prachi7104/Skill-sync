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
import type { StructuredJD } from "@/lib/jd/parser";

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
  parsedJd?: ParsedJD | StructuredJD | null;
  rawJd: string;
  roleTitle: string;
  company: string;
}): string {
  // If we have a parsed JD, use structured data (no company / summary)
  if (jd.parsedJd) {
    const parsed = jd.parsedJd;
    const parts: string[] = [];

    // Detect: StructuredJD has role_metadata, ParsedJD has title
    if ('role_metadata' in parsed && parsed.role_metadata?.job_title) {
      // StructuredJD format
      parts.push(`Role: ${parsed.role_metadata.job_title}`);

      if (parsed.responsibilities?.primary_tasks && parsed.responsibilities.primary_tasks.length > 0) {
        parts.push(`Responsibilities: ${parsed.responsibilities.primary_tasks.join("; ")}`);
      }

      if (parsed.requirements?.hard_requirements?.technical_skills && parsed.requirements.hard_requirements.technical_skills.length > 0) {
        const skills = parsed.requirements.hard_requirements.technical_skills.map((s: any) => s.skill).join(", ");
        parts.push(`Required Skills: ${skills}`);
      }

      if (parsed.requirements?.soft_requirements?.technical_skills && parsed.requirements.soft_requirements.technical_skills.length > 0) {
        const skills = parsed.requirements.soft_requirements.technical_skills.map((s: any) => s.skill).join(", ");
        parts.push(`Preferred Skills: ${skills}`);
      }
    } else if ('title' in parsed) {
      // ParsedJD format (legacy DB data)
      const legacy = parsed as ParsedJD;
      if (legacy.title) parts.push(`Role: ${legacy.title}`);
      if (legacy.responsibilities && legacy.responsibilities.length > 0) {
        parts.push(`Responsibilities: ${legacy.responsibilities.join("; ")}`);
      }
      if (legacy.requiredSkills && legacy.requiredSkills.length > 0) {
        parts.push(`Required Skills: ${legacy.requiredSkills.join(", ")}`);
      }
      if (legacy.preferredSkills && legacy.preferredSkills.length > 0) {
        parts.push(`Preferred Skills: ${legacy.preferredSkills.join(", ")}`);
      }
      if (legacy.qualifications && legacy.qualifications.length > 0) {
        parts.push(`Qualifications: ${legacy.qualifications.join("; ")}`);
      }
    }

    if (parts.length > 0) return parts.join(". ");
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
 * Supports both ParsedJD (legacy DB format) and StructuredJD (new parser format).
 *
 * @param parsedJd - Parsed job description
 * @returns Array of required skill name strings (lowercase, trimmed)
 */
export function extractJDRequiredSkills(parsedJd: ParsedJD | StructuredJD | null | undefined): string[] {
  if (!parsedJd) return [];

  // StructuredJD format
  if ('requirements' in parsedJd && parsedJd.requirements?.hard_requirements?.technical_skills) {
    return parsedJd.requirements.hard_requirements.technical_skills.map((s: any) => s.skill.toLowerCase().trim());
  }

  // ParsedJD format (legacy)
  if ('requiredSkills' in parsedJd && parsedJd.requiredSkills && parsedJd.requiredSkills.length > 0) {
    return parsedJd.requiredSkills.map((s: string) => s.toLowerCase().trim());
  }

  return [];
}
