'use client';

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Box, FolderOpen,
  Menu, X, LucideIcon, Activity, Users, CalendarDays,
  Building2, LibraryBig, Sparkles, Settings,
  GraduationCap, BarChart, Star, Bot
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
    { href: '/student/companies',    label: 'Companies',    icon: Building2 },
    { href: '/student/resources',    label: 'Resources',    icon: LibraryBig },
    { href: '/student/career-coach', label: 'Career Coach', icon: Sparkles },
    { href: '/student/sandbox',      label: 'AI Sandbox',   icon: Box },
    { href: '/student/settings',     label: 'Settings',     icon: Settings },
  ],
  faculty: [
    { href: '/faculty',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { href: '/faculty/drives',       label: 'Drives',       icon: FolderOpen },
    { href: '/faculty/students',     label: 'Students',     icon: GraduationCap },
    { href: '/faculty/resources',    label: 'Resources',    icon: LibraryBig },
    { href: '/faculty/sandbox',      label: 'Sandbox',      icon: Box },
    { href: '/faculty/settings',     label: 'Settings',     icon: Settings },
  ],
  admin: [
    { href: '/admin/health',       label: 'System Health', icon: Activity },
    { href: '/admin/drives',       label: 'All Drives',    icon: Briefcase },
    { href: '/admin/users',        label: 'User Mgmt',     icon: Users },
    { href: '/admin/seasons',      label: 'Seasons',       icon: CalendarDays },
    { href: '/admin/amcat',        label: 'AMCAT',         icon: BarChart },
    { href: '/admin/experiences',  label: 'Experiences',   icon: Star },
    { href: '/admin/resources',    label: 'Resources',     icon: LibraryBig },
    { href: '/admin/students',     label: 'Students',      icon: GraduationCap },
    { href: '/admin/ai-models',    label: 'AI Models',     icon: Bot },
    { href: '/admin/settings',     label: 'Settings',      icon: Settings },
  ],
};

export default function MobileNav({
  userName,
  userRole = 'student',
  forceOpen,
  onClose,
}: {
  userName: string;
  userRole?: 'student' | 'faculty' | 'admin';
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const links = ROLE_LINKS[userRole] || [];
  const [internalOpen, setInternalOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const open = forceOpen !== undefined ? forceOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (forceOpen === undefined) setInternalOpen(false);
  }, [forceOpen, onClose]);

  const handleOpen = useCallback(() => {
    if (forceOpen === undefined) setInternalOpen(true);
  }, [forceOpen]);

  const [edgeStartX, setEdgeStartX] = useState<number | null>(null);

  const handleEdgeSwipeStart = (event: TouchEvent<HTMLDivElement>) => {
    if (open || forceOpen !== undefined) return;
    setEdgeStartX(event.touches[0]?.clientX ?? null);
  };

  const handleEdgeSwipeMove = (event: TouchEvent<HTMLDivElement>) => {
    if (edgeStartX === null || open || forceOpen !== undefined) return;
    const distance = (event.touches[0]?.clientX ?? edgeStartX) - edgeStartX;
    if (distance > 60) {
      setInternalOpen(true);
      setEdgeStartX(null);
    }
  };

  const handleEdgeSwipeEnd = () => {
    setEdgeStartX(null);
  };

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const container = drawerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleClose]);

  return (
    <>
      {/* Left edge swipe target — touch only, opens drawer in uncontrolled mode */}
      <div
        className='fixed inset-y-0 left-0 z-30 w-4 touch-pan-y md:hidden'
        onTouchStart={handleEdgeSwipeStart}
        onTouchMove={handleEdgeSwipeMove}
        onTouchEnd={handleEdgeSwipeEnd}
        aria-hidden='true'
      />

      {/* Hamburger — mobile only */}
      {forceOpen === undefined && (
        <button
          onClick={handleOpen}
          className='flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground md:hidden'
          aria-label='Open navigation menu'
        >
          <Menu size={20} />
        </button>
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
              className='fixed inset-0 z-40 bg-black/50 md:hidden'
              onClick={handleClose}
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
                if (info.offset.x < -80) handleClose();
              }}
              ref={drawerRef}
              className='fixed inset-y-0 left-0 z-50 flex w-[280px] touch-pan-y flex-col border-r border-border bg-card md:hidden'
              role='dialog'
              aria-modal='true'
              aria-label='Mobile navigation menu'
            >
              {/* Drawer header */}
              <div className='flex h-14 shrink-0 items-center justify-between border-b border-border px-5'>
                <span className='select-none font-sans text-base font-black tracking-tight text-foreground'>
                  Skill<span className='text-primary'>Sync.</span>
                </span>
                <button
                  onClick={handleClose}
                  ref={closeButtonRef}
                  className='flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground'
                  aria-label='Close navigation menu'
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <nav className='flex-1 overflow-y-auto p-3' aria-label='Mobile navigation'>
                <p className='px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground'>
                  More
                </p>
                {links.map((link) => {
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleClose}
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
              <div className='shrink-0 space-y-3 border-t border-border px-5 py-4'>
                <div>
                  <p className='mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
                    Signed in as
                  </p>
                  <p className='truncate text-sm font-semibold text-foreground'>{userName}</p>
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
