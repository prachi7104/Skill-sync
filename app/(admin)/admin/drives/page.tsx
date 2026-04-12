export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import PageHeader from "@/components/shared/page-header";
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
import Pagination from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, IndianRupee, Calendar, ExternalLink, Users } from "lucide-react";
import { getCompanyColor } from "@/lib/utils/company-color";
import { TriggerRankingButton } from "@/components/faculty/trigger-ranking-button";
import { cn } from "@/lib/utils";
import { DriveActionButtons } from "./drive-action-buttons";

export default async function AdminDrivesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requireRole(["admin"]);

  if (!user.collegeId) {
    return <div className="p-8 text-destructive">Account not linked to a college.</div>;
  }

  const page = Number(searchParams?.page ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

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
      parsedJd: drives.parsedJd,
      createdAt: drives.createdAt,
      createdBy: drives.createdBy,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(drives)
    .leftJoin(users, eq(drives.createdBy, users.id))
    .where(eq(drives.collegeId, user.collegeId))
    .orderBy(desc(drives.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ total: totalDrives }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(drives)
    .where(eq(drives.collegeId, user.collegeId));

  const [{ active: activeDrivesCount }] = await db
    .select({ active: sql<number>`count(*)::int` })
    .from(drives)
    .where(and(eq(drives.collegeId, user.collegeId), eq(drives.isActive, true)));

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
  const activeDrives = activeDrivesCount;
  const rankedDrives = allDrives.filter((d) => (statsMap.get(d.id)?.count ?? 0) > 0).length; // Just approximate from this page
  const totalRanked = Array.from(statsMap.values()).reduce((s, v) => s + v.count, 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="All Placement Drives"
        description={`${totalDrives} total · ${activeDrives} active · ${rankedDrives} ranked · ${totalRanked} students ranked`}
        actions={
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
            <Link href="/admin/drives/new">
              <Plus className="h-4 w-4" /> Create Drive
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="rounded-full border-border bg-background px-3 py-1 text-sm text-foreground">
          Total Drives: {totalDrives}
        </Badge>
        <Badge variant="outline" className="rounded-full border-success/20 bg-success/10 px-3 py-1 text-sm text-success">
          Active: {activeDrives}
        </Badge>
        <Badge variant="outline" className="rounded-full border-border bg-background px-3 py-1 text-sm text-muted-foreground">
          Closed: {totalDrives - activeDrives}
        </Badge>
        <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
          Students Ranked: {totalRanked}
        </Badge>
      </div>

      {totalDrives === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">No drives created yet.</p>
          <Button asChild variant="link" className="mt-2 text-primary">
            <Link href="/admin/drives/new">Create your first drive &rarr;</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {allDrives.map((drive) => {
            const stats = statsMap.get(drive.id);
            const isProcessing = processingDriveIds.has(drive.id);

            let status: "pending" | "ranked" | "processing" | "closed" | "jd_analyzing" = "pending";
            if (!drive.isActive) status = "closed";
            else if (!drive.parsedJd) status = "jd_analyzing";
            else if (isProcessing) status = "processing";
            else if (stats && stats.count > 0) status = "ranked";

            const statusConfig = {
              ranked: { label: "RANKED", className: "text-success bg-success/10 border-success/20" },
              processing: { label: "PROCESSING", className: "text-primary bg-primary/10 border-primary/30" },
              jd_analyzing: { label: "JD ANALYZING", className: "text-warning bg-warning/10 border-warning/20" },
              pending: { label: "PENDING", className: "text-warning bg-warning/10 border-warning/20" },
              closed: { label: "CLOSED", className: "text-muted-foreground bg-background border-border" },
            };

            const config = statusConfig[status];

            return (
              <Card
                key={drive.id}
                className="group flex flex-col border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm text-foreground",
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
                        "shrink-0 rounded px-1.5 py-0 text-[10px] font-bold tracking-wider",
                        config.className
                      )}
                    >
                      {status === "processing" && (
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
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
                      <span className="font-medium text-muted-foreground">
                        {drive.creatorName ?? "Unknown"}
                      </span>
                    </span>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {drive.location && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {drive.location}
                      </div>
                    )}
                    {drive.packageOffered && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        <IndianRupee className="h-3 w-3" /> {drive.packageOffered}
                      </div>
                    )}
                    {drive.deadline && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />{" "}
                        {format(new Date(drive.deadline), "MMM d")}
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />{" "}
                      {format(new Date(drive.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 border-y border-dashed border-border py-3">
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

                <CardFooter className="flex items-center justify-between gap-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/drives/${drive.id}/rankings`}
                      className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      View Rankings <ExternalLink className="h-3 w-3" />
                    </Link>
                    <DriveActionButtons driveId={drive.id} isActive={drive.isActive} />
                  </div>
                  <TriggerRankingButton
                    driveId={drive.id}
                    initialStatus={status}
                    jdReady={!!drive.parsedJd}
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {totalDrives > pageSize && (
        <Pagination page={page} total={totalDrives} pageSize={pageSize} />
      )}
    </div>
  );
}
