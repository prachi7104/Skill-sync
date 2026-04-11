"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardGreetingCardProps {
  studentName: string;
  profileCompletion: number;
  onboardingRequired: boolean;
}

export default function DashboardGreetingCard({ studentName, profileCompletion, onboardingRequired }: DashboardGreetingCardProps) {
  return (
    <div className='flex h-full flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      {/* Greeting */}
      <div>
        <p className='mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-slate-400'>Welcome back</p>
        <h2 className='text-xl font-black leading-tight tracking-tight text-zinc-900 dark:text-slate-100'>
          {/* Show first name only */}
          {studentName.split(' ')[0]}
        </h2>
      </div>

      {/* Profile completion ring */}
      <div className='flex items-center gap-4'>
        <div className='relative w-20 h-20 shrink-0' role='img' aria-label={`Profile completion: ${profileCompletion}%`}>
          <ResponsiveContainer width='100%' height='100%'>
            <RadialBarChart
              cx='50%' cy='50%'
              innerRadius='70%' outerRadius='100%'
              startAngle={90} endAngle={-270}
              data={[{ value: profileCompletion, fill: 'hsl(var(--primary))' }]}
            >
              <RadialBar dataKey='value' background={{ fill: 'hsl(var(--muted))' }} cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center percentage label */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-sm font-black text-zinc-900 dark:text-slate-100'>{profileCompletion}%</span>
          </div>
        </div>
        <div>
          <p className='text-[13px] font-bold text-zinc-900 dark:text-slate-100'>Profile Complete</p>
          <p className='mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-slate-400'>
            {profileCompletion === 100
              ? 'Your profile is fully set up.'
              : `${100 - profileCompletion}% remaining to unlock all features.`
            }
          </p>
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
