"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DashboardGreetingCardProps {
  studentName: string;
  progressPercent: number;
  onboardingRequired: boolean;
}


export default function DashboardGreetingCard({ studentName, progressPercent, onboardingRequired }: DashboardGreetingCardProps) {
  const firstName = studentName.trim().split(/\s+/)[0] || 'Student';

  return (
    <div className='flex min-h-[220px] flex-col gap-5 rounded-2xl border border-border bg-card/95 p-5 sm:min-h-[240px] sm:p-6 xl:min-h-[260px]'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground'>Welcome back</p>
          <h2 className='max-w-[240px] truncate text-2xl font-black leading-tight tracking-tight text-foreground' title={firstName}>
            {firstName}
          </h2>
        </div>
        <Badge variant='info' className='gap-1.5 border-info/20 bg-info/10 text-[11px] font-semibold'>
          <Sparkles size={11} /> Ready for the next step
        </Badge>
      </div>

      <div className='flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4'>
        <div className='relative h-20 w-20 shrink-0' role='img' aria-label={`Profile completion: ${progressPercent}%`}>
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
            <span className='text-sm font-black text-foreground' aria-hidden="true">{progressPercent}%</span>
          </div>
        </div>
        <div className='min-w-0 flex-1 space-y-2'>
          <p className='text-sm font-semibold text-foreground'>
            {onboardingRequired ? 'Finish onboarding to unlock the full placement workspace.' : 'Your profile is ready for drives, ranking, and coach insights.'}
          </p>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {onboardingRequired
              ? 'Add academics, SAP ID, and roll number to improve matching and eligibility signals.'
              : 'Keep your profile current so drive matches and eligibility checks stay accurate.'}
          </p>
        </div>
      </div>

      <div className='mt-auto pt-1'>
        <Link
          href={onboardingRequired ? '/student/onboarding' : '/student/profile'}
          className='inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-primary transition-colors duration-150 hover:text-primary-hover'
        >
          {onboardingRequired ? 'Complete setup' : 'View profile'}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
