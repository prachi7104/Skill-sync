import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { students, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString!, { prepare: false });
    const db = drizzle(client);

    try {
        const results = await db
            .select({
                id: students.id,
                email: users.email,
                resumeUrl: students.resumeUrl,
                resumeFilename: students.resumeFilename,
            })
            .from(students)
            .leftJoin(users, eq(users.id, students.id));

        console.log("Students with resume data:");
        for (const r of results) {
            console.log(`\n${r.email}:`);
            console.log(`  URL: ${r.resumeUrl || "(none)"}`);
            console.log(`  Filename: ${r.resumeFilename || "(none)"}`);
            
            // Check if URL is valid Cloudinary
            if (r.resumeUrl && !r.resumeUrl.includes("cloudinary.com")) {
                console.log("  ⚠️  NOT a valid Cloudinary URL!");
            }
        }
    } catch (error) {
        console.error("Query Failed:", error);
    } finally {
        await client.end();
    }
}

main();
