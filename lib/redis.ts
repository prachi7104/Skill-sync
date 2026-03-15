import "server-only";
import { Redis } from "@upstash/redis";

// Lazy singleton — created on first call
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // Redis not configured — callers must handle null gracefully
  }

  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

/**
 * Rate limit check using Redis sliding window.
 * Falls back to allowing the request if Redis is unavailable.
 * Returns { allowed: boolean, current: number, limit: number }
 */
export async function redisRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const redis = getRedis();
  if (!redis) {
    // No Redis configured — allow but log
    console.warn("[Redis] Not configured, skipping rate limit check for:", key);
    return { allowed: true, current: 0, limit };
  }

  try {
    const windowKey = `rl:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const current = await redis.incr(windowKey);

    if (current === 1) {
      // First request in window — set expiry
      await redis.expire(windowKey, windowSeconds);
    }

    return { allowed: current <= limit, current, limit };
  } catch (err) {
    console.error("[Redis] Rate limit check failed:", err);
    return { allowed: true, current: 0, limit }; // Fail open
  }
}
