'use client';

import { motion } from 'framer-motion';
import { User, Zap, FolderOpen, FileText } from 'lucide-react';

export type ProfileTab = 'identity' | 'skills' | 'projects' | 'documents';

interface ProfileTabNavProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'skills',   label: 'Skills',   icon: Zap },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'documents',label: 'Documents',icon: FileText },
];

export default function ProfileTabNav({ active, onChange }: ProfileTabNavProps) {
  return (
    <div className='grid grid-cols-4 items-stretch border-b border-border' role='tablist' aria-label='Profile sections'>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          id={`profile-tab-${id}`}
          type='button'
          role='tab'
          aria-selected={active === id}
          aria-controls={`profile-tabpanel-${id}`}
          tabIndex={active === id ? 0 : -1}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
            active === id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={14} className='shrink-0' />
          <span className='max-w-full truncate text-[11px] sm:text-sm'>{label}</span>
          {active === id && (
            <motion.div
              layoutId='profile-tab-indicator'
              className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full'
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
