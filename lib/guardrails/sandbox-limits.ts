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
import { getCachedSession } from "@/lib/auth/session-cache";
import { getRedis } from "@/lib/redis";

// ── Default limits (used when sandbox_config row is absent) ──────────────────

const DEFAULTS = {
  student_daily_limit: 3,
  student_monthly_limit: 20,
  faculty_daily_limit: 10,
  faculty_monthly_limit: 100,
  student_detailed_daily: 2,
  student_detailed_monthly: 10,
  faculty_detailed_daily: 5,
  faculty_detailed_monthly: 30,
} as const;

type SandboxConfig = typeof DEFAULTS;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns current UTC date as "YYYY-MM-DD". */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current UTC month as "YYYY-MM". */
function currentMonthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Fetches sandbox limits for a college from `sandbox_config`.
 * Results are cached in Redis for 5 minutes. Falls back to DEFAULTS if absent.
 */
async function getSandboxLimits(collegeId: string): Promise<SandboxConfig> {
  const redis = getRedis();
  const cacheKey = `sandbox_config:${collegeId}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached as string) as SandboxConfig;
    } catch {}
  }

  const [config] = await db.execute(sql`
    SELECT
      student_daily_limit,
      student_monthly_limit,
      faculty_daily_limit,
      faculty_monthly_limit,
      student_detailed_daily,
      student_detailed_monthly,
      faculty_detailed_daily,
      faculty_detailed_monthly
    FROM sandbox_config
    WHERE college_id = ${collegeId}
    LIMIT 1
  `) as unknown as Array<SandboxConfig>;

  const limits: SandboxConfig = config ?? DEFAULTS;

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(limits), { ex: 300 }).catch(() => {});
  }

  return limits;
}

// ── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Checks whether a user can use the sandbox feature.
 * Admin role is always bypassed. Faculty use higher limits than students.
 */
export async function enforceSandboxLimits(studentId: string, role = "student"): Promise<void> {
  if (role === "admin") return; // Admin has no limits

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

  const session = await getCachedSession();
  const collegeId = session?.user?.collegeId;
  if (!collegeId) throw new GuardrailViolation({
    code: "MISSING_COLLEGE_CONTEXT",
    reason: "No college context found for this account.",
    nextStep: "Sign out and sign back in, or contact your administrator.",
    status: 403,
  });
  const limits = await getSandboxLimits(collegeId);

  const dailyLimit = role === "faculty" ? limits.faculty_daily_limit : limits.student_daily_limit;
  const monthlyLimit = role === "faculty" ? limits.faculty_monthly_limit : limits.student_monthly_limit;

  if (dailyUsed >= dailyLimit) throw new GuardrailViolation({
    code: "SANDBOX_DAILY_LIMIT",
    reason: `Daily limit reached (${dailyLimit} analyses/day).`,
    nextStep: "Your quota resets at midnight UTC.",
    status: 429,
  });

  if (monthlyUsed >= monthlyLimit) throw new GuardrailViolation({
    code: "SANDBOX_MONTHLY_LIMIT",
    reason: `Monthly limit reached (${monthlyLimit} analyses/month).`,
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

/**
 * Checks whether a user can use the Detailed Analysis feature.
 * Admin role is always bypassed. Faculty use higher limits than students.
 */
export async function enforceDetailedAnalysisLimits(studentId: string, role = "student"): Promise<void> {
  if (role === "admin") return; // Admin has no limits

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

  const session = await getCachedSession();
  const collegeId = session?.user?.collegeId;
  if (!collegeId) throw new GuardrailViolation({
    code: "MISSING_COLLEGE_CONTEXT",
    reason: "No college context found for this account.",
    nextStep: "Sign out and sign back in, or contact your administrator.",
    status: 403,
  });
  const limits = await getSandboxLimits(collegeId);

  const dailyLimit = role === "faculty" ? limits.faculty_detailed_daily : limits.student_detailed_daily;
  const monthlyLimit = role === "faculty" ? limits.faculty_detailed_monthly : limits.student_detailed_monthly;

  if (dailyUsed >= dailyLimit) throw new GuardrailViolation({
    code: "SANDBOX_DAILY_LIMIT",
    reason: `Daily detailed analysis limit reached (${dailyLimit}/day).`,
    nextStep: "Your quota resets at midnight UTC.",
    status: 429,
  });

  if (monthlyUsed >= monthlyLimit) throw new GuardrailViolation({
    code: "SANDBOX_MONTHLY_LIMIT",
    reason: `Monthly detailed analysis limit reached (${monthlyLimit}/month).`,
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
