import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingFinalCta() {
  return (
    <section className='w-full bg-background px-4 py-16 sm:px-6 lg:px-8'>
      <div className='w-full rounded-none border-y border-border bg-card px-4 py-10 text-center shadow-sm sm:px-8'>
        <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
          Start With SkillSync
        </p>
        <h2 className='mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl'>
          Launch placement operations with clarity and control
        </h2>
        <p className='mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground'>
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
            className='inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted'
          >
            Faculty / Admin Access
          </Link>
        </div>
      </div>
    </section>
  );
}
