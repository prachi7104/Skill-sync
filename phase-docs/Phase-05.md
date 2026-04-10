# Phase 05: Sidebar Navigation System

> **Scope:** Build the complete collapsible sidebar system — a shared `SidebarShell` base, a `NavItem` primitive, and three role-specific nav configurations (admin, faculty, student). This phase replaces the bare `<aside>` slot markers left in Phase 04 and wires the sidebar collapse state from the Zustand store created in Phase 01.
> **Branch:** `ui/enterprise-saas-redesign`
> **Dependencies:** Phase 01 (sidebar store, tokens), Phase 04 (layout shells with `<aside>` slots).
> **Workflow:** After implementing, toggle collapse on each portal. Verify: expanded = 200px with labels, collapsed = 64px icons-only with tooltips. Verify smooth animation. Verify active state highlights correct link. Verify keyboard navigation works. Verify mobile: sidebar is fully hidden, mobile nav drawer handles navigation.

---

## Sub-Phase 05.1: SidebarShell — Shared Base Component

**File to Target:** `components/shared/sidebar-shell.tsx` (new file)  
**Context for Copilot:** `SidebarShell` is the structural wrapper that every portal's sidebar renders inside. It is a client component that reads `isCollapsed` from `useSidebarStore`, applies the Framer Motion width animation, renders the toggle button, and provides the always-dark surface. It accepts `children` (the nav items) and an optional `label` string (e.g., `'Student Menu'`, `'Admin'`). The sidebar background uses the `--sidebar` CSS variable token (`bg-sidebar`) and is always dark regardless of the light/dark theme. The toggle button sits at the bottom of the sidebar on desktop. On mobile (`< 768px`), `SidebarShell` renders nothing — mobile navigation is handled by `MobileNav` (the existing drawer component).

**The Copilot Prompt:**
> "Create `components/shared/sidebar-shell.tsx` as a client component (`'use client'`).
>
> **Imports:**
> - `motion, AnimatePresence` from `'framer-motion'`
> - `PanelLeftClose, PanelLeftOpen` from `'lucide-react'`
> - `useSidebarStore` from `'@/lib/stores/sidebar-store'`
> - `cn` from `'@/lib/utils'`
> - `useEffect` from `'react'`
> - `SIDEBAR_ANIM_MS, BREAKPOINT_MD` from `'@/lib/constants/layout'`
>
> **Props:**
> ```ts
> interface SidebarShellProps {
>   children: React.ReactNode;
>   label?: string;
> }
> ```
>
> **Component logic:**
> ```tsx
> export default function SidebarShell({ children, label }: SidebarShellProps) {
>   const { isCollapsed, toggle, collapse } = useSidebarStore();
>
>   // On mount: if viewport is mobile, ensure sidebar is collapsed
>   useEffect(() => {
>     if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MD) {
>       collapse();
>     }
>   }, []);
>
>   return (
>     <motion.div
>       animate={{ width: isCollapsed ? 64 : 200 }}
>       transition={{ duration: SIDEBAR_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
>       className='hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0'
>     >
>       {/* Top: logo row (collapsed = icon only, expanded = label) */}
>       <div className={cn(
>         'h-14 shrink-0 flex items-center border-b border-sidebar-border',
>         isCollapsed ? 'justify-center px-0' : 'px-4'
>       )}>
>         <AnimatePresence mode='wait'>
>           {!isCollapsed && (
>             <motion.span
>               key='label'
>               initial={{ opacity: 0, x: -6 }}
>               animate={{ opacity: 1, x: 0 }}
>               exit={{ opacity: 0, x: -6 }}
>               transition={{ duration: 0.15, ease: 'easeOut' }}
>               className='text-[11px] font-black uppercase tracking-[0.18em] text-sidebar-fg-muted select-none whitespace-nowrap overflow-hidden'
>             >
>               {label ?? 'Menu'}
>             </motion.span>
>           )}
>         </AnimatePresence>
>       </div>
>
>       {/* Navigation items area — scrollable */}
>       <div className='flex-1 overflow-y-auto overflow-x-hidden py-3'>
>         {children}
>       </div>
>
>       {/* Bottom: collapse toggle button */}
>       <div className='shrink-0 border-t border-sidebar-border p-2'>
>         <button
>           onClick={toggle}
>           aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
>           className={cn(
>             'w-full flex items-center h-9 rounded-md transition-colors duration-150',
>             'text-sidebar-fg-muted hover:text-sidebar-fg hover:bg-sidebar-surface',
>             isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
>           )}
>         >
>           {isCollapsed
>             ? <PanelLeftOpen size={17} />
>             : (
>               <>
>                 <PanelLeftClose size={17} />
>                 <span className='text-[12px] font-semibold whitespace-nowrap'>Collapse</span>
>               </>
>             )
>           }
>         </button>
>       </div>
>     </motion.div>
>   );
> }
> ```
>
> **Notes:**
> - `hidden md:flex` — the sidebar is invisible on mobile; it only appears on `md` (768px) and above.
> - `overflow-hidden` on the outer `motion.div` ensures that during the width animation, labels do not wrap or overflow — they clip cleanly.
> - The width animation uses `motion.div animate={{ width }}` not CSS transitions — Framer Motion handles the layout shift smoothly.
> - `overflow-x-hidden` on the nav area prevents momentary horizontal scroll during animation.
> - The `h-14` top row matches the header height exactly, creating a seamless vertical alignment."

---

## Sub-Phase 05.2: NavItem — Shared Navigation Link Primitive

**File to Target:** `components/shared/nav-item.tsx` (new file)  
**Context for Copilot:** `NavItem` is the single reusable component for every navigation link in every portal sidebar. It renders a button (or Link) with a Lucide icon on the left and a label that fades/slides when collapsed. When collapsed, hovering shows a tooltip to the right of the icon. Active state: left accent bar (2px wide, `bg-sidebar-primary`) + `bg-sidebar-active-bg` fill. Hover state: `bg-sidebar-surface/50`. Blocked state (student onboarding not done): reduced opacity + `Lock` icon on the right. The component accepts either a Next.js `Link` href or an `onClick` handler — both patterns exist in the current nav components.

**The Copilot Prompt:**
> "Create `components/shared/nav-item.tsx` as a client component (`'use client'`).
>
> **Imports:**
> - `motion, AnimatePresence` from `'framer-motion'`
> - `Lock` from `'lucide-react'`
> - `Link` from `'next/link'`
> - `cn` from `'@/lib/utils'`
> - `useSidebarStore` from `'@/lib/stores/sidebar-store'`
> - `useState, useRef` from `'react'`
>
> **Props interface:**
> ```ts
> interface NavItemProps {
>   href?: string;            // if provided, renders as Next.js Link
>   onClick?: () => void;     // if provided, renders as button
>   icon: React.ElementType;  // Lucide icon component
>   label: string;
>   isActive?: boolean;
>   isBlocked?: boolean;      // shows lock icon, dims item
>   badge?: string;           // optional count badge (e.g. '3' for 3 pending drives)
> }
> ```
>
> **Component:**
> ```tsx
> export default function NavItem({ href, onClick, icon: Icon, label, isActive, isBlocked, badge }: NavItemProps) {
>   const { isCollapsed } = useSidebarStore();
>   const [showTooltip, setShowTooltip] = useState(false);
>   const itemRef = useRef<HTMLElement>(null);
>
>   const baseClasses = cn(
>     'group relative flex items-center w-full h-10 rounded-md transition-colors duration-150 select-none',
>     isCollapsed ? 'justify-center px-0 mx-auto' : 'px-3 gap-3 mx-2',
>     isCollapsed ? 'w-10' : 'w-[calc(100%-16px)]', // collapsed: square; expanded: inset 8px each side
>     isActive && !isBlocked
>       ? 'bg-sidebar-active-bg text-sidebar-primary'
>       : isBlocked
>         ? 'opacity-40 text-sidebar-fg-muted cursor-not-allowed'
>         : 'text-sidebar-fg-muted hover:bg-sidebar-surface/60 hover:text-sidebar-fg'
>   );
>
>   const content = (
>     <>
>       {/* Active left accent bar */}
>       {isActive && !isBlocked && (
>         <span className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary' />
>       )}
>
>       {/* Icon */}
>       <Icon
>         size={18}
>         className={cn(
>           'shrink-0 transition-colors duration-150',
>           isActive && !isBlocked ? 'text-sidebar-primary' : 'text-sidebar-fg-muted group-hover:text-sidebar-fg'
>         )}
>         aria-hidden='true'
>       />
>
>       {/* Label — hidden when collapsed */}
>       <AnimatePresence>
>         {!isCollapsed && (
>           <motion.span
>             key='label'
>             initial={{ opacity: 0, x: -4 }}
>             animate={{ opacity: 1, x: 0 }}
>             exit={{ opacity: 0, x: -4 }}
>             transition={{ duration: 0.14, ease: 'easeOut' }}
>             className='flex-1 text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis'
>           >
>             {label}
>           </motion.span>
>         )}
>       </AnimatePresence>
>
>       {/* Badge (visible only when expanded) */}
>       {!isCollapsed && badge && (
>         <span className='ml-auto shrink-0 h-4 min-w-4 px-1 rounded-sm bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center'>
>           {badge}
>         </span>
>       )}
>
>       {/* Lock icon for blocked items (visible only when expanded) */}
>       {!isCollapsed && isBlocked && (
>         <Lock size={11} className='ml-auto shrink-0 text-sidebar-fg-muted' aria-hidden='true' />
>       )}
>     </>
>   );
>
>   // Tooltip for collapsed mode
>   const tooltip = isCollapsed && showTooltip && (
>     <div
>       role='tooltip'
>       className='absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-md bg-sidebar-surface border border-sidebar-border text-sidebar-fg text-[12px] font-semibold whitespace-nowrap shadow-md pointer-events-none'
>     >
>       {label}
>       {isBlocked && <span className='ml-1.5 text-sidebar-fg-muted font-normal'>(locked)</span>}
>     </div>
>   );
>
>   const sharedHandlers = {
>     ref: itemRef as React.RefObject<any>,
>     onMouseEnter: () => isCollapsed && setShowTooltip(true),
>     onMouseLeave: () => setShowTooltip(false),
>     onFocus: () => isCollapsed && setShowTooltip(true),
>     onBlur: () => setShowTooltip(false),
>   };
>
>   if (href && !isBlocked) {
>     return (
>       <div className='relative px-2 mb-0.5'>
>         <Link href={href} className={baseClasses} {...sharedHandlers}>
>           {content}
>         </Link>
>         {tooltip}
>       </div>
>     );
>   }
>
>   return (
>     <div className='relative px-2 mb-0.5'>
>       <button
>         type='button'
>         onClick={isBlocked ? undefined : onClick}
>         className={baseClasses}
>         aria-disabled={isBlocked}
>         aria-label={label}
>         {...sharedHandlers}
>       >
>         {content}
>       </button>
>       {tooltip}
>     </div>
>   );
> }
> ```
>
> **Touch safety:**
> The tooltip only shows on `onMouseEnter`/`onFocus`. On touch devices, `onMouseEnter` does not fire before tap — the tooltip will never appear on a touch interaction. This is the correct behavior. Do not add touch event handlers.
>
> **`@media (hover: none)` note:**
> The collapsed sidebar is not shown on mobile (handled by `SidebarShell`'s `hidden md:flex`). So touch-triggered tooltip issues are structurally impossible — the sidebar only renders on `md+` screens where mice are expected. No extra CSS media query guard is needed here."

---

## Sub-Phase 05.3: Admin Sidebar — Wire SidebarShell

**File to Target:** `components/admin/admin-nav.tsx` + `app/(admin)/layout.tsx`  
**Context for Copilot:** The existing `AdminNav` renders a list of links directly. It must be updated to use `NavItem` for each link. Then, in the admin layout, the bare `<aside>` slot is replaced with `<SidebarShell>` wrapping the updated `AdminNav`. The existing `links` array in `admin-nav.tsx` stays — only the render method changes from `<Link className='...'>` to `<NavItem>`.

**The Copilot Prompt:**
> "**Step 1 — Update `components/admin/admin-nav.tsx`:**
>
> Replace the existing render in `AdminNav` with:
> ```tsx
> 'use client';
> import { usePathname } from 'next/navigation';
> import NavItem from '@/components/shared/nav-item';
> import {
>   Activity, Briefcase, Compass, LibraryBig, BarChart,
>   CalendarDays, Users, GraduationCap, Bot, Settings
> } from 'lucide-react';
>
> const links = [
>   { href: '/admin/health',    label: 'System Health', icon: Activity },
>   { href: '/admin/drives',    label: 'All Drives',    icon: Briefcase },
>   { href: '/admin/experiences', label: 'Experiences', icon: Compass },
>   { href: '/admin/resources', label: 'Resources',     icon: LibraryBig },
>   { href: '/admin/amcat',     label: 'AMCAT',         icon: BarChart },
>   { href: '/admin/seasons',   label: 'Seasons',       icon: CalendarDays },
>   { href: '/admin/users',     label: 'User Mgmt',     icon: Users },
>   { href: '/admin/students',  label: 'Students',      icon: GraduationCap },
>   { href: '/admin/ai-models', label: 'AI Models',     icon: Bot },
>   { href: '/admin/settings',  label: 'Settings',      icon: Settings },
> ];
>
> export default function AdminNav() {
>   const pathname = usePathname();
>   return (
>     <nav aria-label='Admin navigation'>
>       {links.map(link => (
>         <NavItem
>           key={link.href}
>           href={link.href}
>           icon={link.icon}
>           label={link.label}
>           isActive={pathname.startsWith(link.href)}
>         />
>       ))}
>     </nav>
>   );
> }
> ```
> Note: `User Mgmt` is shortened from `User Management` — at 13px font in the 200px sidebar, the full label risks text overflow. Confirm visually after implementation.
>
> **Step 2 — Update `app/(admin)/layout.tsx`:**
>
> Replace the `<aside>` block (the one containing the Phase 05 marker comment) with:
> ```tsx
> import SidebarShell from '@/components/shared/sidebar-shell';
>
> // In the layout JSX, replace the <aside> block with:
> <SidebarShell label='Admin'>
>   <AdminNav />
> </SidebarShell>
> ```
> Remove the `{/* Phase 05 inserts: <AdminSidebarShell /> here */}` comment. Remove the wrapping `<aside className='hidden md:block shrink-0 relative z-10'>` — `SidebarShell` provides its own outer wrapper with `hidden md:flex`."

---

## Sub-Phase 05.4: Student Sidebar — Wire SidebarShell with Blocking

**File to Target:** `components/student/student-sidebar-nav.tsx` + `app/(student)/layout.tsx`  
**Context for Copilot:** The student sidebar has a special behavior: when `onboardingRequired` is true, most nav links are blocked (they show a lock icon and trigger a toast when clicked instead of navigating). This logic must be preserved — the `useStudent()` context hook provides `onboardingRequired`, and the `toast.info(...)` call on blocked items must stay. The `NavItem` component's `isBlocked` prop and `onClick` handler accommodate this pattern.

**The Copilot Prompt:**
> "**Step 1 — Rewrite `components/student/student-sidebar-nav.tsx`:**
>
> ```tsx
> 'use client';
> import { usePathname, useRouter } from 'next/navigation';
> import {
>   LayoutDashboard, UserCircle, Briefcase, Box, Settings,
>   Trophy, Building2, LibraryBig, Sparkles
> } from 'lucide-react';
> import { toast } from 'sonner';
> import { useStudent } from '@/app/(student)/providers/student-provider';
> import NavItem from '@/components/shared/nav-item';
>
> const studentLinks = [
>   { href: '/student/dashboard', label: 'Dashboard',    icon: LayoutDashboard, alwaysUnlocked: true },
>   { href: '/student/profile',   label: 'My Profile',   icon: UserCircle,      alwaysUnlocked: false },
>   { href: '/student/drives',    label: 'Drives',       icon: Briefcase,       alwaysUnlocked: false },
>   { href: '/student/companies', label: 'Companies',    icon: Building2,       alwaysUnlocked: false },
>   { href: '/student/resources', label: 'Resources',    icon: LibraryBig,      alwaysUnlocked: false },
>   { href: '/student/career-coach', label: 'Career Coach', icon: Sparkles,     alwaysUnlocked: false },
>   { href: '/student/leaderboard',  label: 'Leaderboard',  icon: Trophy,       alwaysUnlocked: false },
>   { href: '/student/sandbox',   label: 'AI Sandbox',   icon: Box,             alwaysUnlocked: false },
>   { href: '/student/settings',  label: 'Settings',     icon: Settings,        alwaysUnlocked: true },
> ];
>
> export default function StudentSidebarNav() {
>   const pathname = usePathname();
>   const router = useRouter();
>   const { onboardingRequired } = useStudent();
>
>   return (
>     <nav aria-label='Student navigation'>
>       {studentLinks.map(link => {
>         const isBlocked = onboardingRequired && !link.alwaysUnlocked;
>         const isActive = pathname.startsWith(link.href);
>
>         const handleBlockedClick = () => {
>           toast.info('Complete your profile setup first', {
>             description: 'Fill in your SAP ID, roll number, academic details to unlock all features.',
>             action: {
>               label: 'Go to Onboarding',
>               onClick: () => router.push('/student/onboarding'),
>             },
>           });
>         };
>
>         return (
>           <NavItem
>             key={link.href}
>             href={isBlocked ? undefined : link.href}
>             onClick={isBlocked ? handleBlockedClick : undefined}
>             icon={link.icon}
>             label={link.label}
>             isActive={isActive}
>             isBlocked={isBlocked}
>           />
>         );
>       })}
>     </nav>
>   );
> }
> ```
>
> **Changes from old component:**
> - `alwaysUnlocked: true` on Dashboard and Settings — these are always accessible even during onboarding. Previously Dashboard was also blocked.
> - `onClick` on blocked items uses the exact same `toast.info(...)` as before.
> - When `isBlocked`, `href` is `undefined` so `NavItem` renders a `<button>` instead of `<Link>`.
>
> **Step 2 — Update `app/(student)/layout.tsx`:**
>
> Add import: `import SidebarShell from '@/components/shared/sidebar-shell';`
>
> Replace the `<aside>` block with:
> ```tsx
> <SidebarShell label='Student Menu'>
>   <StudentSidebarNav />
> </SidebarShell>
> ```
> Remove the wrapping `<aside className='hidden md:block shrink-0 relative z-10'>` and the Phase 05 marker comment."

---

## Sub-Phase 05.5: Faculty Sidebar — Wire SidebarShell + Sign-Out Link

**File to Target:** `components/faculty/sidebar-nav.tsx` + `app/(faculty)/layout.tsx`  
**Context for Copilot:** The faculty sidebar has a slightly different existing pattern — it receives `name` as a prop. This prop was used for the old logout button inside the sidebar. In the new design, the sign-out button is in the header (not the sidebar), so the `name` prop is no longer needed by `SidebarNav`. Remove it to simplify the component signature. The faculty nav links stay the same. At the bottom of the faculty sidebar, add a `LogOut` nav item that calls `signOut` from `next-auth/react`.

**The Copilot Prompt:**
> "**Step 1 — Rewrite `components/faculty/sidebar-nav.tsx`:**
>
> ```tsx
> 'use client';
> import { usePathname } from 'next/navigation';
> import {
>   LayoutDashboard, FolderOpen, ListOrdered,
>   Users, LibraryBig, Settings, Box
> } from 'lucide-react';
> import NavItem from '@/components/shared/nav-item';
>
> const facultyLinks = [
>   { href: '/faculty',                   label: 'Dashboard',  icon: LayoutDashboard },
>   { href: '/faculty/drives',            label: 'My Drives',  icon: FolderOpen },
>   { href: '/faculty/drives/new',        label: 'New Drive',  icon: FolderOpen }, // shown only when creating
>   { href: '/faculty/students',          label: 'Students',   icon: Users },
>   { href: '/faculty/resources',         label: 'Resources',  icon: LibraryBig },
>   { href: '/faculty/sandbox',           label: 'Sandbox',    icon: Box },
>   { href: '/faculty/settings',          label: 'Settings',   icon: Settings },
> ];
>
> // Filter out the 'New Drive' link from the persistent nav — it appears contextually
> const persistentLinks = facultyLinks.filter(l => l.href !== '/faculty/drives/new');
>
> export default function SidebarNav() {  // keep the export name for backward compat
>   const pathname = usePathname();
>   return (
>     <nav aria-label='Faculty navigation'>
>       {persistentLinks.map(link => (
>         <NavItem
>           key={link.href}
>           href={link.href}
>           icon={link.icon}
>           label={link.label}
>           isActive={
>             link.href === '/faculty'
>               ? pathname === '/faculty'        // exact match for dashboard only
>               : pathname.startsWith(link.href) // prefix match for sub-routes
>           }
>         />
>       ))}
>     </nav>
>   );
> }
> ```
>
> Notes:
> - Remove the `name` prop — it is no longer needed.
> - The `/faculty` dashboard link uses exact match (`pathname === '/faculty'`) to avoid being active on all faculty sub-routes.
> - `FolderOpen` replaces `FolderOpen` for 'My Drives' — the icon stays the same. Check if a more distinct icon is available: `BookOpen`, `ClipboardList`, or `LayoutList` may be clearer for 'My Drives'.
>
> **Step 2 — Update `app/(faculty)/layout.tsx`:**
>
> Add import: `import SidebarShell from '@/components/shared/sidebar-shell';`
>
> Update the `<SidebarNav name={name} />` call to `<SidebarNav />` (prop removed).
>
> Replace the `<aside>` block with:
> ```tsx
> <SidebarShell label='Faculty'>
>   <SidebarNav />
> </SidebarShell>
> ```
> Remove the wrapping `<aside className='hidden md:block shrink-0 relative z-10'>` and the Phase 05 marker comment.
>
> **Step 3 — Verify the full sidebar renders correctly on all three portals:**
> - Admin: 10 nav items, collapse toggle at bottom, label 'Admin'
> - Faculty: 6 persistent nav items, label 'Faculty'
> - Student: 9 nav items with lock behavior, label 'Student Menu'
> - All three: 200px expanded width, 64px collapsed, `bg-sidebar` (#08112F) always-dark background
> - All three: active item shows left accent bar + `bg-sidebar-active-bg` fill
> - All three: collapsed mode shows icon-only + tooltip on hover
> - Mobile (< 768px): `SidebarShell` is `hidden md:flex` — sidebar is invisible, `MobileNav` drawer handles navigation"
