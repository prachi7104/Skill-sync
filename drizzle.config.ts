import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (process.env.DRIZZLE_MIGRATIONS_ENABLED !== "true") {
  throw new Error(
    "\n\nDRIZZLE MIGRATIONS ARE DISABLED\n" +
    "Schema changes must be applied manually via Supabase SQL Editor.\n" +
    "To run migrations locally only: set DRIZZLE_MIGRATIONS_ENABLED=true in .env.local\n" +
    "Never set this in production.\n",
  );
}

export default {
  // Canonical schema: migrations are generated only from this file.
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
