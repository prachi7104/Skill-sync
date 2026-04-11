"use client";

import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from 'next/link';
import { BarChart3, ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import { StatusCard } from '@/components/ui/status-card';

interface DashboardAMCATChartProps {
  data: { session: string; score: number }[] | null;
  studentName: string;
}

export default function DashboardAMCATChart({ data }: DashboardAMCATChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['3deg', '-3deg']);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-3deg', '3deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={prefersReducedMotion ? {} : { rotateX, rotateY, transformPerspective: 800 }}
      className='flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
    >
      {/* Header row */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center'>
            <BarChart3 size={16} className='text-primary' />
          </div>
          <div>
            <p className='text-[13px] font-bold text-zinc-900 dark:text-slate-100'>AMCAT Score History</p>
            <p className='text-[11px] text-zinc-500 dark:text-slate-400'>Last 6 sessions</p>
          </div>
        </div>
        <Link
          href='/student/leaderboard'
          className='flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover'
        >
          View all <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Chart area */}
      <div className='flex-1 min-h-[180px]'>
        {data && data.length > 0 ? (
          <>
            {/* Best score callout */}
            <div className='mb-3 flex items-baseline gap-1.5'>
              <span className='text-3xl font-black text-zinc-900 dark:text-slate-100'>
                {Math.max(...data.map(d => d.score))}
              </span>
              <span className='text-[12px] font-medium text-zinc-500 dark:text-slate-400'>best score</span>
            </div>
            <ResponsiveContainer width='100%' height={140}>
              <BarChart data={data} barSize={28}>
                <XAxis
                  dataKey='session'
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['dataMin - 50', 'dataMax + 20']} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 10px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Bar dataKey='score' radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => {
                    const isHighest = entry.score === Math.max(...data.map(d => d.score));
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isHighest ? 'hsl(var(--primary-hover))' : 'hsl(var(--primary))'}
                        opacity={isHighest ? 1 : 0.75}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <StatusCard
            variant='empty'
            title='AMCAT history unavailable'
            description='We could not load your recent AMCAT sessions. Try refreshing when the network is stable.'
            actionLabel='Reload'
            onAction={() => window.location.reload()}
          />
        )}
      </div>
    </motion.div>
  );
}
