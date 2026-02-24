export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, rankings, jobs } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, isNull, sql, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "yellow" | "red";
}) {
  const classes = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    yellow: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes[variant]}`}>
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string | number;
  sub?: string;
  badge?: { label: string; variant: "green" | "yellow" | "red" };
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {badge && <StatusBadge label={badge.label} variant={badge.variant} />}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminHealthPage() {
  await requireRole(["admin"]);

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 1 — Job Queue Health
  // ────────────────────────────────────────────────────────────────────────────

  const [
    pendingByType,
    failedLast24h,
    failedRecentErrors,
    completedLast24h,
    avgLatencyByType,
  ] = await Promise.all([
    // Pending counts grouped by type
    db
      .select({
        type: jobs.type,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .groupBy(jobs.type),

    // Failed jobs in last 24h
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(
        and(eq(jobs.status, "failed"), gte(jobs.updatedAt, twentyFourHoursAgo)),
      ),

    // Latest 5 error messages from failed jobs
    db
      .select({
        type: jobs.type,
        error: jobs.error,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(
        and(eq(jobs.status, "failed"), gte(jobs.updatedAt, twentyFourHoursAgo)),
      )
      .orderBy(desc(jobs.updatedAt))
      .limit(5),

    // Completed jobs in last 24h
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "completed"),
          gte(jobs.updatedAt, twentyFourHoursAgo),
        ),
      ),

    // Average latency per job type (completed only)
    db
      .select({
        type: jobs.type,
        avgLatency: sql<number>`round(avg(${jobs.latencyMs}))::int`,
      })
      .from(jobs)
      .where(
        and(eq(jobs.status, "completed"), isNotNull(jobs.latencyMs)),
      )
      .groupBy(jobs.type),
  ]);

  const totalPending = pendingByType.reduce((sum, r) => sum + r.count, 0);
  const failedCount = failedLast24h[0]?.count ?? 0;
  const completedCount = completedLast24h[0]?.count ?? 0;

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 2 — Embedding Status
  // ────────────────────────────────────────────────────────────────────────────

  const [
    totalStudentsResult,
    withEmbeddingResult,
    withoutEmbeddingResult,
    noResumeResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(students),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(isNotNull(students.embedding)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(isNull(students.embedding)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(isNull(students.resumeUrl)),
  ]);

  const totalStudents = totalStudentsResult[0]?.count ?? 0;
  const withEmbedding = withEmbeddingResult[0]?.count ?? 0;
  const withoutEmbedding = withoutEmbeddingResult[0]?.count ?? 0;
  const noResume = noResumeResult[0]?.count ?? 0;

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 3 — API Quota Estimate
  // ────────────────────────────────────────────────────────────────────────────

  const [quotaResult] = await db
    .select({
      sandboxToday: sql<number>`coalesce(sum(${students.sandboxUsageToday}), 0)::int`,
      detailedToday: sql<number>`coalesce(sum(${students.detailedAnalysisUsageToday}), 0)::int`,
    })
    .from(students);

  const sandboxToday = quotaResult?.sandboxToday ?? 0;
  const detailedToday = quotaResult?.detailedToday ?? 0;
  const estimatedCalls = sandboxToday * 2 + detailedToday * 3;
  const dailyBudget = 1000;
  const remaining = Math.max(0, dailyBudget - estimatedCalls);
  const quotaPercent = Math.round((estimatedCalls / dailyBudget) * 100);

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 4 — System Status
  // ────────────────────────────────────────────────────────────────────────────

  // DB connection latency
  let dbLatencyMs = -1;
  let dbHealthy = false;
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  // Last completed job (most recent cron activity)
  const [lastCompletedJob] = await db
    .select({
      type: jobs.type,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .where(eq(jobs.status, "completed"))
    .orderBy(desc(jobs.updatedAt))
    .limit(1);

  // Overall counts for context
  const [drivesResult, rankedDrivesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(drives),
    db
      .select({ count: sql<number>`count(distinct ${rankings.driveId})::int` })
      .from(rankings),
  ]);

  const totalDrives = drivesResult[0]?.count ?? 0;
  const rankedDrives = rankedDrivesResult[0]?.count ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational dashboard — snapshot at{" "}
          {now.toISOString().replace("T", " ").slice(0, 19)} UTC
        </p>
      </div>

      {/* ── SECTION 1: Job Queue Health ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Queue Health</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Total Pending"
              value={totalPending}
              badge={
                totalPending > 20
                  ? { label: "Backlog", variant: "red" }
                  : totalPending > 0
                    ? { label: "Processing", variant: "yellow" }
                    : { label: "Clear", variant: "green" }
              }
            />
            <Metric
              label="Completed (24h)"
              value={completedCount}
              badge={{ label: "OK", variant: "green" }}
            />
            <Metric
              label="Failed (24h)"
              value={failedCount}
              badge={
                failedCount > 5
                  ? { label: "Failures", variant: "red" }
                  : failedCount > 0
                    ? { label: "Some Errors", variant: "yellow" }
                    : { label: "Clean", variant: "green" }
              }
            />
            <Metric
              label="Success Rate"
              value={
                completedCount + failedCount > 0
                  ? `${Math.round((completedCount / (completedCount + failedCount)) * 100)}%`
                  : "—"
              }
            />
          </div>

          {/* Pending by type */}
          {pendingByType.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Pending by Type</p>
              <div className="flex flex-wrap gap-2">
                {pendingByType.map((r) => (
                  <Badge
                    key={r.type}
                    variant={r.count > 20 ? "destructive" : "secondary"}
                  >
                    {r.type}: {r.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Avg latency by type */}
          {avgLatencyByType.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Avg Latency (completed jobs)</p>
              <div className="flex flex-wrap gap-2">
                {avgLatencyByType.map((r) => (
                  <Badge key={r.type} variant="outline">
                    {r.type}: {r.avgLatency != null ? `${r.avgLatency}ms` : "—"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recent errors */}
          {failedRecentErrors.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent Errors</p>
              <div className="space-y-2">
                {failedRecentErrors.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {r.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.updatedAt.toISOString().replace("T", " ").slice(0, 19)}
                      </span>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-300 font-mono truncate">
                      {r.error || "No error message"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 2: Embedding Status ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Embedding Status</CardTitle>
          <CardDescription>Student profile vectorization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total Students" value={totalStudents} />
            <Metric
              label="With Embedding"
              value={withEmbedding}
              badge={{ label: "Ready", variant: "green" }}
              sub={
                totalStudents > 0
                  ? `${Math.round((withEmbedding / totalStudents) * 100)}% coverage`
                  : undefined
              }
            />
            <Metric
              label="Missing Embedding"
              value={withoutEmbedding}
              badge={
                withoutEmbedding > 30
                  ? { label: "Needs Processing", variant: "yellow" }
                  : withoutEmbedding > 0
                    ? { label: "Low", variant: "green" }
                    : { label: "All Done", variant: "green" }
              }
              sub="Needs generate_embedding job"
            />
            <Metric
              label="No Resume"
              value={noResume}
              badge={
                noResume > 0
                  ? { label: "Blocked", variant: "yellow" }
                  : { label: "All Uploaded", variant: "green" }
              }
              sub="Cannot generate embedding"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 3: API Quota Estimate ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Quota Estimate</CardTitle>
          <CardDescription>
            Based on sandbox + detailed analysis usage today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Sandbox Calls Today"
              value={sandboxToday}
              sub="~2 API calls each"
            />
            <Metric
              label="Detailed Analysis Today"
              value={detailedToday}
              sub="~3 API calls each"
            />
            <Metric
              label="Estimated API Calls"
              value={estimatedCalls}
              badge={
                quotaPercent >= 80
                  ? { label: "Quota Critical", variant: "red" }
                  : quotaPercent >= 50
                    ? { label: "Moderate", variant: "yellow" }
                    : { label: "Low Usage", variant: "green" }
              }
              sub={`${quotaPercent}% of ${dailyBudget} daily budget`}
            />
            <Metric
              label="Remaining Headroom"
              value={remaining}
              sub={`of ${dailyBudget} free calls/day`}
            />
          </div>

          {/* Quota bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Used: {estimatedCalls}</span>
              <span>Budget: {dailyBudget}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quotaPercent >= 80
                    ? "bg-red-500"
                    : quotaPercent >= 50
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 4: System Status ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
          <CardDescription>Infrastructure health checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Database Connection"
              value={dbHealthy ? `${dbLatencyMs}ms` : "DOWN"}
              badge={
                dbHealthy
                  ? dbLatencyMs < 100
                    ? { label: "Healthy", variant: "green" }
                    : { label: "Slow", variant: "yellow" }
                  : { label: "Unreachable", variant: "red" }
              }
              sub="SELECT 1 latency"
            />
            <Metric
              label="Last Cron Activity"
              value={
                lastCompletedJob
                  ? lastCompletedJob.updatedAt
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19)
                  : "Never"
              }
              badge={
                lastCompletedJob
                  ? now.getTime() - lastCompletedJob.updatedAt.getTime() <
                    60 * 60 * 1000
                    ? { label: "Recent", variant: "green" }
                    : { label: "Stale", variant: "yellow" }
                  : { label: "No Data", variant: "red" }
              }
              sub={lastCompletedJob ? `Job type: ${lastCompletedJob.type}` : undefined}
            />
            <Metric label="Drives Created" value={totalDrives} />
          </div>

          {/* Quick overview row */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="outline">
              Drives Ranked: {rankedDrives} / {totalDrives}
            </Badge>
            <Badge variant="outline">
              Embeddings: {withEmbedding} / {totalStudents}
            </Badge>
            <Badge variant="outline">Jobs Today: {completedCount + failedCount}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
