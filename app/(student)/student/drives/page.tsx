export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Briefcase, MapPin, IndianRupee, Award, ChevronRight, Clock, AlertCircle } from "lucide-react";

import { expandBranches } from "@/lib/constants/branches";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">

            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Placement Drives
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {eligible.length} active {eligible.length === 1 ? "drive" : "drives"} matching your profile
                </p>
            </div>

            <Separator />

            {eligible.length === 0 ? (
                hasIncompleteProfile ? (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">Complete your profile to see eligible drives</p>
                            <p className="text-xs text-muted-foreground mt-1 text-balance">
                                Add your branch, CGPA, and batch year in your profile to see drives you qualify for.
                            </p>
                        </div>
                        </div>
                        <Button asChild className="shrink-0">
                            <Link href="/student/onboarding">
                                Complete Profile →
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-md border border-border bg-card">
                        <Briefcase className="w-8 h-8 text-muted-foreground mb-4" />
                        <h3 className="text-sm font-semibold text-foreground mb-1">No eligible drives yet</h3>
                        <p className="text-muted-foreground text-sm max-w-xs text-center text-balance">
                            No active drives match your branch, batch year, and CGPA right now. Check back soon.
                        </p>
                    </div>
                )
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {eligible.map((drive) => {
                        const ranking = rankingMap.get(drive.id);
                        const isDeadlineSoon = drive.deadline
                            ? new Date(drive.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                            : false;

                        return (
                            <div
                                key={drive.id}
                                className="group relative bg-card rounded-md border border-border hover:border-primary/50 transition-all flex flex-col"
                            >
                                {ranking && (
                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-full border border-border">
                                        <Award className="w-3.5 h-3.5 text-foreground" />
                                        <span className="text-xs font-semibold text-foreground">
                                            #{ranking.rankPosition} · {ranking.matchScore.toFixed(0)}%
                                        </span>
                                    </div>
                                )}

                                <div className="p-5 flex-1">
                                    <div className="mb-4 pr-20">
                                        <h3 className="font-semibold text-foreground text-base leading-tight">
                                            {drive.company}
                                        </h3>
                                        <p className="text-muted-foreground text-sm font-medium mt-0.5">
                                            {drive.roleTitle}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {drive.location && (
                                            <Badge variant="secondary" className="font-normal text-xs gap-1 py-0.5">
                                                <MapPin className="w-3 h-3" /> {drive.location}
                                            </Badge>
                                        )}
                                        {drive.packageOffered && (
                                            <Badge variant="secondary" className="font-normal text-xs gap-1 py-0.5">
                                                <IndianRupee className="w-3 h-3" /> {drive.packageOffered}
                                            </Badge>
                                        )}
                                        {drive.minCgpa && (
                                            <Badge variant="outline" className="font-normal text-xs gap-1 py-0.5 border-border">
                                                Min CGPA {drive.minCgpa}
                                            </Badge>
                                        )}
                                        {drive.deadline && (
                                            <Badge variant={isDeadlineSoon ? "destructive" : "secondary"} className="font-normal text-xs gap-1 py-0.5">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(drive.deadline), "MMM d, yyyy")}
                                            </Badge>
                                        )}
                                    </div>

                                    {ranking ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {ranking.shortExplanation}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(ranking.matchedSkills as string[]).slice(0, 3).map((skill) => (
                                                    <span key={skill} className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                                {(ranking.missingSkills as string[]).slice(0, 2).map((skill) => (
                                                    <span key={skill} className="text-[11px] font-medium text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-sm">
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

                                {ranking && (
                                    <Link
                                        href={`/student/drives/${drive.id}/ranking`}
                                        className="flex items-center justify-between px-5 py-3 border-t border-border text-xs font-semibold text-foreground hover:bg-secondary/50 transition-all rounded-b-md"
                                    >
                                        View Full Ranking
                                        <ChevronRight className="w-4 h-4 ml-1 text-muted-foreground" />
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
