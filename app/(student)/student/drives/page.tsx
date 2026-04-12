export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Briefcase, TriangleAlert } from "lucide-react";
import DrivesGrid, { type SerializedDrive, type SerializedRanking } from "@/components/student/drives/drives-grid";
import DrivesSkeleton from "@/components/student/drives/drives-skeleton";
import { filterEligibleDrives } from "@/lib/business/eligibility";

async function StudentDrivesContent() {
  const { user, profile } = await requireStudentProfile();

  const activeDrives = await db.query.drives.findMany({
    where: eq(drives.isActive, true),
    orderBy: (drives, { desc }) => [desc(drives.createdAt)],
  });

  const eligible = filterEligibleDrives(activeDrives, {
    cgpa: profile.cgpa,
    branch: profile.branch,
    batchYear: profile.batchYear,
    category: profile.category,
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
    <div className='mx-auto max-w-6xl space-y-5 px-4 py-6 pb-24 text-foreground sm:px-6 md:pb-8'>
      <section className='rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
              Student Drives
            </p>
            <h1 className='mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl'>
              Drives matching your profile
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
              Explore active drives, compare match quality, and open ranking details with clear eligibility signals.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {['Eligibility checks', 'Deadline alerts', 'Ranking insights'].map((chip) => (
              <span key={chip} className='inline-flex h-7 items-center rounded-md border border-border bg-muted/50 px-2.5 text-[11px] font-semibold text-muted-foreground'>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Incomplete profile warning */}
      {hasIncompleteProfile && (
        <div className='flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 dark:bg-warning/10'>
          <TriangleAlert size={15} className='text-warning mt-0.5 shrink-0' />
          <div>
            <p className='text-sm font-medium text-warning'>Profile incomplete</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>
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
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24'>
          <Briefcase size={36} className='mb-3 text-muted-foreground opacity-40' />
          <h3 className='mb-1 text-sm font-semibold text-foreground'>No eligible drives yet</h3>
          <p className='max-w-xs text-center text-xs leading-relaxed text-muted-foreground'>
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

export default function StudentDrivesPage() {
  return (
    <Suspense
      fallback={(
        <div role="status" aria-label="Loading drives">
          <span className="sr-only">Loading drives...</span>
          <DrivesSkeleton />
        </div>
      )}
    >
      <StudentDrivesContent />
    </Suspense>
  );
}
