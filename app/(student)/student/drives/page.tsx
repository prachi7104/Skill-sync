export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Briefcase, MapPin, IndianRupee, Award, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { expandBranches } from "@/lib/constants/branches";

export default async function StudentDrivesPage() {
  const { user, profile } = await requireStudentProfile();

  const activeDrives = await db.query.drives.findMany({
    where: eq(drives.isActive, true),
    orderBy: (drives, { desc }) => [desc(drives.createdAt)],
  });

  const eligible = activeDrives.filter((drive) => {
    if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
      if (profile.cgpa === null || profile.cgpa === undefined) return false;
      if (profile.cgpa < drive.minCgpa) return false;
    }
    const branches = drive.eligibleBranches as string[] | null;
    if (branches && branches.length > 0) {
      if (!profile.branch) return false;
      const expanded = expandBranches(branches).map((b) => b.toLowerCase().trim());
      if (!expanded.includes(profile.branch.toLowerCase().trim())) return false;
    }
    const batchYears = drive.eligibleBatchYears as number[] | null;
    if (batchYears && batchYears.length > 0) {
      if (profile.batchYear === null || profile.batchYear === undefined) return false;
      if (!batchYears.includes(profile.batchYear)) return false;
    }
    const categories = drive.eligibleCategories as string[] | null;
    if (categories && categories.length > 0) {
      if (!profile.category) return false;
      if (!categories.includes(profile.category)) return false;
    }
    return true;
  });

  const hasIncompleteProfile = !profile.branch || !profile.cgpa || !profile.batchYear;

  const studentRankings = await db.query.rankings.findMany({
    where: eq(rankings.studentId, user.id),
  });
  const rankingMap = new Map(studentRankings.map((r) => [r.driveId, r]));

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-10 pb-32 space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Placement Drives
        </h1>
        <p className="text-muted-foreground font-medium">
          {eligible.length} active {eligible.length === 1 ? "drive" : "drives"} matching your profile
        </p>
      </div>

      {eligible.length === 0 ? (
        hasIncompleteProfile ? (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-6 text-center">
            <p className="text-warning font-bold">Complete your profile to see eligible drives</p>
            <p className="text-muted-foreground text-sm mt-2">
              Add your branch, CGPA, and batch year in your profile to see drives you qualify for.
            </p>
            <Link href="/student/onboarding" className="mt-4 inline-block bg-warning/10 hover:bg-warning/10 text-warning font-bold px-6 py-2.5 rounded-md transition-colors">
              Complete Profile →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-md border border-dashed border-border bg-card/30">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">No eligible drives yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs text-center">
              No active drives match your branch, batch year, and CGPA right now. Check back soon.
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {eligible.map((drive) => {
            const ranking = rankingMap.get(drive.id);
            const hasRankPosition = Boolean(ranking && ranking.rankPosition > 0);
            const isDeadlineSoon = drive.deadline
              ? new Date(drive.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
              : false;

            return (
              <div
                key={drive.id}
                className="group relative bg-card rounded-md border border-border hover:border-indigo-500/30 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Rank badge */}
                {ranking && (
                  <Link
                    href={`/student/drives/${drive.id}/ranking`}
                    className="absolute top-4 right-4 z-10"
                  >
                    <div className="flex items-center gap-1.5 bg-primary/15 border border-indigo-500/25 rounded-full px-3 py-1.5 hover:bg-primary/25 transition-colors">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-black text-primary">
                        {hasRankPosition
                          ? `#${ranking.rankPosition} · ${ranking.matchScore.toFixed(0)}%`
                          : "Ineligible"}
                      </span>
                    </div>
                  </Link>
                )}

                <div className="p-6 flex-1">
                  {/* Company + Role */}
                  <div className="mb-4 pr-24">
                    <h3 className="font-black text-foreground text-lg leading-tight tracking-tight">
                      {drive.company}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium mt-0.5">
                      {drive.roleTitle}
                    </p>
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {drive.location && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/50/80 rounded-md px-2.5 py-1">
                        <MapPin className="w-3 h-3" /> {drive.location}
                      </span>
                    )}
                    {drive.packageOffered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/50/80 rounded-md px-2.5 py-1">
                        <IndianRupee className="w-3 h-3" /> {drive.packageOffered}
                      </span>
                    )}
                    {drive.minCgpa && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/50/80 rounded-md px-2.5 py-1">
                        Min CGPA {drive.minCgpa}
                      </span>
                    )}
                    {drive.deadline && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-bold rounded-md px-2.5 py-1",
                        isDeadlineSoon
                          ? "text-warning bg-warning/10"
                          : "text-muted-foreground bg-muted/50/80"
                      )}>
                        <Clock className="w-3 h-3" />
                        {format(new Date(drive.deadline), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  {/* Ranking result */}
                  {ranking ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {ranking.shortExplanation}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(ranking.matchedSkills as string[]).slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-md bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold text-success"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                        {(ranking.missingSkills as string[]).slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive"
                          >
                            ✗ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Rankings not yet generated for this drive.
                    </p>
                  )}
                </div>

                {/* Footer CTA */}
                {ranking && (
                  <Link
                    href={`/student/drives/${drive.id}/ranking`}
                    className="flex items-center justify-between px-6 py-3.5 border-t border-border text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    View Full Ranking
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
