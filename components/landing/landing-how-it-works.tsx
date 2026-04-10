'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Search, Sparkles, CalendarClock } from 'lucide-react';

const steps = [
  {
    title: 'Ingest profiles',
    description:
      'AMCAT, resume, and eligibility data are unified.',
    icon: Search,
  },
  {
    title: 'Rank matches',
    description:
      'Job requirements are scored against candidate signals.',
    icon: Sparkles,
  },
  {
    title: 'Schedule cleanly',
    description:
      'Drive rounds are checked for overlaps in real time.',
    icon: CalendarClock,
  },
];

export default function LandingHowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id='how-it-works' className='w-full border-b border-zinc-200/80 bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='mb-10 max-w-2xl'>
          <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400'>
            Workflow
          </p>
          <h2 className='mt-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-slate-100'>
            Three quick steps
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {steps.map((step, index) => {
            const card = (
              <article className='h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900'>
                <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <step.icon size={18} />
                </div>
                <div className='mb-2 text-xs font-bold text-zinc-500 dark:text-slate-400'>
                  0{index + 1}
                </div>
                <h3 className='text-base font-bold tracking-tight text-zinc-900 dark:text-slate-100'>
                  {step.title}
                </h3>
                <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-slate-300'>
                  {step.description}
                </p>
              </article>
            );

            if (prefersReducedMotion) {
              return <div key={step.title}>{card}</div>;
            }

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
                viewport={{ once: true }}
              >
                {card}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
