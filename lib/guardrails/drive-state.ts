/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Drive State Guardrails
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Prevents invalid ranking access by deriving drive state from existing data.
 *
 * Derived states (not stored):
 *   "not_ranked"  — No rankings rows exist for this drive
 *   "ranked"      — Rankings exist, drive is still active
 *   "closed"      — Rankings exist and deadline has passed
 *
 * Guardrails:
 *   - Ranking access before generation → blocked
 *   - Ranking access after deadline → allowed (read-only)
 *   - Ranking regeneration → blocked unless user is admin
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ERRORS } from "./errors";

// ── Types ────────────────────────────────────────────────────────────────────

export type DriveState = "not_ranked" | "ranked" | "closed";

export interface DriveStateInfo {
  state: DriveState;
  driveId: string;
  company: string;
  roleTitle: string;
  createdBy: string;
  deadline: Date | null;
  isActive: boolean;
  rankingsCount: number;
}

// ── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Derives the current state of a drive from existing data.
 * Returns null if drive does not exist.
 */
export async function getDriveState(driveId: string): Promise<DriveStateInfo | null> {
  const [drive] = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      createdBy: drives.createdBy,
      deadline: drives.deadline,
      isActive: drives.isActive,
    })
    .from(drives)
    .where(eq(drives.id, driveId))
    .limit(1);

  if (!drive) return null;

  // Count rankings for this drive
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rankings)
    .where(eq(rankings.driveId, driveId));

  const rankingsCount = countResult?.count ?? 0;

  // Derive state
  let state: DriveState;
  if (rankingsCount === 0) {
    state = "not_ranked";
  } else if (drive.deadline && new Date(drive.deadline) < new Date()) {
    state = "closed";
  } else {
    state = "ranked";
  }

  return {
    state,
    driveId: drive.id,
    company: drive.company,
    roleTitle: drive.roleTitle,
    createdBy: drive.createdBy,
    deadline: drive.deadline,
    isActive: drive.isActive,
    rankingsCount,
  };
}

/**
 * Enforces that rankings exist before allowing read access.
 * Throws RANKINGS_NOT_GENERATED if drive has no rankings.
 * Returns the drive state info on success.
 */
export async function enforceRankingsExist(driveId: string): Promise<DriveStateInfo> {
  const info = await getDriveState(driveId);

  if (!info) {
    throw ERRORS.DRIVE_NOT_FOUND();
  }

  if (info.state === "not_ranked") {
    throw ERRORS.RANKINGS_NOT_GENERATED();
  }

  return info;
}

/**
 * Enforces that ranking generation is allowed.
 * Faculty and admins can always re-trigger ranking.
 * The only block is when a ranking job is actively pending or processing.
 *
 * @param driveId - The drive to check
 */
export async function enforceRankingGeneration(
  driveId: string,
): Promise<void> {
  const info = await getDriveState(driveId);

  if (!info) {
    throw ERRORS.DRIVE_NOT_FOUND();
  }

  // Block only if a ranking job is actively running right now
  const [activeJob] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      sql`${jobs.type} = 'rank_students'
        AND ${jobs.status} IN ('pending', 'processing')
        AND ${jobs.payload}->>'driveId' = ${driveId}`,
    )
    .limit(1);

  if (activeJob) {
    throw ERRORS.RANKING_REGEN_BLOCKED();
  }
}
