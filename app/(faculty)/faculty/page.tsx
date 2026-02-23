import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PlusCircle, BarChart3, Users, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default async function FacultyDashboard() {
    const user = await requireRole(["faculty", "admin"]);

    // ── 1. Fetch all drives created by this faculty ───────────────────────────
    const myDrives = await db
        .select({
            id: drives.id,
            company: drives.company,
            roleTitle: drives.roleTitle,
            isActive: drives.isActive,
            createdAt: drives.createdAt,
        })
        .from(drives)
        .where(eq(drives.createdBy, user.id))
        .orderBy(drives.createdAt);

    // ── 2. Fetch ranking counts per drive ────────────────────────────────────
    const driveIds = myDrives.map((d) => d.id);
    const rankingCounts = driveIds.length > 0
        ? await db
            .select({
                driveId: rankings.driveId,
                count: count(rankings.id),
            })
            .from(rankings)
            .where(inArray(rankings.driveId, driveIds))
            .groupBy(rankings.driveId)
        : [];

    // Build a lookup map: driveId → rankingCount
    const rankingMap = new Map<string, number>(
        rankingCounts.map((r) => [r.driveId, r.count])
    );

    // ── 3. Compute stats ──────────────────────────────────────────────────────
    const activeDrives = myDrives.filter((d) => d.isActive).length;
    const totalStudentsRanked = [...rankingMap.values()].reduce((a, b) => a + b, 0);
    const pendingDrives = myDrives.filter((d) => !rankingMap.has(d.id) || rankingMap.get(d.id) === 0).length;
    const completedDrives = myDrives.filter((d) => (rankingMap.get(d.id) ?? 0) > 0 && !d.isActive).length;

    // ── 4. Recent 5 drives (sorted newest first) ──────────────────────────────
    const recentDrives = [...myDrives]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

    // ── 5. Status badge helper ────────────────────────────────────────────────
    function getDriveStatus(driveId: string, isActive: boolean) {
        const count = rankingMap.get(driveId) ?? 0;
        if (count === 0) return { label: "Pending", variant: "pending" as const };
        if (isActive) return { label: "Active", variant: "active" as const };
        return { label: "Closed", variant: "closed" as const };
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user.name}. Here&apos;s an overview of your placement drives.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/faculty/drives/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Drive
                    </Link>
                </Button>
            </div>

            {/* ── Stats Cards ────────────────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Drives"
                    value={activeDrives}
                    icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                    description="Currently open drives"
                />
                <StatCard
                    title="Students Ranked"
                    value={totalStudentsRanked}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    description="Across all your drives"
                />
                <StatCard
                    title="Pending Rankings"
                    value={pendingDrives}
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    description="Drives with no rankings yet"
                />
                <StatCard
                    title="Completed Drives"
                    value={completedDrives}
                    icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                    description="Closed with rankings"
                />
            </div>

            {/* ── Recent Drives Table ─────────────────────────────────────────── */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Drives</CardTitle>
                        <CardDescription>Your last 5 placement drives</CardDescription>
                    </div>
                    {myDrives.length > 5 && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/faculty/drives">View All ({myDrives.length})</Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {recentDrives.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                            <p className="text-sm font-medium text-muted-foreground">No drives yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Create your first placement drive to get started.
                            </p>
                            <Button className="mt-4" asChild>
                                <Link href="/faculty/drives/new">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Drive
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-center">Students Ranked</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDrives.map((drive) => {
                                    const status = getDriveStatus(drive.id, drive.isActive);
                                    const studentCount = rankingMap.get(drive.id) ?? 0;
                                    return (
                                        <TableRow key={drive.id}>
                                            <TableCell className="font-medium">{drive.company}</TableCell>
                                            <TableCell className="text-muted-foreground">{drive.roleTitle}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-semibold">{studentCount}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusBadge status={status.label} />
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {format(drive.createdAt, "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/faculty/drives/${drive.id}/rankings`}>
                                                        View Rankings
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
    title,
    value,
    icon,
    description,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    description: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "Pending") {
        return (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                Pending
            </Badge>
        );
    }
    if (status === "Active") {
        return (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                Active
            </Badge>
        );
    }
    return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">
            Closed
        </Badge>
    );
}
