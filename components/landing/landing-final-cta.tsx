import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingFinalCta() {
  return (
    <section className='w-full bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-[hsl(226,71%,11%)]'>
      <div className='w-full rounded-none border-y border-zinc-200 bg-white px-4 py-10 text-center shadow-sm sm:px-8 dark:border-slate-800 dark:bg-slate-900'>
        <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400'>
          Start With SkillSync
        </p>
        <h2 className='mt-3 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-slate-100'>
          Launch placement operations with clarity and control
        </h2>
        <p className='mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-slate-300'>
          A single platform for AMCAT intelligence, AI-native matching, and conflict-safe execution across students, faculty, and administrators.
        </p>
        <div className='mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href='/login'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover'
          >
            Sign In To SkillSync
            <ArrowRight size={15} />
          </Link>
          <Link
            href='/login?role=faculty'
            className='inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors duration-150 hover:bg-zinc-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
          >
            Faculty / Admin Access
          </Link>
        </div>
      </div>
    </section>
  );
}
