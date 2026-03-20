/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Health Check Script
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Run: npx tsx scripts/health-check.ts
 *
 * Comprehensive system health verification:
 *   1. Database connectivity
 *   2. All counts (students, drives, rankings, jobs)
 *   3. Stuck jobs detection (processing > 1 hour)
 *   4. Students without college_id
 *   5. Drives without college_id
 *   6. Redis connectivity
 *   7. Display summary report
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { db } from "@/lib/db";
import { students, drives, rankings, jobs } from "@/lib/db/schema";
import { eq, isNull, isNotNull, lt, and, sql } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

interface HealthReport {
  timestamp: string;
  database: {
    connected: boolean;
    error?: string;
  };
  counts: {
    totalStudents: number;
    studentsOnboarded: number;
    studentsWithEmbeddings: number;
    drivesCreated: number;
    drivesRanked: number;
    jobsPending: number;
    jobsProcessing: number;
    jobsFailed: number;
  };
  issues: {
    stuckJobs: Array<{ id: string; type: string; status: string; time: string }>;
    studentsWithoutCollege: number;
    drivesWithoutCollege: number;
  };
  redis: {
    connected: boolean;
    error?: string;
  };
  summary: {
    healthy: boolean;
    warnings: string[];
    errors: string[];
  };
}

async function getRedisStatus(): Promise<{ connected: boolean; error?: string }> {
  try {
    const redis = getRedis();
    if (!redis) {
      return { connected: false, error: "Redis not configured" };
    }
    await redis.ping();
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function performHealthCheck(): Promise<HealthReport> {
  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    database: { connected: false },
    counts: {
      totalStudents: 0,
      studentsOnboarded: 0,
      studentsWithEmbeddings: 0,
      drivesCreated: 0,
      drivesRanked: 0,
      jobsPending: 0,
      jobsProcessing: 0,
      jobsFailed: 0,
    },
    issues: {
      stuckJobs: [],
      studentsWithoutCollege: 0,
      drivesWithoutCollege: 0,
    },
    redis: { connected: false },
    summary: {
      healthy: true,
      warnings: [],
      errors: [],
    },
  };

  try {
    // ────────────────────────────────────────────────────────────────────────────
    // 1. Database Connectivity Check
    // ────────────────────────────────────────────────────────────────────────────
    try {
      const result = await db
        .select({ count: sql<number>`1` })
        .from(students)
        .limit(1);
      report.database.connected = (result.length > 0) || true; // Any successful query means connected
    } catch (err) {
      report.database.connected = false;
      report.database.error = err instanceof Error ? err.message : String(err);
      report.summary.errors.push(
        `Database connection failed: ${report.database.error}`
      );
      return report; // Can't continue without database
    }

    // ────────────────────────────────────────────────────────────────────────────
    // 2. Fetch All Counts in Parallel
    // ────────────────────────────────────────────────────────────────────────────
    const [
      totalStudentsResult,
      onboardedResult,
      embeddingsResult,
      drivesCreatedResult,
      drivesRankedResult,
      jobsPendingResult,
      jobsProcessingResult,
      jobsFailedResult,
      studentsNoCollegeResult,
      drivesNoCollegeResult,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(sql`${students.profileCompleteness} >= 80`)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(isNotNull(students.embedding))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(drives)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(distinct ${rankings.driveId})::int` })
        .from(rankings)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.status, "pending"))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.status, "processing"))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.status, "failed"))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(isNull(students.collegeId))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(drives)
        .where(isNull(drives.collegeId))
        .then((r) => r[0]?.count ?? 0),
    ]);

    report.counts = {
      totalStudents: totalStudentsResult,
      studentsOnboarded: onboardedResult,
      studentsWithEmbeddings: embeddingsResult,
      drivesCreated: drivesCreatedResult,
      drivesRanked: drivesRankedResult,
      jobsPending: jobsPendingResult,
      jobsProcessing: jobsProcessingResult,
      jobsFailed: jobsFailedResult,
    };

    // ────────────────────────────────────────────────────────────────────────────
    // 3. Check for Stuck Jobs (processing > 1 hour)
    // ────────────────────────────────────────────────────────────────────────────
    const stuckJobThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const stuckJobs = await db
      .select({
        id: jobs.id,
        type: jobs.type,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "processing"),
          lt(jobs.updatedAt, stuckJobThreshold)
        )
      );

    if (stuckJobs.length > 0) {
      report.issues.stuckJobs = stuckJobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        time: job.updatedAt?.toISOString() || "unknown",
      }));
      report.summary.warnings.push(
        `Found ${stuckJobs.length} stuck job(s) in processing state`
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // 4. Check Students/Drives without college_id
    // ────────────────────────────────────────────────────────────────────────────
    report.issues.studentsWithoutCollege = studentsNoCollegeResult;
    report.issues.drivesWithoutCollege = drivesNoCollegeResult;

    if (studentsNoCollegeResult > 0) {
      report.summary.warnings.push(
        `Found ${studentsNoCollegeResult} student(s) without college_id`
      );
    }

    if (drivesNoCollegeResult > 0) {
      report.summary.warnings.push(
        `Found ${drivesNoCollegeResult} drive(s) without college_id`
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // 5. Check Jobs Status
    // ────────────────────────────────────────────────────────────────────────────
    if (report.counts.jobsFailed > 0) {
      report.summary.warnings.push(
        `Found ${report.counts.jobsFailed} failed job(s) that need investigation`
      );
    }

    if (report.counts.jobsProcessing > 5) {
      report.summary.warnings.push(
        `${report.counts.jobsProcessing} jobs currently processing (may indicate slow worker)`
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // 6. Redis Check
    // ────────────────────────────────────────────────────────────────────────────
    report.redis = await getRedisStatus();
    if (!report.redis.connected) {
      report.summary.warnings.push(
        `Redis unavailable: ${report.redis.error || "unknown error"}`
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // 7. Overall Health Status
    // ────────────────────────────────────────────────────────────────────────────
    report.summary.healthy =
      report.database.connected &&
      report.summary.errors.length === 0 &&
      stuckJobs.length === 0 &&
      report.counts.jobsFailed === 0;
  } catch (err) {
    report.summary.errors.push(
      `Health check failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return report;
}

function printReport(report: HealthReport): void {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          SkillSync — System Health Check Report               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`\nTimestamp: ${report.timestamp}`);

  // ────────────────────────────────────────────────────────────────────────────
  // Connection Status
  // ────────────────────────────────────────────────────────────────────────────
  console.log("\n┌─ Connections ────────────────────────────────────────────────┐");
  console.log(
    `│ Database: ${report.database.connected ? "✓ Connected" : "✗ Failed"}`
  );
  if (report.database.error) {
    console.log(`│ Error: ${report.database.error}`);
  }
  console.log(`│ Redis:    ${report.redis.connected ? "✓ Connected" : "✗ Failed"}`);
  if (report.redis.error) {
    console.log(`│ Error: ${report.redis.error}`);
  }
  console.log("└──────────────────────────────────────────────────────────────┘");

  // ────────────────────────────────────────────────────────────────────────────
  // Counts
  // ────────────────────────────────────────────────────────────────────────────
  console.log("\n┌─ System Counts ──────────────────────────────────────────────┐");
  console.log(`│ Students                   ${report.counts.totalStudents.toString().padEnd(40)}`);
  console.log(`│   └─ Onboarded (≥80%)      ${report.counts.studentsOnboarded.toString().padEnd(40)}`);
  console.log(`│   └─ With Embeddings       ${report.counts.studentsWithEmbeddings.toString().padEnd(40)}`);
  console.log(`│ Drives                     ${report.counts.drivesCreated.toString().padEnd(40)}`);
  console.log(`│   └─ With Rankings         ${report.counts.drivesRanked.toString().padEnd(40)}`);
  console.log(`│ Jobs                       ${report.counts.jobsPending.toString().padEnd(40)}`);
  console.log(`│   └─ Pending               ${report.counts.jobsPending.toString().padEnd(40)}`);
  console.log(`│   └─ Processing            ${report.counts.jobsProcessing.toString().padEnd(40)}`);
  console.log(`│   └─ Failed                ${report.counts.jobsFailed.toString().padEnd(40)}`);
  console.log("└──────────────────────────────────────────────────────────────┘");

  // ────────────────────────────────────────────────────────────────────────────
  // Issues
  // ────────────────────────────────────────────────────────────────────────────
  if (
    report.issues.stuckJobs.length > 0 ||
    report.issues.studentsWithoutCollege > 0 ||
    report.issues.drivesWithoutCollege > 0
  ) {
    console.log("\n┌─ Issues ─────────────────────────────────────────────────────┐");

    if (report.issues.stuckJobs.length > 0) {
      console.log(
        `│ ⚠ Stuck Jobs: ${report.issues.stuckJobs.length} job(s) processing >1h`
      );
      for (const job of report.issues.stuckJobs.slice(0, 3)) {
        console.log(
          `│   - ${job.type} (${job.id}) since ${job.time}`
        );
      }
      if (report.issues.stuckJobs.length > 3) {
        console.log(
          `│   ... and ${report.issues.stuckJobs.length - 3} more`
        );
      }
    }

    if (report.issues.studentsWithoutCollege > 0) {
      console.log(
        `│ ⚠ Students without college_id: ${report.issues.studentsWithoutCollege}`
      );
    }

    if (report.issues.drivesWithoutCollege > 0) {
      console.log(
        `│ ⚠ Drives without college_id: ${report.issues.drivesWithoutCollege}`
      );
    }

    console.log("└──────────────────────────────────────────────────────────────┘");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────────
  console.log("\n┌─ Summary ────────────────────────────────────────────────────┐");
  const statusIcon = report.summary.healthy ? "✓ HEALTHY" : "✗ ISSUES DETECTED";
  console.log(`│ Status: ${statusIcon.padEnd(58)}`);

  if (report.summary.errors.length > 0) {
    console.log(`│ Errors:${" ".padEnd(52)}`);
    for (const error of report.summary.errors) {
      console.log(`│   • ${error}`);
    }
  }

  if (report.summary.warnings.length > 0) {
    console.log(`│ Warnings:${" ".padEnd(49)}`);
    for (const warning of report.summary.warnings) {
      console.log(`│   • ${warning}`);
    }
  }

  console.log("└──────────────────────────────────────────────────────────────┘\n");
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Execution
// ════════════════════════════════════════════════════════════════════════════════

(async () => {
  try {
    const report = await performHealthCheck();
    printReport(report);
    process.exit(report.summary.healthy ? 0 : 1);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();
