/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Profile Completeness Gate
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-side enforcement that only sufficiently complete profiles
 * can access placement features (sandbox, ranking visibility, JD comparison).
 *
 * Requirements:
 *   1. Profile completeness ≥ 70%
 *   2. Resume uploaded (resumeUrl exists)
 *   3. Embedding generated (embedding exists)
 *   4. Skills array is non-empty
 *
 * Returns explicit rejection reasons, not silent failures.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeCompleteness } from "@/lib/profile/completeness";
import { ERRORS } from "./errors";
import type { Skill } from "@/lib/db/schema";

const MIN_COMPLETENESS = 70;

/**
 * Enforces that a student's profile meets the minimum bar for placement features.
 *
 * Checks (in order, first failure wins):
 *   1. Skills array non-empty
 *   2. Resume URL exists
 *   3. Embedding exists
 *   4. Profile completeness ≥ 70%
 *
 * Throws `GuardrailViolation` on failure with explicit reason + next step.
 */
export async function enforceProfileGate(studentId: string): Promise<void> {
  const [student] = await db
    .select({
      skills: students.skills,
      resumeUrl: students.resumeUrl,
      embedding: students.embedding,
      profileCompleteness: students.profileCompleteness,
      // Fields needed for recomputing completeness if stored value is stale
      projects: students.projects,
      workExperience: students.workExperience,
      certifications: students.certifications,
      codingProfiles: students.codingProfiles,
      branch: students.branch,
      batchYear: students.batchYear,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw ERRORS.STUDENT_NOT_FOUND();
  }

  // ── Check 1: Skills must exist ─────────────────────────────────────────
  const skills = student.skills as Skill[] | null;
  if (!skills || skills.length === 0) {
    throw ERRORS.SKILLS_EMPTY();
  }

  // ── Check 2: Resume must be uploaded ───────────────────────────────────
  if (!student.resumeUrl) {
    throw ERRORS.RESUME_MISSING();
  }

  // ── Check 3: Embedding must exist ──────────────────────────────────────
  if (!student.embedding) {
    // Try to trigger embedding generation asynchronously
    try {
      const { enqueueEmbeddingJob, processEmbeddingJobs } = await import("@/lib/workers/generate-embedding");
      await enqueueEmbeddingJob(studentId, "student", 10); // High priority
      // Fire-and-forget inline processing attempt
      processEmbeddingJobs().catch((e) => console.error("[ProfileGate] Inline embed failed:", e));
    } catch (triggerErr) {
      console.error("[ProfileGate] Failed to trigger embedding:", triggerErr);
    }
    throw ERRORS.EMBEDDING_MISSING();
  }

  // ── Check 4: Profile completeness ≥ 70% ───────────────────────────────
  // Always recompute to avoid stale stored values
  // Fetch user name/email for completeness calculation
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  const result = computeCompleteness({ ...student, name: user?.name, email: user?.email });
  const completeness = result.score;
  const missing = result.missing;

  // Update stored completeness if it differs
  if (completeness !== student.profileCompleteness) {
    await db
      .update(students)
      .set({ profileCompleteness: completeness, updatedAt: new Date() })
      .where(eq(students.id, studentId));
  }

  if (completeness < MIN_COMPLETENESS) {
    throw ERRORS.PROFILE_INCOMPLETE(completeness, missing);
  }
}
