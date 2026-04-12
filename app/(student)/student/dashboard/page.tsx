export const dynamic = 'force-dynamic';

import { requireRole, getStudentProfile } from '@/lib/auth/helpers';
import DashboardGreetingCard from '@/components/student/dashboard/dashboard-greeting-card';
import DashboardAMCATChart from '@/components/student/dashboard/dashboard-amcat-chart';
import DashboardDrivesPanel from '@/components/student/dashboard/dashboard-drives-panel';
import DashboardOnboardingCard from '@/components/student/dashboard/dashboard-onboarding-card';
import DashboardStatsRow from '@/components/student/dashboard/dashboard-stats-row';
import { computeOnboardingProgress } from '@/lib/utils/onboarding';

export default async function StudentDashboardPage() {
  const user = await requireRole(['student']);
  const profile = await getStudentProfile(user.id);

  // Compute onboarding progress (same logic as layout)
  const { progress: onboardingProgress, onboardingRequired } = computeOnboardingProgress(profile);

  // Fetch AMCAT data — graceful failure
  let amcatData: { session: string; score: number }[] | null = null;
  let leaderboardRank: number | null = null;
  let activeDrivesCount: number | null = null;

  try {
    const [amcatRes, rankRes, drivesRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/amcat?studentId=${user.id}`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/rank?studentId=${user.id}`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/drives/active?studentId=${user.id}`, { cache: 'no-store' }),
    ]);

    if (amcatRes.status === 'fulfilled' && amcatRes.value.ok) {
      amcatData = await amcatRes.value.json();
    }
    if (rankRes.status === 'fulfilled' && rankRes.value.ok) {
      const rankJson = await rankRes.value.json();
      leaderboardRank = rankJson.rank ?? null;
    }
    if (drivesRes.status === 'fulfilled' && drivesRes.value.ok) {
      const drivesJson = await drivesRes.value.json();
      activeDrivesCount = drivesJson.count ?? null;
    }
  } catch {
    // All data defaults to null — components show skeletons
  }

  return (
    <div className='space-y-5 text-foreground'>
      <section className='rounded-2xl border border-border bg-card px-5 py-5 shadow-sm sm:px-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
              Student Workspace
            </p>
            <h1 className='mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl'>
              Your placement activity at a glance
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
              Track AMCAT scoring, active drives, your profile status, and quick links to Sandbox and Career Coach.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {['AMCAT scoring', 'AI Sandbox', 'Career Coach'].map((chip) => (
              <span key={chip} className='inline-flex h-7 items-center rounded-md border border-border bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground'>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

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
            profileCompletion={onboardingProgress}
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
