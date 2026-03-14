// import { redirect } from "next/navigation";

// export default function AdminPage() {
//   // The real admin landing page is System Health — redirect to it.
//   // The sidebar provides navigation to All Drives and User Management.
//   redirect("/admin/health");
// }


















export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students, drives, jobs } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";
import { eq, and, gte, isNotNull, isNull, sql, desc } from "drizzle-orm";

const Metric = ({ label, value, sub, status }: any) => {
  const statusColors: any = { ok: "bg-emerald-100 text-emerald-700", warning: "bg-amber-100 text-amber-700", error: "bg-rose-100 text-rose-700", neutral: "bg-slate-100 text-slate-700" };
  return (
    <div className="flex flex-col">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <div className="flex items-baseline space-x-2">
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        {status && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[status]}`}>{status === 'ok' ? 'OK' : status === 'warning' ? 'Processing' : status}</span>}
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

export default async function AdminHealthPage() {
  await requireRole(["admin"]);

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // YOUR EXACT DB LOGIC
  const [pendingByType, failedLast24h, completedLast24h] = await Promise.all([
    db.select({ type: jobs.type, count: sql<number>`count(*)::int` }).from(jobs).where(eq(jobs.status, "pending")).groupBy(jobs.type),
    db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(and(eq(jobs.status, "failed"), gte(jobs.updatedAt, twentyFourHoursAgo))),
    db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(and(eq(jobs.status, "completed"), gte(jobs.updatedAt, twentyFourHoursAgo))),
  ]);

  const totalPending = pendingByType.reduce((sum, r) => sum + r.count, 0);
  const failedCount = failedLast24h[0]?.count ?? 0;
  const completedCount = completedLast24h[0]?.count ?? 0;
  const successRate = completedCount + failedCount > 0 ? `${Math.round((completedCount / (completedCount + failedCount)) * 100)}%` : "100%";

  const [totalStudentsResult, withEmbeddingResult, withoutEmbeddingResult, noResumeResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(students),
    db.select({ count: sql<number>`count(*)::int` }).from(students).where(isNotNull(students.embedding)),
    db.select({ count: sql<number>`count(*)::int` }).from(students).where(isNull(students.embedding)),
    db.select({ count: sql<number>`count(*)::int` }).from(students).where(isNull(students.resumeUrl)),
  ]);

  const totalStudents = totalStudentsResult[0]?.count ?? 0;
  const withEmbedding = withEmbeddingResult[0]?.count ?? 0;
  const withoutEmbedding = withoutEmbeddingResult[0]?.count ?? 0;
  const noResume = noResumeResult[0]?.count ?? 0;

  const [quotaResult] = await db.select({ sandboxToday: sql<number>`coalesce(sum(${students.sandboxUsageToday}), 0)::int`, detailedToday: sql<number>`coalesce(sum(${students.detailedAnalysisUsageToday}), 0)::int` }).from(students);
  const estimatedCalls = (quotaResult?.sandboxToday ?? 0) * 2 + (quotaResult?.detailedToday ?? 0) * 3;
  const dailyBudget = 1000;
  const quotaPercent = Math.round((estimatedCalls / dailyBudget) * 100);

  let dbLatencyMs = -1; let dbHealthy = false;
  try { const dbStart = Date.now(); await db.execute(sql`SELECT 1`); dbLatencyMs = Date.now() - dbStart; dbHealthy = true; } catch {}
  
  const [lastCompletedJob] = await db.select({ type: jobs.type, updatedAt: jobs.updatedAt }).from(jobs).where(eq(jobs.status, "completed")).orderBy(desc(jobs.updatedAt)).limit(1);
  const [drivesResult] = await Promise.all([ db.select({ count: sql<number>`count(*)::int` }).from(drives) ]);

  return (
    <div className="p-8 max-w-6xl w-full animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-1">System Health</h2>
        <p className="text-sm text-slate-500">Operational dashboard — {now.toISOString().slice(0, 19).replace("T", " ")} UTC</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Job Queue Health</h3>
          <p className="text-sm text-slate-500 mb-6">Last 24 hours</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <Metric label="Total Pending" value={totalPending} status={totalPending > 0 ? "warning" : "ok"} />
            <Metric label="Completed (24h)" value={completedCount} status="ok" />
            <Metric label="Failed (24h)" value={failedCount} status={failedCount > 0 ? "error" : "neutral"} />
            <Metric label="Success Rate" value={successRate} />
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-700 mb-2">Pending by Type</p>
            <div className="flex flex-wrap gap-2">
              {pendingByType.map(r => <span key={r.type} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-md">{r.type}: {r.count}</span>)}
              {pendingByType.length === 0 && <span className="text-xs text-slate-400">Queue is clear</span>}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Embedding Status</h3>
          <p className="text-sm text-slate-500 mb-6">Student profile vectorization</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Metric label="Total Students" value={totalStudents} />
            <Metric label="With Embedding" value={withEmbedding} status="ok" sub={`${totalStudents > 0 ? Math.round((withEmbedding/totalStudents)*100) : 0}% coverage`} />
            <Metric label="Missing Embedding" value={withoutEmbedding} status={withoutEmbedding > 0 ? "warning" : "neutral"} sub="Needs generate_embedding" />
            <Metric label="No Resume" value={noResume} status={noResume > 0 ? "error" : "ok"} sub="Cannot generate embedding" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">API Quota Estimate</h3>
          <p className="text-sm text-slate-500 mb-6">Estimated Free Tier Usage</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-4">
             <Metric label="Estimated Calls" value={estimatedCalls} status={quotaPercent > 80 ? "error" : "ok"} sub={`${quotaPercent}% of budget`} />
             <Metric label="Remaining" value={Math.max(0, dailyBudget - estimatedCalls)} sub="of 1000 daily budget" />
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className={`h-full ${quotaPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(quotaPercent, 100)}%` }}></div>
          </div>
        </section>
        
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">System Status</h3>
          <p className="text-sm text-slate-500 mb-6">Infrastructure health checks</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Metric label="Database Connection" value={dbHealthy ? `${dbLatencyMs}ms` : "DOWN"} status={dbHealthy ? "ok" : "error"} />
            <Metric label="Last Cron Activity" value={lastCompletedJob ? formatDistanceToNow(lastCompletedJob.updatedAt) + " ago" : "Never"} status="ok" sub={lastCompletedJob?.type} />
            <Metric label="Drives Created" value={drivesResult[0]?.count ?? 0} />
          </div>
        </section>
      </div>
    </div>
  );
}