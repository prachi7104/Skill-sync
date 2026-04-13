'use client';

import { motion, useReducedMotion } from 'framer-motion';

const faqs = [
  {
    q: 'How does AMCAT feed in?',
    a: 'Scores sync into student profiles for shortlisting.',
  },
  {
    q: 'Can faculty override ranking?',
    a: 'Yes. Recommendations assist; approvals stay manual.',
  },
  {
    q: 'How are conflicts blocked?',
    a: 'Timelines are checked in real time.',
  },
  {
    q: 'Who can access it?',
    a: 'Students use SSO; staff use gated access.',
  },
];

export default function LandingFaq() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id='faq' className='w-full border-b border-border bg-background px-4 py-16 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-[900px]'>
        <div className='mb-8'>
          <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
            FAQ
          </p>
          <h2 className='mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl'>
            Quick answers
          </h2>
        </div>

        <div className='space-y-3'>
          {faqs.map((faq, index) => {
            const item = (
              <details className='group rounded-2xl border border-border bg-card p-5 shadow-sm'>
                <summary className='cursor-pointer list-none pr-6 text-sm font-bold text-foreground marker:content-none'>
                  {faq.q}
                </summary>
                <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>{faq.a}</p>
              </details>
            );

            if (prefersReducedMotion) {
              return <div key={faq.q}>{item}</div>;
            }

            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: index * 0.05, ease: 'easeOut' }}
                viewport={{ once: true }}
              >
                {item}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
