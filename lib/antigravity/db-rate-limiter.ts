import { db as defaultDb } from "@/lib/db";
import { aiRateLimits } from "../db/schema";
import { sql } from "drizzle-orm";

/**
 * Atomic DB-based rate limiter for AI model requests.
 * Tracks usage in 1-minute windows using PostgreSQL ON CONFLICT UPDATE.
 *
 * @param modelKey - Lowercase model identifier (e.g., 'gemini-1.5-flash')
 * @param limitPerMinute - Maximum allowed requests in a rolling 1-minute window
 * @param db - Optional drizzle database instance (defaults to shared instance)
 * @returns Promise<boolean> - true if within limit (and incremented), false if blocked
 */
export async function checkAndIncrementRateLimit(
    modelKey: string,
    limitPerMinute: number,
    db = defaultDb
): Promise<boolean> {
    // 1. Truncate current time to the start of the minute
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setSeconds(0, 0);

    try {
        // 2. Upsert the rate limit row for this model + window
        // We use raw SQL for ON CONFLICT because Drizzle's upsert API varies by version
        const [result] = await db.execute(sql`
      INSERT INTO ${aiRateLimits} (model_key, window_start, request_count)
      VALUES (${modelKey}, ${windowStart.toISOString()}, 1)
      ON CONFLICT (model_key, window_start)
      DO UPDATE SET request_count = ai_rate_limits.request_count + 1
      RETURNING request_count
    `);

        // 3. Check if we exceeded the limit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (result as any).request_count as number;
        return count <= limitPerMinute;
    } catch (error) {
        console.error("[RateLimiter] DB error during rate limit check:", error);
        // Fallback: allow request if DB is down to avoid blocking users
        return true;
    }
}
