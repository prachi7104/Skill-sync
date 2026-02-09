import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

// postgres-js is the official driver for drizzle-orm/postgres-js and is fast and lightweight for Node runtimes.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Server-only because it uses a secret connection string and opens direct DB connections.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
