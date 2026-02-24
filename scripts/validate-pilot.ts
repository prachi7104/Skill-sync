/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Pilot Validation Script
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Read-only diagnostic script that checks system readiness for the pilot.
 *
 * Usage:  npm run validate:pilot
 *         npx tsx scripts/validate-pilot.ts
 *
 * Checks:
 *   1. DB connection (SELECT 1)
 *   2. Core table counts (users, students, drives, jobs)
 *   3. Students with NULL embeddings
 *   4. Jobs stuck in 'processing' > 5 minutes
 *   5. pg_cron schedules (cron.job table, if accessible)
 *   6. Overall verdict: READY / WARNINGS / NOT READY
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import { users, students, drives, jobs } from "../lib/db/schema";
import { eq, and, isNull, lte, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
    name: string;
    status: "pass" | "warn" | "fail";
    detail: string;
}

// ── Checks ───────────────────────────────────────────────────────────────────

async function checkDbConnection(): Promise<CheckResult> {
    const start = Date.now();
    try {
        await db.execute(sql`SELECT 1`);
        const latency = Date.now() - start;
        return {
            name: "DB Connection",
            status: latency < 500 ? "pass" : "warn",
            detail: `Connected in ${latency}ms`,
        };
    } catch (err: any) {
        return {
            name: "DB Connection",
            status: "fail",
            detail: `Cannot connect: ${err.message}`,
        };
    }
}

async function checkTableCounts(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const [usersCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
    const [studentsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students);
    const [drivesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(drives);
    const [jobsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs);

    results.push({
        name: "Users",
        status: (usersCount?.count ?? 0) > 0 ? "pass" : "warn",
        detail: `${usersCount?.count ?? 0} users`,
    });
    results.push({
        name: "Students",
        status: (studentsCount?.count ?? 0) > 0 ? "pass" : "warn",
        detail: `${studentsCount?.count ?? 0} students`,
    });
    results.push({
        name: "Drives",
        status: (drivesCount?.count ?? 0) > 0 ? "pass" : "warn",
        detail: `${drivesCount?.count ?? 0} drives`,
    });
    results.push({
        name: "Jobs",
        status: "pass",
        detail: `${jobsCount?.count ?? 0} total jobs`,
    });

    return results;
}

async function checkNullEmbeddings(): Promise<CheckResult> {
    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(isNull(students.embedding));

    const count = result?.count ?? 0;

    if (count === 0) {
        return {
            name: "Student Embeddings",
            status: "pass",
            detail: "All students have embeddings",
        };
    } else if (count <= 10) {
        return {
            name: "Student Embeddings",
            status: "warn",
            detail: `${count} students missing embeddings — run generate_embedding worker`,
        };
    } else {
        return {
            name: "Student Embeddings",
            status: "fail",
            detail: `${count} students missing embeddings — embeddings pipeline may be broken`,
        };
    }
}

async function checkStuckJobs(): Promise<CheckResult> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(
            and(
                eq(jobs.status, "processing"),
                lte(jobs.updatedAt, fiveMinutesAgo),
            ),
        );

    const count = result?.count ?? 0;

    if (count === 0) {
        return {
            name: "Stuck Jobs",
            status: "pass",
            detail: "No jobs stuck in processing",
        };
    } else {
        return {
            name: "Stuck Jobs",
            status: "fail",
            detail: `${count} job(s) stuck in 'processing' for > 5 minutes — possible worker crash`,
        };
    }
}

async function checkCronSchedules(): Promise<CheckResult> {
    try {
        const result = await db.execute(
            sql`SELECT jobname, schedule, active FROM cron.job ORDER BY jobname`,
        );

        const rows = result as unknown as Array<{
            jobname: string;
            schedule: string;
            active: boolean;
        }>;

        if (!rows || rows.length === 0) {
            return {
                name: "pg_cron Schedules",
                status: "warn",
                detail: "No cron jobs found — scheduled tasks will not run automatically",
            };
        }

        const activeCount = rows.filter((r) => r.active).length;
        const details = rows
            .map(
                (r) => `  ${r.active ? "✓" : "✗"} ${r.jobname} — ${r.schedule}`,
            )
            .join("\n");

        return {
            name: "pg_cron Schedules",
            status: activeCount > 0 ? "pass" : "warn",
            detail: `${activeCount}/${rows.length} active cron jobs:\n${details}`,
        };
    } catch {
        return {
            name: "pg_cron Schedules",
            status: "warn",
            detail: "Cannot query cron.job — pg_cron extension may not be installed/accessible",
        };
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function validate() {
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  SkillSync — Pilot Validation Report");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log("");

    const allResults: CheckResult[] = [];

    // 1. DB connection
    const dbCheck = await checkDbConnection();
    allResults.push(dbCheck);

    if (dbCheck.status === "fail") {
        // Can't proceed without DB
        printResults(allResults);
        printVerdict(allResults);
        process.exit(1);
    }

    // 2. Table counts
    const tableCounts = await checkTableCounts();
    allResults.push(...tableCounts);

    // 3. NULL embeddings
    const embeddingCheck = await checkNullEmbeddings();
    allResults.push(embeddingCheck);

    // 4. Stuck jobs
    const stuckCheck = await checkStuckJobs();
    allResults.push(stuckCheck);

    // 5. pg_cron
    const cronCheck = await checkCronSchedules();
    allResults.push(cronCheck);

    // Print report
    printResults(allResults);
    printVerdict(allResults);

    process.exit(0);
}

function printResults(results: CheckResult[]) {
    const icons = { pass: "✅", warn: "⚠️ ", fail: "❌" };

    for (const r of results) {
        const icon = icons[r.status];
        const lines = r.detail.split("\n");
        console.log(`  ${icon} ${r.name}: ${lines[0]}`);
        for (let i = 1; i < lines.length; i++) {
            console.log(`      ${lines[i]}`);
        }
    }
    console.log("");
}

function printVerdict(results: CheckResult[]) {
    const fails = results.filter((r) => r.status === "fail").length;
    const warns = results.filter((r) => r.status === "warn").length;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (fails > 0) {
        console.log(`  🔴 NOT READY — ${fails} critical issue(s)`);
    } else if (warns > 0) {
        console.log(`  🟡 WARNINGS — ${warns} non-critical issue(s)`);
    } else {
        console.log("  🟢 READY — All checks passed");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
}

validate();
