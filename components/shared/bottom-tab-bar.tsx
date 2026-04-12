'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, UserCircle, Trophy,
  MoreHorizontal, Activity, Users, GraduationCap,
  FolderOpen, LucideIcon
} from 'lucide-react';
import MobileNav from '@/components/shared/mobile-nav';
import { cn } from '@/lib/utils';

type Tab = {
  href?: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  isMore?: boolean;
  alwaysUnlocked?: boolean;
};

const STUDENT_TABS: Tab[] = [
  { href: '/student/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, exact: true, alwaysUnlocked: true },
  { href: '/student/drives',      label: 'Drives',       icon: Briefcase,                    alwaysUnlocked: false },
  { href: '/student/profile',     label: 'Profile',      icon: UserCircle,                   alwaysUnlocked: false },
  { href: '/student/leaderboard', label: 'Leaderboard',  icon: Trophy,                       alwaysUnlocked: false },
  { label: 'More', icon: MoreHorizontal, isMore: true, alwaysUnlocked: true },
];

const FACULTY_TABS: Tab[] = [
  { href: '/faculty',          label: 'Home',     icon: LayoutDashboard, exact: true },
  { href: '/faculty/drives',   label: 'Drives',   icon: FolderOpen },
  { href: '/faculty/students', label: 'Students', icon: GraduationCap },
  { label: 'More', icon: MoreHorizontal, isMore: true },
];

const ADMIN_TABS: Tab[] = [
  { href: '/admin/health',  label: 'Health',  icon: Activity },
  { href: '/admin/drives',  label: 'Drives',  icon: Briefcase },
  { href: '/admin/users',   label: 'Users',   icon: Users },
  { label: 'More', icon: MoreHorizontal, isMore: true },
];

const TABS_BY_ROLE: Record<string, Tab[]> = {
  student: STUDENT_TABS,
  faculty: FACULTY_TABS,
  admin: ADMIN_TABS,
};

interface BottomTabBarProps {
  userRole: 'student' | 'faculty' | 'admin';
  userName: string;
  onboardingRequired?: boolean;
}

export default function BottomTabBar({ userRole, userName, onboardingRequired }: BottomTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabs = TABS_BY_ROLE[userRole] ?? STUDENT_TABS;

  const shouldGate = userRole === 'student' && onboardingRequired === true;

  const isTabActive = (tab: Tab) => {
    if (!tab.href) return false;
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  };

  const handleBlockedTabPress = () => {
    toast.info('Complete your profile setup first', {
      description: 'Fill in your SAP ID, roll number, and academic details to unlock all features.',
      action: {
        label: 'Go to Setup',
        onClick: () => router.push('/student/onboarding'),
      },
    });
  };

  return (
    <>
      {/* Tab Bar — mobile only */}
      <nav
        className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        aria-label='Mobile navigation'
      >
        <div className={cn(
          'grid h-14',
          tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
        )}>
          {tabs.map((tab) => {
            const active = isTabActive(tab);

            if (tab.isMore) {
            return (
              <button
                key='more'
                onClick={() => setDrawerOpen(true)}
                className='flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors duration-150 hover:text-foreground'
                aria-label='More navigation options'
                aria-haspopup='dialog'
                aria-expanded={drawerOpen}
              >
                <tab.icon size={22} />
                  <span className='text-[10px] font-semibold'>{tab.label}</span>
                </button>
              );
            }

            const isBlocked = shouldGate && !tab.alwaysUnlocked;

            if (isBlocked) {
              return (
                <button
                  key={tab.href}
                  type='button'
                  onClick={handleBlockedTabPress}
                  className='relative flex flex-col items-center justify-center gap-0.5 opacity-50 transition-colors duration-150'
                  aria-label={`${tab.label} (complete setup to unlock)`}
                >
                  <tab.icon size={22} className='relative z-10 text-muted-foreground' />
                  <span className='relative z-10 text-[10px] font-semibold text-muted-foreground'>{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href!}
                className='relative flex flex-col items-center justify-center gap-0.5 transition-colors duration-150'
                aria-current={active ? 'page' : undefined}
              >
                {/* Active background pill */}
                {active && (
                  <motion.div
                    layoutId={`tab-active-${userRole}`}
                    className='absolute inset-x-3 top-1.5 h-8 rounded-lg bg-primary/10'
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <tab.icon
                  size={22}
                  className={cn(
                    'relative z-10 transition-colors duration-150',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className={cn(
                  'relative z-10 text-[10px] font-semibold transition-colors duration-150',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MobileNav drawer — triggered by More tab */}
      {drawerOpen && (
        <MobileNav
          userName={userName}
          userRole={userRole}
          forceOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
