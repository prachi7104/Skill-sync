export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs, seasons } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Briefcase, Users, Clock, TrendingUp, Activity, PlusCircle, ArrowRight } from "lucide-react";
import PageHeader from "@/components/shared/page-header";
import StatCard from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";

// Helpers
function getActivityLabel(type: string, status: string) {
    if (status === "completed") {
        if (type === "rank_students") return { text: "Rankings ready", color: "bg-success/10" };
        if (type === "enhance_jd") return { text: "JD enhanced", color: "bg-success/10" };
        if (type === "generate_embedding") return { text: "Embedding done", color: "bg-success/10" };
        return { text: "Job completed", color: "bg-success/10" };
    }
    if (status === "processing") return { text: "Processing...", color: "bg-primary/20 text-primary" };
    if (status === "failed") return { text: "Job failed", color: "bg-destructive/10 text-destructive" };
    return { text: "Queued", color: "bg-warning/10 text-warning" };
}



export default async function FacultyDashboardPage({
    searchParams,
}: {
    searchParams?: { seasonId?: string };
}) {
    const user = await requireRole(["faculty", "admin"]);
    const selectedSeasonId = searchParams?.seasonId ?? "all";
    const firstName = user.name?.trim().split(/\s+/)[0] || "Faculty";

    const seasonRows = user.collegeId
        ? await db.query.seasons.findMany({
            where: eq(seasons.collegeId, user.collegeId),
            columns: { id: true, name: true },
            orderBy: [sql`${seasons.createdAt} DESC`],
        })
        : [];

    // YOUR EXACT BACKEND LOGIC
    const facultyDrives = await db.select({ id: drives.id, company: drives.company, roleTitle: drives.roleTitle, isActive: drives.isActive, createdAt: drives.createdAt, seasonId: drives.seasonId })
        .from(drives)
        .where(user.collegeId ? eq(drives.collegeId, user.collegeId) : eq(drives.createdBy, user.id))
        .orderBy(sql`${drives.createdAt} DESC`);

    const filteredDrives = selectedSeasonId === "all"
        ? facultyDrives
        : facultyDrives.filter((d) => d.seasonId === selectedSeasonId);

    const driveIds = filteredDrives.map((d) => d.id);
    const activeDriveCount = filteredDrives.filter((d) => d.isActive).length;

    let totalRanked = 0; let avgScore: string | null = null; let pendingJobCount = 0; let activityFeed: any[] = [];
    const rankingCounts = new Map<string, { count: number; avgScore: number | null }>();

    if (driveIds.length > 0) {
        const [rankStatsRows, jobCountRows, activityRows, perDrive] = await Promise.all([
            db.select({ total: count(), avg: avg(rankings.matchScore) }).from(rankings).where(inArray(rankings.driveId, driveIds)),
            db.select({ c: count() }).from(jobs).where(and(inArray(jobs.status, ["pending", "processing"]), sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(driveIds.map((id) => sql`${id}`), sql`, `)}]::text[])`)),
            db.select({ id: jobs.id, type: jobs.type, status: jobs.status, updatedAt: jobs.updatedAt, payload: jobs.payload }).from(jobs).where(sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(driveIds.map((id) => sql`${id}`), sql`, `)}]::text[])`).orderBy(sql`${jobs.updatedAt} DESC`).limit(8),
            db.select({ driveId: rankings.driveId, cnt: count(), avgScore: avg(rankings.matchScore) }).from(rankings).where(inArray(rankings.driveId, driveIds)).groupBy(rankings.driveId),
        ]);

        const [rankStats] = rankStatsRows;
        const [jobCount] = jobCountRows;

        totalRanked = Number(rankStats?.total ?? 0);
        avgScore = rankStats?.avg ? Number(rankStats.avg).toFixed(1) : null;
        pendingJobCount = Number(jobCount?.c ?? 0);
        activityFeed = activityRows;

        perDrive.forEach((r) => rankingCounts.set(r.driveId, { count: Number(r.cnt), avgScore: r.avgScore ? Number(r.avgScore) : null }));
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 animate-in fade-in duration-500 sm:px-6 lg:px-8">
                        <PageHeader
                eyebrow="Faculty dashboard"
                title={`Good morning, ${firstName}`}
                description="Track live drives, queued ranking jobs, and college-wide placement activity from one neutral shell."
                actions={
                  <>
                    <div className="flex flex-wrap gap-2 mr-4">
                        <Link href="/faculty" className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center", selectedSeasonId === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground")}>
                            All seasons
                        </Link>
                        {seasonRows.map((season) => (
                            <Link
                                key={season.id}
                                href={`/faculty?seasonId=${season.id}`}
                                className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center", selectedSeasonId === season.id ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground")}
                            >
                                {season.name}
                            </Link>
                        ))}
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm shadow-sm text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Season scope</p>
                        <p className="mt-1 font-semibold text-foreground">{filteredDrives.length} drives visible</p>
                    </div>
                    <Link href="/faculty/drives/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 h-full">
                        <PlusCircle className="h-4 w-4" /> Create Drive
                    </Link>
                  </>
                }
            />

            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
                <p className="mb-1 font-semibold text-foreground">Bulk eligibility snapshot</p>
                <p>
                    Select a drive in the rankings table and query <span className="font-mono">/api/faculty/bulk-eligibility?driveId=...</span> for batch eligibility counts.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/faculty/drives" className="font-semibold text-primary hover:underline">Open drives</Link>
                    <span>•</span>
                    <span>{filteredDrives.length} drives in current season scope</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Active Drives" value={activeDriveCount} icon={Briefcase} tone="primary" />
                <StatCard label="Students Ranked" value={totalRanked} icon={Users} tone="success" />
                <StatCard label="Pending Jobs" value={pendingJobCount} icon={Clock} tone="warning" />
                <StatCard label="Avg Match Score" value={avgScore ? `${avgScore}%` : "—"} icon={TrendingUp} tone="primary" />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Activity Feed */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h4 className="mb-6 flex items-center justify-between text-sm font-bold text-foreground">
                        Recent activity <span className="text-[10px] font-black tracking-[0.24em] text-muted-foreground">LIVE FEED</span>
                    </h4>
                    <div className="space-y-6">
                        {activityFeed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                                <Activity className="mb-2 h-8 w-8" />
                                <p className="text-xs">No activity yet</p>
                            </div>
                        ) : activityFeed.map((item) => {
                            const label = getActivityLabel(item.type, item.status);
                            return (
                                <div key={item.id} className="flex space-x-4">
                                    <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", label.color.split(" ")[0])} />
                                    <div>
                                        <p className={`text-xs font-black uppercase ${label.color.split(" ")[1] || "text-muted-foreground"}`}>{label.text}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{item.type.replace("_", " ")} • {formatDistanceToNow(item.updatedAt)} ago</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Table */}
                <section className="lg:col-span-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border p-6">
                        <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">Recent drives</h4>
                        <Link href="/faculty/drives" className="flex items-center text-xs font-bold text-primary transition-colors hover:underline">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="p-4 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Details</th>
                                    <th className="p-4 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                                    <th className="p-4 text-right text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Analytics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredDrives.slice(0, 5).map((drive) => {
                                    const analytics = rankingCounts.get(drive.id);
                                    return (
                                        <tr key={drive.id} className="transition-colors hover:bg-muted/30">
                                            <td className="p-4">
                                                <Link href={`/faculty/drives/${drive.id}/rankings`} className="flex items-center space-x-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold uppercase text-primary">{drive.company.slice(0,2)}</div>
                                                    <div><p className="text-sm font-bold text-foreground">{drive.company}</p><p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">{drive.roleTitle}</p></div>
                                                </Link>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={cn("rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border", drive.isActive ? "border-success/20 bg-success/10 text-success" : "border-border bg-background text-muted-foreground")}>
                                                    {drive.isActive ? "Active" : "Closed"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className="text-sm font-bold text-foreground">{analytics?.count ?? 0} <span className="text-[10px] font-medium tracking-wide text-muted-foreground">RANKED</span></p>
                                                {analytics?.avgScore && <p className="mt-1 text-[10px] text-success">{analytics.avgScore.toFixed(1)}% Avg</p>}
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