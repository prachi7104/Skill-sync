"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardGreetingCardProps {
  studentName: string;
  progressPercent: number;
  onboardingRequired: boolean;
  className?: string;
}


export default function DashboardGreetingCard({ studentName, progressPercent, onboardingRequired, className }: DashboardGreetingCardProps) {
  const firstName = studentName.trim().split(/\s+/)[0] || 'Student';

  return (
    <div className={cn('flex min-h-[220px] flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 sm:gap-4 sm:min-h-[240px] sm:p-5 md:p-6 lg:gap-5 xl:min-h-[260px]', className)}>
      <div className='flex items-start justify-between gap-2 sm:gap-3'>
        <div className='min-w-0'>
          <p className='mb-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground'>Welcome back</p>
          <h2 className='text-xl sm:text-2xl font-black leading-tight tracking-tight text-foreground truncate' title={firstName}>
            {firstName}
          </h2>
        </div>
        <Badge variant='info' className='gap-1 sm:gap-1.5 border-info/20 bg-info/10 text-[10px] sm:text-[11px] font-semibold shrink-0'>
          <Sparkles size={10} className='sm:w-[11px] sm:h-[11px]' /> 
          <span className='hidden sm:inline'>Ready for the next step</span>
          <span className='sm:hidden'>Ready</span>
        </Badge>
      </div>

      <div className='flex items-center gap-3 sm:gap-4 rounded-xl border border-border bg-muted/20 p-3 sm:p-4'>
        <div className='relative h-16 w-16 sm:h-20 sm:w-20 shrink-0' role='img' aria-label={`Profile completion: ${progressPercent}%`}>
          <ResponsiveContainer width='100%' height='100%'>
            <RadialBarChart
              cx='50%' cy='50%'
              innerRadius='70%' outerRadius='100%'
              startAngle={90} endAngle={-270}
              data={[{ value: progressPercent, fill: 'hsl(var(--primary))' }]}
            >
              <RadialBar dataKey='value' background={{ fill: 'hsl(var(--muted))' }} cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-xs sm:text-sm font-black text-foreground' aria-hidden="true">{progressPercent}%</span>
          </div>
        </div>
        <div className='min-w-0 flex-1 space-y-1 sm:space-y-2'>
          <p className='text-xs sm:text-sm font-semibold text-foreground leading-snug'>
            {onboardingRequired ? 'Finish onboarding to unlock the workspace.' : 'Your profile is ready for drives & insights.'}
          </p>
          <p className='text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-none'>
            {onboardingRequired
              ? 'Add academics, SAP ID & roll number to improve signals.'
              : 'Keep your profile current for accurate checks.'}
          </p>
        </div>
      </div>

      <div className='mt-auto pt-1'>
        <Link
          href={onboardingRequired ? '/student/onboarding' : '/student/profile'}
          className='inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-primary transition-colors duration-150 hover:text-primary-hover'
        >
          {onboardingRequired ? 'Complete setup' : 'View profile'}
          <ArrowRight size={12} className='sm:w-[13px] sm:h-[13px]' />
        </Link>
      </div>
    </div>
  );
}
