'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import SignOutButton from './sign-out-button';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { cn } from '@/lib/utils';

export interface DrawerLink {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
}

interface BottomDrawerProps {
  open: boolean;
  onClose: () => void;
  links: DrawerLink[];
  userName: string;
}

export default function BottomDrawer({ open, onClose, links, userName }: BottomDrawerProps) {
  const pathname = usePathname();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeMobileSidebar = useSidebarStore((state) => state.closeMobile);

  useEffect(() => {
    if (!open) return;

    closeMobileSidebar();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open, onClose, closeMobileSidebar]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key='drawer-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className='fixed inset-0 bg-black/50 z-[60] md:hidden'
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            key='drawer-sheet'
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            drag='y'
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className='fixed bottom-0 left-0 right-0 z-[61] md:hidden bg-card rounded-t-2xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col'
            style={{
              maxHeight: '75vh',
              paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
            }}
            role='dialog'
            aria-modal='true'
            aria-label='More navigation options'
          >
            <div className='flex justify-center pt-3 pb-1'>
              <div className='w-9 h-1 rounded-full bg-border' />
            </div>

            <div className='px-5 pt-1 pb-3'>
              <p className='text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground'>
                More
              </p>
            </div>

            <nav className='flex-1 overflow-y-auto px-3 pb-2' aria-label='Additional navigation'>
              {links.map((link, index) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    ref={index === 0 ? firstLinkRef : undefined}
                    className={cn(
                      'flex items-center gap-3 h-12 px-4 rounded-lg text-sm font-semibold transition-colors duration-150 mb-0.5',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {Icon && <Icon size={18} aria-hidden />}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className='shrink-0 border-t border-border px-5 py-3 flex items-center justify-between'>
              <div className='min-w-0'>
                <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em]'>
                  Signed in as
                </p>
                <p className='text-sm font-semibold text-foreground truncate max-w-[180px]'>
                  {userName}
                </p>
              </div>
              <SignOutButton />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}