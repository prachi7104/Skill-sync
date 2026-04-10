'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { SIDEBAR_ANIM_MS, BREAKPOINT_MD } from '@/lib/constants/layout';

interface SidebarShellProps {
  children: React.ReactNode;
  label?: string;
}

export default function SidebarShell({ children, label }: SidebarShellProps) {
  const { isCollapsed, toggle, collapse } = useSidebarStore();

  // On mount: if viewport is mobile, ensure sidebar is collapsed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MD) {
      collapse();
    }
  }, []);

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 200 }}
      transition={{ duration: SIDEBAR_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      className='hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0'
    >
      {/* Top: logo row (collapsed = icon only, expanded = label) */}
      <div className={cn(
        'h-14 shrink-0 flex items-center border-b border-sidebar-border',
        isCollapsed ? 'justify-center px-0' : 'px-4'
      )}>
        <AnimatePresence mode='wait'>
          {!isCollapsed && (
            <motion.span
              key='label'
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className='text-[11px] font-black uppercase tracking-[0.18em] text-sidebar-fg-muted select-none whitespace-nowrap overflow-hidden'
            >
              {label ?? 'Menu'}
            </motion.span>
          )}
        </AnimatePresence>
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
