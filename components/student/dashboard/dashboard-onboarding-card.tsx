'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function DashboardOnboardingCard({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900'
    >
      <div className='flex-1'>
        <div className='flex items-center gap-2 mb-2'>
          <CheckCircle2 size={16} className='text-primary shrink-0' />
          <p className='text-[13px] font-bold text-zinc-900 dark:text-slate-100'>Complete your profile setup</p>
        </div>
        <div className='w-full h-1.5 rounded-full bg-primary/20 overflow-hidden'>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className='h-full rounded-full bg-primary'
          />
        </div>
        <p className='text-[11px] text-muted-foreground mt-1.5'>
          {progress}% complete — fill in your academics, SAP ID, and roll number to unlock all features.
        </p>
      </div>
      <Link
        href='/student/onboarding'
        className='shrink-0 flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-bold transition-colors duration-150 hover:bg-primary-hover'
      >
        Continue setup
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
}
