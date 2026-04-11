'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useState, useEffect } from 'react';

interface NavItemProps {
  href?: string;            // if provided, renders as Next.js Link
  onClick?: () => void;     // if provided, renders as button
  icon: React.ElementType;  // Lucide icon component
  label: string;
  isActive?: boolean;
  isBlocked?: boolean;      // shows lock icon, dims item
  badge?: string;           // optional count badge (e.g. '3' for 3 pending drives)
}

export default function NavItem({ href, onClick, icon: Icon, label, isActive, isBlocked, badge }: NavItemProps) {
  const [isMounted, setIsMounted] = useState(false);
  const storeIsCollapsed = useSidebarStore(state => state.isCollapsed);
  const isCollapsed = isMounted ? storeIsCollapsed : false;
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const baseClasses = cn(
    'group relative flex items-center w-full h-10 rounded-md transition-colors duration-150 select-none',
    isCollapsed ? 'justify-center px-0 mx-auto' : 'px-3 gap-3 mx-2',
    isCollapsed ? 'w-10' : 'w-[calc(100%-16px)]', // collapsed: square; expanded: inset 8px each side
    isActive && !isBlocked
      ? 'bg-sidebar-active-bg text-sidebar-primary'
      : isBlocked
        ? 'opacity-40 text-sidebar-fg-muted cursor-not-allowed'
        : 'text-sidebar-fg-muted hover:bg-sidebar-surface/60 hover:text-sidebar-fg'
  );

  const content = (
    <>
      {/* Active left accent bar */}
      {isActive && !isBlocked && (
        <span className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary' />
      )}

      {/* Icon */}
      <Icon
        size={18}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive && !isBlocked ? 'text-sidebar-primary' : 'text-sidebar-fg-muted group-hover:text-sidebar-fg'
        )}
        aria-hidden='true'
      />

      {/* Label — hidden when collapsed */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            key='label'
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className='flex-1 text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis'
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge (visible only when expanded) */}
      {!isCollapsed && badge && (
        <span className='ml-auto shrink-0 h-4 min-w-4 px-1 rounded-sm bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center'>
          {badge}
        </span>
      )}

      {/* Lock icon for blocked items (visible only when expanded) */}
      {!isCollapsed && isBlocked && (
        <Lock size={11} className='ml-auto shrink-0 text-sidebar-fg-muted' aria-hidden='true' />
      )}
    </>
  );

  // Tooltip for collapsed mode
  const tooltip = isCollapsed && showTooltip && (
    <div
      role='tooltip'
      className='absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[201] px-2.5 py-1 rounded-md bg-sidebar-surface border border-sidebar-border text-sidebar-fg text-[12px] font-semibold whitespace-nowrap shadow-md pointer-events-none'
    >
      {label}
      {isBlocked && <span className='ml-1.5 text-sidebar-fg-muted font-normal'>(locked)</span>}
    </div>
  );

  const sharedHandlers = {
    onMouseEnter: () => isCollapsed && setShowTooltip(true),
    onMouseLeave: () => setShowTooltip(false),
    onFocus: () => isCollapsed && setShowTooltip(true),
    onBlur: () => setShowTooltip(false),
  };

  if (href && !isBlocked) {
    return (
      <div className='relative px-2 mb-0.5'>
        <Link href={href} className={baseClasses} {...sharedHandlers}>
          {content}
        </Link>
        {tooltip}
      </div>
    );
  }

  return (
    <div className='relative px-2 mb-0.5'>
      <button
        type='button'
        onClick={isBlocked ? undefined : onClick}
        className={baseClasses}
        aria-disabled={isBlocked}
        aria-label={label}
        {...sharedHandlers}
      >
        {content}
      </button>
      {tooltip}
    </div>
  );
}
