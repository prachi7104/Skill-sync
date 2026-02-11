import dotenv from "dotenv";
import path from "path";

async function main() {
    console.log("Setting up environment...");

    // 1. Load environment variables from .env.local
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

    // 2. Mock required env vars to prevent lib/env.ts from crashing
    // These must be set BEFORE importing lib/env
    process.env.MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "test_client_id";
    process.env.MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "test_client_secret";
    process.env.MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "test_tenant_id";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://test:test@localhost:5432/test";
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test_secret";

    // 3. Dynamically import modules AFTER env is set
    const { parseJD } = await import("../lib/jd/parser");
    const { env } = await import("../lib/env");

    console.log("Environment loaded. Running JD Parser Test...");
    console.log("GROQ_API_KEY:", env.GROQ_API_KEY ? `${env.GROQ_API_KEY.slice(0, 4)}...` : "MISSING");
    console.log("GOOGLE_GENERATIVE_AI_API_KEY:", env.GOOGLE_GENERATIVE_AI_API_KEY ? `${env.GOOGLE_GENERATIVE_AI_API_KEY.slice(0, 4)}...` : "MISSING");

    const EXAMPLE_JD = `
About the job
Join our amazing team! We're a fast-growing startup...

As a remote, hourly paid Kotlin Engineer, you will review AI-generated responses...

Your Profile
- 2+ years of hands-on Kotlin development experience
- Strong understanding of null safety, coroutines
- Bachelor's degree in CS
`;

    if (!env.GOOGLE_GENERATIVE_AI_API_KEY && !env.GROQ_API_KEY) {
        console.error("Missing API Keys - skip test");
        return;
    }

    const fs = await import("fs");

    try {
        const result = await parseJD(EXAMPLE_JD, "Kotlin Engineer", "Test Company");
        const output = JSON.stringify(result, null, 2);
        console.log("Parsing Result:", output);
        fs.writeFileSync("test_output_clean.txt", output);

        // Basic Validation
        let log = "";
        if (result.role_metadata.job_title === "Kotlin Engineer") {
            log += "✅ Title Extracted Correctly\n";
        } else {
            log += "❌ Title Mismatch\n";
        }

        const hasKotlin = result.normalized_skills.programming_languages.includes("Kotlin");
        if (hasKotlin) {
            log += "✅ Kotlin Skill Detected\n";
        } else {
            log += "❌ Kotlin Skill Missing\n";
        }

        const years = result.requirements.hard_requirements.experience.total_years;
        if (years === "2+" || years === "2") {
            log += "✅ Experience Years Extracted Correctly\n";
        } else {
            log += `⚠️ Experience Years: ${years} (Expected 2+)\n`;
        }
        console.log(log);
        fs.appendFileSync("test_output_clean.txt", "\n\nLOGS:\n" + log);

    } catch (error) {
        console.error("Test Failed:", error);
        const fs = await import("fs");
        fs.writeFileSync("test_output_clean.txt", "ERROR: " + String(error));
    }
}

main();
