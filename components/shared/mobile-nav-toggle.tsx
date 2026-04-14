'use client';

import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

export default function MobileNavToggle() {
  const openMobile = useSidebarStore((state) => state.openMobile);

  return (
    <button
      onClick={openMobile}
      aria-label='Open navigation menu'
      className='md:hidden flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-accent transition-colors duration-150'
    >
      <Menu size={20} />
    </button>
  );
}
