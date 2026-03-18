import "server-only";

import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export interface CachedModel {
  id: string;
  model_key: string;
  provider: "google" | "groq";
  task_types: string[];
  rpm_limit: number;
  rpd_limit: number;
  tpm_limit: number | null;
  priority: number;
  is_active: boolean;
  is_deprecated: boolean;
}

let cache: CachedModel[] | null = null;
let cacheTime = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;
const REDIS_CACHE_KEY = "antigravity:active-models";

export const AntigravityModelCache = {
  async getActive(taskType?: string): Promise<CachedModel[]> {
    const now = Date.now();
    const redis = getRedis();

    if (redis && (!cache || now - cacheTime > CACHE_TTL_MS)) {
      try {
        const cached = await redis.get<CachedModel[]>(REDIS_CACHE_KEY);
        if (cached && Array.isArray(cached)) {
          cache = cached;
          cacheTime = now;
        }
      } catch (err) {
        console.warn("[AntigravityModelCache] Redis fetch failed:", err);
      }
    }

    if (!cache || now - cacheTime > CACHE_TTL_MS) {
      try {
        const rows = (await db.execute(sql`
          SELECT id, model_key, provider, task_types, rpm_limit, rpd_limit, tpm_limit, priority, is_active, is_deprecated
          FROM ai_models
          WHERE is_active = true AND is_deprecated = false
          ORDER BY priority ASC
        `)) as unknown as CachedModel[];

        cache = rows;
        cacheTime = now;

        if (redis) {
          await redis.set(REDIS_CACHE_KEY, rows, { ex: 300 }).catch(() => undefined);
        }
      } catch (err) {
        console.warn("[AntigravityModelCache] DB fetch failed, using stale/empty cache:", err);
        cache = cache ?? [];
      }
    }

    if (!taskType) return cache;
    return cache.filter((model) => Array.isArray(model.task_types) && model.task_types.includes(taskType));
  },

  invalidate() {
    cache = null;
    cacheTime = 0;
    const redis = getRedis();
    if (redis) {
      void redis.del(REDIS_CACHE_KEY).catch(() => undefined);
    }
  },
};
