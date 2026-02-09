
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Testing DB connection (Standalone)...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is missing! Make sure .env.local exists and is loaded.");
        process.exit(1);
    }

    // Mask password for logging
    try {
        const urlObj = new URL(connectionString);
        urlObj.password = "***";
        console.log("URL found:", urlObj.toString());
    } catch (e) {
        console.log("URL found (invalid format for logging):", connectionString.substring(0, 10) + "...");
    }

    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);

    try {
        console.log("Selecting 1 user...");
        const result = await db.select().from(users).limit(1);
        console.log("Connection successful. Users found:", result.length);
        if (result.length > 0) {
            console.log("First user:", result[0]);
        } else {
            console.log("No users found. Attempting insert...");
            const testEmail = `test-${Date.now()}@example.com`;
            const testName = "Test User";

            console.log(`Inserting: ${testEmail}`);

            const [newUser] = await db.insert(users).values({
                email: testEmail,
                name: testName,
                role: "student",
            }).returning();

            console.log("Insert successful:", newUser);

            await db.delete(users).where(eq(users.id, newUser.id));
            console.log("Cleaned up test user.");
        }

    } catch (error) {
        console.error("DB Connection/Query Failed:", error);
    } finally {
        await client.end();
    }
}

main();
