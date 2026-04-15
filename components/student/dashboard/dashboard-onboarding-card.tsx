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
      className='flex flex-col items-start gap-4 rounded-2xl border border-border bg-card/95 p-5 sm:flex-row sm:items-center sm:p-6'
    >
      <div className='flex-1'>
        <div className='flex items-center gap-2 mb-2'>
          <CheckCircle2 size={16} className='text-primary shrink-0' />
          <p className='text-[13px] font-bold text-foreground'>Complete your profile setup</p>
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
        className='shrink-0 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-foreground transition-colors duration-150 hover:bg-primary-hover'
      >
        Continue setup
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
}
