#!/usr/bin/env node
import "dotenv/config";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not set. This smoke script requires a configured database connection.");
        process.exit(1);
    }

    console.log("Running resume worker smoke — will process up to a few jobs if present.");
    try {
        const processed = await processResumeParseJobs();
        console.log(`Worker processed ${processed} jobs`);
    } catch (err) {
        console.error("Worker smoke failed:", err);
        process.exit(2);
    }
}

main();
