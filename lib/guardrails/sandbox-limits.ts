/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Sandbox Usage Limits
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-side enforcement of free-tier sandbox usage limits.
 *
 * Limits (hardcoded):
 *   Daily:   3 sandbox runs
 *   Monthly: 20 sandbox runs
 *
 * Reset logic:
 *   Daily counter resets when the current UTC date differs from sandboxResetDate.
 *   Monthly counter resets when the current UTC month differs from sandboxMonthResetDate.
 *
 * No cron jobs. Resets are lazy — checked and applied on each usage attempt.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "server-only";

import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ERRORS } from "./errors";

// ── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 100;
const MONTHLY_LIMIT = 500;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns current UTC date as "YYYY-MM-DD". */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current UTC month as "YYYY-MM". */
function currentMonthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

// ── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Checks whether a student can use the sandbox.
 * Throws `GuardrailViolation` if limit is exceeded.
 * Does NOT increment — call `incrementSandboxUsage` after successful sandbox run.
 *
 * This function performs lazy reset: if the day/month has changed since the
 * last recorded reset date, the counters are zeroed in-place before checking.
 */
export async function enforceSandboxLimits(studentId: string): Promise<void> {
  // Fetch current counters
  const [student] = await db
    .select({
      sandboxUsageToday: students.sandboxUsageToday,
      sandboxResetDate: students.sandboxResetDate,
      sandboxUsageMonth: students.sandboxUsageMonth,
      sandboxMonthResetDate: students.sandboxMonthResetDate,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new Error("Student record not found");
  }

  const today = todayUTC();
  const month = currentMonthUTC();

  let dailyUsage = student.sandboxUsageToday;
  let monthlyUsage = student.sandboxUsageMonth;
  const updates: Record<string, unknown> = {};

  // ── Lazy daily reset ───────────────────────────────────────────────────
  if (student.sandboxResetDate !== today) {
    dailyUsage = 0;
    updates.sandboxUsageToday = 0;
    updates.sandboxResetDate = today;
  }

  // ── Lazy monthly reset ─────────────────────────────────────────────────
  if (student.sandboxMonthResetDate !== month) {
    monthlyUsage = 0;
    updates.sandboxUsageMonth = 0;
    updates.sandboxMonthResetDate = month;
  }

  // Persist resets if any
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db.update(students).set(updates).where(eq(students.id, studentId));
  }

  // ── Enforce limits ─────────────────────────────────────────────────────
  if (dailyUsage >= DAILY_LIMIT) {
    throw ERRORS.SANDBOX_DAILY_LIMIT();
  }

  if (monthlyUsage >= MONTHLY_LIMIT) {
    throw ERRORS.SANDBOX_MONTHLY_LIMIT();
  }
}

/**
 * Increments both daily and monthly sandbox counters atomically using SQL.
 * Uses conditional CASE expressions to handle lazy resets in a single UPDATE,
 * preventing race conditions from concurrent read-then-write patterns.
 * Call this AFTER a successful sandbox run.
 */
export async function incrementSandboxUsage(studentId: string): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();

  await db
    .update(students)
    .set({
      // Atomic daily: if date changed, reset to 1; otherwise increment
      sandboxUsageToday: sql`CASE
        WHEN ${students.sandboxResetDate} IS DISTINCT FROM ${today}
        THEN 1
        ELSE ${students.sandboxUsageToday} + 1
      END`,
      sandboxResetDate: today,
      // Atomic monthly: if month changed, reset to 1; otherwise increment
      sandboxUsageMonth: sql`CASE
        WHEN ${students.sandboxMonthResetDate} IS DISTINCT FROM ${month}
        THEN 1
        ELSE ${students.sandboxUsageMonth} + 1
      END`,
      sandboxMonthResetDate: month,
      updatedAt: new Date(),
    } as any)
    .where(eq(students.id, studentId));
}

// ── Detailed Analysis Limits ────────────────────────────────────────────────

const DETAILED_DAILY_LIMIT = 100;
const DETAILED_MONTHLY_LIMIT = 500;

/**
 * Checks whether a student can use the Detailed Analysis feature.
 * Throws `GuardrailViolation` if limit is exceeded.
 */
export async function enforceDetailedAnalysisLimits(studentId: string): Promise<void> {
  const [student] = await db
    .select({
      detailedAnalysisUsageToday: students.detailedAnalysisUsageToday,
      detailedAnalysisResetDate: students.detailedAnalysisResetDate,
      detailedAnalysisUsageMonth: students.detailedAnalysisUsageMonth,
      detailedAnalysisMonthResetDate: students.detailedAnalysisMonthResetDate,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new Error("Student record not found");
  }

  const today = todayUTC();
  const month = currentMonthUTC();

  let dailyUsage = student.detailedAnalysisUsageToday;
  let monthlyUsage = student.detailedAnalysisUsageMonth;
  const updates: Record<string, unknown> = {};

  // Lazy daily reset
  if (student.detailedAnalysisResetDate !== today) {
    dailyUsage = 0;
    updates.detailedAnalysisUsageToday = 0;
    updates.detailedAnalysisResetDate = today;
  }

  // Lazy monthly reset
  if (student.detailedAnalysisMonthResetDate !== month) {
    monthlyUsage = 0;
    updates.detailedAnalysisUsageMonth = 0;
    updates.detailedAnalysisMonthResetDate = month;
  }

  // Persist resets
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db.update(students).set(updates).where(eq(students.id, studentId));
  }

  // Enforce limits
  if (dailyUsage >= DETAILED_DAILY_LIMIT) {
    // We can reuse the same error for now or create a specific one
    throw new Error(`Daily limit reached (${DETAILED_DAILY_LIMIT} detailed analyses/day). Please try again tomorrow.`);
  }

  if (monthlyUsage >= DETAILED_MONTHLY_LIMIT) {
    throw new Error(`Monthly limit reached (${DETAILED_MONTHLY_LIMIT} detailed analyses/month). Please try again next month.`);
  }
}

/**
 * Increments daily/monthly counters for Detailed Analysis.
 */
export async function incrementDetailedAnalysisUsage(studentId: string): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();

  await db
    .update(students)
    .set({
      detailedAnalysisUsageToday: sql`CASE
        WHEN ${students.detailedAnalysisResetDate} IS DISTINCT FROM ${today}
        THEN 1
        ELSE ${students.detailedAnalysisUsageToday} + 1
      END`,
      detailedAnalysisResetDate: today,
      detailedAnalysisUsageMonth: sql`CASE
        WHEN ${students.detailedAnalysisMonthResetDate} IS DISTINCT FROM ${month}
        THEN 1
        ELSE ${students.detailedAnalysisUsageMonth} + 1
      END`,
      detailedAnalysisMonthResetDate: month,
      updatedAt: new Date(),
    } as any)
    .where(eq(students.id, studentId));
}
