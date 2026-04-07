export const dynamic = "force-dynamic";

import { hasComponent, requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings, jobs } from "@/lib/db/schema";
import { eq, count, avg, sql, and, inArray, desc } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, IndianRupee, Calendar } from "lucide-react";
import { getCompanyColor } from "@/lib/utils/company-color";
import { DriveConflictsButton } from "@/components/faculty/drive-conflicts-button";
import Pagination from "@/components/shared/pagination";
import { cn } from "@/lib/utils";

export default async function FacultyDrivesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requireRole(["faculty", "admin"]);
  const canCreateDrive = await hasComponent("drive_management");

  const pageValue = Number(searchParams?.page ?? 1);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  if (!user.collegeId) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Drives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Account is not linked to a college yet.
          </p>
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
  let statsMap = new Map<string, { driveId: string; count: number; avgScore: number | null; maxScore: number | null }>();
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

    statsMap = new Map(driveStats.map((s) => [s.driveId, {
        driveId: s.driveId,
        count: Number(s.count),
        avgScore: s.avgScore ? Number(s.avgScore) : null,
        maxScore: s.maxScore ? Number(s.maxScore) : null
    }]));
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
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Drives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Managing {totalDrives} total placement drives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DriveConflictsButton />
          {canCreateDrive && (
            <Button asChild className="gap-2">
              <Link href="/faculty/drives/new">
                <Plus className="h-4 w-4" /> Create Drive
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="h-px bg-border w-full" />

      {facultyDrives.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-md">
          <p className="text-muted-foreground">No drives created yet.</p>
          {canCreateDrive && (
            <Button asChild variant="link" className="text-primary mt-2">
              <Link href="/faculty/drives/new">Create your first drive &rarr;</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-card text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground">Company & Role</th>
                <th className="px-4 py-3 font-medium text-foreground">Status & Details</th>
                <th className="px-4 py-3 font-medium text-foreground">Stats</th>
                <th className="px-4 py-3 font-medium text-right text-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {facultyDrives.map((drive, index) => {
                const stats = statsMap.get(drive.id);
                const isProcessing = processingDriveIds.has(drive.id);

                let status: "pending" | "ranked" | "processing" | "closed" | "jd_analyzing" = "pending";
                if (!drive.isActive) status = "closed";
                else if (!drive.parsedJd) status = "jd_analyzing";
                else if (isProcessing) status = "processing";
                else if (stats && stats.count > 0) status = "ranked";

                const badgeMap = {
                  ranked: { label: "Ranked", variant: "green" as const },
                  processing: { label: "Processing", variant: "blue" as const },
                  jd_analyzing: { label: "Analyzing", variant: "yellow" as const },
                  pending: { label: "Active", variant: "default" as const },
                  closed: { label: "Closed", variant: "secondary" as const },
                };
                
                const config = badgeMap[status];

                return (
                  <tr key={drive.id} className={index % 2 === 0 ? "bg-card hover:bg-accent/50" : "bg-secondary/40 hover:bg-accent/50"}>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 shadow-sm", getCompanyColor(drive.company))}>
                            {drive.company.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{drive.company}</p>
                            <p className="text-xs text-muted-foreground font-medium">{drive.roleTitle}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        <div>
                          <Badge variant={config.variant} className="rounded px-2">{config.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          {drive.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{drive.location}</span>}
                          {drive.packageOffered && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{drive.packageOffered}</span>}
                          {drive.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(drive.deadline), "MMM d")}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                         <div><p className="uppercase font-medium">Ranked</p><p className="text-sm font-mono font-semibold text-foreground">{stats ? stats.count : "—"}</p></div>
                         <div><p className="uppercase font-medium">Avg Match</p><p className="text-sm font-mono font-semibold text-foreground">{stats?.avgScore ? stats.avgScore.toFixed(0) : "—"}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                       <Button asChild variant="outline" size="sm" className="h-8 shadow-sm">
                         <Link href={`/faculty/drives/${drive.id}/rankings`} className="gap-1.5">
                           View Rankings
                         </Link>
                       </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalDrives > pageSize && (
        <Pagination page={page} total={totalDrives} pageSize={pageSize} />
      )}
    </div>
  );
}
