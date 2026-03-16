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
  ResearchPaper,
  Achievement,
  CodingProfile,
} from "@/lib/db/schema";

/**
 * Maximum character length for embedding text input.
 * Tuned to keep inputs within typical embedding model limits.
 * Prioritizes skills and project titles over long descriptions.
 */
const MAX_EMBEDDING_TEXT_LENGTH = 2000;

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
  researchPapers?: ResearchPaper[] | null;
  achievements?: Achievement[] | null;
  softSkills?: string[] | null;
  codingProfiles?: CodingProfile[] | null;
}): string {
  const parts: string[] = [];

  // 1. Skills (names only) — highest priority
  if (profile.skills && profile.skills.length > 0) {
    const skillNames = profile.skills.map((s) => s.name).join(", ");
    parts.push(`Skills: ${skillNames}`);
  }

  // 2. Soft skills (light signal)
  if (profile.softSkills && profile.softSkills.length > 0) {
    parts.push(`Soft Skills: ${profile.softSkills.slice(0, 10).join(", ")}`);
  }

  // 3. Projects (titles + tech stacks first, descriptions added later if space allows)
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

  // 4. Work experience (roles + companies)
  if (profile.workExperience && profile.workExperience.length > 0) {
    const workTexts = profile.workExperience.map(
      (w) => `${w.role} at ${w.company}`,
    );
    parts.push(`Experience: ${workTexts.join("; ")}`);
  }

  // 5. Certifications (names + issuer)
  if (profile.certifications && profile.certifications.length > 0) {
    const certNames = profile.certifications
      .map((c) => (c.issuer ? `${c.title} (${c.issuer})` : c.title))
      .join(", ");
    parts.push(`Certifications: ${certNames}`);
  }

  // 6. Coding platforms (platform signal only)
  if (profile.codingProfiles && profile.codingProfiles.length > 0) {
    const platforms = profile.codingProfiles
      .map((cp) => cp.platform)
      .filter(Boolean)
      .slice(0, 10);
    if (platforms.length > 0) {
      parts.push(`Coding Profiles: ${platforms.join(", ")}`);
    }
  }

  // 7. Research papers (important for AI/ML/research roles)
  if (profile.researchPapers && profile.researchPapers.length > 0) {
    const papers = profile.researchPapers.map((r) => r.title).filter(Boolean);
    if (papers.length > 0) {
      parts.push(`Research: ${papers.join(", ")}`);
    }
  }

  // 8. Achievements (first 5)
  if (profile.achievements && profile.achievements.length > 0) {
    const ach = profile.achievements
      .slice(0, 5)
      .map((a) => a.title ?? String(a))
      .filter(Boolean);
    if (ach.length > 0) {
      parts.push(`Achievements: ${ach.join("; ")}`);
    }
  }

  let text = parts.join(". ");

  // 9. If under budget, append project descriptions for richer context
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
  parsedJd?: any | null;
  rawJd: string;
  roleTitle: string;
  company: string;
}): string {
  const parts: string[] = [];

  if (jd.parsedJd) {
    const p = jd.parsedJd;

    // StructuredJD shape (from process-jd-enhancement)
    const title = p.role_metadata?.job_title || p.title;
    if (title) parts.push(`Role: ${title}`);

    const primaryTasks: string[] = p.responsibilities?.primary_tasks ?? [];
    if (primaryTasks.length > 0) {
      parts.push(`Responsibilities: ${primaryTasks.join("; ")}`);
    }

    const hardSkills: string[] = (p.requirements?.hard_requirements?.technical_skills ?? [])
      .map((s: any) => s.skill).filter(Boolean);
    if (hardSkills.length > 0) {
      parts.push(`Required Skills: ${hardSkills.join(", ")}`);
    }

    const softSkills: string[] = (p.requirements?.soft_requirements?.technical_skills ?? [])
      .map((s: any) => s.skill).filter(Boolean);
    if (softSkills.length > 0) {
      parts.push(`Preferred Skills: ${softSkills.join(", ")}`);
    }

    const normalizedHard: string[] = p.normalized_skills?.hard_skills ?? [];
    if (normalizedHard.length > 0 && hardSkills.length === 0) {
      parts.push(`Skills: ${normalizedHard.join(", ")}`);
    }

    const keywords: string[] = p.matching_keywords?.primary_keywords ?? [];
    if (keywords.length > 0) {
      parts.push(`Keywords: ${keywords.join(", ")}`);
    }
  }

  // Always fall back to raw JD if structured extraction yields nothing
  if (parts.length === 0) {
    const prefix = `Role: ${jd.roleTitle}`;
    return `${prefix}. ${jd.rawJd}`.slice(0, 8000);
  }

  return parts.join(". ");
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
