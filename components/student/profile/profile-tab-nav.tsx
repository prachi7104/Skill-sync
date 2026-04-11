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
    <div className='flex items-end gap-0 border-b border-border overflow-x-auto scrollbar-none'>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            active === id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={14} className='shrink-0' />
          <span className='inline text-[11px] sm:text-sm'>{label}</span>
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
