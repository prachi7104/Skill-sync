"use client";

import { BarChart3, Trophy, Briefcase, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsRowProps {
  amcatScore: number | null;
  leaderboardRank: number | null;
  activeDrives: number | null;
  profileCompletion: number;
}

const getStats = (props: DashboardStatsRowProps) => [
  {
    label: 'AMCAT Score',
    value: props.amcatScore !== null ? String(props.amcatScore) : null,
    icon: BarChart3,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    suffix: '',
  },
  {
    label: 'Leaderboard Rank',
    value: props.leaderboardRank !== null ? `#${props.leaderboardRank}` : null,
    icon: Trophy,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    suffix: '',
  },
  {
    label: 'Active Drives',
    value: props.activeDrives !== null ? String(props.activeDrives) : null,
    icon: Briefcase,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    suffix: '',
  },
  {
    label: 'Profile Complete',
    value: String(props.profileCompletion),
    icon: UserCircle,
    iconColor: 'text-[#3E53A0]',
    iconBg: 'bg-[#3E53A0]/10',
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
      className='grid grid-cols-2 xl:grid-cols-4 gap-3'
    >
      {stats.map(stat => (
        <motion.div
          key={stat.label}
          variants={item}
          className='bg-card border border-border rounded-lg p-4 flex items-start gap-3'
        >
          <div className={`w-9 h-9 rounded-md ${stat.iconBg} flex items-center justify-center shrink-0`}>
            <stat.icon size={18} className={stat.iconColor} />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] text-muted-foreground font-medium truncate'>{stat.label}</p>
            {stat.value !== null ? (
              <p className='text-xl font-black text-foreground leading-tight mt-0.5'>
                {stat.value}<span className='text-sm font-semibold text-muted-foreground'>{stat.suffix}</span>
              </p>
            ) : (
              <div className='h-7 w-16 mt-1 rounded-sm bg-muted overflow-hidden'>
                <div className='h-full w-full animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
