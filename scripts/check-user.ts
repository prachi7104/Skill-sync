
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking for Aniruddh...");

    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString!, { prepare: false });
    const db = drizzle(client);

    try {
        const targetEmail = "aniruddh.125613@stu.upes.ac.in"; // Lowercase to match
        // Check with both casings just in case
        const result = await db.select().from(users).where(eq(users.email, targetEmail));

        if (result.length > 0) {
            console.log("✅ User FOUND in public.users table!");
            console.log(result[0]);
        } else {
            console.log("❌ User NOT found in public.users table.");
            // Check case insensitive?
            const allUsers = await db.select().from(users);
            console.log("Total users in DB:", allUsers.length);
            console.log("User emails:", allUsers.map(u => u.email));
        }

    } catch (error) {
        console.error("Query Failed:", error);
    } finally {
        await client.end();
    }
}

main();
