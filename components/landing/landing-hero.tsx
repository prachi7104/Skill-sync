'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } }
};

function HeroLeft() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={container}
      initial={prefersReducedMotion ? 'visible' : 'hidden'}
      animate="visible"
      className="flex flex-col items-start"
    >
      {/* 1. Status badge */}
      <motion.div variants={item} className="mb-6">
        <div className='inline-flex items-center gap-2 h-7 px-3 rounded-sm bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.12em]'>
          <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
          Placement Season 2026 Live
        </div>
      </motion.div>

      {/* 2. Main headline */}
      <motion.div variants={item} className="mb-5">
        <h1 className='text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-black text-foreground leading-[1.08] tracking-tight'>
          The Intelligent<br />
          <span className='text-primary'>Placement</span> Ecosystem
        </h1>
      </motion.div>

      {/* 3. Sub-text */}
      <motion.div variants={item} className="mb-8">
        <p className='text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[520px] font-normal'>
          AMCAT-integrated intelligence hub for UPES. AI-native matching,
          real-time drive analytics, and zero scheduling conflicts — for
          students, faculty, and administrators.
        </p>
      </motion.div>

      {/* 4. CTA buttons row */}
      <motion.div variants={item} className="w-full mb-4">
        <div className='flex flex-col xs:flex-row sm:flex-row gap-3 pt-2'>
          <Link href='/login'
            className='inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-[#3E53A0] transition-colors duration-150'>
            Student SSO Login
            <ArrowRight size={15} />
          </Link>
          <Link href='/login?role=faculty'
            className='inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors duration-150'>
            <LogIn size={15} className='text-muted-foreground' />
            Faculty / Admin
          </Link>
        </div>
      </motion.div>

      {/* 5. Trust line */}
      <motion.div variants={item}>
        <p className='text-[11px] text-muted-foreground font-medium tracking-wide'>
          Microsoft SSO for students · Credentials for staff · Role-gated access
        </p>
      </motion.div>
    </motion.div>
  );
}

function HeroRight() {
  return (
    <div className='hidden lg:block'>
      <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
        {/* Mini topbar */}
        <div className='h-10 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-2'>
          <span className='w-2 h-2 rounded-full bg-sidebar-primary' />
          <span className='text-[11px] font-bold text-sidebar-fg'>SkillSync</span>
        </div>
        {/* Body with mock sidebar + content */}
        <div className='flex h-[260px]'>
          {/* Mock sidebar icons */}
          <div className='w-10 bg-sidebar flex flex-col items-center gap-3 pt-4'>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`w-5 h-5 rounded-sm ${i === 0 ? 'bg-sidebar-primary' : 'bg-sidebar-surface'}`} />
            ))}
          </div>
          {/* Mock content area */}
          <div className='flex-1 p-4 grid grid-cols-2 gap-3 bg-background overflow-hidden relative'>
            {/* Greeting card */}
            <div className='col-span-2 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-3'>
              <div className='flex-1'>
                <div className='w-24 h-2.5 rounded-sm bg-primary/40 mb-1.5' />
                <div className='w-36 h-1.5 rounded-sm bg-primary/20' />
              </div>
              <div className='w-10 h-10 rounded-lg bg-primary/20' />
            </div>
            {/* Stats cards */}
            {[
              { label: 'AMCAT Score', value: '847', color: 'bg-primary' },
              { label: 'Drive Rank', value: '#12', color: 'bg-[#3E53A0]' },
              { label: 'Profile', value: '91%', color: 'bg-success' },
              { label: 'Active Drives', value: '4', color: 'bg-warning' },
            ].map((stat, i) => (
              <div key={i} className='rounded-lg border border-border bg-card p-2.5'>
                <div className={`w-4 h-4 rounded-sm ${stat.color} mb-2 opacity-80`} />
                <div className='text-[10px] text-muted-foreground font-medium'>{stat.label}</div>
                <div className='text-sm font-black text-foreground mt-0.5'>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className='text-center text-[11px] text-muted-foreground mt-3 font-medium tracking-wide uppercase'>
        Dashboard preview
      </p>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className='w-full py-14 lg:py-20 px-4 sm:px-6 lg:px-8 border-b border-border'>
      <div className='max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
        <HeroLeft />
        <HeroRight />
      </div>
    </section>
  );
}
