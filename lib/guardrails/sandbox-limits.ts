/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Sandbox Usage Limits
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Server-side enforcement of free-tier sandbox usage limits.
 *
 * Limits (hardcoded):
 *   Daily:   5 sandbox runs
 *   Monthly: 30 sandbox runs
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
import { GuardrailViolation } from "@/lib/guardrails/errors";

// ── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5;
const MONTHLY_LIMIT = 30;

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
 * 
 * NOTE: Rate limits are currently DISABLED for testing.
 * TODO: Re-enable before production.
 */
export async function enforceSandboxLimits(studentId: string): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();

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

  if (!student) throw new GuardrailViolation({
    code: "STUDENT_NOT_FOUND",
    reason: "Student profile not found.",
    nextStep: "Please sign out and sign back in.",
    status: 404,
  });

  const dailyUsed = student.sandboxResetDate === today ? student.sandboxUsageToday : 0;
  const monthlyUsed = student.sandboxMonthResetDate === month ? student.sandboxUsageMonth : 0;

  if (dailyUsed >= DAILY_LIMIT) throw new GuardrailViolation({
    code: "SANDBOX_DAILY_LIMIT",
    reason: `Daily limit reached (${DAILY_LIMIT} analyses/day).`,
    nextStep: "Your quota resets at midnight UTC.",
    status: 429,
  });

  if (monthlyUsed >= MONTHLY_LIMIT) throw new GuardrailViolation({
    code: "SANDBOX_MONTHLY_LIMIT",
    reason: `Monthly limit reached (${MONTHLY_LIMIT} analyses/month).`,
    nextStep: "Your quota resets at the start of next month.",
    status: 429,
  });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .where(eq(students.id, studentId));
}

// ── Detailed Analysis Limits ────────────────────────────────────────────────

const DETAILED_DAILY_LIMIT = 3;
const DETAILED_MONTHLY_LIMIT = 15;

/**
 * Checks whether a student can use the Detailed Analysis feature.
 * 
 * NOTE: Rate limits are currently DISABLED for testing.
 * TODO: Re-enable before production.
 */
export async function enforceDetailedAnalysisLimits(studentId: string): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();

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

  if (!student) throw new GuardrailViolation({
    code: "STUDENT_NOT_FOUND",
    reason: "Student profile not found.",
    nextStep: "Please sign out and sign back in.",
    status: 404,
  });

  const dailyUsed = student.detailedAnalysisResetDate === today ? student.detailedAnalysisUsageToday : 0;
  const monthlyUsed = student.detailedAnalysisMonthResetDate === month ? student.detailedAnalysisUsageMonth : 0;

  if (dailyUsed >= DETAILED_DAILY_LIMIT) throw new GuardrailViolation({
    code: "SANDBOX_DAILY_LIMIT",
    reason: `Daily limit reached (${DETAILED_DAILY_LIMIT} detailed analyses/day).`,
    nextStep: "Your quota resets at midnight UTC.",
    status: 429,
  });

  if (monthlyUsed >= DETAILED_MONTHLY_LIMIT) throw new GuardrailViolation({
    code: "SANDBOX_MONTHLY_LIMIT",
    reason: `Monthly limit reached (${DETAILED_MONTHLY_LIMIT} detailed analyses/month).`,
    nextStep: "Your quota resets at the start of next month.",
    status: 429,
  });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .where(eq(students.id, studentId));
}
