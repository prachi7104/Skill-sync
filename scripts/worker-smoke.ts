#!/usr/bin/env node
import "dotenv/config";

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not set. This smoke script requires a configured database connection.");
        process.exit(1);
    }

    console.log("Running resume worker smoke — will process up to a few jobs if present.");
    try {
        // Dynamically import worker to avoid hoisting server-only imports before
        // we've verified environment variables. This prevents module resolution
        // errors when running outside Next.js.
        const { processResumeParseJobs } = await import("@/lib/workers/parse-resume");
        const processed = await processResumeParseJobs();
        console.log(`Worker processed ${processed} jobs`);
    } catch (err) {
        console.error("Worker smoke failed:", err);
        process.exit(2);
    }
}

main();
