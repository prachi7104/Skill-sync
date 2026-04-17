import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LatestAmcatSummary {
  score: number | null;
  category: string | null;
  rank: number | null;
  total_students: number | null;
  session_name: string | null;
  test_date: string | null;
}

interface DashboardLeaderboardCardProps {
  latest: LatestAmcatSummary | null;
  className?: string;
}

export default function DashboardLeaderboardCard({ latest, className }: DashboardLeaderboardCardProps) {
  const rank = latest?.rank ?? null;
  const totalStudents = latest?.total_students ?? null;
  const topPercent = rank && totalStudents ? Math.max(1, Math.round((rank / totalStudents) * 100)) : null;
  const displayDate = latest?.test_date ? new Date(latest.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
  const hasScore = latest?.score !== null && latest?.score !== undefined;

  return (
    <section className={cn('flex min-h-[220px] flex-col rounded-2xl border border-border bg-card/95 p-5 sm:min-h-[240px] sm:p-6 xl:min-h-[260px]', className)}>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md bg-warning/10'>
            <Trophy size={16} className='text-warning' />
          </div>
          <div>
            <p className='text-[13px] font-bold tracking-tight text-foreground'>Leaderboard context</p>
            <p className='text-[11px] uppercase tracking-[0.08em] text-muted-foreground'>Latest published AMCAT session</p>
          </div>
        </div>
        {topPercent !== null ? (
          <Badge variant='warning' className='text-[11px] font-semibold'>Top {topPercent}%</Badge>
        ) : null}
      </div>

      <div className='min-h-0 flex-1 xl:overflow-y-auto xl:pr-1'>
        {rank ? (
          <div className='space-y-4'>
            <div className='rounded-xl border border-border bg-background/40 p-4'>
              <div className='flex items-end justify-between gap-4 border-b border-border/80 pb-3'>
                <div>
                  <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>Current rank</p>
                  <p className='mt-2 text-4xl font-black tracking-tight text-foreground'>#{rank}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold text-muted-foreground'>of {totalStudents ?? '—'}</p>
                  {latest?.category ? (
                    <Badge variant='neutral' className='mt-2 text-[11px] font-semibold'>
                      {latest.category}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {hasScore ? (
                <div className='mt-4 grid grid-cols-2 gap-3 text-xs'>
                  <div className='rounded-lg border border-border bg-card px-3 py-2'>
                    <p className='text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>Score</p>
                    <p className='mt-1 text-sm font-bold text-foreground'>{latest.score}</p>
                  </div>
                  <div className='rounded-lg border border-border bg-card px-3 py-2'>
                    <p className='text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>Top %</p>
                    <p className='mt-1 text-sm font-bold text-foreground'>{topPercent}%</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className='flex flex-wrap gap-2 text-[11px] text-muted-foreground'>
              {latest?.session_name ? <Badge variant='neutral' className='text-[10px] font-semibold'>{latest.session_name}</Badge> : null}
              {displayDate ? <Badge variant='neutral' className='text-[10px] font-semibold'>{displayDate}</Badge> : null}
            </div>
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground'>
            No published AMCAT rank yet. Complete a session to unlock this panel.
          </div>
        )}
      </div>

      <div className='mt-4'>
        <Link
          href='/student/leaderboard'
          className='inline-flex items-center gap-2 text-[12px] font-bold text-primary transition-colors duration-150 hover:text-primary-hover'
        >
          View full leaderboard
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}