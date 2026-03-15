import { db as defaultDb } from "@/lib/db";
import { aiRateLimits } from "../db/schema";
import { sql } from "drizzle-orm";
import { getRedis, redisRateLimit } from "@/lib/redis";

/**
 * Atomic rate limiter for AI model requests.
 * Uses Redis as primary (fast, sub-ms) with PostgreSQL as fallback.
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
    const redis = getRedis();

    // Try Redis first (faster, no DB round-trip)
    if (redis) {
        const { allowed } = await redisRateLimit(`model:${modelKey}`, limitPerMinute, 60);
        return allowed;
    }

    // Fall back to DB-based rate limiting
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setSeconds(0, 0);

    try {
        // Upsert the rate limit row for this model + window
        // We use raw SQL for ON CONFLICT because Drizzle's upsert API varies by version
        const [result] = await db.execute(sql`
      INSERT INTO ${aiRateLimits} (model_key, window_start, request_count)
      VALUES (${modelKey}, ${windowStart.toISOString()}, 1)
      ON CONFLICT (model_key, window_start)
      DO UPDATE SET request_count = ai_rate_limits.request_count + 1
      RETURNING request_count
    `);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (result as any).request_count as number;
        return count <= limitPerMinute;
    } catch (error) {
        console.error("[RateLimiter] DB error during rate limit check:", error);
        // Fail open: allow request if DB is down to avoid blocking users
        return true;
    }
}
