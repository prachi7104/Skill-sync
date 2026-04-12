"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardGreetingCardProps {
  studentName: string;
  progressPercent: number;
  onboardingRequired: boolean;
}


export default function DashboardGreetingCard({ studentName, progressPercent, onboardingRequired }: DashboardGreetingCardProps) {
  const firstName = studentName.trim().split(/\s+/)[0] || 'Student';

  return (
    <div className='flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm'>
      {/* Greeting */}
      <div>
        <p className='mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground'>Welcome back</p>
        <h2 className='max-w-[180px] truncate text-xl font-black leading-tight tracking-tight text-foreground' title={firstName}>
          {/* Show first name only */}
          {firstName}
        </h2>
      </div>

      {/* Profile completion ring */}
      <div className='flex items-center gap-4'>
        <div className='relative w-20 h-20 shrink-0' role='img' aria-label={`Profile completion: ${progressPercent}%`}>
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
          {/* Center percentage label */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-sm font-black text-foreground' aria-hidden="true">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={onboardingRequired ? '/student/onboarding' : '/student/profile'}
        className='mt-auto flex items-center gap-2 text-[12px] font-bold text-primary transition-colors duration-150 hover:text-primary-hover'
      >
        {onboardingRequired ? 'Complete setup' : 'View profile'}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
