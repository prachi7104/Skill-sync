# Phase 06: Remediation — Verified Bug Fixes

> **Scope:** Fix all issues found during post-implementation audit of Phases 01–05. These are targeted surgical fixes only. No new features, no new components. Every sub-phase points to an exact file and line.
> **Branch:** `ui/enterprise-saas-redesign`
> **Priority:** Complete all sub-phases before beginning Phase 07. Phase 07 (Student Dashboard) depends on a stable sidebar and layout.
> **Workflow:** After all fixes, run `npx tsc --noEmit` to confirm zero TypeScript errors, then `npm run dev` and manually verify: sidebar expands/collapses without flash, tooltip appears on hover in collapsed state, mobile nav shows student links with correct role.

---

## Sub-Phase 06.1: Fix SidebarShell — Initial Width + Hydration Guard

**File to Target:** `components/shared/sidebar-shell.tsx`  
**Context for Copilot:** Two bugs exist. (1) `motion.div` has no `initial` prop — Framer Motion cannot infer the correct starting width so it animates from the browser's computed default (0 or auto) on every page load, causing a visible swoop/flash from 0px → 200px. (2) The Zustand `persist` store reads from `localStorage` on the client but SSR always renders with `isCollapsed: false`. If the user had collapsed the sidebar and refreshes, there is a brief flash as the sidebar expands then collapses. The fix uses a client-side mount guard (`useIsMounted`) to defer reading the persisted store value until after hydration.

**The Copilot Prompt:**
> "Make the following targeted fixes to `components/shared/sidebar-shell.tsx`:
>
> **Fix 1 — Add `initial` prop to `motion.div`:**
> Change the `motion.div` opening tag from:
> ```tsx
> <motion.div
>   animate={{ width: isCollapsed ? 64 : 200 }}
>   transition={{ duration: SIDEBAR_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
>   className='hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0'
> >
> ```
> To:
> ```tsx
> <motion.div
>   initial={false}
>   animate={{ width: isCollapsed ? 64 : 200 }}
>   transition={{ duration: SIDEBAR_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
>   className='hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0'
> >
> ```
> Using `initial={false}` tells Framer Motion not to animate from a starting state on first render — the component appears at the correct width immediately, and only subsequent `animate` changes trigger the transition. This eliminates the 0px → 200px swoosh on every page load.
>
> **Fix 2 — Zustand hydration guard:**
> Add a `useState(false)` mount guard at the top of the component. Read `isCollapsed` from the store only after mount. Before mount, use a safe default of `false` (expanded) which matches the SSR output:
> ```tsx
> const [isMounted, setIsMounted] = useState(false);
> useEffect(() => { setIsMounted(true); }, []);
>
> const storeIsCollapsed = useSidebarStore(state => state.isCollapsed);
> const isCollapsed = isMounted ? storeIsCollapsed : false;
> ```
> Replace the single-line `const { isCollapsed, toggle, collapse } = useSidebarStore();` with the above pattern. Keep `toggle` and `collapse` fetched normally (they are stable references and don't cause hydration issues):
> ```tsx
> const { toggle, collapse } = useSidebarStore();
> ```
> Add `useState` to the React import if not already present.
>
> **Fix 3 — useEffect dependency array:**
> Change the mobile collapse effect from:
> ```tsx
> useEffect(() => {
>   if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MD) {
>     collapse();
>   }
> }, []);
> ```
> To:
> ```tsx
> useEffect(() => {
>   if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MD) {
>     collapse();
>   }
>   // eslint-disable-next-line react-hooks/exhaustive-deps
> }, []);
> ```
> The `collapse` function from Zustand is a stable reference (it never changes between renders), so it is safe to omit from the dependency array. The comment documents this intentionally.
>
> **Final import line for this file:**
> ```tsx
> import { motion, AnimatePresence } from 'framer-motion';
> import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
> import { useSidebarStore } from '@/lib/stores/sidebar-store';
> import { cn } from '@/lib/utils';
> import { useEffect, useState } from 'react';
> import { SIDEBAR_ANIM_MS, BREAKPOINT_MD } from '@/lib/constants/layout';
> ```"

---

## Sub-Phase 06.2: Fix NavItem — Remove Unused Ref + Hydration Guard

**File to Target:** `components/shared/nav-item.tsx`  
**Context for Copilot:** Two bugs. (1) `useRef<HTMLElement>(null)` is declared and spread via `sharedHandlers` onto both `<Link>` (which expects `React.Ref<HTMLAnchorElement>`) and `<button>` (which expects `React.Ref<HTMLButtonElement>`). TypeScript in strict mode will error on this. The `ref` is not used for any functionality in the component — it can be removed entirely without any behavioral change. (2) Same Zustand hydration mismatch as SidebarShell: `isCollapsed` from the persisted store differs between SSR and client first render.

**The Copilot Prompt:**
> "Make the following targeted fixes to `components/shared/nav-item.tsx`:
>
> **Fix 1 — Remove unused ref:**
> Remove these lines entirely:
> ```tsx
> const itemRef = useRef<HTMLElement>(null);
> ```
> Remove `useRef` from the React import line (keep `useState`).
> In `sharedHandlers`, remove the `ref` property:
> ```tsx
> const sharedHandlers = {
>   // REMOVE: ref: itemRef as React.RefObject<any>,
>   onMouseEnter: () => isCollapsed && setShowTooltip(true),
>   onMouseLeave: () => setShowTooltip(false),
>   onFocus: () => isCollapsed && setShowTooltip(true),
>   onBlur: () => setShowTooltip(false),
> };
> ```
> The `sharedHandlers` object now only contains event handlers — no ref.
>
> **Fix 2 — Zustand hydration guard:**
> Add the same mount guard pattern used in SidebarShell:
> ```tsx
> import { useState, useEffect } from 'react';
>
> // Inside the component, before any isCollapsed usage:
> const [isMounted, setIsMounted] = useState(false);
> useEffect(() => { setIsMounted(true); }, []);
> const storeIsCollapsed = useSidebarStore(state => state.isCollapsed);
> const isCollapsed = isMounted ? storeIsCollapsed : false;
> ```
> Replace the existing `const { isCollapsed } = useSidebarStore();` with the above.
>
> **Final import line:**
> ```tsx
> import { useState, useEffect } from 'react';
> ```
> Remove `useRef` from the import. Keep `useState` and add `useEffect`.
>
> **Verify:** After this fix, run `npx tsc --noEmit`. There should be zero TypeScript errors in `nav-item.tsx`. The tooltip still works because `showTooltip` state and the mouse handlers are untouched."

---

## Sub-Phase 06.3: Fix Student Layout — MobileNav Role Prop

**File to Target:** `app/(student)/layout.tsx`  
**Context for Copilot:** `<MobileNav userName={user.name!} />` is missing the `role` prop. While `MobileNav` defaults to `'student'`, explicit props are safer for maintainability — if the default changes, this silently breaks. Additionally, the `MobileNav` component currently renders student links only for role `'student'`, so making the prop explicit ensures the correct link set is always shown regardless of future default changes.

**The Copilot Prompt:**
> "In `app/(student)/layout.tsx`, update line containing `<MobileNav userName={user.name!} />` to:
> ```tsx
> <MobileNav userName={user.name!} role='student' />
> ```
> No other changes to this file. This is a single-prop addition."

---

## Sub-Phase 06.4: Fix AUTH_ERRORS — Restore Missing Configuration Key

**File to Target:** `app/login/page.tsx`  
**Context for Copilot:** The `AUTH_ERRORS` constant originally had a `Configuration` key mapping to a descriptive server error message. This was inadvertently dropped during the Phase 03 refactor. When NextAuth encounters a server configuration problem (misconfigured Azure AD credentials, missing env vars, etc.), it returns `error=Configuration` in the callback URL. Without the key, the error silently falls back to `AUTH_ERRORS.Default`, which gives the user no actionable information.

**The Copilot Prompt:**
> "In `app/login/page.tsx`, update the `AUTH_ERRORS` constant to restore the missing `Configuration` key:
> ```ts
> const AUTH_ERRORS: Record<string, string> = {
>   AccessDenied: 'Access denied. Your account is not authorized.',
>   NotAuthorized: 'Use your @stu.upes.ac.in account for student login.',
>   Configuration: 'Server configuration error. Please contact your placement coordinator.',
>   CredentialsSignin: 'Incorrect email or password.',
>   Default: 'An authentication error occurred. Please try again.',
> };
> ```
> No other changes to this file."

---

## Sub-Phase 06.5: Fix MobileNav — Token Update + Design Alignment

**File to Target:** `components/shared/mobile-nav.tsx`  
**Context for Copilot:** The `MobileNav` drawer was not updated during Phase 05 — it still uses old design patterns: `font-heading` class on the logo, `bg-background` drawer background (light/dark), and old active state classes. The new design requires: (1) logo uses `font-sans` (Inter), (2) the drawer uses `bg-card` with `border-r border-border` (light/dark aware, since the mobile drawer is NOT always dark — only the desktop sidebar is always dark), (3) active states use `bg-primary/10 text-primary`, (4) the overlay uses Framer Motion `AnimatePresence` for a smooth entrance, (5) the hamburger button uses `h-9 w-9` touch target. The drawer does NOT use the sidebar dark tokens — it uses card/background tokens since it overlays the light/dark content area.

**The Copilot Prompt:**
> "Rewrite `components/shared/mobile-nav.tsx` completely. Preserve all imports that are still used, the `ROLE_LINKS` data structure, the `NavLink` interface, and the component prop signature (`userName`, `role`).
>
> **Updated imports:**
> ```tsx
> 'use client';
> import { useState } from 'react';
> import Link from 'next/link';
> import { usePathname } from 'next/navigation';
> import { motion, AnimatePresence } from 'framer-motion';
> import {
>   LayoutDashboard, UserCircle, Briefcase, Box, FolderOpen,
>   Plus, Menu, X, LucideIcon, Activity, Users, CalendarDays
> } from 'lucide-react';
> import SignOutButton from './sign-out-button';
> import { cn } from '@/lib/utils';
> ```
>
> **`ROLE_LINKS` stays unchanged** — same links as before.
>
> **Component:**
> ```tsx
> export default function MobileNav({
>   userName,
>   role = 'student',
> }: {
>   userName: string;
>   role?: 'student' | 'faculty' | 'admin';
> }) {
>   const links = ROLE_LINKS[role] || [];
>   const [open, setOpen] = useState(false);
>   const pathname = usePathname();
>
>   return (
>     <>
>       {/* Hamburger — mobile only */}
>       <button
>         onClick={() => setOpen(true)}
>         className='md:hidden flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150'
>         aria-label='Open navigation menu'
>       >
>         <Menu size={20} />
>       </button>
>
>       <AnimatePresence>
>         {open && (
>           <>
>             {/* Overlay */}
>             <motion.div
>               key='overlay'
>               initial={{ opacity: 0 }}
>               animate={{ opacity: 1 }}
>               exit={{ opacity: 0 }}
>               transition={{ duration: 0.18 }}
>               className='fixed inset-0 bg-black/50 z-40 md:hidden'
>               onClick={() => setOpen(false)}
>               aria-hidden='true'
>             />
>
>             {/* Drawer */}
>             <motion.div
>               key='drawer'
>               initial={{ x: '-100%' }}
>               animate={{ x: 0 }}
>               exit={{ x: '-100%' }}
>               transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
>               className='fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 flex flex-col md:hidden'
>             >
>               {/* Drawer header */}
>               <div className='h-14 shrink-0 flex items-center justify-between px-5 border-b border-border'>
>                 <span className='font-sans text-base font-black tracking-tight text-foreground select-none'>
>                   Skill<span className='text-primary'>Sync.</span>
>                 </span>
>                 <button
>                   onClick={() => setOpen(false)}
>                   className='flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150'
>                   aria-label='Close navigation menu'
>                 >
>                   <X size={18} />
>                 </button>
>               </div>
>
>               {/* Nav links */}
>               <nav className='flex-1 overflow-y-auto py-3 px-3' aria-label='Mobile navigation'>
>                 {links.map((link) => {
>                   const isActive = link.exact
>                     ? pathname === link.href
>                     : pathname.startsWith(link.href);
>                   return (
>                     <Link
>                       key={link.href}
>                       href={link.href}
>                       onClick={() => setOpen(false)}
>                       className={cn(
>                         'flex items-center gap-3 h-11 px-3 rounded-md text-sm font-semibold transition-colors duration-150 mb-0.5',
>                         isActive
>                           ? 'bg-primary/10 text-primary border border-primary/20'
>                           : 'text-muted-foreground hover:bg-muted hover:text-foreground'
>                       )}
>                     >
>                       {link.icon && <link.icon size={18} aria-hidden='true' />}
>                       {link.label}
>                     </Link>
>                   );
>                 })}
>               </nav>
>
>               {/* Drawer footer */}
>               <div className='shrink-0 border-t border-border px-5 py-4 space-y-3'>
>                 <div>
>                   <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1'>
>                     Signed in as
>                   </p>
>                   <p className='text-sm font-semibold text-foreground truncate'>{userName}</p>
>                 </div>
>                 <SignOutButton />
>               </div>
>             </motion.div>
>           </>
>         )}
>       </AnimatePresence>
>     </>
>   );
> }
> ```
>
> **Key changes:**
> - Logo: `font-heading` → `font-sans`
> - Drawer: `bg-background` → `bg-card` (light-aware, NOT the dark sidebar tokens)
> - Overlay: now animated with Framer Motion `AnimatePresence`
> - Drawer slides in from left with Framer Motion instead of conditional render only
> - Hamburger button: `p-2` → `h-9 w-9 flex items-center justify-center` (proper 36px touch target)
> - Active state: matches new token system (`bg-primary/10 text-primary border border-primary/20`)
> - Font size on nav links: `text-sm` consistent with sidebar labels
> - `NavLink` interface and `ROLE_LINKS` data are unchanged"

---

## Sub-Phase 06.6: Create PWA Icon Placeholders

**File to Target:** `public/icons/` (new directory), `scripts/generate-icons.md` (new file)  
**Context for Copilot:** The `manifest.json` references `/icons/icon-192.png` and `/icons/icon-512.png`. Without these files, the PWA install prompt fails silently and Chrome DevTools shows a manifest parse error. Actual icon files need to be created using the SkillSync brand color (#5A77DF). Since we cannot generate binary PNG files here, we create a script that can be run once to generate the icons programmatically, plus placeholder SVG files that can serve as temporary standin icons until proper PNGs are produced.

**The Copilot Prompt:**
> "Create the following files to resolve the missing PWA icon error:
>
> **File 1: `public/icons/icon.svg`** — A simple SVG that will be used as the source for icon generation:
> ```svg
> <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
>   <rect width='512' height='512' rx='96' fill='#08112F'/>
>   <text
>     x='256'
>     y='320'
>     font-family='Inter, system-ui, sans-serif'
>     font-size='260'
>     font-weight='900'
>     text-anchor='middle'
>     fill='#5A77DF'
>   >S</text>
> </svg>
> ```
>
> **File 2: `scripts/generate-pwa-icons.js`** — A Node.js script that generates the required PNG icons from the SVG. Run this once with `node scripts/generate-pwa-icons.js`:
> ```js
> /**
>  * PWA Icon Generator for SkillSync
>  * Run: node scripts/generate-pwa-icons.js
>  * Requires: npm install sharp (dev dependency only)
>  *
>  * If sharp is not available, manually export the SVG at 192x192 and 512x512
>  * from Figma/Inkscape and place in public/icons/
>  */
> const fs = require('fs');
> const path = require('path');
>
> const ICON_DIR = path.join(__dirname, '../public/icons');
>
> // Ensure directory exists
> if (!fs.existsSync(ICON_DIR)) {
>   fs.mkdirSync(ICON_DIR, { recursive: true });
> }
>
> try {
>   const sharp = require('sharp');
>   const svgBuffer = fs.readFileSync(path.join(ICON_DIR, 'icon.svg'));
>
>   Promise.all([
>     sharp(svgBuffer).resize(192, 192).png().toFile(path.join(ICON_DIR, 'icon-192.png')),
>     sharp(svgBuffer).resize(512, 512).png().toFile(path.join(ICON_DIR, 'icon-512.png')),
>   ]).then(() => {
>     console.log('PWA icons generated successfully:');
>     console.log('  public/icons/icon-192.png');
>     console.log('  public/icons/icon-512.png');
>   }).catch(err => {
>     console.error('Icon generation failed:', err.message);
>   });
> } catch {
>   console.log('sharp not installed. Install with: npm install --save-dev sharp');
>   console.log('Then re-run: node scripts/generate-pwa-icons.js');
>   console.log('Alternatively, manually export public/icons/icon.svg at 192x192 and 512x512 as PNG.');
> }
> ```
>
> **After creating the script:**
> Run `npm install --save-dev sharp` then `node scripts/generate-pwa-icons.js` to produce the two PNG files. Verify that `public/icons/icon-192.png` and `public/icons/icon-512.png` exist before committing.
>
> **Note:** `sharp` is a dev dependency only — it is used solely for the one-time icon generation script and is NOT imported anywhere in the app code."
