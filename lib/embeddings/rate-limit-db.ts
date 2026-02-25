/**
 * DB-backed rate limit tracker.
 * Survives serverless restarts. Tracks per model per UTC day.
 *
 * Models and their real free-tier limits:
 *   gemini_embedding: 100 RPM, 1000 RPD
 */

import "server-only";
import { db } from "@/lib/db";
import { rateLimitState } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export interface ModelRateLimit {
    rpd: number; // Requests per day
    rpm: number; // Requests per minute (checked at cron level via batch sizing)
}

// REAL free-tier limits (verified from Google AI Studio dashboard)
export const MODEL_LIMITS: Record<string, ModelRateLimit> = {
    gemini_embedding: { rpd: 1000, rpm: 100 },
    groq_llama_4_scout: { rpd: 1000, rpm: 30 },
    groq_qwen_32b: { rpd: 1000, rpm: 60 },
    groq_llama_3_3_70b: { rpd: 1000, rpm: 30 },
    groq_llama_3_1_8b: { rpd: 14400, rpm: 30 },
    gemini_2_5_flash: { rpd: 250000, rpm: 10 },
    gemini_2_0_flash: { rpd: 1500, rpm: 15 },
};

/** Returns today's UTC date as string YYYY-MM-DD */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Get current usage for a model today.
 * Returns 0 if no record exists yet.
 */
export async function getModelUsageToday(modelKey: string): Promise<number> {
    const today = todayUTC();
    const [row] = await db
        .select({ request_count: rateLimitState.requestCount })
        .from(rateLimitState)
        .where(
            and(
                eq(rateLimitState.modelKey, modelKey),
                eq(rateLimitState.date, today),
            ),
        )
        .limit(1);

    return row?.request_count ?? 0;
}

/**
 * Check if a model has capacity for N more requests today.
 */
export async function hasCapacity(
    modelKey: string,
    needed: number = 1,
): Promise<boolean> {
    const limits = MODEL_LIMITS[modelKey];
    if (!limits) return false;

    const used = await getModelUsageToday(modelKey);
    return used + needed <= limits.rpd;
}

/**
 * Atomically increment request count for a model.
 * Uses INSERT ... ON CONFLICT UPDATE to handle concurrent serverless invocations safely.
 * Returns the NEW total count.
 */
export async function incrementModelUsage(
    modelKey: string,
    requests: number = 1,
): Promise<number> {
    const today = todayUTC();

    const result: unknown = await db.execute(sql`
    INSERT INTO rate_limit_state (model_key, date, request_count, last_used_at)
    VALUES (${modelKey}, ${today}::date, ${requests}, now())
    ON CONFLICT (model_key, date) DO UPDATE
    SET request_count = rate_limit_state.request_count + ${requests},
        last_used_at  = now()
    RETURNING request_count
  `);

    const rows = Array.isArray(result) ? result : (result as { rows?: Array<Record<string, number>> })?.rows;
    return rows?.[0]?.request_count ?? 0;
}

/**
 * Calculate how many requests are safe to make right now.
 * Accounts for remaining daily budget.
 * Returns 0 if at limit.
 */
export async function safeRequestBudget(
    modelKey: string,
    maxPerBatch: number,
): Promise<number> {
    const limits = MODEL_LIMITS[modelKey];
    if (!limits) return 0;

    const used = await getModelUsageToday(modelKey);
    const remaining = Math.max(0, limits.rpd - used);

    // Also respect RPM: we run every 10 mins, so safe to send up to RPM/7 per tick
    // At 100 RPM: 100/7 ≈ 14 per tick. But use conservative value to be safe.
    const rpmSafePerTick = Math.floor(limits.rpm / 7);

    return Math.min(remaining, maxPerBatch, rpmSafePerTick);
}
