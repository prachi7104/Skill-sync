'use client';

import { usePathname } from 'next/navigation';
import NavItem from '@/components/shared/nav-item';
import {
  Activity, Briefcase, Star, LibraryBig, BarChart,
  CalendarDays, Users, GraduationCap, Bot, Settings
} from 'lucide-react';

const links = [
  { href: '/admin/health',      label: 'System Health', icon: Activity },
  { href: '/admin/drives',      label: 'All Drives',    icon: Briefcase },
  { href: '/admin/experiences', label: 'Experiences',   icon: Star },
  { href: '/admin/resources',   label: 'Resources',     icon: LibraryBig },
  { href: '/admin/amcat',       label: 'AMCAT',         icon: BarChart },
  { href: '/admin/seasons',     label: 'Seasons',       icon: CalendarDays },
  { href: '/admin/users',       label: 'User Mgmt',     icon: Users },
  { href: '/admin/students',    label: 'Students',      icon: GraduationCap },
  { href: '/admin/ai-models',   label: 'AI Models',     icon: Bot },
  { href: '/admin/settings',    label: 'Settings',      icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label='Admin navigation'>
      {links.map(link => (
        <NavItem
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          isActive={pathname.startsWith(link.href)}
        />
      ))}
    </nav>
  );
}
