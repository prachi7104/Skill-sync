export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Briefcase, TriangleAlert } from "lucide-react";
import DrivesGrid, { type SerializedDrive, type SerializedRanking } from "@/components/student/drives/drives-grid";
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
  const serializedDrives: SerializedDrive[] = eligible.map(drive => {
    const isDeadlineSoon = drive.deadline
      ? new Date(drive.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
      : false;
    return {
      id: drive.id,
      company: drive.company,
      roleTitle: drive.roleTitle,
      location: drive.location ?? null,
      packageOffered: drive.packageOffered ?? null,
      minCgpa: drive.minCgpa ?? null,
      deadlineFormatted: drive.deadline
        ? format(new Date(drive.deadline), 'MMM d, yyyy')
        : null,
      isDeadlineSoon,
    };
  });

  const serializedRankingMap: Record<string, SerializedRanking> = {};
  studentRankings.forEach(r => {
    serializedRankingMap[r.driveId] = {
      rankPosition: r.rankPosition ?? 0,
      matchScore: r.matchScore ?? 0,
      matchedSkills: (r.matchedSkills ?? []) as string[],
      missingSkills: (r.missingSkills ?? []) as string[],
      shortExplanation: r.shortExplanation ?? null,
    };
  });

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24 md:pb-8'>

      {/* Page header */}
      <div>
        <h1 className='text-2xl font-semibold text-foreground'>Placement Drives</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          {eligible.length} active {eligible.length === 1 ? 'drive' : 'drives'} matching your profile
        </p>
      </div>

      {/* Incomplete profile warning */}
      {hasIncompleteProfile && (
        <div className='flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3'>
          <TriangleAlert size={15} className='text-amber-500 mt-0.5 shrink-0' />
          <div>
            <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>Profile incomplete</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Add your branch, CGPA, and batch year to see all eligible drives.{' '}
              <Link href='/student/profile' className='text-primary hover:underline font-medium'>
                Update profile
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* No drives at all (eligible = 0 and profile is complete) */}
      {eligible.length === 0 && !hasIncompleteProfile && (
        <div className='flex flex-col items-center justify-center py-24 rounded-lg border border-dashed border-border bg-card/30'>
          <Briefcase size={36} className='text-muted-foreground mb-3 opacity-40' />
          <h3 className='text-sm font-semibold text-foreground mb-1'>No eligible drives yet</h3>
          <p className='text-xs text-muted-foreground max-w-xs text-center leading-relaxed'>
            No active drives match your branch, batch year, and CGPA. Check back soon.
          </p>
        </div>
      )}

      {/* Interactive drives grid — client component */}
      {eligible.length > 0 && (
        <DrivesGrid
          drives={serializedDrives}
          rankingMap={serializedRankingMap}
        />
      )}
    </div>
  );
}
