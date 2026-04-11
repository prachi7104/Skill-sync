'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Cpu, CalendarCheck } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
    title: 'AMCAT Score Integration',
    description: 'AMCAT sessions flow straight into ranking scores.',
    metric: { label: 'Sync', value: '< 2 min' },
  },
  {
    icon: Cpu,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    title: 'AI-Native Drive Matching',
    description: 'JDs and profiles are matched with vector search.',
    metric: { label: 'Accuracy', value: '94%' },
  },
  {
    icon: CalendarCheck,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    title: 'Conflict-Free Scheduling',
    description: 'Drives, deadlines, and shortlists stay conflict-free.',
    metric: { label: 'Conflicts', value: '0' },
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Icon row */}
      <div className='flex items-start justify-between'>
        <div className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
          <feature.icon size={20} className={feature.iconColor} />
        </div>
        {/* Metric pill */}
        <div className='text-right'>
          <div className='text-[10px] text-muted-foreground font-medium'>{feature.metric.label}</div>
          <div className='text-sm font-black text-foreground'>{feature.metric.value}</div>
        </div>
      </div>
      {/* Text */}
      <div>
        <h3 className='text-base font-bold text-foreground tracking-tight'>{feature.title}</h3>
        <p className='text-sm text-muted-foreground mt-1.5 leading-relaxed font-normal'>{feature.description}</p>
      </div>
      {/* Bottom bar (decorative static progress) */}
      <div className='mt-auto'>
        <div className='w-full h-1 rounded-full bg-muted overflow-hidden'>
          <div className={`h-full rounded-full ${feature.iconBg.replace('/10', '')} opacity-60`}
            style={{ width: feature.metric.value.includes('%') ? feature.metric.value : '70%' }} />
        </div>
      </div>
    </>
  );

  const className = 'group flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900';

  if (prefersReducedMotion) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.div
      className={className}
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      {content}
    </motion.div>
  );
}

export default function LandingFeatureGrid() {
  return (
    <section id='capabilities' className='w-full border-b border-zinc-200/80 bg-zinc-50 px-4 py-14 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[hsl(226,71%,11%)]'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='mb-9'>
          <span className='text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400'>
            Capabilities
          </span>
          <h2 className='mt-1.5 max-w-[18ch] text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-slate-100'>
            Core placement flows
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
