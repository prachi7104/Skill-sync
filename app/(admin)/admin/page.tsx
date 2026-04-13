export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, jobs, users } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, sql, desc } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, Briefcase, TrendingUp } from "lucide-react";
import PageHeader from "@/components/shared/page-header";
import StatCard from "@/components/shared/stat-card";

export default async function AdminMasterDashboard() {
  const user = await requireRole(["admin"]);
  if (!user.collegeId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-6 text-warning-foreground">
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
    avgCompleteness,
    lowCompletenessStudents,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(eq(students.collegeId, user.collegeId)),
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(and(eq(students.collegeId, user.collegeId), isNotNull(students.embedding))),
    db.select({ avg: sql<number>`round(avg(profile_completeness))::int` }).from(students).where(eq(students.collegeId, user.collegeId)),
    db.select({ c: sql<number>`count(*)::int` }).from(students).where(and(eq(students.collegeId, user.collegeId), sql`profile_completeness < 40`)),
  ]);

  // ── Drive Stats ────────────────────────────────────────────────────────
  const [activeDrives, rankedDrives] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(drives).where(and(eq(drives.collegeId, user.collegeId), eq(drives.isActive, true))),
    db.select({ c: sql<number>`count(*)::int` }).from(drives).where(and(eq(drives.collegeId, user.collegeId), sql`ranking_status = 'completed'`)),
  ]);

  // ── Ranking Stats ─────────────────────────────────────────────────────
  const [totalRankings] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*)::int AS c
      FROM rankings r
      JOIN drives d ON d.id = r.drive_id
      WHERE d.college_id = ${user.collegeId}
    `) as unknown as Promise<Array<{ c: number }>>,
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      
      {/* Header */}
            <PageHeader
        eyebrow={<><Sparkles className="h-3.5 w-3.5" /> Admin control plane</>}
        title="Master Dashboard"
        description={`Complete placement platform overview. Last updated ${format(now, "MMM d, h:mm a")}`}
        actions={
          <>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 shadow-sm text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">College scope</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{totalStudents[0]?.c ?? 0} {Number(totalStudents[0]?.c ?? 0) === 1 ? "student" : "students"}</p>
            </div>
            <Link href="/admin/drives" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 h-full">
              View drives <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label: "Total Students", value: totalStudents[0]?.c ?? 0, icon: Users, tone: "primary" },
          { label: "Active Drives", value: activeDrives[0]?.c ?? 0, icon: Briefcase, tone: "success" },
          { label: "Rankings Generated", value: totalRankings[0]?.c ?? 0, icon: TrendingUp, tone: "primary" },
          { label: "Faculty Members", value: facultyCount?.c ?? 0, icon: Users, tone: "warning" },
        ].map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone as "primary"|"success"|"warning"|"destructive"} />
        ))}
      </div>

      {/* Two-column: AI Pipeline + Student Readiness */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* AI Pipeline Health */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">AI pipeline health</h2>
            <Link href="/admin/health" className="text-xs font-bold text-primary hover:underline">Full system health</Link>
          </div>
          {[
            { label: "Pending jobs", value: pendingJobs[0]?.c ?? 0, status: (pendingJobs[0]?.c ?? 0) > 10 ? "warn" : "ok" },
            { label: "Failed (24h)", value: failedJobs[0]?.c ?? 0, status: (failedJobs[0]?.c ?? 0) > 0 ? "error" : "ok" },
            { label: "Completed (24h)", value: completedToday[0]?.c ?? 0, status: "ok" },
            { label: "Drives ranked", value: rankedDrives[0]?.c ?? 0, status: "ok" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm font-bold ${
                row.status === "error" ? "text-destructive" :
                row.status === "warn" ? "text-warning" : "text-success"
              }`}>{row.value}</span>
            </div>
          ))}
        </section>

        {/* Student Readiness */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">Student readiness</h2>
            <Link href="/admin/users" className="text-xs font-bold text-primary hover:underline">View students</Link>
          </div>
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
                <span className="text-foreground font-bold">{row.value}</span>
              </div>
              <div className="h-1.5 bg-card rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.inverted ? "bg-destructive/10" : "bg-primary"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Recent Drives */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">Recent drives</h2>
          <Link href="/admin/drives" className="text-xs font-bold text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {recentDrives.map((drive) => (
            <div key={drive.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
              <div>
                <p className="font-bold text-foreground text-sm">{drive.company} — {drive.roleTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {drive.creatorName} · {formatDistanceToNow(drive.createdAt)} ago
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                drive.ranking_status === "completed" ? "bg-success/10 text-success" :
                drive.ranking_status === "processing" ? "bg-primary/15 text-primary" :
                "bg-card text-muted-foreground"
              }`}>
                {drive.ranking_status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { href: "/admin/users", label: "Manage Faculty", desc: "Add or update staff accounts", emoji: "👥" },
          { href: "/admin/drives", label: "All Drives", desc: "Monitor every placement drive", emoji: "🎯" },
          { href: "/admin/health", label: "System Health", desc: "Job queue and AI pipeline status", emoji: "⚡" },
        ].map((action) => (
          <Link key={action.href} href={action.href}
            className="group rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
          >
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{action.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}