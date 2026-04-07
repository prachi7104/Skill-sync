import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs, seasons } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray } from "drizzle-orm";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { Briefcase, Users, Clock, TrendingUp, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Helpers
function getActivityLabel(type: string, status: string) {
    if (status === "completed") {
        if (type === "rank_students") return { text: "Rankings ready", color: "text-emerald-600" };
        if (type === "enhance_jd") return { text: "JD enhanced", color: "text-emerald-600" };
        if (type === "generate_embedding") return { text: "Embedding done", color: "text-emerald-600" };
        return { text: "Job completed", color: "text-emerald-600" };
    }
    if (status === "processing") return { text: "Processing...", color: "text-blue-600" };
    if (status === "failed") return { text: "Job failed", color: "text-destructive" };
    return { text: "Queued", color: "text-amber-600" };
}

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </div>
    <div className="text-2xl font-semibold text-foreground">
      {value}
    </div>
  </div>
);

export default async function FacultyDashboardPage({
    searchParams,
}: {
    searchParams?: { seasonId?: string; error?: string };
}) {
    const user = await requireRole(["faculty", "admin"]);
    const selectedSeasonId = searchParams?.seasonId ?? "all";
    const showPermissionWarning = searchParams?.error === "no_permission";
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
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Good morning, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(), "EEEE, MMMM d")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 max-w-[420px] overflow-x-auto">
                        <Link
                            href="/faculty"
                            className={`rounded-md px-3 py-1.5 text-xs font-medium ${selectedSeasonId === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                        >
                            All seasons
                        </Link>
                        {seasonRows.map((season) => (
                            <Link
                                key={season.id}
                                href={`/faculty?seasonId=${season.id}`}
                                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${selectedSeasonId === season.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                            >
                                {season.name}
                            </Link>
                        ))}
                    </div>
                    <Link href="/faculty/drives/new">
                        <Button size="sm" className="h-8 gap-2">
                            <PlusCircle className="w-4 h-4" />
                            Create Drive
                        </Button>
                    </Link>
                </div>
            </header>

            {showPermissionWarning && (
                <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-medium">Permission required</p>
                    <p className="mt-1">You do not currently have access to create drives. Contact your admin to enable drive management permissions.</p>
                </div>
            )}

            <div className="h-px w-full bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard label="Active Drives" value={activeDriveCount} icon={Briefcase} />
                <StatCard label="Total Ranked" value={totalRanked} icon={Users} />
                <StatCard label="Pending Jobs" value={pendingJobCount} icon={Clock} />
                <StatCard label="Avg Match Score" value={avgScore ? `${avgScore}%` : "—"} icon={TrendingUp} />
            </div>

            <div className="h-px w-full bg-border" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <section>
                    <h2 className="text-sm font-medium text-foreground mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {activityFeed.length === 0 ? (
                            <EmptyState 
                                message="No recent activity" 
                                description="When background jobs like ranking students or enhancing JDs are triggered, they will appear here."
                            />
                        ) : activityFeed.map((item) => {
                            const label = getActivityLabel(item.type, item.status);
                            return (
                                <div key={item.id} className="flex flex-col gap-1">
                                    <p className={`text-sm font-medium ${label.color}`}>{label.text}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.type.replace("_", " ")} • {formatDistanceToNow(item.updatedAt)} ago
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Recent Drives List */}
                <section className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-medium text-foreground">Recent Drives</h2>
                        <Link href="/faculty/drives" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 group transition-colors">
                            View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                {filteredDrives.slice(0, 5).map((drive, index) => {
                                    const analytics = rankingCounts.get(drive.id);
                                    return (
                                        <tr key={drive.id} className={`border-b border-border hover:bg-accent/50 transition-colors last:border-0 ${index % 2 === 1 ? 'bg-secondary/40' : ''}`}>
                                            <td className="px-4 py-3">
                                                <Link href={`/faculty/drives/${drive.id}/rankings`} className="block">
                                                    <p className="text-sm font-medium text-foreground">{drive.company}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{drive.roleTitle}</p>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {drive.isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="text-sm font-medium text-foreground">{analytics?.count ?? 0} <span className="text-muted-foreground font-normal">ranked</span></p>
                                                {analytics?.avgScore && <p className="text-xs text-muted-foreground mt-0.5">{analytics.avgScore.toFixed(1)}% avg</p>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredDrives.length === 0 && (
                            <div className="p-8">
                                <EmptyState 
                                    message="No drives found" 
                                    description="Try selecting a different season or create your first recruitment drive."
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}