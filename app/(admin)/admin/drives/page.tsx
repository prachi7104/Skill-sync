export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, users, jobs } from "@/lib/db/schema";
import { count, avg, sql, and, inArray, desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, IndianRupee, Calendar, ExternalLink, Users } from "lucide-react";
import { getCompanyColor } from "@/lib/utils/company-color";
import { TriggerRankingButton } from "@/components/faculty/trigger-ranking-button";
import { cn } from "@/lib/utils";

export default async function AdminDrivesPage() {
  await requireRole(["admin"]);

  // ── STEP 1: All drives + creator name ──────────────────────────────────────
  const allDrives = await db
    .select({
      id: drives.id,
      company: drives.company,
      roleTitle: drives.roleTitle,
      location: drives.location,
      packageOffered: drives.packageOffered,
      deadline: drives.deadline,
      isActive: drives.isActive,
      createdAt: drives.createdAt,
      createdBy: drives.createdBy,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(drives)
    .leftJoin(users, eq(drives.createdBy, users.id))
    .orderBy(desc(drives.createdAt));

  const driveIds = allDrives.map((d) => d.id);

  // ── STEP 2: Rankings stats per drive ───────────────────────────────────────
  let statsMap = new Map<
    string,
    { count: number; avgScore: number | null; maxScore: number | null }
  >();
  if (driveIds.length > 0) {
    const driveStats = await db
      .select({
        driveId: rankings.driveId,
        count: count(),
        avgScore: avg(rankings.matchScore),
        maxScore: sql<number>`MAX(${rankings.matchScore})`,
      })
      .from(rankings)
      .where(inArray(rankings.driveId, driveIds))
      .groupBy(rankings.driveId);

    statsMap = new Map(
      driveStats.map((s) => [
        s.driveId,
        {
          count: Number(s.count),
          avgScore: s.avgScore ? Number(s.avgScore) : null,
          maxScore: s.maxScore ? Number(s.maxScore) : null,
        },
      ])
    );
  }

  // ── STEP 3: Processing jobs ────────────────────────────────────────────────
  const activeJobs =
    driveIds.length > 0
      ? await db
          .select({ payload: jobs.payload })
          .from(jobs)
          .where(
            and(
              inArray(jobs.status, ["pending", "processing"]),
              inArray(jobs.type, ["rank_students"])
            )
          )
      : [];

  const processingDriveIds = new Set(
    activeJobs
      .map((j) => (j.payload as { driveId?: string })?.driveId)
      .filter(Boolean) as string[]
  );

  // ── STEP 4: Summary counts ─────────────────────────────────────────────────
  const totalDrives = allDrives.length;
  const activeDrives = allDrives.filter((d) => d.isActive).length;
  const rankedDrives = allDrives.filter((d) => (statsMap.get(d.id)?.count ?? 0) > 0).length;
  const totalRanked = Array.from(statsMap.values()).reduce((s, v) => s + v.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Placement Drives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDrives} total · {activeDrives} active · {rankedDrives} ranked ·{" "}
            {totalRanked} students ranked
          </p>
        </div>
        {/* Admin can create drives — reuses the faculty create page since admin has faculty-level access */}
        <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Link href="/faculty/drives/new">
            <Plus className="h-4 w-4" /> Create Drive
          </Link>
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total Drives: {totalDrives}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 text-emerald-700 border-emerald-200 bg-emerald-50">
          Active: {activeDrives}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 text-gray-500 border-gray-200">
          Closed: {totalDrives - activeDrives}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 text-indigo-700 border-indigo-200 bg-indigo-50">
          Students Ranked: {totalRanked}
        </Badge>
      </div>

      {totalDrives === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No drives created yet.</p>
          <Button asChild variant="link" className="text-indigo-600 mt-2">
            <Link href="/faculty/drives/new">Create your first drive &rarr;</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allDrives.map((drive) => {
            const stats = statsMap.get(drive.id);
            const isProcessing = processingDriveIds.has(drive.id);

            let status: "pending" | "ranked" | "processing" | "closed" = "pending";
            if (!drive.isActive) status = "closed";
            else if (isProcessing) status = "processing";
            else if (stats && stats.count > 0) status = "ranked";

            const statusConfig = {
              ranked: { label: "RANKED", className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              processing: { label: "PROCESSING", className: "text-indigo-600 bg-indigo-50 border-indigo-200" },
              pending: { label: "PENDING", className: "text-amber-600 bg-amber-50 border-amber-200" },
              closed: { label: "CLOSED", className: "text-gray-500 bg-gray-50 border-gray-200" },
            };

            const config = statusConfig[status];

            return (
              <Card
                key={drive.id}
                className="group hover:ring-1 hover:ring-indigo-500 transition-all shadow-sm flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm",
                          getCompanyColor(drive.company)
                        )}
                      >
                        {drive.company.slice(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base line-clamp-1">{drive.company}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">
                          {drive.roleTitle}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded px-1.5 py-0 text-[10px] font-bold tracking-wider shrink-0",
                        config.className
                      )}
                    >
                      {status === "processing" && (
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                        </span>
                      )}
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4 flex-1">
                  {/* Creator badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      Created by{" "}
                      <span className="font-medium text-gray-700">
                        {drive.creatorName ?? "Unknown"}
                      </span>
                    </span>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {drive.location && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {drive.location}
                      </div>
                    )}
                    {drive.packageOffered && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border text-[10px] text-muted-foreground">
                        <IndianRupee className="h-3 w-3" /> {drive.packageOffered}
                      </div>
                    )}
                    {drive.deadline && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />{" "}
                        {format(new Date(drive.deadline), "MMM d")}
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />{" "}
                      {format(new Date(drive.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-dashed">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        Ranked
                      </p>
                      <p className="text-lg font-mono font-bold">{stats ? stats.count : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        Avg %
                      </p>
                      <p className="text-lg font-mono font-bold">
                        {stats?.avgScore ? stats.avgScore.toFixed(0) : "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        Top %
                      </p>
                      <p className="text-lg font-mono font-bold">
                        {stats?.maxScore ? stats.maxScore.toFixed(0) : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex items-center justify-between gap-4">
                  <Link
                    href={`/faculty/drives/${drive.id}/rankings`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View Rankings <ExternalLink className="h-3 w-3" />
                  </Link>
                  <TriggerRankingButton driveId={drive.id} initialStatus={status} />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
