"use client";

import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
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
      style={!prefersReducedMotion ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
      className='flex h-[320px] flex-col rounded-lg border border-border bg-card p-5'
    >
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
            <BarChart3 size={16} className='text-primary' />
          </div>
          <p className='text-[13px] font-bold text-foreground'>AMCAT History</p>
        </div>
        {data && data.length > 0 ? (
          <div className='flex items-center gap-2 text-[12px]'>
            <span className='font-bold text-foreground'>Avg: {Math.round(data.reduce((a, b) => a + b.score, 0) / data.length)}</span>
          </div>
        ) : null}
      </div>

      <div className='min-h-0 flex-1 relative'>
        {data && data.length > 0 ? (
          <>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey='session'
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                  tickMargin={8}
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
