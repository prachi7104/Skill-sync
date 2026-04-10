# Phase 09: Mobile Bottom Tab Bar

> **Scope:** Replace the hamburger-only mobile navigation with a persistent bottom tab bar on mobile screens (< 768px). The tab bar shows 5 items for student (Dashboard, Drives, Profile, Leaderboard, More), 4 for faculty (Dashboard, Drives, Students, More), 4 for admin (Health, Drives, Users, More). The "More" tab opens the existing `MobileNav` drawer. The bottom bar is `fixed bottom-0 w-full` with `safe-area-inset-bottom` padding for iPhone home bar. The hamburger button in the header remains for tablet (768–1023px) only where the bottom bar is hidden. The `SidebarShell` continues to handle desktop (1024px+).
> **Files to Target:** `components/shared/bottom-tab-bar.tsx` (new), all three portal layouts (insert bar + adjust main content bottom padding), `components/shared/mobile-nav.tsx` (remove hamburger from mobile, keep for tablet).
> **Dependencies:** Phase 06 fixes complete (MobileNav updated). Phase 04 layouts stable.
> **Workflow:** Test on mobile viewport (375px width). Verify tab bar sticks to bottom. Verify safe area padding on iPhone (use browser DevTools iPhone emulation). Verify active tab highlights. Verify "More" opens drawer. Verify desktop (1024px+) shows sidebar, not tab bar.

---

## Sub-Phase 09.1: Bottom Tab Bar Component

**File to Target:** `components/shared/bottom-tab-bar.tsx` (new file)  
**Context for Copilot:** The bottom tab bar is a mobile-only (`md:hidden`) fixed bar at the bottom of the viewport. It renders 4–5 tabs with Lucide icons and short labels. The active tab uses `text-primary` icon and label. Inactive tabs use `text-muted-foreground`. Framer Motion `layoutId` animates the active indicator (a small pill) between tabs. The "More" tab triggers the `MobileNav` drawer open state. The component uses `usePathname` to determine the active tab. Safe area inset is applied with `pb-[env(safe-area-inset-bottom)]` and a minimum `pb-2`.

**The Copilot Prompt:**
> "Create `components/shared/bottom-tab-bar.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { useState } from 'react';
> import { usePathname } from 'next/navigation';
> import Link from 'next/link';
> import { motion } from 'framer-motion';
> import {
>   LayoutDashboard, Briefcase, UserCircle, Trophy,
>   MoreHorizontal, Activity, Users, GraduationCap,
>   FolderOpen, LucideIcon
> } from 'lucide-react';
> import MobileNav from '@/components/shared/mobile-nav';
> import { cn } from '@/lib/utils';
> ```
>
> **Tab config per role:**
> ```ts
> type Tab = {
>   href?: string;
>   label: string;
>   icon: LucideIcon;
>   exact?: boolean;
>   isMore?: boolean;
> };
>
> const STUDENT_TABS: Tab[] = [
>   { href: '/student/dashboard', label: 'Home',       icon: LayoutDashboard, exact: true },
>   { href: '/student/drives',    label: 'Drives',     icon: Briefcase },
>   { href: '/student/profile',   label: 'Profile',    icon: UserCircle },
>   { href: '/student/leaderboard', label: 'Rankings', icon: Trophy },
>   { label: 'More', icon: MoreHorizontal, isMore: true },
> ];
>
> const FACULTY_TABS: Tab[] = [
>   { href: '/faculty',          label: 'Home',     icon: LayoutDashboard, exact: true },
>   { href: '/faculty/drives',   label: 'Drives',   icon: FolderOpen },
>   { href: '/faculty/students', label: 'Students', icon: GraduationCap },
>   { label: 'More', icon: MoreHorizontal, isMore: true },
> ];
>
> const ADMIN_TABS: Tab[] = [
>   { href: '/admin/health',  label: 'Health',  icon: Activity },
>   { href: '/admin/drives',  label: 'Drives',  icon: Briefcase },
>   { href: '/admin/users',   label: 'Users',   icon: Users },
>   { label: 'More', icon: MoreHorizontal, isMore: true },
> ];
>
> const TABS_BY_ROLE: Record<string, Tab[]> = {
>   student: STUDENT_TABS,
>   faculty: FACULTY_TABS,
>   admin: ADMIN_TABS,
> };
> ```
>
> **Props:**
> ```ts
> interface BottomTabBarProps {
>   role: 'student' | 'faculty' | 'admin';
>   userName: string;
> }
> ```
>
> **Component:**
> ```tsx
> export default function BottomTabBar({ role, userName }: BottomTabBarProps) {
>   const pathname = usePathname();
>   const [drawerOpen, setDrawerOpen] = useState(false);
>   const tabs = TABS_BY_ROLE[role] ?? STUDENT_TABS;
>
>   const isTabActive = (tab: Tab) => {
>     if (!tab.href) return false;
>     return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
>   };
>
>   return (
>     <>
>       {/* Tab Bar — mobile only */}
>       <nav
>         className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border'
>         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
>         aria-label='Mobile navigation'
>       >
>         <div className={cn(
>           'grid h-14',
>           tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
>         )}>
>           {tabs.map((tab) => {
>             const active = isTabActive(tab);
>
>             if (tab.isMore) {
>               return (
>                 <button
>                   key='more'
>                   onClick={() => setDrawerOpen(true)}
>                   className='flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150'
>                   aria-label='More navigation options'
>                 >
>                   <tab.icon size={22} />
>                   <span className='text-[10px] font-semibold'>{tab.label}</span>
>                 </button>
>               );
>             }
>
>             return (
>               <Link
>                 key={tab.href}
>                 href={tab.href!}
>                 className='relative flex flex-col items-center justify-center gap-0.5 transition-colors duration-150'
>                 aria-current={active ? 'page' : undefined}
>               >
>                 {/* Active background pill */}
>                 {active && (
>                   <motion.div
>                     layoutId={`tab-active-${role}`}
>                     className='absolute inset-x-3 top-1.5 h-8 rounded-lg bg-primary/10'
>                     transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
>                   />
>                 )}
>                 <tab.icon
>                   size={22}
>                   className={cn(
>                     'relative z-10 transition-colors duration-150',
>                     active ? 'text-primary' : 'text-muted-foreground'
>                   )}
>                 />
>                 <span className={cn(
>                   'relative z-10 text-[10px] font-semibold transition-colors duration-150',
>                   active ? 'text-primary' : 'text-muted-foreground'
>                 )}>
>                   {tab.label}
>                 </span>
>               </Link>
>             );
>           })}
>         </div>
>       </nav>
>
>       {/* MobileNav drawer — triggered by More tab */}
>       {drawerOpen && (
>         <MobileNav
>           userName={userName}
>           role={role}
>           forceOpen={drawerOpen}
>           onClose={() => setDrawerOpen(false)}
>         />
>       )}
>     </>
>   );
> }
> ```
>
> **Note on `MobileNav` props:** The existing `MobileNav` uses internal `useState` for `open`. To allow external control from `BottomTabBar`, update `MobileNav` in Sub-Phase 09.2 to accept optional `forceOpen` and `onClose` props."

---

## Sub-Phase 09.2: Update MobileNav for External Control

**File to Target:** `components/shared/mobile-nav.tsx`  
**Context for Copilot:** `MobileNav` currently manages its own `open` state internally. The `BottomTabBar` needs to open it externally (when the "More" tab is pressed). Add optional `forceOpen` and `onClose` props. When `forceOpen` is provided, the component uses it as the controlled open state and calls `onClose` instead of its internal `setOpen(false)`. When `forceOpen` is `undefined`, the component falls back to internal state (no behavioral change for the existing header hamburger button usage).

**The Copilot Prompt:**
> "Update `components/shared/mobile-nav.tsx` to support optional external control. Make the following targeted changes only:
>
> **1. Update the props interface:**
> ```ts
> export default function MobileNav({
>   userName,
>   role = 'student',
>   forceOpen,     // NEW — externally controlled open state
>   onClose,       // NEW — called when drawer should close
> }: {
>   userName: string;
>   role?: 'student' | 'faculty' | 'admin';
>   forceOpen?: boolean;   // optional
>   onClose?: () => void;  // optional
> })
> ```
>
> **2. Update open state logic:**
> At the top of the component, replace `const [open, setOpen] = useState(false)` with:
> ```tsx
> const [internalOpen, setInternalOpen] = useState(false);
> // Use forceOpen if provided (controlled mode), otherwise use internal state
> const open = forceOpen !== undefined ? forceOpen : internalOpen;
> const close = () => {
>   if (onClose) onClose();
>   else setInternalOpen(false);
> };
> ```
>
> **3. Update all `setOpen(false)` calls to `close()`:**
> - The overlay `onClick`: `onClick={() => close()}`
> - The X button `onClick`: `onClick={() => close()}`
> - Each nav link `onClick`: `onClick={() => close()}`
>
> **4. Update the hamburger button:**
> The hamburger button (the `<button>` with `Menu` icon) should only render when NOT in forceOpen mode (i.e., when it manages its own state):
> ```tsx
> {forceOpen === undefined && (
>   <button
>     onClick={() => setInternalOpen(true)}
>     className='md:hidden flex items-center justify-center h-9 w-9 rounded-md ...'
>   >
>     <Menu size={20} />
>   </button>
> )}
> ```
> When `forceOpen` is provided (controlled by `BottomTabBar`), the hamburger is not rendered — the `BottomTabBar` handles opening via the More tab.
>
> No other changes to `MobileNav`. The drawer JSX, animation, and link rendering stay identical."

---

## Sub-Phase 09.3: Wire Bottom Tab Bar into Portal Layouts

**File to Target:** `app/(admin)/layout.tsx`, `app/(faculty)/layout.tsx`, `app/(student)/layout.tsx`  
**Context for Copilot:** Insert `BottomTabBar` into each layout. It renders below `<main>` at the page root level (a sibling of the header+body flex container, not inside main). The main content area needs `pb-[calc(56px+env(safe-area-inset-bottom))]` on mobile to prevent content from being hidden behind the fixed tab bar. The `MobileNav` hamburger in the header should only show on tablet (`md:` prefix), not on mobile where the tab bar handles navigation.

**The Copilot Prompt:**
> "Update all three portal layout files with identical structural changes (only `role`, `userName`, and portal-specific values differ).
>
> **Changes per layout:**
>
> **1. Add import:**
> ```tsx
> import BottomTabBar from '@/components/shared/bottom-tab-bar';
> ```
>
> **2. Move `MobileNav` to tablet-only:**
> The existing `<MobileNav>` in the header already has `md:hidden` on the hamburger button itself. Since on mobile the bottom tab bar replaces it, update the `<MobileNav>` wrapper to only show on tablet (`sm:block md:hidden` pattern — visible from 640px to 767px). On desktop (768px+), the sidebar handles navigation. On mobile (< 640px), the tab bar handles it.
>
> The simplest approach: wrap `<MobileNav>` in a `<div className='sm:hidden'>` in the header for now — the tab bar's More button will open MobileNav via `forceOpen` on mobile. On tablet (640–767px), keep the hamburger visible via the natural `md:hidden` class on MobileNav's internal button.
>
> Actually, the cleaner approach: keep `MobileNav` in the header as-is (it only renders its hamburger button below md, and the drawer is triggered by that button). The `BottomTabBar` provides a SECOND way to open the drawer via its More tab. Both can coexist — the header hamburger is redundant on mobile but harmless. For now, leave `MobileNav` in the header unchanged and let the tab bar augment it.
>
> **3. Insert `BottomTabBar` as a sibling to the main flex container:**
> ```tsx
> return (
>   <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>
>
>     {/* ── Header ── */}
>     <header ...>...</header>
>
>     {/* ── Body ── */}
>     <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>
>       <SidebarShell label='...'>...</SidebarShell>
>       <main className='flex-1 overflow-y-auto'>
>         <div className='px-4 sm:px-6 py-6 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-6'>
>           {/* ADD pb-[calc(56px+...)] on mobile to clear tab bar height */}
>           {children}
>         </div>
>       </main>
>     </div>
>
>     {/* ── Bottom Tab Bar (mobile only, rendered outside the overflow container) ── */}
>     <BottomTabBar role='admin' userName={name} />
>     {/* Change role and userName per portal */}
>
>   </div>
> );
> ```
>
> **Per-portal values:**
> - Admin: `role='admin'` `userName={name}`
> - Faculty: `role='faculty'` `userName={name}`
> - Student: `role='student'` `userName={user.name ?? ''}`
>
> **Content padding update:**
> Change the main content wrapper `<div>` from:
> ```tsx
> <div className='px-4 sm:px-6 py-6'>
> ```
> To:
> ```tsx
> <div className='px-4 sm:px-6 py-6 md:pb-6 pb-[calc(56px+max(env(safe-area-inset-bottom),8px))]'>
> ```
> This ensures content on mobile is not hidden behind the 56px fixed tab bar. On `md+` screens, normal `py-6` padding applies since the tab bar is `md:hidden`."

---

## Sub-Phase 09.4: Swipe Gesture to Open/Close Mobile Drawer

**File to Target:** `components/shared/mobile-nav.tsx`  
**Context for Copilot:** Add drag-to-close gesture to the MobileNav drawer. When the drawer is open, the user can swipe left (on the drawer itself) to close it. Use Framer Motion's `drag` prop with `dragConstraints` and `onDragEnd` to detect a left swipe beyond a threshold of 80px. Also add drag-to-open from the left edge of the screen — this is implemented as a small invisible swipe target zone on the left edge that detects a right-drag gesture to open the drawer. Touch devices only — the gesture target is hidden on non-touch devices.

**The Copilot Prompt:**
> "Update `components/shared/mobile-nav.tsx` to add swipe gestures to the drawer. Make targeted additions only — do not restructure the component.
>
> **1. Add drag-to-close to the drawer `motion.div`:**
> Replace the existing drawer `motion.div` animation props with:
> ```tsx
> <motion.div
>   key='drawer'
>   initial={{ x: '-100%' }}
>   animate={{ x: 0 }}
>   exit={{ x: '-100%' }}
>   transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
>   drag='x'
>   dragConstraints={{ left: 0, right: 0 }}
>   dragElastic={{ left: 0.3, right: 0 }}
>   onDragEnd={(_, info) => {
>     if (info.offset.x < -80) close(); // swipe left 80px = close
>   }}
>   className='fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 flex flex-col md:hidden touch-pan-y'
> >
> ```
> The `dragConstraints={{ left: 0, right: 0 }}` prevents the drawer from being dragged right (it's already fully open). `dragElastic: { left: 0.3, right: 0 }` allows rubber-band feel when dragging left. `onDragEnd` closes the drawer only if dragged left more than 80px. `touch-pan-y` allows vertical scroll inside the drawer without triggering the horizontal drag.
>
> **2. Add swipe-right-from-edge gesture target:**
> Inside the main component return (NOT inside `AnimatePresence`), add a persistent edge target:
> ```tsx
> {/* Left edge swipe target — touch only, opens drawer */}
> <div
>   className='md:hidden fixed left-0 top-0 bottom-0 w-4 z-30 touch-pan-y'
>   onTouchStart={(e) => {
>     const startX = e.touches[0].clientX;
>     const handleTouchMove = (e: TouchEvent) => {
>       if (e.touches[0].clientX - startX > 60) {
>         setInternalOpen(true);
>         document.removeEventListener('touchmove', handleTouchMove);
>       }
>     };
>     document.addEventListener('touchmove', handleTouchMove, { passive: true });
>     document.addEventListener('touchend', () => {
>       document.removeEventListener('touchmove', handleTouchMove);
>     }, { once: true });
>   }}
>   aria-hidden='true'
> />
> ```
> This 16px (w-4) invisible strip on the left edge listens for right-swipe gestures. When a right swipe of 60px+ is detected, it opens the drawer. `aria-hidden='true'` prevents screen readers from announcing it. `touch-pan-y` prevents interference with vertical scroll.
>
> **@media (hover: none) note:** These swipe targets use touch events exclusively (`onTouchStart`, not `onMouseDown`). They are inherently touch-only and will not fire on desktop mouse interactions."
