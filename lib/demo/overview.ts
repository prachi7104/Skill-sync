import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoResumeFiles, students } from "@/lib/db/schema";
import type { ParsedResumeData } from "@/lib/resume/ai-parser";
import { getStudentFit } from "./ranking";
import type { DemoGuest } from "./session";

type GuestMeta = { source?: "upload" | "sample"; model?: string; provider?: string; parsedAt?: string };

/** Rule-based resume checks. Deterministic, so the UI labels them "computed". */
function resumeHealth(parsed: ParsedResumeData | null) {
  const checks = [
    { key: "summary", label: "Professional summary", ok: !!parsed?.professional_summary, tip: "Add a two-line summary that names the role you want." },
    { key: "skills", label: "At least 8 skills listed", ok: (parsed?.skills?.length ?? 0) >= 8, tip: "List the tools and languages you have actually used." },
    { key: "projects", label: "2+ projects", ok: (parsed?.projects?.length ?? 0) >= 2, tip: "Add projects with their tech stack and what you built." },
    { key: "experience", label: "Work or internship experience", ok: (parsed?.experience?.length ?? 0) >= 1, tip: "Include internships, freelance or campus roles." },
    { key: "education", label: "Education with CGPA", ok: !!parsed?.education_history?.some((e) => e.current_cgpa || e.score_or_cgpa), tip: "Show your degree, institution and CGPA." },
    { key: "metrics", label: "Quantified impact", ok: JSON.stringify(parsed?.experience ?? []).match(/\d+\s*(%|\+|users|ms|x\b)/i) !== null || JSON.stringify(parsed?.projects ?? []).match(/\d+\s*(%|\+|users|ms|x\b)/i) !== null, tip: "Add numbers: users, speed-ups, percentages." },
    { key: "links", label: "Profile links", ok: !!parsed?.linkedin_url || (parsed?.coding_profiles?.length ?? 0) > 0, tip: "Link GitHub, LinkedIn or a portfolio." },
  ];
  return { score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100), checks };
}

export async function getStudentOverview(guest: DemoGuest) {
  const profile = await db.query.students.findFirst({
    where: and(eq(students.id, guest.studentUserId), eq(students.collegeId, guest.collegeId)),
    columns: {
      cgpa: true, branch: true, batchYear: true, skills: true, projects: true, workExperience: true,
      certifications: true, achievements: true, parsedResumeJson: true, resumeParsedAt: true, resumeFilename: true, profileCompleteness: true,
    },
  });
  if (!profile) return null;
  const [file] = await db.select({ filename: demoResumeFiles.filename }).from(demoResumeFiles)
    .where(and(eq(demoResumeFiles.studentId, guest.studentUserId), eq(demoResumeFiles.collegeId, guest.collegeId))).limit(1);
  const parsed = (profile.parsedResumeJson ?? null) as (ParsedResumeData & { _guest?: GuestMeta }) | null;
  const meta = parsed?._guest;
  return {
    resume: {
      // "preloaded" = fictional sample profile created with the workspace; no AI involved.
      source: meta?.source ?? "preloaded",
      model: meta?.model ?? null,
      provider: meta?.provider ?? null,
      parsedAt: meta?.parsedAt ?? null,
      filename: file?.filename ?? null,
      downloadable: !!file,
    },
    profile: {
      name: parsed?.full_name ?? null,
      summary: parsed?.professional_summary ?? null,
      cgpa: profile.cgpa, branch: profile.branch, batchYear: profile.batchYear,
      completeness: profile.profileCompleteness,
      skills: (profile.skills ?? []).map((s) => ({ name: s.name, category: s.category ?? "General" })),
      projects: profile.projects ?? [],
      experience: profile.workExperience ?? [],
      education: (parsed?.education_history ?? []).map((e) => ({
        institution: e.institution, degree: e.degree, branch: e.branch,
        year: e.expected_graduation ?? e.year_of_completion ?? null, cgpa: e.current_cgpa ?? e.score_or_cgpa ?? null,
      })),
      certifications: (profile.certifications ?? []).map((c) => c.title),
      achievements: (profile.achievements ?? []).map((a) => a.title),
    },
    health: resumeHealth(parsed),
    fit: await getStudentFit(guest),
  };
}
