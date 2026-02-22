import "dotenv/config";

// ── Production guard ─────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? "";
const isRemote =
    dbUrl.includes("supabase.co") &&
    !dbUrl.includes("localhost") &&
    !dbUrl.includes("127.0.0.1");

if (isRemote) {
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise<void>((resolve) => {
        rl.question(
            "⚠️  WARNING: This will DELETE ALL DATA in the remote Supabase database.\n" +
            'Type "delete everything" to confirm: ',
            (answer) => {
                rl.close();
                if (answer.trim() !== "delete everything") {
                    console.log("Aborted.");
                    process.exit(0);
                }
                resolve();
            },
        );
    });
}
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function resetDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing");
    }

    console.log("⚠️  Resetting database (Truncating tables)...");

    try {
        // Truncate users table with CASCADE to clear dependent tables (students, drives, rankings)
        await db.execute(sql`TRUNCATE TABLE users CASCADE`);
        console.log("✅ Users table truncated successfully.");

        // Optionally truncate jobs if unrelated to users but part of state reset
        await db.execute(sql`TRUNCATE TABLE jobs CASCADE`);
        console.log("✅ Jobs table truncated successfully.");

        console.log("Database reset complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to reset database:", error);
        process.exit(1);
    }
}

resetDb();
