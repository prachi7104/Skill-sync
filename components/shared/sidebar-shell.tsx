'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { SIDEBAR_ANIM_MS, BREAKPOINT_MD } from '@/lib/constants/layout';

interface SidebarShellProps {
  children: React.ReactNode;
  label?: string;
}

export default function SidebarShell({ children, label }: SidebarShellProps) {
  const [isMounted, setIsMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const storeIsCollapsed = useSidebarStore(state => state.isCollapsed);
  const { toggle, collapse } = useSidebarStore();
  const isCollapsed = isMounted ? storeIsCollapsed : false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On mount: if viewport is mobile, ensure sidebar is collapsed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth < BREAKPOINT_MD) {
        collapse();
      } else {
        // re-open once wide enough
        if (storeIsCollapsed) toggle();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapse, toggle, storeIsCollapsed]);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 200 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: SIDEBAR_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      className='hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0'
    >
      {/* Top: logo row (collapsed = icon only, expanded = label) */}
      <div className={cn(
        'h-14 shrink-0 flex items-center border-b border-sidebar-border',
        isCollapsed ? 'justify-center px-0' : 'px-4'
      )}>
        <motion.span
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -6 : 0, maxWidth: isCollapsed ? 0 : 160 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
          className='overflow-hidden whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em] text-sidebar-fg-muted select-none'
        >
          {label ?? 'Menu'}
        </motion.span>
      </div>

      {/* Navigation items area — scrollable */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden py-3'>
        {children}
      </div>

      {/* Bottom: collapse toggle button */}
      <div className='shrink-0 border-t border-sidebar-border p-2'>
        <button
          onClick={toggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center h-9 rounded-md transition-colors duration-150',
            'text-sidebar-fg-muted hover:text-sidebar-fg hover:bg-sidebar-surface',
            isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
          )}
        >
          {isCollapsed
            ? <PanelLeftOpen size={17} />
            : (
              <>
                <PanelLeftClose size={17} />
                <span className='text-[12px] font-semibold whitespace-nowrap'>Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </motion.div>
  );
}
