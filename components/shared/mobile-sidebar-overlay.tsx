'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

interface MobileSidebarOverlayProps {
  children: React.ReactNode;
  label?: string;
}

export default function MobileSidebarOverlay({ children, label }: MobileSidebarOverlayProps) {
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const closeMobile = useSidebarStore((state) => state.closeMobile);
  const prefersReducedMotion = useReducedMotion();

  // Close on Escape
  useEffect(() => {
    if (!isMobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMobileOpen, closeMobile]);

  // Lock body scroll while open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const duration = prefersReducedMotion ? 0 : 0.22;

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          key='mobile-backdrop'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className='md:hidden fixed inset-0 z-[59] bg-black/40'
          onClick={closeMobile}
          aria-hidden='true'
        />
      )}
      {isMobileOpen && (
        <motion.div
          key='mobile-panel'
          initial={{ x: -260 }}
          animate={{ x: 0 }}
          exit={{ x: -260 }}
          transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
          className='md:hidden fixed top-0 left-0 h-full w-[260px] z-[60] flex flex-col bg-sidebar border-r border-sidebar-border'
          role='dialog'
          aria-modal='true'
          aria-label={label ?? 'Navigation menu'}
        >
          {/* Header row */}
          <div className='h-14 shrink-0 flex items-center justify-between px-4 border-b border-sidebar-border'>
            <span className='text-[11px] font-black uppercase tracking-[0.18em] text-sidebar-fg-muted select-none'>
              {label ?? 'Menu'}
            </span>
            <button
              onClick={closeMobile}
              aria-label='Close navigation menu'
              className='flex items-center justify-center h-8 w-8 rounded-md text-sidebar-fg-muted hover:text-sidebar-fg hover:bg-sidebar-surface transition-colors duration-150'
            >
              <X size={17} />
            </button>
          </div>

          {/* Nav items — scrollable */}
          <div className='flex-1 overflow-y-auto overflow-x-hidden py-3'>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
