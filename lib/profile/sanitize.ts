/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Profile Sanitization Contract
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Shared sanitization layer for all profile writes (onboarding + profile edit + API).
 * Normalizes:
 *   1. Trim all string fields (leading/trailing whitespace)
 *   2. Filter array items where required fields are empty after trim
 *   3. Preserve optional fields (URLs, descriptions) that are legitimately empty
 *   4. Preserve null/undefined as distinct from empty strings
 *
 * Rules:
 *   - skill.name must be non-empty (required)
 *   - project.title must be non-empty (required)
 *   - project.url may be empty (optional)
 *   - cert.title must be non-empty (required)
 *   - cert.url may be empty (optional)
 *   - codingProfile.platform & username must be non-empty (required)
 *   - codingProfile.url may be empty (optional)
 *   - workExperience.company & role must be non-empty (required)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { StudentProfileInput } from "@/lib/validations/student-profile";

type SanitizedSkill = {
  name: string;
  proficiency?: number;
  category?: string;
}

type SanitizedProject = {
  title: string;
  description?: string | null;
  techStack?: string[];
  url?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

type SanitizedCertification = {
  title: string;
  issuer: string;
  dateIssued?: string | null;
  url?: string | null;
}

type SanitizedCodingProfile = {
  platform: string;
  username: string;
  url?: string | null;
  rating?: number;
  problemsSolved?: number;
}

type SanitizedWorkExperience = {
  company: string;
  role: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
}

type SanitizedAchievement = {
  title: string;
  description?: string | null;
  date?: string | null;
  issuer?: string | null;
}

type SanitizedResearchPaper = {
  title: string;
  abstract?: string | null;
  url?: string | null;
  datePublished?: string | null;
}

/**
 * Trim a string field, or return null/undefined as-is
 */
function trimString(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  const trimmed = String(value).trim();
  return trimmed === "" ? "" : trimmed;
}

/**
 * Check if a string is empty after trimming
 */
function isEmpty(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return String(value).trim() === "";
}

/**
 * Sanitize a skill object: trim name, filter if empty
 * Returns { name, proficiency?, category? } or null if invalid
 */
function sanitizeSkill(skill: { name?: string | null; proficiency?: number | null; category?: string | null }): SanitizedSkill | null {
  if (!skill || typeof skill !== "object") return null;

  const trimmedName = trimString(skill.name);
  if (isEmpty(trimmedName)) return null; // Required field missing
  const name = trimmedName as string;

  return {
    name,
    ...(skill.proficiency !== undefined && skill.proficiency !== null && { proficiency: skill.proficiency }),
    ...(skill.category && typeof skill.category === "string" && { category: skill.category.trim() }),
  };
}

/**
 * Sanitize a project object: trim title, preserve optional fields
 * Returns { title, description?, techStack?, url?, startDate?, endDate? } or null if invalid
 */
function sanitizeProject(project: { title?: string | null; description?: string | null; techStack?: string[] | null; url?: string | null; startDate?: string | null; endDate?: string | null }): SanitizedProject | null {
  if (!project || typeof project !== "object") return null;

  const trimmedTitle = trimString(project.title);
  if (isEmpty(trimmedTitle)) return null; // Required field missing
  const title = trimmedTitle as string;

  return {
    title,
    ...(project.description && { description: trimString(project.description) }),
    ...(project.techStack && Array.isArray(project.techStack) && { techStack: project.techStack }),
    ...(project.url !== undefined && project.url !== null && { url: trimString(project.url) }),
    ...(project.startDate && { startDate: project.startDate }),
    ...(project.endDate && { endDate: project.endDate }),
  };
}

/**
 * Sanitize a certification object: trim title/issuer, preserve optional url
 * Returns { title, issuer, dateIssued?, url? } or null if invalid
 */
function sanitizeCertification(cert: { title?: string | null; issuer?: string | null; dateIssued?: string | null; url?: string | null }): SanitizedCertification | null {
  if (!cert || typeof cert !== "object") return null;

  const trimmedTitle = trimString(cert.title);
  const trimmedIssuer = trimString(cert.issuer);

  if (isEmpty(trimmedTitle) || isEmpty(trimmedIssuer)) return null; // Required fields missing
  const title = trimmedTitle as string;
  const issuer = trimmedIssuer as string;

  return {
    title,
    issuer,
    ...(cert.dateIssued && { dateIssued: cert.dateIssued }),
    ...(cert.url !== undefined && cert.url !== null && { url: trimString(cert.url) }),
  };
}

/**
 * Sanitize a coding profile object: trim platform/username, preserve optional url
 * Returns { platform, username, url?, rating?, problemsSolved? } or null if invalid
 */
function sanitizeCodingProfile(profile: { platform?: string | null; username?: string | null; url?: string | null; rating?: number | null; problemsSolved?: number | null }): SanitizedCodingProfile | null {
  if (!profile || typeof profile !== "object") return null;

  const trimmedPlatform = trimString(profile.platform);
  const trimmedUsername = trimString(profile.username);

  if (isEmpty(trimmedPlatform) || isEmpty(trimmedUsername)) return null; // Required fields missing
  const platform = trimmedPlatform as string;
  const username = trimmedUsername as string;

  return {
    platform,
    username,
    ...(profile.url !== undefined && profile.url !== null && { url: trimString(profile.url) }),
    ...(profile.rating !== undefined && profile.rating !== null && { rating: profile.rating }),
    ...(profile.problemsSolved !== undefined && profile.problemsSolved !== null && { problemsSolved: profile.problemsSolved }),
  };
}

/**
 * Sanitize a work experience object: trim company/role, preserve optional fields
 * Returns { company, role, description?, startDate?, endDate?, location? } or null if invalid
 */
function sanitizeWorkExperience(exp: { company?: string | null; role?: string | null; description?: string | null; startDate?: string | null; endDate?: string | null; location?: string | null }): SanitizedWorkExperience | null {
  if (!exp || typeof exp !== "object") return null;

  const trimmedCompany = trimString(exp.company);
  const trimmedRole = trimString(exp.role);

  if (isEmpty(trimmedCompany) || isEmpty(trimmedRole)) return null; // Required fields missing
  const company = trimmedCompany as string;
  const role = trimmedRole as string;

  return {
    company,
    role,
    ...(exp.description && { description: trimString(exp.description) }),
    ...(exp.startDate && { startDate: exp.startDate }),
    ...(exp.endDate && { endDate: exp.endDate }),
    ...(exp.location && { location: exp.location.trim() }),
  };
}

/**
 * Sanitize an achievement object: trim title, preserve optional fields
 * Returns { title, description?, date?, issuer? } or null if invalid
 */
function sanitizeAchievement(achievement: { title?: string | null; description?: string | null; date?: string | null; issuer?: string | null }): SanitizedAchievement | null {
  if (!achievement || typeof achievement !== "object") return null;

  const trimmedTitle = trimString(achievement.title);
  if (isEmpty(trimmedTitle)) return null; // Required field missing
  const title = trimmedTitle as string;

  return {
    title,
    ...(achievement.description && { description: trimString(achievement.description) }),
    ...(achievement.date && { date: achievement.date }),
    ...(achievement.issuer && { issuer: achievement.issuer.trim() }),
  };
}

/**
 * Sanitize a research paper object: trim title, preserve optional fields
 * Returns { title, abstract?, url?, datePublished? } or null if invalid
 */
function sanitizeResearchPaper(paper: { title?: string | null; abstract?: string | null; url?: string | null; datePublished?: string | null }): SanitizedResearchPaper | null {
  if (!paper || typeof paper !== "object") return null;

  const trimmedTitle = trimString(paper.title);
  if (isEmpty(trimmedTitle)) return null; // Required field missing
  const title = trimmedTitle as string;

  return {
    title,
    ...(paper.abstract && { abstract: trimString(paper.abstract) }),
    ...(paper.url !== undefined && paper.url !== null && { url: trimString(paper.url) }),
    ...(paper.datePublished && { datePublished: paper.datePublished }),
  };
}

/**
 * Main sanitization function: clean profile payload before send
 * - Trims all string fields
 * - Filters invalid array items (blank required fields)
 * - Preserves optional empty fields
 * - Does NOT mutate input; returns new object
 *
 * @param payload Partial StudentProfileInput to sanitize
 * @returns Sanitized partial payload (does not mutate input)
 */
export function sanitizeProfilePayload(
  payload: Partial<StudentProfileInput>
): Partial<StudentProfileInput> {
  if (!payload || typeof payload !== "object") return {};

  const sanitized: Partial<StudentProfileInput> = {};

  // Identity fields - trim strings
  if (payload.sapId !== undefined) {
    sanitized.sapId = trimString(payload.sapId);
  }
  if (payload.rollNo !== undefined) {
    sanitized.rollNo = trimString(payload.rollNo);
  }
  if (payload.phone !== undefined) {
    sanitized.phone = trimString(payload.phone);
  }
  if (payload.linkedin !== undefined) {
    sanitized.linkedin = trimString(payload.linkedin);
  }

  // Academic fields - preserve as-is (numbers)
  if (payload.cgpa !== undefined) sanitized.cgpa = payload.cgpa;
  if (payload.branch !== undefined) sanitized.branch = trimString(payload.branch);
  if (payload.batchYear !== undefined) sanitized.batchYear = payload.batchYear;
  if (payload.semester !== undefined) sanitized.semester = payload.semester;
  if (payload.tenthPercentage !== undefined) sanitized.tenthPercentage = payload.tenthPercentage;
  if (payload.twelfthPercentage !== undefined) sanitized.twelfthPercentage = payload.twelfthPercentage;

  // Array fields - filter and sanitize items
  if (payload.skills !== undefined && Array.isArray(payload.skills)) {
    const sanitizedSkills = payload.skills
      .map((s) => sanitizeSkill(s))
      .filter((s) => s !== null);
    sanitized.skills = (sanitizedSkills.length > 0 ? sanitizedSkills : undefined) as StudentProfileInput["skills"];
  }

  if (payload.projects !== undefined && Array.isArray(payload.projects)) {
    const sanitizedProjects = payload.projects
      .map((p) => sanitizeProject(p))
      .filter((p) => p !== null);
    sanitized.projects = (sanitizedProjects.length > 0 ? sanitizedProjects : undefined) as StudentProfileInput["projects"];
  }

  if (payload.certifications !== undefined && Array.isArray(payload.certifications)) {
    const sanitizedCerts = payload.certifications
      .map((c) => sanitizeCertification(c))
      .filter((c) => c !== null);
    sanitized.certifications = (sanitizedCerts.length > 0 ? sanitizedCerts : undefined) as StudentProfileInput["certifications"];
  }

  if (payload.codingProfiles !== undefined && Array.isArray(payload.codingProfiles)) {
    const sanitizedProfiles = payload.codingProfiles
      .map((p) => sanitizeCodingProfile(p))
      .filter((p) => p !== null);
    sanitized.codingProfiles = (sanitizedProfiles.length > 0 ? sanitizedProfiles : undefined) as StudentProfileInput["codingProfiles"];
  }

  if (payload.workExperience !== undefined && Array.isArray(payload.workExperience)) {
    const sanitizedExp = payload.workExperience
      .map((e) => sanitizeWorkExperience(e))
      .filter((e) => e !== null);
    sanitized.workExperience = (sanitizedExp.length > 0 ? sanitizedExp : undefined) as StudentProfileInput["workExperience"];
  }

  if (payload.achievements !== undefined && Array.isArray(payload.achievements)) {
    const sanitizedAchievements = payload.achievements
      .map((a) => sanitizeAchievement(a))
      .filter((a) => a !== null);
    sanitized.achievements = (sanitizedAchievements.length > 0 ? sanitizedAchievements : undefined) as StudentProfileInput["achievements"];
  }

  if (payload.researchPapers !== undefined && Array.isArray(payload.researchPapers)) {
    const sanitizedPapers = payload.researchPapers
      .map((r) => sanitizeResearchPaper(r))
      .filter((r) => r !== null);
    sanitized.researchPapers = (sanitizedPapers.length > 0 ? sanitizedPapers : undefined) as StudentProfileInput["researchPapers"];
  }

  // Soft skills - string array, trim each
  if (payload.softSkills !== undefined && Array.isArray(payload.softSkills)) {
    const sanitizedSoftSkills = payload.softSkills
      .map((s) => (typeof s === "string" ? s.trim() : s))
      .filter((s) => typeof s === "string" && s !== "");
    sanitized.softSkills = sanitizedSoftSkills.length > 0 ? sanitizedSoftSkills : undefined;
  }

  return sanitized;
}

