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
    <div className='bg-card border border-border rounded-xl p-5 flex flex-col gap-5 h-full'>
      {/* Greeting */}
      <div>
        <p className='text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-1'>Welcome back</p>
        <h2 className='text-xl font-black text-foreground tracking-tight leading-tight'>
          {/* Show first name only */}
          {studentName.split(' ')[0]}
        </h2>
      </div>

      {/* Profile completion ring */}
      <div className='flex items-center gap-4'>
        <div className='relative w-20 h-20 shrink-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <RadialBarChart
              cx='50%' cy='50%'
              innerRadius='70%' outerRadius='100%'
              startAngle={90} endAngle={-270}
              data={[{ value: profileCompletion, fill: '#5A77DF' }]}
            >
              <RadialBar dataKey='value' background={{ fill: 'hsl(var(--muted))' }} cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center percentage label */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-sm font-black text-foreground'>{profileCompletion}%</span>
          </div>
        </div>
        <div>
          <p className='text-[13px] font-bold text-foreground'>Profile Complete</p>
          <p className='text-[11px] text-muted-foreground mt-0.5 leading-relaxed'>
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
        className='mt-auto flex items-center gap-2 text-[12px] font-bold text-primary hover:text-[#3E53A0] transition-colors duration-150'
      >
        {onboardingRequired ? 'Complete setup' : 'View profile'}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
