'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, UserCircle, Briefcase, Box, Settings,
  Trophy, Building2, LibraryBig, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '@/app/(student)/providers/student-provider';
import NavItem from '@/components/shared/nav-item';

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard',    icon: LayoutDashboard, alwaysUnlocked: true },
  { href: '/student/profile',   label: 'Profile',      icon: UserCircle,      alwaysUnlocked: false },
  { href: '/student/drives',    label: 'Drives',       icon: Briefcase,       alwaysUnlocked: false },
  { href: '/student/companies', label: 'Companies',    icon: Building2,       alwaysUnlocked: false },
  { href: '/student/resources', label: 'Resources',    icon: LibraryBig,      alwaysUnlocked: false },
  { href: '/student/career-coach', label: 'Career Coach', icon: Sparkles,     alwaysUnlocked: false },
  { href: '/student/leaderboard',  label: 'Leaderboard',  icon: Trophy,       alwaysUnlocked: false },
  { href: '/student/sandbox',   label: 'AI Sandbox',   icon: Box,             alwaysUnlocked: false },
  { href: '/student/settings',  label: 'Settings',     icon: Settings,        alwaysUnlocked: true },
];

export default function StudentSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingRequired } = useStudent();

  return (
    <nav aria-label='Student navigation'>
      {studentLinks.map(link => {
        const isBlocked = onboardingRequired && !link.alwaysUnlocked;
        const isActive = pathname.startsWith(link.href);

        const handleBlockedClick = () => {
          const returnTo = link.href;
          toast.info('Complete your profile setup first', {
            description: 'Fill in your SAP ID, roll number, academic details to unlock all features.',
            action: {
              label: 'Go to Onboarding',
              onClick: () =>
                router.push(`/student/onboarding?returnTo=${encodeURIComponent(returnTo)}`),
            },
          });
        };

        return (
          <NavItem
            key={link.href}
            href={isBlocked ? undefined : link.href}
            onClick={isBlocked ? handleBlockedClick : undefined}
            icon={link.icon}
            label={link.label}
            isActive={isActive}
            isBlocked={isBlocked}
          />
        );
      })}
    </nav>
  );
}
