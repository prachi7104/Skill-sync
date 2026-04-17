export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, Sparkles, Trophy } from 'lucide-react';

import { requireRole, getStudentProfile } from '@/lib/auth/helpers';
import PageHeader from '@/components/shared/page-header';
import DashboardGreetingCard from '@/components/student/dashboard/dashboard-greeting-card';
import DashboardAMCATChart from '@/components/student/dashboard/dashboard-amcat-chart';
import DashboardDrivesPanel from '@/components/student/dashboard/dashboard-drives-panel';
import DashboardOnboardingCard from '@/components/student/dashboard/dashboard-onboarding-card';
import DashboardStatsRow from '@/components/student/dashboard/dashboard-stats-row';
import DashboardLeaderboardCard from '@/components/student/dashboard/dashboard-leaderboard-card';
import DashboardCareerCoachCard from '@/components/student/dashboard/dashboard-career-coach-card';
import DashboardSkeleton from '@/components/student/dashboard/dashboard-skeleton';
import { computeCompleteness } from '@/lib/profile/completeness';
import { computeOnboardingProgress } from '@/lib/utils/onboarding';
import {
  getStudentAMCATData,
  getStudentAMCATHistory,
  getStudentRank,
  getStudentActiveDrivesCount,
} from '@/lib/queries/student-dashboard';

async function StudentDashboardContent() {
  const user = await requireRole(['student']);
  const profile = await getStudentProfile(user.id);

  // Compute onboarding progress (same logic as layout)
  const { progress: onboardingProgress, onboardingRequired } = computeOnboardingProgress(profile);
  const { score: profileCompleteness } = computeCompleteness({
    ...profile,
    name: user.name,
    email: user.email,
  });

  // Fetch dashboard data via direct DB calls — graceful failure per source
  let latestAmcat: Awaited<ReturnType<typeof getStudentAMCATData>> = null;
  let amcatHistory: Awaited<ReturnType<typeof getStudentAMCATHistory>> | null = null;
  let leaderboardRank: number | null = null;
  let activeDrivesCount: number | null = null;

  if (user.collegeId) {
    const [amcatResult, historyResult, rankResult, drivesResult] = await Promise.allSettled([
      getStudentAMCATData(user.id, user.collegeId),
      getStudentAMCATHistory(user.id, user.collegeId),
      getStudentRank(user.id, user.collegeId),
      getStudentActiveDrivesCount(user.collegeId),
    ]);

    if (amcatResult.status === 'fulfilled' && amcatResult.value?.hasAmcat && !amcatResult.value.isAbsent) {
      latestAmcat = amcatResult.value;
    }
    if (historyResult.status === 'fulfilled') {
      amcatHistory = historyResult.value;
    }
    if (rankResult.status === 'fulfilled') {
      leaderboardRank = rankResult.value?.rank ?? null;
    }
    if (drivesResult.status === 'fulfilled') {
      activeDrivesCount = drivesResult.value?.count ?? null;
    }
  }

  return (
    <div className='space-y-5 text-foreground sm:space-y-6'>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:[--top-row-h:clamp(18rem,34vh,22rem)]'>
        <section className='relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-7 xl:h-[var(--top-row-h)]'>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent' />
          <PageHeader
            className='border-0 bg-transparent p-0'
            eyebrow='Student Dashboard'
            title='Your placement activity at a glance'
            description='Track AMCAT performance, active drives, profile readiness, and personalized guidance in one workspace.'
            actions={
              <div className='flex flex-wrap gap-2'>
                {[
                  { href: '/student/sandbox', label: 'AI Sandbox', icon: BarChart3 },
                  { href: '/student/career-coach', label: 'Career Coach', icon: Sparkles },
                  { href: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className='inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/70 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-primary/5'
                    >
                      <Icon size={13} className='text-primary' />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            }
          />
        </section>

        <DashboardGreetingCard
          className='xl:h-[var(--top-row-h)] xl:min-h-0'
          studentName={user.name ?? 'Student'}
          progressPercent={profileCompleteness}
          onboardingRequired={onboardingRequired}
        />
      </div>

      {/* Onboarding card — only when incomplete */}
      {onboardingRequired && (
        <DashboardOnboardingCard progress={onboardingProgress} />
      )}

      <div className='xl:hidden'>
        <DashboardLeaderboardCard latest={latestAmcat} />
      </div>

      {/* Stats row — 4 metric chips */}
      <DashboardStatsRow
        amcatScore={latestAmcat?.score ?? null}
        leaderboardRank={leaderboardRank ?? latestAmcat?.rank ?? null}
        activeDrives={activeDrivesCount}
        profileCompletion={profileCompleteness}
      />

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:[--main-row-h:clamp(24rem,42vh,32rem)]'>
        <div className='xl:h-[var(--main-row-h)]'>
          <DashboardAMCATChart
            className='xl:h-full xl:min-h-0'
            history={amcatHistory}
            latest={latestAmcat}
            studentName={user.name ?? 'Student'}
          />
        </div>

        <div className='hidden xl:block xl:h-[var(--main-row-h)]'>
          <DashboardLeaderboardCard className='xl:h-full xl:min-h-0' latest={latestAmcat} />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] xl:[--bottom-row-h:clamp(22rem,38vh,28rem)]'>
        <div className='xl:h-[var(--bottom-row-h)]'>
          <DashboardDrivesPanel className='xl:h-full xl:min-h-0' />
        </div>

        <div className='xl:h-[var(--bottom-row-h)]'>
          <DashboardCareerCoachCard className='xl:h-full xl:min-h-0' />
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
