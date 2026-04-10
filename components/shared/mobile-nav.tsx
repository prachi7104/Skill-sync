'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  Box,
  FolderOpen,
  Plus,
  Menu,
  X,
  LucideIcon,
  Activity,
  Users,
  CalendarDays,
} from 'lucide-react';
import SignOutButton from './sign-out-button';
import { cn } from '@/lib/utils';

export interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
}

const ROLE_LINKS: Record<string, NavLink[]> = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/profile', label: 'My Profile', icon: UserCircle },
    { href: '/student/drives', label: 'Drives', icon: Briefcase },
    { href: '/student/sandbox', label: 'AI Sandbox', icon: Box },
  ],
  faculty: [
    { href: '/faculty', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/faculty/drives', label: 'My Drives', icon: FolderOpen },
    { href: '/faculty/drives/new', label: 'New Drive', icon: Plus },
  ],
  admin: [
    { href: '/admin/health', label: 'System Health', icon: Activity },
    { href: '/admin/drives', label: 'All Drives', icon: Briefcase },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/seasons', label: 'Seasons', icon: CalendarDays },
  ],
};

export default function MobileNav({
  userName,
  role = 'student',
  forceOpen,
  onClose,
}: {
  userName: string;
  role?: 'student' | 'faculty' | 'admin';
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const links = ROLE_LINKS[role] || [];
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const pathname = usePathname();

  const close = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  return (
    <>
      {/* Hamburger — tablet only */}
      {forceOpen === undefined && (
        <button
          onClick={() => setInternalOpen(true)}
          className='hidden md:flex lg:hidden items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150'
          aria-label='Open navigation menu'
        >
          <Menu size={20} />
        </button>
      )}

      {/* Left edge swipe target — touch only, opens drawer */}
      {forceOpen === undefined && (
        <div
          className='lg:hidden fixed left-0 top-0 bottom-0 w-4 z-30 touch-pan-y'
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleTouchMove = (e: TouchEvent) => {
              if (e.touches[0].clientX - startX > 60) {
                setInternalOpen(true);
                document.removeEventListener('touchmove', handleTouchMove);
              }
            };
            document.addEventListener('touchmove', handleTouchMove, { passive: true });
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', handleTouchMove);
            }, { once: true });
          }}
          aria-hidden='true'
        />
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key='overlay'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className='fixed inset-0 bg-black/50 z-40 lg:hidden'
              onClick={() => close()}
              aria-hidden='true'
            />

            {/* Drawer */}
            <motion.div
              key='drawer'
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              drag='x'
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.3, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) close(); // swipe left 80px = close
              }}
              className='fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 flex flex-col lg:hidden touch-pan-y'
            >
              {/* Drawer header */}
              <div className='h-14 shrink-0 flex items-center justify-between px-5 border-b border-border'>
                <span className='font-sans text-base font-black tracking-tight text-foreground select-none'>
                  Skill<span className='text-primary'>Sync.</span>
                </span>
                <button
                  onClick={() => close()}
                  className='flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150'
                  aria-label='Close navigation menu'
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <nav className='flex-1 overflow-y-auto py-3 px-3' aria-label='Mobile navigation'>
                {links.map((link) => {
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => close()}
                      className={cn(
                        'flex items-center gap-3 h-11 px-3 rounded-md text-sm font-semibold transition-colors duration-150 mb-0.5',
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {link.icon && <link.icon size={18} aria-hidden='true' />}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer footer */}
              <div className='shrink-0 border-t border-border px-5 py-4 space-y-3'>
                <div>
                  <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1'>
                    Signed in as
                  </p>
                  <p className='text-sm font-semibold text-foreground truncate'>{userName}</p>
                </div>
                <SignOutButton />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
