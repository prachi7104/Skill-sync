export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, jobs, users } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, isNull, sql, desc } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function AdminMasterDashboard() {
  const user = await requireRole(["admin"]);
  if (!user.collegeId) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          Admin account is not linked to a college. Dashboard metrics are unavailable.
        </div>
      </div>
    );
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ── Student Stats ──────────────────────────────────────────────────────
  const [
    totalStudents,
    embeddedStudents,
    noResumeStudents,
    avgCompleteness,
    lowCompletenessStudents,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(eq(students.collegeId, user.collegeId)),
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(and(eq(students.collegeId, user.collegeId), isNotNull(students.embedding))),
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(and(eq(students.collegeId, user.collegeId), isNull(students.resumeUrl))),
    db.select({ avg: sql<number>`round(avg(profile_completeness))::int` }).from(students).where(eq(students.collegeId, user.collegeId)),
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(and(eq(students.collegeId, user.collegeId), sql`profile_completeness < 40`)),
  ]);

  // ── Drive Stats ────────────────────────────────────────────────────────
  const [totalDrives, activeDrives, rankedDrives] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(drives).where(eq(drives.collegeId, user.collegeId)),
    db.select({ c: sql<number>`count(*)::int` }).from(drives).where(and(eq(drives.collegeId, user.collegeId), eq(drives.isActive, true))),
    db.select({ c: sql<number>`count(*)::int` }).from(drives).where(and(eq(drives.collegeId, user.collegeId), sql`ranking_status = 'completed'`)),
  ]);

  // ── Ranking Stats ─────────────────────────────────────────────────────
  const [totalRankings, avgMatchScore] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*)::int AS c
      FROM rankings r
      JOIN drives d ON d.id = r.drive_id
      WHERE d.college_id = ${user.collegeId}
    `) as unknown as Promise<Array<{ c: number }>>,
    db.execute(sql`
      SELECT ROUND(AVG(r.match_score))::int AS avg
      FROM rankings r
      JOIN drives d ON d.id = r.drive_id
      WHERE d.college_id = ${user.collegeId}
    `) as unknown as Promise<Array<{ avg: number | null }>>,
  ]);

  // ── Job Queue Health ──────────────────────────────────────────────────
  const [pendingJobs, failedJobs, completedToday] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(jobs).where(eq(jobs.status, "pending")),
    db.select({ c: sql<number>`count(*)::int` }).from(jobs).where(and(eq(jobs.status, "failed"), gte(jobs.updatedAt, twentyFourHoursAgo))),
    db.select({ c: sql<number>`count(*)::int` }).from(jobs).where(and(eq(jobs.status, "completed"), gte(jobs.updatedAt, twentyFourHoursAgo))),
  ]);

  // ── Recent Faculty Activity ────────────────────────────────────────────
  const recentDrives = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      createdAt: drives.createdAt,
      ranking_status: sql<string>`${drives}.ranking_status`,
      creatorName: users.name,
    })
    .from(drives)
    .leftJoin(users, eq(drives.createdBy, users.id))
    .where(eq(drives.collegeId, user.collegeId))
    .orderBy(desc(drives.createdAt))
    .limit(5);

  // ── Faculty Count ─────────────────────────────────────────────────────
  const [facultyCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "faculty"), eq(users.collegeId, user.collegeId)));

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete placement platform overview · Last updated {format(now, "MMM d, h:mm a")}
        </p>
      </div>

      <div className="h-px bg-border my-6" />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalStudents[0]?.c ?? 0, sub: `${noResumeStudents[0]?.c ?? 0} without resume` },
          { label: "Active Drives", value: activeDrives[0]?.c ?? 0, sub: `${totalDrives[0]?.c ?? 0} total` },
          { label: "Rankings Generated", value: totalRankings[0]?.c ?? 0, sub: `Avg score: ${avgMatchScore[0]?.avg ?? 0}%` },
          { label: "Faculty Members", value: facultyCount?.c ?? 0, sub: "Active staff" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-semibold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-border my-6" />

      {/* Two-column: AI Pipeline + Student Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Pipeline Health */}
        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">AI Pipeline Health</h2>
          {[
            { label: "Pending jobs", value: pendingJobs[0]?.c ?? 0, status: (pendingJobs[0]?.c ?? 0) > 10 ? "warn" : "ok" },
            { label: "Failed (24h)", value: failedJobs[0]?.c ?? 0, status: (failedJobs[0]?.c ?? 0) > 0 ? "error" : "ok" },
            { label: "Completed (24h)", value: completedToday[0]?.c ?? 0, status: "ok" },
            { label: "Drives ranked", value: rankedDrives[0]?.c ?? 0, status: "ok" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm font-medium ${
                row.status === "error" ? "text-red-500" :
                row.status === "warn" ? "text-yellow-500" : "text-green-500"
              }`}>{row.value}</span>
            </div>
          ))}
          <Link href="/admin/health" className="text-xs text-primary hover:underline">
            Full system health →
          </Link>
        </div>

        {/* Student Readiness */}
        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Student Readiness</h2>
          {[
            {
              label: "Embedding coverage",
              value: `${embeddedStudents[0]?.c ?? 0} / ${totalStudents[0]?.c ?? 0}`,
              pct: totalStudents[0]?.c ? Math.round((embeddedStudents[0]?.c ?? 0) / totalStudents[0].c * 100) : 0,
            },
            {
              label: "Avg profile completeness",
              value: `${avgCompleteness[0]?.avg ?? 0}%`,
              pct: avgCompleteness[0]?.avg ?? 0,
            },
            {
              label: "Low completeness (<40%)",
              value: `${lowCompletenessStudents[0]?.c ?? 0} students`,
              pct: totalStudents[0]?.c ? Math.round((lowCompletenessStudents[0]?.c ?? 0) / totalStudents[0].c * 100) : 0,
              inverted: true,
            },
          ].map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-foreground font-medium">{row.value}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.inverted ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
          <Link href="/admin/users" className="text-xs text-primary hover:underline">
            View all students →
          </Link>
        </div>
      </div>

      <div className="h-px bg-border my-6" />

      {/* Recent Drives - Simple Bordered Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Drives</h2>
          <Link href="/admin/drives" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {recentDrives.map((drive, i) => (
                <tr key={drive.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/40"}>
                  <td className="p-3">
                    <p className="font-medium text-foreground">{drive.company} — {drive.roleTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {drive.creatorName} · {formatDistanceToNow(drive.createdAt)} ago
                    </p>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      drive.ranking_status === "completed" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                      drive.ranking_status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                      "bg-secondary text-muted-foreground border-border"
                    }`}>
                      {drive.ranking_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-px bg-border my-6" />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", label: "Manage Faculty", desc: "Add or update staff accounts" },
          { href: "/admin/drives", label: "All Drives", desc: "Monitor every placement drive" },
          { href: "/admin/health", label: "System Health", desc: "Job queue and AI pipeline status" },
        ].map((action) => (
          <Link key={action.href} href={action.href}
            className="flex flex-col gap-1 rounded-md border border-border p-4 hover:bg-secondary/40 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground hover:underline">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}