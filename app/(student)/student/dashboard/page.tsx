export const dynamic = 'force-dynamic';

import { requireRole, getStudentProfile } from '@/lib/auth/helpers';
import DashboardGreetingCard from '@/components/student/dashboard/dashboard-greeting-card';
import DashboardAMCATChart from '@/components/student/dashboard/dashboard-amcat-chart';
import DashboardDrivesPanel from '@/components/student/dashboard/dashboard-drives-panel';
import DashboardOnboardingCard from '@/components/student/dashboard/dashboard-onboarding-card';
import DashboardStatsRow from '@/components/student/dashboard/dashboard-stats-row';

export default async function StudentDashboardPage() {
  const user = await requireRole(['student']);
  const profile = await getStudentProfile(user.id);

  // Compute onboarding progress (same logic as layout)
  const onboardingFields = [
    !!profile?.sapId, !!profile?.rollNo, !!profile?.cgpa,
    !!profile?.branch, !!profile?.batchYear,
    typeof profile?.tenthPercentage === 'number',
    typeof profile?.twelfthPercentage === 'number',
  ];
  const onboardingProgress = Math.round(
    (onboardingFields.filter(Boolean).length / onboardingFields.length) * 100
  );
  const onboardingRequired = onboardingProgress < 100;

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
    <div className='space-y-5'>

      {/* Onboarding card — only when incomplete */}
      {onboardingRequired && (
        <DashboardOnboardingCard progress={onboardingProgress} />
      )}

      {/* Stats row — 4 metric chips */}
      <DashboardStatsRow
        amcatScore={amcatData?.[0]?.score ?? null}
        leaderboardRank={leaderboardRank}
        activeDrives={activeDrivesCount}
        profileCompletion={onboardingProgress}
      />

      {/* 3-column bento grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>

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