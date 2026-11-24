import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoWorkspaces, drives, students, users } from "@/lib/db/schema";
import { computeRanking } from "@/lib/matching/computeRanking";
import { logger } from "@/lib/logger";
import { GUEST_EMAIL_DOMAIN_SUFFIX, GUEST_SESSION_HOURS, guestAccessEnabled } from "./config";
import type { GuestIdentity, GuestKind } from "./guest-auth";
import { consumeDemoQuota, DemoQuotaExceeded } from "./quota";
import {
  FIXTURE_CANDIDATES, FIXTURE_OPENINGS, SAMPLE_STUDENT,
  toParsedJd, toParsedResume, toRawJd, toStudentProfile,
} from "./fixtures";
import embeddings from "./fixture-embeddings.json";

const fixtureEmbeddings = embeddings as { people: Record<string, number[]>; openings: Record<string, number[]> };

export const guestEmail = (kind: "student" | "recruiter" | `candidate-${number}`, collegeId: string) =>
  `${kind}@${collegeId}${GUEST_EMAIL_DOMAIN_SUFFIX}`;

const GRADUATION_YEAR = 2027;

/** Creates a fresh isolated guest workspace and returns the identity for `kind`. */
export async function provisionDemoWorkspace(kind: GuestKind): Promise<GuestIdentity | null> {
  if (!guestAccessEnabled()) return null;
  try {
    await consumeDemoQuota("enroll");
  } catch (error) {
    if (error instanceof DemoQuotaExceeded) return null;
    throw error;
  }

  const collegeId = randomUUID();
  const expiresAt = Date.now() + GUEST_SESSION_HOURS * 60 * 60 * 1000;
  const student = { id: randomUUID(), name: "Guest Student", email: guestEmail("student", collegeId) };
  const recruiter = { id: randomUUID(), name: "Guest Recruiter", email: guestEmail("recruiter", collegeId) };
  const candidates = FIXTURE_CANDIDATES.map((person, index) => ({
    person, id: randomUUID(), email: guestEmail(`candidate-${index + 1}`, collegeId),
  }));

  const driveIds = await db.transaction(async (tx) => {
    // Raw SQL: the live colleges table has no `settings` column (schema drift).
    await tx.execute(sql`
      insert into colleges (id, name, short_code, student_domain, is_active)
      values (${collegeId}, 'SkillSync Guest Workspace', ${`g-${collegeId.slice(0, 18)}`},
              ${`${collegeId}${GUEST_EMAIL_DOMAIN_SUFFIX}`}, true)`);
    await tx.insert(demoWorkspaces).values({
      collegeId, studentUserId: student.id, recruiterUserId: recruiter.id, expiresAt: new Date(expiresAt),
    });
    await tx.insert(users).values([
      { ...student, role: "student" as const, collegeId },
      { ...recruiter, role: "faculty" as const, collegeId },
      ...candidates.map((c) => ({ id: c.id, name: c.person.name, email: c.email, role: "student" as const, collegeId })),
    ]);
    await tx.insert(students).values([
      {
        id: student.id, collegeId, batchYear: GRADUATION_YEAR, onboardingStep: 6, profileCompleteness: 80,
        ...toStudentProfile(SAMPLE_STUDENT),
        parsedResumeJson: toParsedResume(SAMPLE_STUDENT),
        embedding: fixtureEmbeddings.people[SAMPLE_STUDENT.key],
      },
      ...candidates.map((c) => ({
        id: c.id, collegeId, batchYear: GRADUATION_YEAR, onboardingStep: 6, profileCompleteness: 85,
        ...toStudentProfile(c.person),
        parsedResumeJson: toParsedResume(c.person),
        embedding: fixtureEmbeddings.people[c.person.key],
      })),
    ]);
    const inserted = await tx.insert(drives).values(FIXTURE_OPENINGS.map((opening) => ({
      createdBy: recruiter.id, collegeId, company: opening.company, roleTitle: opening.title,
      location: opening.location, packageOffered: opening.packageOffered, minCgpa: opening.minCgpa,
      rawJd: toRawJd(opening), parsedJd: toParsedJd(opening),
      jdEmbedding: fixtureEmbeddings.openings[opening.key],
      rankingsVisible: true, deadline: new Date(expiresAt),
    }))).returning({ id: drives.id });
    return inserted.map((d) => d.id);
  });

  // Rankings use stored vectors only, so this makes no AI calls.
  const results = await Promise.allSettled(driveIds.map((id) => computeRanking(id, { collegeId, studentId: student.id })));
  // A parallel ranking can fail transiently (e.g. pool contention); retry those
  // one at a time so a guest does not land on an opening with no ranked pool.
  for (const [i, r] of results.entries()) {
    if (r.status === "fulfilled") continue;
    try {
      await computeRanking(driveIds[i], { collegeId, studentId: student.id });
    } catch (error) {
      logger.warn("[guest] initial ranking failed", { error: String(error), firstError: String(r.reason) });
    }
  }

  const identity = kind === "student" ? student : recruiter;
  return { id: identity.id, collegeId, email: identity.email, name: identity.name, expiresAt };
}

/** Live workspace lookup; null when missing or expired. */
export async function getLiveWorkspace(collegeId: string) {
  const [workspace] = await db.select().from(demoWorkspaces)
    .where(and(eq(demoWorkspaces.collegeId, collegeId), gt(demoWorkspaces.expiresAt, new Date()))).limit(1);
  return workspace ?? null;
}

/**
 * Ends the caller's own workspace now. Every cookie issued for it (both roles)
 * stops working at once because requireDemoGuest needs a live workspace. Rows
 * are not deleted here: the guarded cleanup removes expired workspaces.
 */
export async function endDemoWorkspace(collegeId: string): Promise<boolean> {
  const rows = await db.update(demoWorkspaces).set({ expiresAt: new Date() })
    .where(and(eq(demoWorkspaces.collegeId, collegeId), gt(demoWorkspaces.expiresAt, new Date())))
    .returning({ id: demoWorkspaces.collegeId });
  return rows.length > 0;
}

/** Returns the other identity of the caller's own, unexpired workspace. */
export async function switchDemoIdentity(kind: GuestKind, current: { id: string; collegeId: string }): Promise<GuestIdentity | null> {
  if (!guestAccessEnabled()) return null;
  const workspace = await getLiveWorkspace(current.collegeId);
  if (!workspace || (current.id !== workspace.studentUserId && current.id !== workspace.recruiterUserId)) return null;
  const targetId = kind === "student" ? workspace.studentUserId : workspace.recruiterUserId;
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    .where(and(eq(users.id, targetId), eq(users.collegeId, workspace.collegeId))).limit(1);
  if (!user) return null;
  return { ...user, collegeId: workspace.collegeId, expiresAt: workspace.expiresAt.getTime() };
}
