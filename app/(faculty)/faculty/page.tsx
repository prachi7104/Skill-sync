export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Briefcase, Users, Clock, TrendingUp, Activity, PlusCircle, ArrowRight } from "lucide-react";

// Helpers
function getActivityLabel(type: string, status: string) {
    if (status === "completed") {
        if (type === "rank_students") return { text: "Rankings ready", color: "bg-emerald-400" };
        if (type === "enhance_jd") return { text: "JD enhanced", color: "bg-emerald-400" };
        if (type === "generate_embedding") return { text: "Embedding done", color: "bg-emerald-400" };
        return { text: "Job completed", color: "bg-emerald-400" };
    }
    if (status === "processing") return { text: "Processing...", color: "bg-indigo-500/20 text-indigo-400" };
    if (status === "failed") return { text: "Job failed", color: "bg-rose-500/20 text-rose-400" };
    return { text: "Queued", color: "bg-amber-500/20 text-amber-400" };
}

const StatCard = ({ label, value, icon: Icon, color = "indigo" }: any) => (
  <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 shadow-sm flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      {Icon && <Icon className={`w-5 h-5 text-${color}-400`} />}
    </div>
    <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
  </div>
);

export default async function FacultyDashboardPage() {
    const user = await requireRole(["faculty", "admin"]);

    // YOUR EXACT BACKEND LOGIC
    const facultyDrives = await db.select({ id: drives.id, company: drives.company, roleTitle: drives.roleTitle, isActive: drives.isActive, createdAt: drives.createdAt })
        .from(drives).where(eq(drives.createdBy, user.id)).orderBy(sql`${drives.createdAt} DESC`);

    const driveIds = facultyDrives.map((d) => d.id);
    const activeDriveCount = facultyDrives.filter((d) => d.isActive).length;

    let totalRanked = 0; let avgScore: string | null = null; let pendingJobCount = 0; let activityFeed: any[] = [];
    const rankingCounts = new Map<string, { count: number; avgScore: number | null }>();

    if (driveIds.length > 0) {
        const [rankStats] = await db.select({ total: count(), avg: avg(rankings.matchScore) }).from(rankings).where(inArray(rankings.driveId, driveIds));
        totalRanked = Number(rankStats?.total ?? 0);
        avgScore = rankStats?.avg ? Number(rankStats.avg).toFixed(1) : null;

        const [jobCount] = await db.select({ c: count() }).from(jobs).where(and(inArray(jobs.status, ["pending", "processing"]), sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(driveIds.map((id) => sql`${id}`), sql`, `)}]::text[])`));
        pendingJobCount = Number(jobCount?.c ?? 0);

        activityFeed = await db.select({ id: jobs.id, type: jobs.type, status: jobs.status, updatedAt: jobs.updatedAt, payload: jobs.payload }).from(jobs).where(sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(driveIds.map((id) => sql`${id}`), sql`, `)}]::text[])`).orderBy(sql`${jobs.updatedAt} DESC`).limit(8);
        const perDrive = await db.select({ driveId: rankings.driveId, cnt: count(), avgScore: avg(rankings.matchScore) }).from(rankings).where(inArray(rankings.driveId, driveIds)).groupBy(rankings.driveId);
        perDrive.forEach((r) => rankingCounts.set(r.driveId, { count: Number(r.cnt), avgScore: r.avgScore ? Number(r.avgScore) : null }));
    }

    return (
        <div className="p-8 max-w-7xl w-full animate-in fade-in duration-500 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Good morning, {user.name.split(" ")[0]}</h1>
                    <p className="text-sm text-slate-500">Faculty Dashboard — UPES Placement Portal</p>
                </div>
                <Link href="/faculty/drives/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-sm">
                    <PlusCircle className="w-4 h-4" /><span>Create Drive</span>
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Active Drives" value={activeDriveCount} icon={Briefcase} color="indigo" />
                <StatCard label="Students Ranked" value={totalRanked} icon={Users} color="emerald" />
                <StatCard label="Pending Jobs" value={pendingJobCount} icon={Clock} color="amber" />
                <StatCard label="Avg Match Score" value={avgScore ? `${avgScore}%` : "—"} icon={TrendingUp} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <section className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 shadow-sm">
                    <h4 className="font-bold text-white mb-6 flex items-center justify-between text-sm">
                        RECENT ACTIVITY <span className="text-[10px] text-slate-500 font-bold tracking-wider">LIVE FEED</span>
                    </h4>
                    <div className="space-y-6">
                        {activityFeed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center opacity-40 py-8"><Activity className="w-8 h-8 mb-2"/><p className="text-xs">No activity yet</p></div>
                        ) : activityFeed.map((item) => {
                            const label = getActivityLabel(item.type, item.status);
                            return (
                                <div key={item.id} className="flex space-x-4">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${label.color.split(" ")[0]}`} />
                                    <div>
                                        <p className={`text-xs font-black uppercase ${label.color.split(" ")[1] || "text-slate-300"}`}>{label.text}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{item.type.replace("_", " ")} • {formatDistanceToNow(item.updatedAt)} ago</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Table */}
                <section className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider">Recent Drives</h4>
                        <Link href="/faculty/drives" className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors flex items-center">View all <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50"><th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Analytics</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {facultyDrives.slice(0, 5).map((drive) => {
                                    const analytics = rankingCounts.get(drive.id);
                                    return (
                                        <tr key={drive.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <Link href={`/faculty/drives/${drive.id}/rankings`} className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">{drive.company.slice(0,2)}</div>
                                                    <div><p className="text-sm font-bold text-white">{drive.company}</p><p className="text-[10px] font-medium text-slate-500 uppercase mt-0.5">{drive.roleTitle}</p></div>
                                                </Link>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${drive.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                    {drive.isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className="text-sm font-bold text-white">{analytics?.count ?? 0} <span className="text-[10px] text-slate-500 font-medium tracking-wide">RANKED</span></p>
                                                {analytics?.avgScore && <p className="text-[10px] text-emerald-400 mt-1">{analytics.avgScore.toFixed(1)}% Avg</p>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}