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
      <div className="max-w-4xl mx-auto p-8 md:p-10">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200">
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
    <div className="max-w-7xl mx-auto p-8 md:p-10 pb-32 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Master Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Complete placement platform overview · Last updated {format(now, "MMM d, h:mm a")}
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalStudents[0]?.c ?? 0, sub: `${noResumeStudents[0]?.c ?? 0} without resume`, color: "indigo" },
          { label: "Active Drives", value: activeDrives[0]?.c ?? 0, sub: `${totalDrives[0]?.c ?? 0} total`, color: "emerald" },
          { label: "Rankings Generated", value: totalRankings[0]?.c ?? 0, sub: `Avg score: ${avgMatchScore[0]?.avg ?? 0}%`, color: "blue" },
          { label: "Faculty Members", value: facultyCount?.c ?? 0, sub: "Active staff", color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 rounded-2xl border border-white/5 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{stat.label}</p>
            <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column: AI Pipeline + Student Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Pipeline Health */}
        <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="font-bold text-white">AI Pipeline Health</h2>
          {[
            { label: "Pending jobs", value: pendingJobs[0]?.c ?? 0, status: (pendingJobs[0]?.c ?? 0) > 10 ? "warn" : "ok" },
            { label: "Failed (24h)", value: failedJobs[0]?.c ?? 0, status: (failedJobs[0]?.c ?? 0) > 0 ? "error" : "ok" },
            { label: "Completed (24h)", value: completedToday[0]?.c ?? 0, status: "ok" },
            { label: "Drives ranked", value: rankedDrives[0]?.c ?? 0, status: "ok" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className={`text-sm font-bold ${
                row.status === "error" ? "text-rose-400" :
                row.status === "warn" ? "text-amber-400" : "text-emerald-400"
              }`}>{row.value}</span>
            </div>
          ))}
          <Link href="/admin/health" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
            Full system health →
          </Link>
        </div>

        {/* Student Readiness */}
        <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="font-bold text-white">Student Readiness</h2>
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
                <span className="text-slate-400">{row.label}</span>
                <span className="text-white font-bold">{row.value}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.inverted ? "bg-rose-500" : "bg-indigo-500"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
          <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
            View all students →
          </Link>
        </div>
      </div>

      {/* Recent Drives */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white">Recent Drives</h2>
          <Link href="/admin/drives" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentDrives.map((drive) => (
            <div key={drive.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5">
              <div>
                <p className="font-bold text-white text-sm">{drive.company} — {drive.roleTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  by {drive.creatorName} · {formatDistanceToNow(drive.createdAt)} ago
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                drive.ranking_status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                drive.ranking_status === "processing" ? "bg-indigo-500/15 text-indigo-400" :
                "bg-slate-800 text-slate-500"
              }`}>
                {drive.ranking_status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", label: "Manage Faculty", desc: "Add or update staff accounts", emoji: "👥" },
          { href: "/admin/drives", label: "All Drives", desc: "Monitor every placement drive", emoji: "🎯" },
          { href: "/admin/health", label: "System Health", desc: "Job queue and AI pipeline status", emoji: "⚡" },
        ].map((action) => (
          <Link key={action.href} href={action.href}
            className="bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all group"
          >
            <div className="text-2xl mb-3">{action.emoji}</div>
            <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">{action.label}</p>
            <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}