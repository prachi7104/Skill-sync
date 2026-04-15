'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';
import { APP_FULL_NAME } from '@/lib/constants/branding';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const featureChips = [
  'AMCAT scoring',
  'AI Sandbox',
  'Career Coach',
  'Drive workflows',
] as const;

function HeroLeft() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={container}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      className="flex flex-col items-start"
    >
      {/* 1. Status badge */}
      <motion.div variants={item} className="mb-6">
        <div className='inline-flex h-7 items-center gap-2 rounded-sm border border-border bg-card px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground shadow-sm'>
          <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
          Placement Season 2026 Live
        </div>
      </motion.div>

      {/* 2. Main headline */}
      <motion.div variants={item} className="mb-5">
        <h1 className='max-w-[12ch] text-[2.7rem] font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.55rem]'>
          {APP_FULL_NAME}
        </h1>
      </motion.div>

      {/* 3. Sub-text */}
      <motion.div variants={item} className="mb-8">
        <p className='max-w-[560px] text-base font-normal leading-relaxed text-muted-foreground sm:text-lg'>
          One platform for AMCAT scoring, AI Sandbox analysis, career guidance,
          and placement workflows — built for students, faculty, and administrators.
        </p>
      </motion.div>

      <motion.div variants={item} className='mb-8 flex flex-wrap gap-2'>
        {featureChips.map((chip) => (
          <span
            key={chip}
            className='inline-flex h-7 items-center rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold text-muted-foreground'
          >
            {chip}
          </span>
        ))}
      </motion.div>

      {/* 4. CTA buttons row */}
      <motion.div variants={item} className="w-full mb-4">
        <div className='flex flex-col xs:flex-row sm:flex-row gap-3 pt-2'>
          <Link href='/login'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover'>
            Student SSO Login
            <ArrowRight size={15} />
          </Link>
          <Link href='/login?role=faculty'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted'>
            <LogIn size={15} className='text-muted-foreground' />
            Faculty / Admin
          </Link>
        </div>
      </motion.div>

      {/* 5. Trust line */}
      <motion.div variants={item}>
        <p className='text-[11px] font-medium tracking-wide text-muted-foreground'>
          Microsoft SSO for students · Credentials for staff · Role-gated access
        </p>
      </motion.div>
    </motion.div>
  );
}

function HeroRight() {
  return (
    <div className='hidden lg:block'>
      <div className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm'>
        {/* Mini topbar */}
        <div className='flex h-10 items-center gap-2 border-b border-border bg-card px-4'>
          <span className='h-2 w-2 rounded-full bg-primary' />
          <span className='text-[11px] font-bold text-foreground'>SkillSync</span>
        </div>
        {/* Body with mock sidebar + content */}
        <div className='flex min-h-[280px] h-auto'>
          {/* Mock sidebar icons */}
          <div className='flex w-10 flex-col items-center gap-3 border-r border-border bg-card pt-4'>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`h-5 w-5 rounded-sm ${i === 0 ? 'bg-primary/60' : 'bg-muted'}`} />
            ))}
          </div>
          {/* Mock content area */}
          <div className='grid flex-1 grid-cols-2 content-start gap-3 bg-background p-4'>
            {/* Greeting card */}
            <div className='col-span-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm'>
              <div className='flex-1'>
                <div className='mb-1.5 h-2.5 w-24 rounded-sm bg-muted' />
                <div className='h-1.5 w-36 rounded-sm bg-border' />
              </div>
              <div className='w-10 h-10 rounded-lg bg-primary/20' />
            </div>
            {/* Stats cards */}
            {[
              { label: 'AMCAT Score', value: '847', color: 'bg-primary' },
              { label: 'Drive Rank', value: '#12', color: 'bg-muted-foreground' },
              { label: 'Profile', value: '91%', color: 'bg-muted-foreground' },
              { label: 'Active Drives', value: '4', color: 'bg-muted-foreground' },
            ].map((stat) => (
              <div key={stat.label} className='rounded-xl border border-border bg-card p-2.5 shadow-sm'>
                <div className={`w-4 h-4 rounded-sm ${stat.color} mb-2 opacity-80`} />
                <div className='text-[10px] font-medium text-muted-foreground'>{stat.label}</div>
                <div className='mt-0.5 text-sm font-black text-foreground'>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className='mt-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
        Dashboard preview
      </p>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className='w-full border-b border-border bg-background px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
      <div className='grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16'>
        <HeroLeft />
        <HeroRight />
      </div>
    </section>
  );
}
