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
