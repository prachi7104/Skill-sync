'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
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
};

const STUDENT_TABS: Tab[] = [
  { href: '/student/dashboard', label: 'Home',       icon: LayoutDashboard, exact: true },
  { href: '/student/drives',    label: 'Drives',     icon: Briefcase },
  { href: '/student/profile',   label: 'Profile',    icon: UserCircle },
  { href: '/student/leaderboard', label: 'Rankings', icon: Trophy },
  { label: 'More', icon: MoreHorizontal, isMore: true },
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
}

export default function BottomTabBar({ userRole, userName }: BottomTabBarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabs = TABS_BY_ROLE[userRole] ?? STUDENT_TABS;

  const isTabActive = (tab: Tab) => {
    if (!tab.href) return false;
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  };

  return (
    <>
      {/* Tab Bar — mobile only */}
      <nav
        className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border'
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
                  className='flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150'
                  aria-label='More navigation options'
                >
                  <tab.icon size={22} />
                  <span className='text-[10px] font-semibold'>{tab.label}</span>
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
