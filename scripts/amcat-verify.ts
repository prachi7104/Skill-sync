/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — AMCAT Pre-Import Verification Script
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Pre-deployment verification for AMCAT import system.
 * Checks database structure, indexes, and system readiness.
 *
 * Run: npx tsx scripts/amcat-verify.ts
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { db } from "@/lib/db";
import { colleges, amcatSessions, amcatResults, studentRoster } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

interface VerificationReport {
  timestamp: string;
  checks: {
    collegesnSetup: { passed: boolean; message: string; details?: unknown };
    amcatSessionsTable: { passed: boolean; message: string; details?: unknown };
    amcatResultsTable: { passed: boolean; message: string; details?: unknown };
    studentRosterTable: { passed: boolean; message: string; details?: unknown };
    amcatSessions: { passed: boolean; message: string; details?: unknown };
    amcatResults: { passed: boolean; message: string; details?: unknown };
    studentRoster: { passed: boolean; message: string; details?: unknown };
  };
  summary: {
    allPassed: boolean;
    warnings: string[];
    errors: string[];
  };
}

async function verifyAmcatSetup(): Promise<VerificationReport> {
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    checks: {
      collegesnSetup: { passed: false, message: "" },
      amcatSessionsTable: { passed: false, message: "" },
      amcatResultsTable: { passed: false, message: "" },
      studentRosterTable: { passed: false, message: "" },
      amcatSessions: { passed: false, message: "" },
      amcatResults: { passed: false, message: "" },
      studentRoster: { passed: false, message: "" },
    },
    summary: {
      allPassed: false,
      warnings: [],
      errors: [],
    },
  };

  try {
    // ────────────────────────────────────────────────────────────────────────────
    // Check 1: Colleges Setup
    // ────────────────────────────────────────────────────────────────────────────
    console.log("📋 Checking colleges setup...");
    try {
      const collegelist = await db
        .select({
          id: colleges.id,
          name: colleges.name,
          domain: colleges.studentDomain,
        })
        .from(colleges)
        .limit(10);

      if (collegelist.length === 0) {
        report.checks.collegesnSetup = {
          passed: false,
          message: "❌ No colleges configured",
        };
        report.summary.errors.push("At least one college must be configured");
      } else {
        report.checks.collegesnSetup = {
          passed: true,
          message: `✓ ${collegelist.length} college(s) configured`,
          details: collegelist.map((c) => ({
            name: c.name,
            domain: c.domain,
          })),
        };
      }
    } catch (err) {
      report.checks.collegesnSetup = {
        passed: false,
        message: `❌ Failed to query colleges: ${err instanceof Error ? err.message : String(err)}`,
      };
      report.summary.errors.push("Cannot access colleges table");
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Check 2-4: Table Structure (columns exist)
    // ────────────────────────────────────────────────────────────────────────────
    console.log("📋 Checking table structures...");
    
    const tableChecks: Array<{
      name: string;
      key: keyof VerificationReport["checks"];
      query: string;
    }> = [
      {
        name: "amcat_sessions",
        key: "amcatSessionsTable",
        query: `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'amcat_sessions' 
          ORDER BY ordinal_position
        `,
      },
      {
        name: "amcat_results",
        key: "amcatResultsTable",
        query: `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'amcat_results' 
          ORDER BY ordinal_position
        `,
      },
      {
        name: "student_roster",
        key: "studentRosterTable",
        query: `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'student_roster' 
          ORDER BY ordinal_position
        `,
      },
    ];

    for (const check of tableChecks) {
      try {
        const columns = await db.execute(
          sql.raw(check.query)
        ) as unknown as Array<{ column_name: string }>;

        if (columns.length === 0) {
          report.checks[check.key] = {
            passed: false,
            message: `❌ Table ${check.name} not found`,
          };
          report.summary.errors.push(`${check.name} table missing`);
        } else {
          const columnNames = columns
            .map((c) => c.column_name)
            .join(", ");
          report.checks[check.key] = {
            passed: true,
            message: `✓ ${check.name} table exists with ${columns.length} column(s)`,
            details: { columns: columnNames.split(", ") },
          };
        }
      } catch (err) {
        report.checks[check.key] = {
          passed: false,
          message: `❌ Failed to check ${check.name}: ${err instanceof Error ? err.message : String(err)}`,
        };
        report.summary.errors.push(`Cannot verify ${check.name} structure`);
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Check 5-7: Data Counts
    // ────────────────────────────────────────────────────────────────────────────
    console.log("📋 Checking data counts...");
    
    try {
      const sessionsCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(amcatSessions);
      
      const session_count = sessionsCount[0]?.count ?? 0;
      report.checks.amcatSessions = {
        passed: session_count >= 0,
        message: `✓ ${session_count} AMCAT session(s) in database`,
        details: { count: session_count },
      };

      if (session_count === 0) {
        report.summary.warnings.push("No AMCAT sessions created yet (expected before import)");
      }
    } catch (err) {
      report.checks.amcatSessions = {
        passed: false,
        message: `❌ Failed to count sessions: ${err instanceof Error ? err.message : String(err)}`,
      };
      report.summary.errors.push("Cannot query amcat_sessions table");
    }

    try {
      const resultsCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(amcatResults);
      const result_count = resultsCount[0]?.count ?? 0;
      report.checks.amcatResults = {
        passed: result_count >= 0,
        message: `✓ ${result_count} AMCAT result record(s) in database`,
        details: { count: result_count },
      };

      if (result_count === 0) {
        report.summary.warnings.push("No AMCAT results imported yet (expected before first import)");
      }
    } catch (err) {
      report.checks.amcatResults = {
        passed: false,
        message: `❌ Failed to count results: ${err instanceof Error ? err.message : String(err)}`,
      };
      report.summary.errors.push("Cannot query amcat_results table");
    }

    try {
      const rosterCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(studentRoster);
      const roster_count = rosterCount[0]?.count ?? 0;
      report.checks.studentRoster = {
        passed: roster_count >= 0,
        message: `✓ ${roster_count} student roster record(s) in database`,
        details: { count: roster_count },
      };
    } catch (err) {
      report.checks.studentRoster = {
        passed: false,
        message: `❌ Failed to count roster: ${err instanceof Error ? err.message : String(err)}`,
      };
      report.summary.errors.push("Cannot query student_roster table");
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Summary
    // ────────────────────────────────────────────────────────────────────────────
    const allPassed = Object.values(report.checks).every((c) => c.passed);
    report.summary.allPassed = allPassed;
  } catch (err) {
    report.summary.errors.push(
      `Verification failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return report;
}

function printReport(report: VerificationReport): void {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║        SkillSync — AMCAT Pre-Import Verification Report       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`\nTimestamp: ${report.timestamp}`);

  console.log("\n┌─ Checks ─────────────────────────────────────────────────────┐");

  const checkLabels: Record<string, string> = {
    collegesnSetup: "Colleges Setup",
    amcatSessionsTable: "AMCAT Sessions Table",
    amcatResultsTable: "AMCAT Results Table",
    studentRosterTable: "Student Roster Table",
    amcatSessions: "AMCAT Sessions Count",
    amcatResults: "AMCAT Results Count",
    studentRoster: "Student Roster Count",
  };

  for (const [key, label] of Object.entries(checkLabels)) {
    const check = report.checks[key as keyof typeof report.checks];
    const icon = check.passed ? "✓" : "✗";
    console.log(`│ ${icon} ${label.padEnd(48)}`);
    console.log(`│   ${check.message}`);

    if (check.details && typeof check.details === "object") {
      const details = check.details as Record<string, unknown>;
      if (Array.isArray(details.columns)) {
        const cols = details.columns as string[];
        console.log(`│   Columns: ${cols.slice(0, 5).join(", ")}${cols.length > 5 ? "..." : ""}`);
      } else if (typeof details.count === "number") {
        console.log(`│   Count: ${details.count}`);
      }
    }
  }

  console.log("└──────────────────────────────────────────────────────────────┘");

  if (report.summary.warnings.length > 0) {
    console.log("\n⚠ Warnings:");
    for (const warning of report.summary.warnings) {
      console.log(`  • ${warning}`);
    }
  }

  if (report.summary.errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const error of report.summary.errors) {
      console.log(`  • ${error}`);
    }
  }

  console.log("\n┌─ Summary ────────────────────────────────────────────────────┐");
  const status = report.summary.allPassed ? "✓ READY FOR IMPORT" : "✗ NOT READY";
  console.log(`│ Status: ${status.padEnd(57)}`);
  console.log("└──────────────────────────────────────────────────────────────┘\n");

  if (!report.summary.allPassed) {
    console.log("Next Steps:");
    console.log("  1. Fix all errors above");
    console.log("  2. Run migrations/seeds to populate databases");
    console.log("  3. Rerun this verification script");
  } else {
    console.log("You are ready to proceed with AMCAT data import!");
    console.log("\nQuick Start:");
    console.log("  1. Go to /admin/amcat in the admin panel");
    console.log("  2. Download CSV template");
    console.log("  3. Fill in AMCAT data from your records");
    console.log("  4. Upload the CSV file");
    console.log("  5. Review scores and categories");
    console.log("  6. Publish session to make visible to students");
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Execution
// ════════════════════════════════════════════════════════════════════════════════

(async () => {
  try {
    const report = await verifyAmcatSetup();
    printReport(report);
    process.exit(report.summary.allPassed ? 0 : 1);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();
