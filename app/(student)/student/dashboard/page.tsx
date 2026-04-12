export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

import { requireRole, getStudentProfile } from '@/lib/auth/helpers';
import PageHeader from '@/components/shared/page-header';
import DashboardGreetingCard from '@/components/student/dashboard/dashboard-greeting-card';
import DashboardAMCATChart from '@/components/student/dashboard/dashboard-amcat-chart';
import DashboardDrivesPanel from '@/components/student/dashboard/dashboard-drives-panel';
import DashboardOnboardingCard from '@/components/student/dashboard/dashboard-onboarding-card';
import DashboardStatsRow from '@/components/student/dashboard/dashboard-stats-row';
import DashboardSkeleton from '@/components/student/dashboard/dashboard-skeleton';
import { computeOnboardingProgress } from '@/lib/utils/onboarding';
import {
  getStudentAMCATData,
  getStudentRank,
  getStudentActiveDrivesCount,
} from '@/lib/queries/student-dashboard';

async function StudentDashboardContent() {
  const user = await requireRole(['student']);
  const profile = await getStudentProfile(user.id);

  // Compute onboarding progress (same logic as layout)
  const { progress: onboardingProgress, onboardingRequired } = computeOnboardingProgress(profile);

  // Fetch dashboard data via direct DB calls — graceful failure per source
  let amcatData: { session: string; score: number }[] | null = null;
  let leaderboardRank: number | null = null;
  let activeDrivesCount: number | null = null;

  if (user.collegeId) {
    const [amcatResult, rankResult, drivesResult] = await Promise.allSettled([
      getStudentAMCATData(user.id, user.collegeId),
      getStudentRank(user.id, user.collegeId),
      getStudentActiveDrivesCount(user.collegeId),
    ]);

    if (amcatResult.status === 'fulfilled' && amcatResult.value?.hasAmcat && !amcatResult.value.isAbsent) {
      const result = amcatResult.value;
      amcatData = result.score !== null && result.session_name
        ? [{ session: result.session_name, score: result.score }]
        : null;
    }
    if (rankResult.status === 'fulfilled') {
      leaderboardRank = rankResult.value?.rank ?? null;
    }
    if (drivesResult.status === 'fulfilled') {
      activeDrivesCount = drivesResult.value?.count ?? null;
    }
  }

  return (
    <div className='space-y-6 text-foreground'>
      <PageHeader
        eyebrow='Student Dashboard'
        title='Your placement activity at a glance'
        description='Track AMCAT scoring, active drives, your profile status, and quick links to Sandbox and Career Coach.'
        actions={
          <div className='flex flex-wrap gap-3'>
            {['AMCAT scoring', 'AI Sandbox', 'Career Coach'].map((chip) => (
              <span key={chip} className='inline-flex h-7 items-center rounded-md border border-border bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground'>
                {chip}
              </span>
            ))}
          </div>
        }
      />

      {/* Onboarding card — only when incomplete */}
      {onboardingRequired && (
        <DashboardOnboardingCard progress={onboardingProgress} />
      )}

      {/* Stats row — 4 metric chips */}
      <DashboardStatsRow
        amcatScore={amcatData?.[0]?.score ?? null}
        leaderboardRank={leaderboardRank}
        activeDrives={activeDrivesCount}
      />

      {/* 3-column bento grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>

        {/* Left: AMCAT chart */}
        <div className='xl:col-span-1 md:col-span-2'>
          <DashboardAMCATChart
            data={amcatData}
            studentName={user.name ?? 'Student'}
          />
        </div>

        {/* Center: Greeting + profile ring */}
        <div className='xl:col-span-1'>
          <DashboardGreetingCard
            studentName={user.name ?? 'Student'}
            progressPercent={onboardingProgress}
            onboardingRequired={onboardingRequired}
          />
        </div>

        {/* Right: Active drives */}
        <div className='xl:col-span-1'>
          <DashboardDrivesPanel studentId={user.id} />
        </div>

      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={(
        <div role='status' aria-label='Loading dashboard'>
          <span className='sr-only'>Loading dashboard...</span>
          <DashboardSkeleton />
        </div>
      )}
    >
      <StudentDashboardContent />
    </Suspense>
  );
}
