'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  isCollapsed: boolean;
  /** true when collapse was caused by viewport shrink, not user click */
  collapsedByViewport: boolean;
  /** mobile overlay open state — not persisted */
  isMobileOpen: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  collapseForViewport: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      collapsedByViewport: false,
      isMobileOpen: false,
      toggle: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          collapsedByViewport: false,
        })),
      collapse: () => set({ isCollapsed: true, collapsedByViewport: false }),
      expand: () => set({ isCollapsed: false, collapsedByViewport: false }),
      collapseForViewport: () => set({ isCollapsed: true, collapsedByViewport: true }),
      openMobile: () => set({ isMobileOpen: true }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'skillsync-sidebar',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
