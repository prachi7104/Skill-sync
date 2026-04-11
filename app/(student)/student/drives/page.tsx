export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Briefcase, TriangleAlert } from "lucide-react";
import DrivesGrid, { type SerializedDrive, type SerializedRanking } from "@/components/student/drives/drives-grid";
import { filterEligibleDrives } from "@/lib/business/eligibility";

export default async function StudentDrivesPage() {
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
    <div className='mx-auto max-w-6xl space-y-5 px-4 py-6 pb-24 text-zinc-900 sm:px-6 md:pb-8 dark:text-slate-100'>
      <section className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400'>
              Student Drives
            </p>
            <h1 className='mt-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-slate-100 sm:text-4xl'>
              Drives matching your profile
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-slate-300'>
              Explore active drives, compare match quality, and open ranking details with clear eligibility signals.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {['Eligibility checks', 'Deadline alerts', 'Ranking insights'].map((chip) => (
              <span key={chip} className='inline-flex h-7 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-[11px] font-semibold text-zinc-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'>
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
            <p className='mt-0.5 text-xs text-zinc-600 dark:text-slate-300'>
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
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-900'>
          <Briefcase size={36} className='mb-3 text-zinc-400 opacity-40 dark:text-slate-500' />
          <h3 className='mb-1 text-sm font-semibold text-zinc-900 dark:text-slate-100'>No eligible drives yet</h3>
          <p className='max-w-xs text-center text-xs leading-relaxed text-zinc-500 dark:text-slate-400'>
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
