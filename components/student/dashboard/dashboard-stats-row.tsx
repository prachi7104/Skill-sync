"use client";

import { BarChart3, Trophy, Briefcase, LucideIcon, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardStatsRowProps {
  amcatScore: number | null;
  leaderboardRank: number | null;
  activeDrives: number | null;
  profileCompletion: number | null;
}

interface StatDef {
  label: string;
  value: string | null;
  nullLabel: string;
  nullHint: string | null;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  suffix: string;
}

const getStats = (props: DashboardStatsRowProps): StatDef[] => [
  {
    label: 'AMCAT Score',
    value: props.amcatScore !== null ? String(props.amcatScore) : null,
    nullLabel: 'No data',
    nullHint: 'AMCAT results will appear after your next session.',
    icon: BarChart3,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    suffix: '',
  },
  {
    label: 'Leaderboard Rank',
    value: props.leaderboardRank !== null ? `#${props.leaderboardRank}` : null,
    nullLabel: 'Unranked',
    nullHint: 'Complete an AMCAT session to get your rank.',
    icon: Trophy,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    suffix: '',
  },
  {
    label: 'Active Drives',
    value: props.activeDrives !== null ? String(props.activeDrives) : null,
    nullLabel: '0',
    nullHint: null,
    icon: Briefcase,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    suffix: '',
  },
  {
    label: 'Profile Ready',
    value: props.profileCompletion !== null ? String(props.profileCompletion) : null,
    nullLabel: '0',
    nullHint: 'Complete your profile to unlock better drive matches.',
    icon: BadgeCheck,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
    suffix: '%',
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }
};

export default function DashboardStatsRow(props: DashboardStatsRowProps) {
  const stats = getStats(props);
  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='visible'
      className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4'
    >
      {stats.map(stat => (
      <motion.div
        key={stat.label}
        variants={item}
        className='min-h-[108px] rounded-2xl border border-border bg-card/95 p-4 sm:p-4.5'
        aria-label={`${stat.label}: ${stat.value ?? 'not available'}${stat.suffix}`}
      >
          <div className='mb-3 flex items-start justify-between gap-2'>
            <p className='text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground'>
              {stat.label}
            </p>
            <div className={cn('rounded-full p-1.5 shrink-0', stat.iconBg)}>
              <stat.icon size={13} className={stat.iconColor} aria-hidden='true' />
            </div>
          </div>

          {stat.value !== null ? (
            <p className='text-[2rem] font-black leading-none tracking-tight text-foreground'>
              {stat.value}{stat.suffix}
            </p>
          ) : (
            <div>
              <p className='text-xl font-bold tracking-tight text-muted-foreground'>
                {stat.nullLabel}
              </p>
              {stat.nullHint && (
                <p className='mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70'>
                  {stat.nullHint}
                </p>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
