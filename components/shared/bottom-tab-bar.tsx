'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, UserCircle, Trophy,
  MoreHorizontal, Activity, Users, GraduationCap,
  FolderOpen, LucideIcon,
  Building2, LibraryBig, Sparkles, Box, Settings,
  FolderPlus, Star, BarChart, CalendarDays, Bot,
} from 'lucide-react';
import BottomDrawer, { type DrawerLink } from '@/components/shared/bottom-drawer';
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
  { href: '/faculty',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/faculty/drives',   label: 'Drives',   icon: FolderOpen },
  { href: '/faculty/students', label: 'Students', icon: GraduationCap },
  { label: 'More', icon: MoreHorizontal, isMore: true },
];

const ADMIN_TABS: Tab[] = [
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/drives',   label: 'Drives',   icon: Briefcase },
  { href: '/admin/users',    label: 'Users',    icon: Users },
  { label: 'More', icon: MoreHorizontal, isMore: true },
];

const TABS_BY_ROLE: Record<string, Tab[]> = {
  student: STUDENT_TABS,
  faculty: FACULTY_TABS,
  admin: ADMIN_TABS,
};

const STUDENT_MORE: DrawerLink[] = [
  { href: '/student/companies', label: 'Companies', icon: Building2 },
  { href: '/student/resources', label: 'Resources', icon: LibraryBig },
  { href: '/student/career-coach', label: 'Career Coach', icon: Sparkles },
  { href: '/student/sandbox', label: 'AI Sandbox', icon: Box },
  { href: '/student/settings', label: 'Settings', icon: Settings },
];

const FACULTY_MORE: DrawerLink[] = [
  { href: '/faculty/drives/new', label: 'New Drive', icon: FolderPlus },
  { href: '/faculty/resources', label: 'Resources', icon: LibraryBig },
  { href: '/faculty/sandbox', label: 'Sandbox', icon: Box },
  { href: '/faculty/settings', label: 'Settings', icon: Settings },
];

const ADMIN_MORE: DrawerLink[] = [
  { href: '/admin/health',      label: 'System Health', icon: Activity },
  { href: '/admin/experiences', label: 'Experiences',   icon: Star },
  { href: '/admin/resources',   label: 'Resources',     icon: LibraryBig },
  { href: '/admin/amcat',       label: 'AMCAT',         icon: BarChart },
  { href: '/admin/seasons',     label: 'Seasons',       icon: CalendarDays },
  { href: '/admin/ai-models',   label: 'AI Models',     icon: Bot },
  { href: '/admin/sandbox',     label: 'Sandbox',       icon: Box },
  { href: '/admin/settings',    label: 'Settings',      icon: Settings },
];

const MORE_BY_ROLE: Record<string, DrawerLink[]> = {
  student: STUDENT_MORE,
  faculty: FACULTY_MORE,
  admin: ADMIN_MORE,
};

interface BottomTabBarProps {
  userRole: 'student' | 'faculty' | 'admin';
  userName: string;
}

export default function BottomTabBar({ userRole, userName }: BottomTabBarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const tabs = TABS_BY_ROLE[userRole] ?? STUDENT_TABS;
  const moreLinks = MORE_BY_ROLE[userRole] ?? STUDENT_MORE;

  const isTabActive = (tab: Tab) => {
    if (!tab.href) return false;
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  };

  const isMoreActive = moreLinks.some((link) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href)
  );

  return (
    <>
      {/* Tab Bar — mobile only */}
      <nav
        className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.06)]'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        aria-label='Mobile navigation'
      >
        <div className={cn(
          'grid h-14',
          tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
        )}>
          {tabs.map((tab) => {
            const active = tab.isMore ? isMoreActive : isTabActive(tab);

            if (tab.isMore) {
              return (
                <button
                  key='more'
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-[0.92]',
                    isMoreActive || drawerOpen
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label='More navigation options'
                  aria-haspopup='dialog'
                  aria-expanded={drawerOpen}
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
                className='relative flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-[0.92]'
                aria-current={active ? 'page' : undefined}
              >
                {/* Active background pill */}
                {active && (
                  prefersReducedMotion ? (
                    <div className='absolute inset-x-3 top-1.5 h-8 rounded-lg bg-primary/10' />
                  ) : (
                    <motion.div
                      layoutId={`tab-active-${userRole}`}
                      className='absolute inset-x-3 top-1.5 h-8 rounded-lg bg-primary/10'
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )
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

      <BottomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        links={moreLinks}
        userName={userName}
      />
    </>
  );
}
