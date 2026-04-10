'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Cpu, CalendarCheck } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'AMCAT Score Integration',
    description: 'Published AMCAT sessions are automatically ingested and normalized into student ranking scores. Zero manual entry.',
    metric: { label: 'Avg. sync time', value: '< 2 min' },
  },
  {
    icon: Cpu,
    iconColor: 'text-[#3E53A0]',
    iconBg: 'bg-[#3E53A0]/10',
    title: 'AI-Native Drive Matching',
    description: 'The ATS engine parses JDs and student profiles using vector embeddings to surface best-fit candidates automatically.',
    metric: { label: 'Match accuracy', value: '94%' },
  },
  {
    icon: CalendarCheck,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    title: 'Conflict-Free Scheduling',
    description: 'Drives, deadlines, and shortlists are cross-checked in real time so no student is double-booked across concurrent drives.',
    metric: { label: 'Conflicts prevented', value: '100%' },
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

  const className = 'group rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200';

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
    <section className='w-full py-12 px-4 sm:px-6 lg:px-8 bg-background border-b border-border'>
      <div className='max-w-[1400px] mx-auto'>
        <div className='mb-8'>
          <span className='text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]'>
            Platform Capabilities
          </span>
          <h2 className='text-2xl sm:text-3xl font-black text-foreground mt-1.5 tracking-tight'>
            Built for placement-scale operations
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
