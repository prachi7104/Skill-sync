export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, rankings, jobs } from "@/lib/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHealthPage() {
  await requireRole(["admin"]);

  // Parallel count queries — same as the API but rendered server-side
  const [
    totalStudentsResult,
    onboardedResult,
    embeddingsResult,
    drivesCreatedResult,
    drivesRankedResult,
    jobFailuresResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(students),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(sql`${students.onboardingStep} >= 7`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(isNotNull(students.embedding)),
    db.select({ count: sql<number>`count(*)::int` }).from(drives),
    db
      .select({ count: sql<number>`count(distinct ${rankings.driveId})::int` })
      .from(rankings),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.status, "failed")),
  ]);

  const stats = [
    {
      label: "Total Students",
      value: totalStudentsResult[0]?.count ?? 0,
      description: "Student rows in the database",
    },
    {
      label: "Students Onboarded",
      value: onboardedResult[0]?.count ?? 0,
      description: "Completed onboarding (step >= 7)",
    },
    {
      label: "Students with Embeddings",
      value: embeddingsResult[0]?.count ?? 0,
      description: "Profile embedding generated",
    },
    {
      label: "Drives Created",
      value: drivesCreatedResult[0]?.count ?? 0,
      description: "Total placement drives",
    },
    {
      label: "Drives Ranked",
      value: drivesRankedResult[0]?.count ?? 0,
      description: "Drives with at least one ranking",
    },
    {
      label: "Job Failures",
      value: jobFailuresResult[0]?.count ?? 0,
      description: "Jobs with status = failed",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only operational overview. No filters, no exports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Snapshot at {new Date().toISOString()}
      </p>
    </div>
  );
}
