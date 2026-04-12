'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowUpRight, Clock } from 'lucide-react';
import { safeFetch } from '@/lib/api';
import { toast } from 'sonner';

interface Drive {
  id: string;
  companyName: string;
  role: string;
  deadline: string;
  isEligible: boolean;
}

export default function DashboardDrivesPanel({ studentId }: { studentId: string }) {
  const [drives, setDrives] = useState<Drive[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrives() {
      const { data, error } = await safeFetch<{ drives: Drive[] }>(
        `/api/student/drives?active=true&studentId=${studentId}`
      );
      if (error) {
        toast.error(error);
        setDrives([]);
      } else {
        setDrives(data?.drives ?? []);
      }
      setLoading(false);
    }
    loadDrives();
  }, [studentId]);

  return (
    <div className='flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-md bg-success/10'>
              <Briefcase size={16} className='text-success' />
            </div>
            <p className='text-[13px] font-bold text-zinc-900 dark:text-slate-100'>Active Drives</p>
          </div>
          {drives && drives.length > 0 ? (
            <Link href='/student/drives' className='flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover'>
              All <ArrowUpRight size={13} />
            </Link>
          ) : null}
        </div>

      <div className='flex-1 space-y-2 overflow-y-auto'>
        {loading ? (
          <div role='status' aria-label='Loading drives' aria-busy='true' className='space-y-2'>
            {[1,2,3].map(i => (
              <div key={i} className='h-14 rounded-lg bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
            <span className='sr-only'>Loading...</span>
          </div>
        ) : drives && drives.length > 0 ? (
          drives.slice(0, 4).map(drive => (
            <Link
              key={drive.id}
              href={`/student/drives/${drive.id}`}
              className='group flex items-start justify-between rounded-lg border border-zinc-200 p-3 transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 dark:border-slate-800 dark:hover:border-primary/30 dark:hover:bg-primary/10'
            >
              <div className='min-w-0 flex-1'>
                <p className='truncate text-[13px] font-bold text-zinc-900 dark:text-slate-100'>{drive.companyName}</p>
                <p className='mt-0.5 truncate text-[11px] text-zinc-500 dark:text-slate-400'>{drive.role}</p>
              </div>
              <div className='ml-3 shrink-0 flex flex-col items-end gap-1'>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${drive.isEligible ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {drive.isEligible ? 'Eligible' : 'Ineligible'}
                </span>
                <span className='flex items-center gap-1 text-[10px] text-zinc-500 dark:text-slate-400'>
                  <Clock size={9} /> {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
            <Briefcase size={28} className='mb-2 text-zinc-400 opacity-40 dark:text-slate-500' />
            <p className='text-[12px] text-zinc-500 dark:text-slate-400'>No active drives at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
