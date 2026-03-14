export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Clock, TrendingUp, Activity, Plus } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCompanyColor(name: string): string {
    const colors = [
        "bg-indigo-500",
        "bg-violet-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-rose-500",
        "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getDriveStatus(
    driveId: string,
    isActive: boolean,
    rankingCounts: Map<string, { count: number; avgScore: number | null }>
): { label: string; className: string } {
    const rc = rankingCounts.get(driveId);
    if (rc && rc.count > 0 && isActive) {
        return {
            label: "RANKED",
            className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        };
    }
    if (rc && rc.count > 0 && !isActive) {
        return {
            label: "CLOSED",
            className: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
        };
    }
    if (!isActive) {
        return {
            label: "CLOSED",
            className: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
        };
    }
    return {
        label: "PENDING",
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
}

function getActivityLabel(type: string, status: string): { text: string; color: string } {
    if (status === "completed") {
        if (type === "rank_students") return { text: "Rankings ready", color: "bg-emerald-400" };
        if (type === "enhance_jd") return { text: "JD enhanced", color: "bg-emerald-400" };
        if (type === "generate_embedding") return { text: "Embedding done", color: "bg-emerald-400" };
        return { text: "Job completed", color: "bg-emerald-400" };
    }
    if (status === "processing") return { text: "Processing...", color: "bg-indigo-400" };
    if (status === "failed") return { text: "Job failed", color: "bg-rose-400" };
    return { text: "Queued", color: "bg-amber-400" };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function FacultyDashboardPage() {
    const user = await requireRole(["faculty", "admin"]);

    // STEP 1 — Get faculty's drives
    const facultyDrives = await db
        .select({
            id: drives.id,
            company: drives.company,
            roleTitle: drives.roleTitle,
            isActive: drives.isActive,
            createdAt: drives.createdAt,
        })
        .from(drives)
        .where(eq(drives.createdBy, user.id))
        .orderBy(sql`${drives.createdAt} DESC`);

    const driveIds = facultyDrives.map((d) => d.id);

    // EMPTY STATE check
    if (facultyDrives.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="bg-muted p-6 rounded-full">
                    <Briefcase className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No placement drives yet</h2>
                    <p className="text-muted-foreground text-sm max-w-[280px]">
                        Create your first drive to start ranking students.
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/faculty/drives/new">
                        <Plus className="h-4 w-4" />
                        Create Drive
                    </Link>
                </Button>
            </div>
        );
    }

    // STEP 2 — Stat: active drive count
    const activeDriveCount = facultyDrives.filter((d) => d.isActive).length;

    // STEP 3 — Stat: total students ranked
    let totalRanked = 0;
    let avgScore: string | null = null;
    if (driveIds.length > 0) {
        const [rankStats] = await db
            .select({
                total: count(),
                avg: avg(rankings.matchScore),
            })
            .from(rankings)
            .where(inArray(rankings.driveId, driveIds));
        totalRanked = Number(rankStats?.total ?? 0);
        avgScore = rankStats?.avg ? Number(rankStats.avg).toFixed(1) : null;
    }

    // STEP 4 — Stat: pending jobs
    let pendingJobCount = 0;
    if (driveIds.length > 0) {
        const [jobCount] = await db
            .select({ c: count() })
            .from(jobs)
            .where(
                and(
                    inArray(jobs.status, ["pending", "processing"]),
                    sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(
                        driveIds.map((id) => sql`${id}`),
                        sql`, `
                    )}]::text[])`
                )
            );
        pendingJobCount = Number(jobCount?.c ?? 0);
    }

    // STEP 5 — Activity feed
    let activityFeed: { id: string; type: string; status: string; updatedAt: Date; payload: unknown }[] = [];
    if (driveIds.length > 0) {
        activityFeed = await db
            .select({
                id: jobs.id,
                type: jobs.type,
                status: jobs.status,
                updatedAt: jobs.updatedAt,
                payload: jobs.payload,
            })
            .from(jobs)
            .where(
                sql`${jobs.payload}->>'driveId' = ANY(ARRAY[${sql.join(
                    driveIds.map((id) => sql`${id}`),
                    sql`, `
                )}]::text[])`
            )
            .orderBy(sql`${jobs.updatedAt} DESC`)
            .limit(8);
    }

    // STEP 6 — Per-drive ranking counts
    const rankingCounts = new Map<string, { count: number; avgScore: number | null }>();
    if (driveIds.length > 0) {
        const perDrive = await db
            .select({
                driveId: rankings.driveId,
                cnt: count(),
                avgScore: avg(rankings.matchScore),
            })
            .from(rankings)
            .where(inArray(rankings.driveId, driveIds))
            .groupBy(rankings.driveId);

        perDrive.forEach((r) =>
            rankingCounts.set(r.driveId, {
                count: Number(r.cnt),
                avgScore: r.avgScore ? Number(r.avgScore) : null,
            })
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Good morning, {user.name.split(" ")[0]}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Faculty Dashboard &mdash; UPES Placement Portal
                    </p>
                </div>
                <Button asChild size="sm" className="gap-2">
                    <Link href="/faculty/drives/new">
                        <Plus className="h-4 w-4" />
                        Create Drive
                    </Link>
                </Button>
            </div>

            {/* ── Stats Cards ────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Drives", value: activeDriveCount, icon: Briefcase, color: "border-t-indigo-500" },
                    { label: "Students Ranked", value: totalRanked, icon: Users, color: "border-t-emerald-500" },
                    { label: "Pending Jobs", value: pendingJobCount, icon: Clock, color: "border-t-amber-500" },
                    { label: "Avg Match Score", value: avgScore ? `${avgScore}%` : "—", icon: TrendingUp, color: "border-t-violet-500" },
                ].map((card) => (
                    <Card key={card.label} className={`border-t-2 ${card.color} shadow-sm rounded-none`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {card.label}
                            </CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-mono font-semibold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Main Grid ──────────────────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Activity Feed */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        Recent Activity
                    </h3>
                    <div className="space-y-4 bg-white border rounded-lg p-4 shadow-sm min-h-[400px]">
                        {activityFeed.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <Activity className="h-8 w-8 mb-2" />
                                <p className="text-xs">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {activityFeed.map((item) => {
                                    const label = getActivityLabel(item.type, item.status);
                                    return (
                                        <div key={item.id} className="flex gap-3 group">
                                            <div className="relative mt-1">
                                                <div className={`h-2.5 w-2.5 rounded-full ${label.color} shrink-0 ring-4 ring-white relative z-10`} />
                                                <div className="absolute left-1.25 top-2.5 w-[1px] h-[calc(100%+20px)] bg-gray-100 group-last:hidden" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium leading-none">{label.text}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                                                    <span>{item.type.replace("_", " ")}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(item.updatedAt)} ago</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Drives Table */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            Recent Placement Drives
                        </h3>
                        <Link href="/faculty/drives" className="text-xs text-indigo-600 hover:underline font-medium">
                            View all drives &rarr;
                        </Link>
                    </div>

                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <th className="px-5 py-3 font-semibold">Drive Details</th>
                                        <th className="px-5 py-3 font-semibold text-center">Status</th>
                                        <th className="px-5 py-3 font-semibold text-right">Analytics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {facultyDrives.slice(0, 5).map((drive) => {
                                        const status = getDriveStatus(drive.id, drive.isActive, rankingCounts);
                                        const analytics = rankingCounts.get(drive.id);
                                        return (
                                            <tr
                                                key={drive.id}
                                                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                                data-href={`/faculty/drives/${drive.id}/rankings`}
                                            >
                                                <td className="px-5 py-4">
                                                    <Link href={`/faculty/drives/${drive.id}/rankings`} className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase ${getCompanyColor(drive.company)}`}>
                                                            {drive.company.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold leading-none">{drive.company}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{drive.roleTitle}</p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <Badge className={`rounded-none text-[9px] font-bold tracking-widest px-1.5 py-0 ${status.className}`}>
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="inline-block text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <span className="text-sm font-mono font-bold">{analytics?.count ?? 0}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Ranked</span>
                                                        </div>
                                                        {analytics?.avgScore && (
                                                            <p className="text-[10px] text-emerald-600 font-medium">
                                                                Avg Match: {analytics.avgScore.toFixed(1)}%
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
