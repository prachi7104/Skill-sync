import "server-only";

import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { drives, rankings, students, users } from "@/lib/db/schema";
import type { ParsedJD } from "@/lib/db/schema";
import { generateEmbedding, isValidEmbedding } from "@/lib/embeddings";
import { computeRanking } from "@/lib/matching/computeRanking";
import { demoJdEmbeddingText } from "./fixtures";
import type { DemoGuest } from "./session";

const candidatePattern = (collegeId: string) => `candidate-%@${collegeId}.demo.invalid`;

/** Re-ranks every opening in the guest's workspace (stored vectors only). */
export async function rankWorkspace(guest: DemoGuest) {
  const ids = await db.select({ id: drives.id }).from(drives).where(eq(drives.collegeId, guest.collegeId));
  for (const { id } of ids) await computeRanking(id, { collegeId: guest.collegeId, studentId: guest.studentUserId });
}

async function ownDrive(guest: DemoGuest, id: string) {
  const [drive] = await db.select().from(drives)
    .where(and(eq(drives.id, id), eq(drives.collegeId, guest.collegeId), eq(drives.createdBy, guest.recruiterUserId))).limit(1);
  return drive ?? null;
}

function driveSummary(d: typeof drives.$inferSelect) {
  const jd = (d.parsedJd ?? {}) as Partial<ParsedJD>;
  return {
    id: d.id, title: d.roleTitle, company: d.company, location: d.location, packageOffered: d.packageOffered,
    minCgpa: d.minCgpa, summary: jd.summary ?? "", responsibilities: jd.responsibilities ?? [],
    requiredSkills: jd.requiredSkills ?? [], preferredSkills: jd.preferredSkills ?? [], qualifications: jd.qualifications ?? [],
    updatedAt: d.updatedAt.toISOString(),
  };
}

const rankingColumns = {
  studentId: rankings.studentId, name: users.name, email: users.email, rank: rankings.rankPosition,
  matchScore: rankings.matchScore, semanticScore: rankings.semanticScore, structuredScore: rankings.structuredScore,
  matchedSkills: rankings.matchedSkills, missingSkills: rankings.missingSkills,
  shortExplanation: rankings.shortExplanation, detailedExplanation: rankings.detailedExplanation,
  isEligible: rankings.isEligible, ineligibilityReason: rankings.ineligibilityReason,
  shortlisted: rankings.shortlisted, cgpa: students.cgpa, branch: students.branch, skills: students.skills,
};

async function rankingRows(guest: DemoGuest, driveIds: string[], includeStudent: boolean) {
  if (driveIds.length === 0) return [];
  return db.select({ driveId: rankings.driveId, ...rankingColumns }).from(rankings)
    .innerJoin(students, and(eq(students.id, rankings.studentId), eq(students.collegeId, guest.collegeId)))
    .innerJoin(users, and(eq(users.id, students.id), eq(users.collegeId, guest.collegeId)))
    .where(and(inArray(rankings.driveId, driveIds), eq(rankings.collegeId, guest.collegeId),
      or(like(users.email, candidatePattern(guest.collegeId)), includeStudent ? eq(users.id, guest.studentUserId) : sql`false`)))
    .orderBy(asc(rankings.driveId), sql`${rankings.rankPosition} = 0`, asc(rankings.rankPosition));
}

type Row = Awaited<ReturnType<typeof rankingRows>>[number];

/** Rank positions among the rows shown (eligible first, ineligible = 0). */
function withDisplayRank(rows: Row[]) {
  let position = 0;
  return rows.map((r) => ({ ...r, displayRank: r.isEligible ? ++position : 0 }));
}

/** Ranking stores lowercase skill keys; show them as the opening spells them. */
function displaySkills(keys: string[], spelled: Map<string, string>) {
  return keys.map((k) => spelled.get(k.toLowerCase().trim()) ?? k);
}

function spellingOf(...lists: Array<Array<{ name: string } | string> | null | undefined>) {
  const map = new Map<string, string>();
  for (const list of lists) for (const item of list ?? []) {
    const name = typeof item === "string" ? item : item.name;
    if (!map.has(name.toLowerCase().trim())) map.set(name.toLowerCase().trim(), name);
  }
  return map;
}

function publicRow(r: ReturnType<typeof withDisplayRank>[number], guest: DemoGuest, jd?: Partial<ParsedJD> | null) {
  const isYou = r.studentId === guest.studentUserId;
  const spelled = spellingOf(jd?.requiredSkills, jd?.preferredSkills, r.skills);
  return {
    studentId: r.studentId, name: isYou ? "You" : r.name, isYou, rank: r.displayRank,
    matchScore: r.matchScore, semanticScore: r.semanticScore, structuredScore: r.structuredScore,
    matchedSkills: displaySkills(r.matchedSkills, spelled), missingSkills: displaySkills(r.missingSkills, spelled),
    shortExplanation: r.shortExplanation, detailedExplanation: r.detailedExplanation,
    isEligible: r.isEligible, ineligibilityReason: r.ineligibilityReason,
    shortlisted: isYou ? null : r.shortlisted === true, cgpa: r.cgpa, branch: r.branch,
    skills: (r.skills ?? []).map((s) => s.name),
  };
}

// ── Recruiter ───────────────────────────────────────────────────────────────

export async function listRecruiterDrives(guest: DemoGuest) {
  const rows = await db.select().from(drives)
    .where(and(eq(drives.collegeId, guest.collegeId), eq(drives.createdBy, guest.recruiterUserId)))
    .orderBy(asc(drives.createdAt), asc(drives.company));
  const ranked = await rankingRows(guest, rows.map((d) => d.id), false);
  return rows.map((d) => {
    const mine = ranked.filter((r) => r.driveId === d.id);
    return {
      ...driveSummary(d),
      candidates: mine.length,
      eligible: mine.filter((r) => r.isEligible).length,
      shortlisted: mine.filter((r) => r.shortlisted).length,
      topScore: mine.reduce((max, r) => (r.isEligible ? Math.max(max, r.matchScore) : max), 0),
    };
  });
}

export async function getRecruiterDrive(guest: DemoGuest, id: string) {
  const drive = await ownDrive(guest, id);
  if (!drive) return null;
  const rows = withDisplayRank(await rankingRows(guest, [id], false));
  return { drive: driveSummary(drive), rankings: rows.map((r) => publicRow(r, guest, drive.parsedJd)) };
}

export interface DriveEdit {
  title: string;
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  minCgpa: number | null;
}

/** Saves a recruiter's edit, re-embeds the opening and re-ranks it. */
export async function updateRecruiterDrive(guest: DemoGuest, id: string, edit: DriveEdit, signal: AbortSignal) {
  const drive = await ownDrive(guest, id);
  if (!drive) return null;
  const previous = (drive.parsedJd ?? {}) as Partial<ParsedJD>;
  const parsedJd: ParsedJD = {
    company: drive.company, title: edit.title, summary: edit.summary,
    responsibilities: edit.responsibilities, requiredSkills: edit.requiredSkills,
    preferredSkills: edit.preferredSkills, qualifications: previous.qualifications ?? [],
  };
  const embedding = await generateEmbedding(demoJdEmbeddingText(parsedJd), "jd", { timeout: 15_000, signal });
  if (embedding.length !== 768 || !isValidEmbedding(embedding)) throw new Error("Invalid JD embedding");
  const rawJd = [
    `${edit.title} — ${drive.company}`, "", edit.summary, "",
    "Responsibilities:", ...edit.responsibilities.map((r) => `- ${r}`), "",
    `Required skills: ${edit.requiredSkills.join(", ")}.`,
    `Preferred skills: ${edit.preferredSkills.join(", ")}.`,
    edit.minCgpa ? `Minimum CGPA: ${edit.minCgpa}.` : "",
  ].join("\n");
  await db.update(drives).set({
    roleTitle: edit.title, parsedJd, rawJd, minCgpa: edit.minCgpa, jdEmbedding: embedding, updatedAt: new Date(),
  }).where(and(eq(drives.id, id), eq(drives.collegeId, guest.collegeId)));
  await computeRanking(id, { collegeId: guest.collegeId, studentId: guest.studentUserId });
  return getRecruiterDrive(guest, id);
}

export async function setShortlist(guest: DemoGuest, driveId: string, studentId: string, value: boolean) {
  if (!await ownDrive(guest, driveId)) return false;
  const [candidate] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, studentId), eq(users.collegeId, guest.collegeId), like(users.email, candidatePattern(guest.collegeId)))).limit(1);
  if (!candidate) return false;
  const updated = await db.update(rankings).set({ shortlisted: value, updatedAt: new Date() })
    .where(and(eq(rankings.driveId, driveId), eq(rankings.studentId, candidate.id), eq(rankings.collegeId, guest.collegeId)))
    .returning({ id: rankings.id });
  return updated.length === 1;
}

export async function getCandidate(guest: DemoGuest, studentId: string) {
  const [person] = await db.select({
    id: users.id, name: users.name, cgpa: students.cgpa, branch: students.branch, batchYear: students.batchYear,
    skills: students.skills, projects: students.projects, workExperience: students.workExperience,
    certifications: students.certifications, achievements: students.achievements,
  }).from(users).innerJoin(students, and(eq(students.id, users.id), eq(students.collegeId, guest.collegeId)))
    .where(and(eq(users.id, studentId), eq(users.collegeId, guest.collegeId), like(users.email, candidatePattern(guest.collegeId)))).limit(1);
  if (!person) return null;
  const driveRows = await db.select({ id: drives.id }).from(drives).where(eq(drives.collegeId, guest.collegeId));
  const all = await rankingRows(guest, driveRows.map((d) => d.id), false);
  const driveInfo = await db.select({ id: drives.id, title: drives.roleTitle, company: drives.company, parsedJd: drives.parsedJd }).from(drives)
    .where(eq(drives.collegeId, guest.collegeId));
  const titles = new Map(driveInfo.map((d) => [d.id, d]));
  const parsedJdById = new Map(driveInfo.map((d) => [d.id, d.parsedJd as Partial<ParsedJD> | null]));
  const byDrive = new Map<string, Row[]>();
  for (const r of all) byDrive.set(r.driveId, [...(byDrive.get(r.driveId) ?? []), r]);
  const fits = Array.from(byDrive.entries()).flatMap(([driveId, rows]) =>
    withDisplayRank(rows).filter((r) => r.studentId === studentId).map((r) => ({
      driveId, title: titles.get(driveId)?.title ?? "", company: titles.get(driveId)?.company ?? "",
      ...publicRow(r, guest, parsedJdById.get(driveId)), outOf: rows.filter((x) => x.isEligible).length,
    })));
  return { candidate: person, fits };
}

// ── Student ─────────────────────────────────────────────────────────────────

/** The guest student's fit for every opening, with fictional peers for comparison. */
export async function getStudentFit(guest: DemoGuest) {
  const driveList = await db.select().from(drives).where(eq(drives.collegeId, guest.collegeId)).orderBy(asc(drives.createdAt), asc(drives.roleTitle));
  const rows = await rankingRows(guest, driveList.map((d) => d.id), true);
  return driveList.map((d) => {
    const ranked = withDisplayRank(rows.filter((r) => r.driveId === d.id)).map((r) => publicRow(r, guest, d.parsedJd));
    const you = ranked.find((r) => r.isYou) ?? null;
    return {
      drive: driveSummary(d),
      you,
      outOf: ranked.filter((r) => r.isEligible).length,
      peers: ranked.filter((r) => !r.isYou).slice(0, 5).map((r) => ({ name: r.name, matchScore: r.matchScore, rank: r.rank, isEligible: r.isEligible })),
    };
  });
}
