export const dynamic = "force-dynamic";

import { hasComponent, requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray, desc } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, IndianRupee, Calendar, ExternalLink } from "lucide-react";
import { getCompanyColor } from "@/lib/utils/company-color";
import { DriveConflictsButton } from "@/components/faculty/drive-conflicts-button";
import Pagination from "@/components/shared/pagination";
import { cn } from "@/lib/utils";
import { FolderOpen, Sparkles } from "lucide-react";

export default async function FacultyDrivesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requireRole(["faculty", "admin"]);
  const canCreateDrive = await hasComponent("drive_management");

  const pageValue = Number(searchParams?.page ?? 1);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  if (!user.collegeId) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Drives</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Account is not linked to a college yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch all drives for this college
  const facultyDrives = await db
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
    })
    .from(drives)
    .where(eq(drives.collegeId, user.collegeId!))
    .orderBy(desc(drives.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ total: totalDrives }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(drives)
    .where(eq(drives.collegeId, user.collegeId!));

  const driveIds = facultyDrives.map((d) => d.id);

  // STEP 2 — Stats per drive (Single GroupBy)
  let statsMap = new Map<string, { driveId: string; count: number; avgScore: string | null; maxScore: number }>();
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

    statsMap = new Map(driveStats.map((s) => [s.driveId, s]));
  }

  // STEP 3 — Active jobs check
  const activeJobs = await db
    .select({ payload: jobs.payload })
    .from(jobs)
    .where(
      and(
        inArray(jobs.status, ["pending", "processing"]),
        inArray(jobs.type, ["rank_students"])
      )
    );

  const processingDriveIds = new Set(
    activeJobs.map((j) => (j.payload as { driveId?: string })?.driveId).filter(Boolean)
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-950/60 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Drive workspace
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-foreground">Drives</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Manage {totalDrives} placement drives from one responsive list with clear status, ranking, and deadline context.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm shadow-sm dark:bg-slate-950/70">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Total drives</p>
              <p className="mt-1 font-semibold text-foreground">{totalDrives}</p>
            </div>
            <DriveConflictsButton />
            {canCreateDrive && (
              <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
                <Link href="/faculty/drives/new">
                  <Plus className="h-4 w-4" /> Create Drive
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Grid */}
      {facultyDrives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm dark:bg-slate-950/60">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No drives created yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first drive to start ranking students and tracking eligibility.</p>
          {canCreateDrive && (
            <Button asChild variant="link" className="mt-2 text-primary">
              <Link href="/faculty/drives/new">Create your first drive &rarr;</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {facultyDrives.map((drive) => {
            const stats = statsMap.get(drive.id);
            const isProcessing = processingDriveIds.has(drive.id);

            // Status Logic
            let status: "pending" | "ranked" | "processing" | "closed" | "jd_analyzing" = "pending";
            if (!drive.isActive) status = "closed";
            else if (!drive.parsedJd) status = "jd_analyzing";
            else if (isProcessing) status = "processing";
            else if (stats && Number(stats.count) > 0) status = "ranked";

            const statusConfig = {
              ranked: { label: "RANKED", className: "text-success bg-success/10 border-success/20" },
              processing: { label: "PROCESSING", className: "text-primary bg-primary/10 border-primary/30" },
              jd_analyzing: { label: "JD ANALYZING", className: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
              pending: { label: "PENDING", className: "text-warning bg-warning/10 border-warning/20" },
              closed: { label: "CLOSED", className: "text-muted-foreground bg-card border-border" },
            };

            const config = statusConfig[status];

            return (
              <Card key={drive.id} className="group flex flex-col overflow-hidden border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:bg-slate-950/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm text-foreground",
                        getCompanyColor(drive.company)
                      )}>
                        {drive.company.slice(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base line-clamp-1">{drive.company}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{drive.roleTitle}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("rounded px-1.5 py-0 text-[10px] font-bold tracking-wider", config.className)}>
                      {status === "processing" && (
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4 flex-1">
                  {/* Info Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {drive.location && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground dark:bg-slate-950/60">
                        <MapPin className="h-3 w-3" /> {drive.location}
                      </div>
                    )}
                    {drive.packageOffered && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground dark:bg-slate-950/60">
                        <IndianRupee className="h-3 w-3" /> {drive.packageOffered}
                      </div>
                    )}
                    {drive.deadline && (
                      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground dark:bg-slate-950/60">
                        <Calendar className="h-3 w-3" /> {format(new Date(drive.deadline), "MMM d")}
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 border-y border-dashed border-border py-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Ranked</p>
                      <p className="text-lg font-mono font-bold">{stats ? Number(stats.count) : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Avg %</p>
                      <p className="text-lg font-mono font-bold">{stats?.avgScore ? Number(stats.avgScore).toFixed(0) : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Top %</p>
                      <p className="text-lg font-mono font-bold">{stats?.maxScore ? Number(stats.maxScore).toFixed(0) : "—"}</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-4 pt-0">
                  <Link
                    href={`/faculty/drives/${drive.id}/rankings`}
                    className="text-xs font-semibold text-primary hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    View Rankings <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Badge variant="outline" className={cn("rounded px-1.5 py-0 text-[10px] font-bold tracking-wider", config.className)}>
                    {config.label}
                  </Badge>
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
