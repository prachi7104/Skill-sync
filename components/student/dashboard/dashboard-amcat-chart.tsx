'use client';

import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Minus } from 'lucide-react';
import { useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { StatusCard } from '@/components/ui/status-card';

interface DashboardAMCATChartProps {
  history: {
    session_name: string;
    score: number;
    rank: number | null;
    category: string | null;
    test_date: string | null;
    total_students: number | null;
  }[] | null;
  latest: {
    score: number | null;
    category: string | null;
    rank: number | null;
    cs_score: number | null;
    cp_score: number | null;
    automata_score: number | null;
    automata_fix_score: number | null;
    quant_score: number | null;
    total_students: number | null;
    session_name: string | null;
    test_date: string | null;
  } | null;
  studentName: string;
}

const SECTION_BREAKDOWN = [
  { key: 'cs_score', label: 'CS' },
  { key: 'cp_score', label: 'CP' },
  { key: 'automata_score', label: 'Automata' },
  { key: 'automata_fix_score', label: 'Automata Fix' },
  { key: 'quant_score', label: 'Quant' },
] as const;

export default function DashboardAMCATChart({ history, latest, studentName }: DashboardAMCATChartProps) {
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

  const orderedHistory = [...(history ?? [])].reverse();
  const latestPoint = history?.[0] ?? null;
  const previousPoint = history?.[1] ?? null;
  const average = history && history.length > 0
    ? Math.round(history.reduce((total, entry) => total + entry.score, 0) / history.length)
    : null;
  const delta = latestPoint && previousPoint ? latestPoint.score - previousPoint.score : null;
  const hasTrend = orderedHistory.length > 1;
  const hasLatest = Boolean(latest?.score !== null || latestPoint);
  const sectionBreakdown = latest
    ? SECTION_BREAKDOWN.map((section) => ({
      label: section.label,
      value: latest[section.key],
    }))
    : [];
  const maxSectionScore = Math.max(...sectionBreakdown.map((section) => section.value ?? 0), 1);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={!prefersReducedMotion ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
      className='flex min-h-[320px] flex-col rounded-2xl border border-border bg-card/95 p-5 sm:min-h-[340px] sm:p-6 xl:min-h-[440px]'
    >
      <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
            <BarChart3 size={17} className='text-primary' />
          </div>
          <div>
            <p className='text-[13px] font-bold tracking-tight text-foreground'>AMCAT Intelligence</p>
            <p className='text-[11px] uppercase tracking-[0.08em] text-muted-foreground'>Score trend and section balance</p>
          </div>
        </div>
        {hasLatest ? (
          <div className='flex flex-wrap items-center gap-2 text-[12px]'>
            {latestPoint?.session_name ? (
              <Badge variant='neutral' className='border-border bg-muted/60 text-[11px] font-semibold'>
                {latestPoint.session_name}
              </Badge>
            ) : null}
            {average !== null ? (
              <span className='font-bold text-foreground'>Avg: {average}</span>
            ) : null}
            {delta !== null ? (
              <Badge variant={delta >= 0 ? 'success' : 'warning'} className='text-[11px] font-semibold'>
                {delta >= 0 ? <TrendingUp size={11} /> : <Minus size={11} />} {delta >= 0 ? '+' : ''}{delta}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className='min-h-0 flex-1'>
        {hasLatest ? (
          <>
            {hasTrend ? (
              <div className='h-[220px] sm:h-[250px] xl:h-[280px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={orderedHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' vertical={false} />
                    <XAxis
                      dataKey='session_name'
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={['dataMin - 50', 'dataMax + 20']} />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 12px',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line
                      type='monotone'
                      dataKey='score'
                      stroke='hsl(var(--primary))'
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--card))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary-hover))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
                <div className='rounded-xl border border-border bg-muted/20 p-4'>
                  <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>Latest score</p>
                  <div className='mt-3 flex items-end gap-3'>
                    <p className='text-4xl font-black tracking-tight text-foreground'>{latest?.score ?? latestPoint?.score ?? '—'}</p>
                    {latest?.category ? (
                      <Badge variant='neutral' className='mb-1 border-border bg-background text-[11px] font-semibold'>
                        {latest.category}
                      </Badge>
                    ) : null}
                  </div>
                  <div className='mt-3 space-y-2 text-xs text-muted-foreground'>
                    <p>{latest?.session_name ?? latestPoint?.session_name ?? `${studentName}'s latest session`}</p>
                    <p>
                      {latest?.rank && latest?.total_students
                        ? `Rank #${latest.rank} of ${latest.total_students}`
                        : latestPoint?.rank && latestPoint?.total_students
                          ? `Rank #${latestPoint.rank} of ${latestPoint.total_students}`
                          : 'Rank information will appear once the session is published.'}
                    </p>
                  </div>
                </div>

                <div className='space-y-3'>
                  {sectionBreakdown.map((section) => {
                    const value = section.value ?? 0;
                    const width = Math.max(4, Math.round((value / maxSectionScore) * 100));

                    return (
                      <div key={section.label} className='space-y-1.5'>
                        <div className='flex items-center justify-between text-[11px] font-semibold text-foreground'>
                          <span>{section.label}</span>
                          <span className='text-muted-foreground'>{section.value ?? '—'}</span>
                        </div>
                        <div className='h-2 rounded-full bg-muted'>
                          <div
                            className='h-full rounded-full bg-primary'
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <StatusCard
            variant='empty'
            title='AMCAT history unavailable'
            description={`We could not load recent AMCAT sessions for ${studentName}. Try refreshing when the network is stable.`}
            actionLabel='Reload'
            onAction={() => window.location.reload()}
          />
        )}
      </div>
    </motion.div>
  );
}