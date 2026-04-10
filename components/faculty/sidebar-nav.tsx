'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderOpen,
  Users, LibraryBig, Settings, Box
} from 'lucide-react';
import NavItem from '@/components/shared/nav-item';

const facultyLinks = [
  { href: '/faculty',                   label: 'Overview',   icon: LayoutDashboard },
  { href: '/faculty/drives',            label: 'Drives',     icon: FolderOpen },
  { href: '/faculty/drives/new',        label: 'New Drive',  icon: FolderOpen }, // shown only when creating
  { href: '/faculty/students',          label: 'Students',   icon: Users },
  { href: '/faculty/resources',         label: 'Resources',  icon: LibraryBig },
  { href: '/faculty/sandbox',           label: 'Sandbox',    icon: Box },
  { href: '/faculty/settings',          label: 'Settings',   icon: Settings },
];

// Filter out the 'New Drive' link from the persistent nav — it appears contextually
const persistentLinks = facultyLinks.filter(l => l.href !== '/faculty/drives/new');

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label='Faculty navigation'>
      {persistentLinks.map(link => (
        <NavItem
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          isActive={
            link.href === '/faculty'
              ? pathname === '/faculty'        // exact match for dashboard only
              : pathname.startsWith(link.href) // prefix match for sub-routes
          }
        />
      ))}
    </nav>
  );
}
