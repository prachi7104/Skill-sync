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

export default async function FacultyDrivesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requireRole(["faculty", "admin"]);
  const canCreateDrive = await hasComponent("drive_management");

  const page = Number(searchParams?.page ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Managing {totalDrives} total placement drives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DriveConflictsButton />
          {canCreateDrive && (
            <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Link href="/faculty/drives/new">
                <Plus className="h-4 w-4" /> Create Drive
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {facultyDrives.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No drives created yet.</p>
          {canCreateDrive && (
            <Button asChild variant="link" className="text-indigo-400 mt-2">
              <Link href="/faculty/drives/new">Create your first drive &rarr;</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
              ranked: { label: "RANKED", className: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
              processing: { label: "PROCESSING", className: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
              jd_analyzing: { label: "JD ANALYZING", className: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
              pending: { label: "PENDING", className: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
              closed: { label: "CLOSED", className: "text-slate-500 bg-slate-800/50 border-slate-700" },
            };

            const config = statusConfig[status];

            return (
              <Card key={drive.id} className="group hover:ring-1 hover:ring-indigo-500 transition-all shadow-sm flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm",
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
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
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
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {drive.location}
                      </div>
                    )}
                    {drive.packageOffered && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-muted-foreground">
                        <IndianRupee className="h-3 w-3" /> {drive.packageOffered}
                      </div>
                    )}
                    {drive.deadline && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {format(new Date(drive.deadline), "MMM d")}
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-dashed">
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

                <CardFooter className="pt-0 flex items-center justify-between gap-4">
                  <Link
                    href={`/faculty/drives/${drive.id}/rankings`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
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
