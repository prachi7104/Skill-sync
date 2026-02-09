import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function main() {
    console.log("Testing database connection...");
    try {
        // 1. Simple query
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("✅ Connection successful:", result[0]);

        // 2. Check for users table
        console.log("Checking for 'users' table...");
        try {
            const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
            console.log("✅ 'users' table exists. Row count:", userCount[0].count);
        } catch (e: any) {
            console.error("❌ 'users' table access failed:", e.message);
            if (e.message.includes("relation \"users\" does not exist")) {
                console.log("💡 Hint: You need to run migrations.");
            }
        }

    } catch (error: any) {
        console.error("❌ Connection failed:", error.message);
    }
    process.exit(0);
}

main();
