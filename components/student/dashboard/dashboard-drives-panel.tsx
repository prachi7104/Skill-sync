'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowUpRight, Clock } from 'lucide-react';

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
    fetch(`/api/student/drives?active=true&studentId=${studentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setDrives(data?.drives ?? []); setLoading(false); })
      .catch(() => { setDrives([]); setLoading(false); });
  }, [studentId]);

  return (
    <div className='bg-card border border-border rounded-xl p-5 h-full flex flex-col'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-md bg-success/10 flex items-center justify-center'>
            <Briefcase size={16} className='text-success' />
          </div>
          <p className='text-[13px] font-bold text-foreground'>Active Drives</p>
        </div>
        <Link href='/student/drives' className='flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-[#3E53A0] transition-colors duration-150'>
          All <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className='flex-1 space-y-2 overflow-y-auto'>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className='h-14 rounded-lg bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' style={{ animationDelay: `${i * 0.1}s` }} />
          ))
        ) : drives && drives.length > 0 ? (
          drives.slice(0, 4).map(drive => (
            <Link
              key={drive.id}
              href={`/student/drives`}
              className='flex items-start justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 group'
            >
              <div className='min-w-0 flex-1'>
                <p className='text-[13px] font-bold text-foreground truncate'>{drive.companyName}</p>
                <p className='text-[11px] text-muted-foreground truncate mt-0.5'>{drive.role}</p>
              </div>
              <div className='ml-3 shrink-0 flex flex-col items-end gap-1'>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${drive.isEligible ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {drive.isEligible ? 'Eligible' : 'Ineligible'}
                </span>
                <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                  <Clock size={9} /> {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
            <Briefcase size={28} className='text-muted-foreground opacity-40 mb-2' />
            <p className='text-[12px] text-muted-foreground'>No active drives at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
