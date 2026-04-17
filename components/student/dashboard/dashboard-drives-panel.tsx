'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowUpRight, Clock, Target } from 'lucide-react';
import { safeFetch } from '@/lib/api';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Drive {
  id: string;
  companyName: string;
  role: string;
  deadline: string | null;
  ranking?: {
    matchScore?: number | null;
  } | null;
}

interface ApiDrive {
  id: string;
  company: string;
  roleTitle: string;
  deadline: string | null;
  ranking?: {
    matchScore?: number | null;
  } | null;
}

interface DashboardDrivesPanelProps {
  className?: string;
}

export default function DashboardDrivesPanel({ className }: DashboardDrivesPanelProps) {
  const [drives, setDrives] = useState<Drive[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDrives() {
      const { data, error } = await safeFetch<{ drives: ApiDrive[] }>(
        '/api/drives?limit=4'
      );
      if (error) {
        setLoadError(error);
        setDrives([]);
      } else {
        setLoadError(null);
        setDrives(
          (data?.drives ?? []).map((drive) => ({
            id: drive.id,
            companyName: drive.company,
            role: drive.roleTitle,
            deadline: drive.deadline,
            ranking: drive.ranking ?? null,
          }))
        );
      }
      setLoading(false);
    }
    loadDrives();
  }, []);

  return (
    <div className={cn('flex min-h-[280px] flex-col rounded-2xl border border-border bg-card/95 p-5 sm:min-h-[320px] sm:p-6 xl:min-h-[360px]', className)}>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md bg-success/10'>
            <Briefcase size={16} className='text-success' />
          </div>
          <div>
            <p className='text-[13px] font-bold tracking-tight text-foreground'>Eligible Drives</p>
            <p className='text-[11px] uppercase tracking-[0.08em] text-muted-foreground'>Matched to your current profile</p>
          </div>
        </div>
        {drives && drives.length > 0 ? (
          <Link href='/student/drives' className='flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover'>
            All <ArrowUpRight size={13} />
          </Link>
        ) : null}
      </div>

      <div className='min-h-0 flex-1 space-y-2 xl:overflow-y-auto xl:pr-1'>
        {loading ? (
          <div role='status' aria-label='Loading drives' aria-busy='true' className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 rounded-xl bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
            <span className='sr-only'>Loading...</span>
          </div>
        ) : drives && drives.length > 0 ? (
          drives.slice(0, 4).map((drive) => {
            const daysRemaining = drive.deadline
              ? Math.ceil((new Date(drive.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
              : null;

            return (
              <Link
                key={drive.id}
                href={`/student/drives/${drive.id}/ranking`}
                className='group flex items-start justify-between rounded-xl border border-border bg-background/40 p-3 transition-all duration-150 hover:border-primary/30 hover:bg-primary/5'
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-bold text-foreground'>{drive.companyName}</p>
                  <p className='mt-0.5 truncate text-[11px] text-muted-foreground'>{drive.role}</p>
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    <Badge variant='success' className='h-6 rounded-md px-2 text-[10px] font-bold'>Eligible</Badge>
                    {typeof drive.ranking?.matchScore === 'number' ? (
                      <Badge variant='neutral' className='h-6 rounded-md px-2 text-[10px] font-bold'>
                        <Target size={10} className='mr-1' /> Match {Math.round(drive.ranking.matchScore)}%
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className='ml-3 shrink-0 flex flex-col items-end gap-1'>
                  <span className={cn(
                    'rounded-sm px-1.5 py-0.5 text-[10px] font-bold',
                    drive.deadline
                      ? (new Date(drive.deadline).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {daysRemaining === null
                      ? 'No deadline'
                      : daysRemaining <= 0
                        ? 'Due today'
                        : daysRemaining <= 3
                          ? `Due in ${daysRemaining}d`
                          : 'Open now'}
                  </span>
                  <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                    <Clock size={9} /> {drive.deadline ? new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}
                  </span>
                </div>
              </Link>
            );
          })
        ) : loadError ? (
          <div className='flex h-full flex-col items-center justify-center py-8 text-center'>
            <Briefcase size={28} className='mb-2 text-muted-foreground/40' />
            <p className='text-[12px] text-muted-foreground'>Could not load drives right now.</p>
            <p className='mt-1 text-[11px] text-muted-foreground'>Please refresh or try again in a moment.</p>
          </div>
        ) : (
          <div className='flex h-full flex-col items-center justify-center py-8 text-center'>
            <Briefcase size={28} className='mb-2 text-muted-foreground/40' />
            <p className='text-[12px] text-muted-foreground'>No active drives at the moment.</p>
            <p className='mt-1 text-[11px] text-muted-foreground'>Check back soon or open the full drives page.</p>
          </div>
        )}
      </div>
    </div>
  );
}