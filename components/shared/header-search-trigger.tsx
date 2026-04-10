"use client";

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('@/components/shared/command-palette'),
  { ssr: false }
);

interface HeaderSearchTriggerProps {
  role: 'student' | 'faculty' | 'admin';
}

export default function HeaderSearchTrigger({ role }: HeaderSearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 text-[12px] font-medium'
        aria-label='Open command palette'
      >
        <Search size={14} />
        <span className='hidden sm:inline'>Search</span>
        <kbd className='hidden md:inline-flex items-center gap-0.5 text-[10px] font-bold opacity-60'>
          {isMac ? '⌘' : 'Ctrl'}<span>K</span>
        </kbd>
      </button>

      {open && (
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          role={role}
        />
      )}
    </>
  );
}
