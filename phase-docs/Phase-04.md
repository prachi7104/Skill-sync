# Phase 04: Global Shell Architecture

> **Scope:** Rewrite the root layout and all three portal layouts (admin, faculty, student). The shell is the persistent chrome — header, sidebar slot, main content area — that every authenticated page sits inside. All server-side auth logic, role guards (`requireRole`), session fetching, `StudentProvider`, and `OnboardingBanner` are preserved exactly. Only the structural JSX and Tailwind classes change.
> **Branch:** `ui/enterprise-saas-redesign`
> **Dependencies:** Phase 01 complete (tokens, sidebar store created). Phase 05 provides the new sidebar component — in this phase, sidebar slot wiring is prepared but the sidebar component itself is a placeholder that Phase 05 fills in.
> **Workflow:** After implementing, verify each portal at `/admin/health`, `/faculty`, and `/student/dashboard` on desktop (1280px) and mobile (375px). Confirm sidebar slot renders, header is correct, and main content scrolls independently.

---

## Sub-Phase 04.1: Root Layout Update

**File to Target:** `app/layout.tsx`  
**Context for Copilot:** The root layout is a server component. It loads fonts, wraps the app in `ThemeProvider`, `AuthProvider`, and `ClientToaster`, and renders children. Three changes are needed: (1) the PWA service worker registration script added in Phase 01 must be present here; (2) the `Plus_Jakarta_Sans` font can remain loaded but will no longer be used visually since `font-heading` now maps to Inter — no removal needed yet; (3) the `metadata` object must be updated with the PWA fields from Phase 01.4. The HTML structure itself stays the same.

**The Copilot Prompt:**
> "Update `app/layout.tsx` with these targeted changes only. Do not restructure the file.
>
> **1. Update the `metadata` export** — merge in the PWA metadata from Phase 01.4. The full updated metadata object should be:
> ```ts
> export const metadata: Metadata = {
>   title: 'SkillSync — Placement Intelligence Hub',
>   description: 'AI-Native Placement Ecosystem for UPES students, faculty, and administrators.',
>   icons: { icon: '/favicon.ico' },
>   manifest: '/manifest.json',
>   appleWebApp: {
>     capable: true,
>     statusBarStyle: 'default',
>     title: 'SkillSync',
>   },
>   formatDetection: { telephone: false },
> };
> ```
>
> **2. Add a `viewport` export** (separate named export, Next.js 14 pattern):
> ```ts
> export const viewport: Viewport = {
>   width: 'device-width',
>   initialScale: 1,
>   maximumScale: 1,
>   userScalable: false,
>   themeColor: [
>     { media: '(prefers-color-scheme: light)', color: '#5A77DF' },
>     { media: '(prefers-color-scheme: dark)', color: '#08112F' },
>   ],
> };
> ```
> Import `Viewport` from `'next'` alongside the existing `Metadata` import.
>
> **3. Add the SW registration script** inside `<body>`, after `<ClientToaster />` and before `</body>`:
> ```tsx
> <script
>   dangerouslySetInnerHTML={{
>     __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
>   }}
> />
> ```
>
> **4. Add `inter.variable` className validation** — ensure the `<html>` tag has both font variables:
> ```tsx
> <html lang='en' className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
> ```
> This line likely already exists. Confirm it is present and unchanged.
>
> No other changes to this file."

---

## Sub-Phase 04.2: Admin Layout Rewrite

**File to Target:** `app/(admin)/layout.tsx`  
**Context for Copilot:** The admin layout is a server component that enforces role-based access via `requireRole(['admin'])`, fetches the session for the user name, and renders the shell. The current shell has a 64px header, a 256px left sidebar (`w-64`), and a main content area. The new shell changes: (1) the header becomes `h-14` (56px) with updated structure; (2) the sidebar slot becomes `w-[200px]` expanded or `w-16` collapsed (the `SidebarShell` component from Phase 05 manages this — the layout only provides the slot); (3) the main content padding changes from the centered `max-w-7xl` pattern to full-bleed with only internal padding, matching the reference's dense edge-to-edge layouts. The `requireRole`, `getServerSession`, `AdminNav`, `MobileNav`, `ThemeToggle`, `SignOutButton`, and `Link` imports all stay.

**The Copilot Prompt:**
> "Rewrite the JSX returned from `AdminLayout` in `app/(admin)/layout.tsx`. Preserve all imports and the auth/session logic above the return statement exactly.
>
> **New return JSX:**
> ```tsx
> return (
>   <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>
>
>     {/* ── Header ── */}
>     <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
>       <div className='flex items-center gap-3'>
>         <Link
>           href='/admin/health'
>           className='font-sans text-base font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
>         >
>           Skill<span className='text-primary'>Sync.</span>
>         </Link>
>         <span className='hidden sm:inline-flex items-center h-5 px-2 rounded-sm bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] text-primary'>
>           Master
>         </span>
>       </div>
>       <div className='flex items-center gap-2 sm:gap-3'>
>         <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
>           {name}
>           <span className='text-primary/60 font-normal ml-1'>(admin)</span>
>         </span>
>         <MobileNav userName={name} role='admin' />
>         <ThemeToggle />
>         <SignOutButton />
>       </div>
>     </header>
>
>     {/* ── Body ── */}
>     <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>
>
>       {/* Sidebar slot — SidebarShell renders AdminNav inside */}
>       <aside className='hidden md:block shrink-0 relative z-10'>
>         {/* Phase 05 inserts: <AdminSidebarShell /> here */}
>         <AdminNav />
>       </aside>
>
>       {/* Main scrollable content */}
>       <main className='flex-1 overflow-y-auto'>
>         <div className='px-4 sm:px-6 py-6'>
>           {children}
>         </div>
>       </main>
>
>     </div>
>   </div>
> );
> ```
>
> **Key changes from the old layout:**
> - Header height: `h-16` (64px) → `h-14` (56px). Update the body height calc accordingly: `calc(100vh - 56px)`.
> - Sidebar: `w-64 p-6 bg-muted/30` → bare `<aside>` slot. The `SidebarShell` in Phase 05 provides its own width and background.
> - Main content: remove `max-w-7xl mx-auto` from `<main>`. Pages that need a max-width container add it themselves. The layout provides full-bleed space.
> - `px-4 sm:px-6 py-6` replaces the old `px-4 py-8 sm:px-6 lg:px-8` — tighter vertical padding, consistent horizontal.
> - Remove the `<div className='mb-8 px-2'><h2>Master Dashboard</h2></div>` section label from inside the sidebar slot — the new `SidebarShell` in Phase 05 handles section labeling internally.
> - Add `antialiased` to the root div.
>
> **Leave the `<aside>` comment in place:** `{/* Phase 05 inserts: <AdminSidebarShell /> here */}` — this is the exact marker Phase 05 will replace."

---

## Sub-Phase 04.3: Faculty Layout Rewrite

**File to Target:** `app/(faculty)/layout.tsx`  
**Context for Copilot:** Same structural changes as the admin layout. The faculty layout wraps the faculty portal pages. It enforces `requireRole(['faculty', 'admin'])` (allowing admins to access faculty routes), fetches session for name and role display. The sidebar slot hosts the faculty nav. Same header pattern, same `calc(100vh - 56px)` body, same full-bleed main content.

**The Copilot Prompt:**
> "Rewrite the JSX returned from `FacultyLayout` in `app/(faculty)/layout.tsx`. Preserve all imports and auth/session logic exactly.
>
> **New return JSX:**
> ```tsx
> return (
>   <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>
>
>     {/* ── Header ── */}
>     <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
>       <div className='flex items-center gap-3'>
>         <Link
>           href='/faculty'
>           className='font-sans text-base font-black tracking-tight text-foreground select-none hover:text-primary transition-colors duration-150'
>         >
>           Skill<span className='text-primary'>Sync.</span>
>         </Link>
>       </div>
>       <div className='flex items-center gap-2 sm:gap-3'>
>         <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
>           {name}
>           <span className='text-primary/60 font-normal ml-1.5 capitalize'>({role})</span>
>         </span>
>         <MobileNav userName={name} role='faculty' />
>         <ThemeToggle />
>         <SignOutButton />
>       </div>
>     </header>
>
>     {/* ── Body ── */}
>     <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>
>
>       {/* Sidebar slot */}
>       <aside className='hidden md:block shrink-0 relative z-10'>
>         {/* Phase 05 inserts: <FacultySidebarShell /> here */}
>         <SidebarNav name={name} />
>       </aside>
>
>       {/* Main scrollable content */}
>       <main className='flex-1 overflow-y-auto'>
>         <div className='px-4 sm:px-6 py-6'>
>           {children}
>         </div>
>       </main>
>
>     </div>
>   </div>
> );
> ```
>
> **Changes from old layout:**
> - Header `h-16` → `h-14`, same as admin.
> - No `bg-muted/30` or `p-6` on sidebar slot.
> - Remove `max-w-7xl mx-auto` from main content area.
> - Remove the `<div><h2>Faculty Menu</h2></div>` section label from sidebar slot.
> - Padding: `px-4 sm:px-6 py-6` on content wrapper.
> - Add the Phase 05 marker comment inside `<aside>`."

---

## Sub-Phase 04.4: Student Layout Rewrite

**File to Target:** `app/(student)/layout.tsx`  
**Context for Copilot:** The student layout is the most complex of the three — it is a server component that also auto-creates the student DB record, derives the SAP ID from the email, computes `onboardingRequired` and `onboardingProgress`, and wraps everything in `<StudentProvider>`. All of this logic must be completely preserved. Only the structural shell JSX changes. The `OnboardingBanner` component renders between the header and the body div — this is preserved. The emoji `⚠️` in the error fallback state must be replaced with a `TriangleAlert` Lucide icon.

**The Copilot Prompt:**
> "Rewrite only the JSX in `app/(student)/layout.tsx`. Preserve all logic above the final return statement: `requireRole`, `getStudentProfile`, the `deriveSapFromEmail` function, the DB auto-create block, the `onboardingRequired` check, and the `onboardingProgress` calculation.
>
> **Error fallback JSX (replace the existing one — remove the emoji, use Lucide icon):**
> ```tsx
> if (!profile) {
>   return (
>     <div className='min-h-screen bg-background flex items-center justify-center p-8'>
>       <div className='text-center space-y-4 max-w-md'>
>         <div className='flex justify-center'>
>           <TriangleAlert size={40} className='text-warning' />
>         </div>
>         <h1 className='text-lg font-bold text-foreground'>Account Setup Required</h1>
>         <p className='text-muted-foreground text-sm leading-relaxed'>
>           Your student profile could not be created. Your college may not be configured yet.
>           Please contact your placement coordinator.
>         </p>
>         <p className='text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-md inline-block'>
>           Error: college_id is null — admin action required
>         </p>
>         <SignOutButton />
>       </div>
>     </div>
>   );
> }
> ```
> Add `TriangleAlert` to the lucide-react import in this file.
>
> **Main return JSX (wrapped in StudentProvider — keep the wrapper):**
> ```tsx
> return (
>   <StudentProvider
>     initialStudent={profile}
>     initialUser={user}
>     onboardingRequired={onboardingRequired}
>     onboardingProgress={onboardingProgress}
>   >
>     <div className='min-h-screen bg-background flex flex-col font-sans text-foreground antialiased'>
>
>       {/* ── Header ── */}
>       <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
>         <div className='flex items-center gap-3'>
>           <span className='font-sans text-base font-black tracking-tight text-foreground select-none'>
>             Skill<span className='text-primary'>Sync.</span>
>           </span>
>         </div>
>         <div className='flex items-center gap-2 sm:gap-3'>
>           <span className='hidden md:block text-[13px] font-medium text-muted-foreground'>
>             {user.name}
>             <span className='text-primary/60 font-normal ml-1'>(student)</span>
>           </span>
>           <MobileNav userName={user.name!} />
>           <ThemeToggle />
>           <SignOutButton />
>         </div>
>       </header>
>
>       {/* Onboarding banner renders here if onboarding is required */}
>       <OnboardingBanner />
>
>       {/* ── Body ── */}
>       <div className='flex flex-1 overflow-hidden' style={{ height: 'calc(100vh - 56px)' }}>
>
>         {/* Sidebar slot */}
>         <aside className='hidden md:block shrink-0 relative z-10'>
>           {/* Phase 05 inserts: <StudentSidebarShell /> here */}
>           <StudentSidebarNav />
>         </aside>
>
>         {/* Main scrollable content */}
>         <main className='flex-1 overflow-y-auto'>
>           <div className='px-4 sm:px-6 py-6'>
>             {children}
>           </div>
>         </main>
>
>       </div>
>     </div>
>   </StudentProvider>
> );
> ```
>
> **Note on `OnboardingBanner`:** It currently renders outside the body div, between the header and the `flex` container. This is correct — the banner pushes content down when visible. Keep it in this exact position. The `style={{ height: 'calc(100vh - 56px)' }}` on the body div must account for the banner dynamically. If the banner adds ~52px, the inner content may clip slightly on very short screens — this is acceptable and will be addressed in the responsive polish phase.
>
> **Remove** the old comment `{/* Soft Dark Canvas using Tailwind Slate */}` and `{/* Premium Glassmorphic Header */}` — these are inaccurate descriptions. Replace with `{/* ── Header ── */}` and `{/* ── Body ── */}` as shown."

---

## Sub-Phase 04.5: Layout Constants File

**File to Target:** `lib/constants/layout.ts` (new file)  
**Context for Copilot:** Layout measurements are referenced in multiple places (layouts, sidebar, mobile nav, page components). Centralizing them prevents drift when values change. This file exports plain TypeScript constants — no React, no imports. It is used by both server and client components via direct import. These constants document the layout grid in one canonical place.

**The Copilot Prompt:**
> "Create `lib/constants/layout.ts`. This is a plain TypeScript module — no imports, no React, no `'use client'` directive.
>
> **File contents:**
> ```ts
> // ─── Shell dimensions ──────────────────────────────────────────────────────────
> // These values are the source of truth for the shell layout grid.
> // If you change any value here, update the corresponding Tailwind class in the
> // relevant layout file (app/(admin)/layout.tsx etc.) to match.
>
> export const HEADER_HEIGHT = 56;            // px — h-14 in Tailwind
> export const HEADER_HEIGHT_CLASS = 'h-14'; // Tailwind class
>
> export const SIDEBAR_WIDTH_EXPANDED = 200;  // px — w-[200px]
> export const SIDEBAR_WIDTH_COLLAPSED = 64;  // px — w-16
> export const SIDEBAR_WIDTH_EXPANDED_CLASS = 'w-[200px]';
> export const SIDEBAR_WIDTH_COLLAPSED_CLASS = 'w-16';
>
> // ─── Breakpoints (match tailwind.config.ts screens) ───────────────────────────
> export const BREAKPOINT_XS = 375;
> export const BREAKPOINT_SM = 640;
> export const BREAKPOINT_MD = 768;   // sidebar appears above this
> export const BREAKPOINT_LG = 1024;
> export const BREAKPOINT_XL = 1280;
>
> // ─── Content padding ──────────────────────────────────────────────────────────
> export const CONTENT_PADDING_X = 'px-4 sm:px-6';  // applied to main content wrapper
> export const CONTENT_PADDING_Y = 'py-6';
>
> // ─── Z-index scale ────────────────────────────────────────────────────────────
> export const Z_HEADER = 50;       // sticky header
> export const Z_SIDEBAR = 40;      // sidebar (below header)
> export const Z_MOBILE_DRAWER = 60; // mobile nav drawer (above header)
> export const Z_MODAL = 70;        // dialogs and modals
> export const Z_TOAST = 80;        // toast notifications
>
> // ─── Animation durations (ms) ─────────────────────────────────────────────────
> export const SIDEBAR_ANIM_MS = 250;   // sidebar expand/collapse
> export const PAGE_ANIM_MS = 350;      // page-level entrance
> export const HOVER_ANIM_MS = 150;     // hover state transitions
> ```
>
> This file has no default export — all exports are named. Components that need these values import only what they use:
> ```ts
> import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_ANIM_MS } from '@/lib/constants/layout';
> ```"
