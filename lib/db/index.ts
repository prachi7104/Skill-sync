import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { DefaultLogger, LogWriter } from 'drizzle-orm/logger';
import * as schema from "./schema";
import { incrementDbQuery } from "@/lib/request-context";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Singleton connection pattern for Next.js HMR
declare global {
  // eslint-disable-next-line no-var
  var _postgresClient: ReturnType<typeof postgres> | undefined;
}

const client = globalThis._postgresClient || postgres(connectionString, {
  prepare: false,
  max: 5, // Limit to 5 connections as requested
  idle_timeout: 20, // 20 seconds idle timeout
  connect_timeout: 10, // 10 seconds connection timeout
  connection: {
    application_name: "skillsync_app",
    statement_timeout: 30000, // 30 seconds statement timeout
  }
});

if (process.env.NODE_ENV !== "production") {
  globalThis._postgresClient = client;
}

// Logger interface for Drizzle
class QueryLogger implements LogWriter {
  write(message: string) {
    // console.log(message); // Verbose query logging
    incrementDbQuery();
  }
}
const logger = new DefaultLogger({ writer: new QueryLogger() });

export const db = drizzle(client, { schema, logger });

export async function getDbStats() {
  const result = await client`
    SELECT count(*)::int as total_connections,
           count(*) filter (where state = 'active')::int as active_connections,
           count(*) filter (where state = 'idle')::int as idle_connections
    FROM pg_stat_activity
    WHERE application_name = 'skillsync_app'
  `;

  const stats = result[0];
  console.log('DB Pool Stats:', stats);
  return stats;
}
