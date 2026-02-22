import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { DefaultLogger, LogWriter } from "drizzle-orm/logger";
import * as schema from "./schema";
import { incrementDbQuery } from "@/lib/request-context";
import { logger } from "@/lib/logger";

// ── Pool Configuration ──────────────────────────────────────────────────────
const SLOW_QUERY_THRESHOLD_MS = 1000; // Log queries slower than 1 second
const MAX_POOL_SIZE = 5;

// Lazy singleton connection pattern — the postgres client is created on the
// first actual query, not when this module is imported. This prevents
// `DATABASE_URL is not set` crashes during `next build`'s static optimization
// phase, which imports all server modules without environment variables.
declare global {
  // eslint-disable-next-line no-var
  var _postgresClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

// ── Query Logger with Slow Query Tracking ───────────────────────────────────
class QueryLogger implements LogWriter {
  write(message: string) {
    incrementDbQuery();

    // Extract timing from Drizzle's log message if available
    // Drizzle logs look like: "Query: SELECT ... -- params: [...] -- duration: 123ms"
    const durationMatch = message.match(/(\d+)ms/);
    const durationMs = durationMatch ? parseInt(durationMatch[1]) : null;

    if (durationMs && durationMs > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn("Slow query detected", {
        durationMs,
        query: message.substring(0, 200), // Truncate for readability
        threshold: SLOW_QUERY_THRESHOLD_MS,
      });
    }
  }
}
const queryLogger = new DefaultLogger({ writer: new QueryLogger() });

function getDrizzleDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (globalThis._drizzleDb) return globalThis._drizzleDb;

  if (!globalThis._postgresClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    globalThis._postgresClient = postgres(url, {
      prepare: false,
      max: MAX_POOL_SIZE,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      connection: {
        application_name: "skillsync_app",
        statement_timeout: 30000,
      },
      onnotice: (notice) => {
        logger.warn("DB notice received", {
          message: notice.message,
          severity: notice.severity,
        });
      },
    });
  }

  const instance = drizzle(globalThis._postgresClient, {
    schema,
    logger: queryLogger,
  });

  // Cache drizzle instance in dev to survive HMR reloads
  if (process.env.NODE_ENV !== "production") {
    globalThis._drizzleDb = instance;
  }

  return instance;
}

// Export a Proxy so callers can use `db.query.xxx` / `db.insert(...)` etc.
// without the drizzle instance being created at module import time.
export const db = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getDrizzleDb(), prop, receiver);
    },
  },
);

// ── Pool Health Monitor ─────────────────────────────────────────────────────
export async function getDbStats() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    // Use a fresh client reference for raw queries (same singleton)
    const client = postgres(url, {
      prepare: false,
      max: 1,
      ssl: "require",
      connection: { application_name: "skillsync_app" },
    });

    const result = await client`
      SELECT count(*)::int as total_connections,
             count(*) filter (where state = 'active')::int as active_connections,
             count(*) filter (where state = 'idle')::int as idle_connections,
             count(*) filter (where wait_event_type = 'Lock')::int as waiting_on_lock
      FROM pg_stat_activity
      WHERE application_name = 'skillsync_app'
    `;

    await client.end();

    const stats = result[0] as {
      total_connections: number;
      active_connections: number;
      idle_connections: number;
      waiting_on_lock: number;
    };

    // ⚠️ Pool exhaustion warning
    if (stats.active_connections >= MAX_POOL_SIZE - 1) {
      logger.error("Connection pool near exhaustion", {
        active: stats.active_connections,
        max: MAX_POOL_SIZE,
        idle: stats.idle_connections,
        waiting: stats.waiting_on_lock,
      });
    }

    return stats;
  } catch (err: any) {
    logger.error("Failed to query pool stats", { error: err.message });
    return null;
  }
}
