import "server-only";

import { db } from "@/lib/db";
import { students, systemSettings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ERRORS } from "./errors";

/** Returns today's UTC date as "YYYY-MM-DD". */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current UTC month as "YYYY-MM". */
function currentMonthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Fetch admin-configured limits from system_settings. */
async function getSandboxLimits(): Promise<{ daily: number; monthly: number }> {
  try {
    const rows = await db
      .select({ key: systemSettings.key, value: systemSettings.value })
      .from(systemSettings)
      .where(
        sql`${systemSettings.key} IN ('sandbox_daily_limit', 'sandbox_monthly_limit')`,
      );

    const map = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));

    return {
      daily: map["sandbox_daily_limit"] ?? 5,
      monthly: map["sandbox_monthly_limit"] ?? 30,
    };
  } catch (err) {
    // Fallback if table doesn't exist yet or query fails
    return { daily: 5, monthly: 30 };
  }
}

/**
 * Atomically check AND increment sandbox usage in a single SQL statement.
 * 
 * Uses a conditional UPDATE:
 *   - If daily/monthly counter < limit: increment and return new values
 *   - If at limit: update nothing, return null (0 rows affected)
 * 
 * No separate read → no race condition.
 */
export async function checkAndIncrementSandboxUsage(
  studentId: string,
): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();
  const { daily, monthly } = await getSandboxLimits();

  const result = await db.execute(sql`
    UPDATE students
    SET
      sandbox_usage_today = CASE
        WHEN sandbox_reset_date IS DISTINCT FROM ${today} THEN 1
        ELSE sandbox_usage_today + 1
      END,
      sandbox_reset_date = ${today},
      sandbox_usage_month = CASE
        WHEN sandbox_month_reset_date IS DISTINCT FROM ${month} THEN 1
        ELSE sandbox_usage_month + 1
      END,
      sandbox_month_reset_date = ${month},
      updated_at = now()
    WHERE id = ${studentId}
      AND (
        -- Check daily limit (with lazy reset)
        CASE WHEN sandbox_reset_date IS DISTINCT FROM ${today} THEN 0
             ELSE COALESCE(sandbox_usage_today, 0)
        END
      ) < ${daily}
      AND (
        -- Check monthly limit (with lazy reset)
        CASE WHEN sandbox_month_reset_date IS DISTINCT FROM ${month} THEN 0
             ELSE COALESCE(sandbox_usage_month, 0)
        END
      ) < ${monthly}
    RETURNING id
  `);

  if (((result as any).count ?? 0) === 0) {
    // Determine which limit was hit for a helpful error message
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

    if (!student) throw ERRORS.STUDENT_NOT_FOUND();

    const effectiveDaily =
      student.sandboxResetDate !== today ? 0 : (student.sandboxUsageToday ?? 0);
    const effectiveMonthly =
      student.sandboxMonthResetDate !== month ? 0 : (student.sandboxUsageMonth ?? 0);

    if (effectiveMonthly >= monthly) throw ERRORS.SANDBOX_MONTHLY_LIMIT();
    if (effectiveDaily >= daily) throw ERRORS.SANDBOX_DAILY_LIMIT();

    // Shouldn't reach here, but safety net
    throw ERRORS.SANDBOX_DAILY_LIMIT();
  }
}

/**
 * Public read-only export of sandbox limits for use in API responses.
 * Matches the same logic used internally for enforcement.
 */
export async function getSandboxLimitsPublic(): Promise<{ daily: number; monthly: number }> {
  return getSandboxLimits();
}

// Same atomic fix for Detailed Analysis
async function getDetailedLimits(): Promise<{ daily: number; monthly: number }> {
  try {
    const rows = await db
      .select({ key: systemSettings.key, value: systemSettings.value })
      .from(systemSettings)
      .where(
        sql`${systemSettings.key} IN ('detailed_daily_limit', 'detailed_monthly_limit')`,
      );

    const map = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
    return {
      daily: map["detailed_daily_limit"] ?? 3,
      monthly: map["detailed_monthly_limit"] ?? 15,
    };
  } catch (err) {
    return { daily: 3, monthly: 15 };
  }
}

export async function checkAndIncrementDetailedUsage(
  studentId: string,
): Promise<void> {
  const today = todayUTC();
  const month = currentMonthUTC();
  const { daily, monthly } = await getDetailedLimits();

  const result = await db.execute(sql`
    UPDATE students
    SET
      detailed_analysis_usage_today = CASE
        WHEN detailed_analysis_reset_date IS DISTINCT FROM ${today} THEN 1
        ELSE detailed_analysis_usage_today + 1
      END,
      detailed_analysis_reset_date = ${today},
      detailed_analysis_usage_month = CASE
        WHEN detailed_analysis_month_reset_date IS DISTINCT FROM ${month} THEN 1
        ELSE detailed_analysis_usage_month + 1
      END,
      detailed_analysis_month_reset_date = ${month},
      updated_at = now()
    WHERE id = ${studentId}
      AND (
        CASE WHEN detailed_analysis_reset_date IS DISTINCT FROM ${today} THEN 0
             ELSE COALESCE(detailed_analysis_usage_today, 0)
        END
      ) < ${daily}
      AND (
        CASE WHEN detailed_analysis_month_reset_date IS DISTINCT FROM ${month} THEN 0
             ELSE COALESCE(detailed_analysis_usage_month, 0)
        END
      ) < ${monthly}
    RETURNING id
  `);

  if (((result as any).count ?? 0) === 0) {
    throw new Error(
      `Detailed analysis limit reached. Limits are ${daily}/day and ${monthly}/month.`,
    );
  }
}
