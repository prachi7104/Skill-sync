import "server-only";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, rankings, jobs } from "@/lib/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

/**
 * GET /api/admin/health
 *
 * Admin-only system health overview. Raw counts only.
 * No charts, no exports, no filters.
 *
 * Returns:
 *   studentsOnboarded   — students with onboarding_step >= 7
 *   studentsWithEmbeddings — students with non-null embedding
 *   drivesCreated       — total drives
 *   drivesRanked        — drives with at least 1 ranking row
 *   jobFailures         — jobs with status = 'failed'
 */
export async function GET() {
  try {
    await requireRole(["admin"]);

    // Execute all counts in parallel
    const [
      onboardedResult,
      embeddingsResult,
      drivesCreatedResult,
      drivesRankedResult,
      jobFailuresResult,
      totalStudentsResult,
    ] = await Promise.all([
      // Students who completed onboarding (step >= 7)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(sql`${students.onboardingStep} >= 7`),

      // Students with non-null embedding
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(isNotNull(students.embedding)),

      // Total drives
      db.select({ count: sql<number>`count(*)::int` }).from(drives),

      // Drives that have at least one ranking row
      db
        .select({ count: sql<number>`count(distinct ${rankings.driveId})::int` })
        .from(rankings),

      // Failed jobs
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.status, "failed")),

      // Total student rows
      db.select({ count: sql<number>`count(*)::int` }).from(students),
    ]);

    return NextResponse.json(
      {
        totalStudents: totalStudentsResult[0]?.count ?? 0,
        studentsOnboarded: onboardedResult[0]?.count ?? 0,
        studentsWithEmbeddings: embeddingsResult[0]?.count ?? 0,
        drivesCreated: drivesCreatedResult[0]?.count ?? 0,
        drivesRanked: drivesRankedResult[0]?.count ?? 0,
        jobFailures: jobFailuresResult[0]?.count ?? 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: any) {
    const message = err?.message ?? "Internal server error";

    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[GET /api/admin/health]", err);
    return NextResponse.json(
      { error: "Failed to retrieve system health" },
      { status: 500 },
    );
  }
}
