# Phase 02: Landing Page Redesign

> **Scope:** Full rewrite of `app/page.tsx` and the creation of landing-specific sub-components. The auth redirect logic (session check → role-based redirect) must be preserved exactly. Only the visual presentation changes.
> **Branch:** `ui/enterprise-saas-redesign`
> **Dependencies:** Phase 01 must be complete (tokens, Framer Motion installed).
> **Workflow:** After implementing, verify in browser at `localhost:3000` while logged out. Then verify the redirect still works when logged in as each role.

---

## Sub-Phase 02.1: Landing Page Server Shell

**File to Target:** `app/page.tsx`  
**Context for Copilot:** The current `app/page.tsx` is a server component that handles auth-based redirects (students → `/student/dashboard`, faculty → `/faculty`, admin → `/admin/health`) and then renders the landing UI. The redirect logic using `getCachedSession()` must remain untouched — only the returned JSX changes. The new layout is a dense, full-width, edge-to-edge page with no large horizontal margins. The header is sticky, solid (no blur, no opacity), and contains the logo on the left and login CTA on the right. The main content below the header is split into three vertical sections: (1) Hero section, (2) Feature bento grid, (3) Footer strip. Framer Motion is used via a client wrapper component — the server component itself cannot use hooks.

**The Copilot Prompt:**
> "Rewrite the JSX returned from the `Home` server component in `app/page.tsx`. Do not touch the `getCachedSession()` call or the redirect logic above the return statement. Preserve all existing imports that are still needed.
>
> **New structure to return:**
> ```tsx
> <div className='min-h-screen bg-background flex flex-col font-sans'>
>   <LandingHeader />  {/* sticky header — client component */}
>   <main className='flex-1 flex flex-col'>
>     <LandingHero />         {/* hero — client component for motion */}
>     <LandingFeatureGrid />  {/* bento grid — client component */}
>     <LandingFooterStrip />  {/* footer row — server component */}
>   </main>
> </div>
> ```
>
> Import the four components from:
> - `@/components/landing/landing-header`
> - `@/components/landing/landing-hero`
> - `@/components/landing/landing-feature-grid`
> - `@/components/landing/landing-footer-strip`
>
> Remove all inline JSX from the current `page.tsx` return statement. Remove the imports for `ArrowRight`, `FileText`, `BarChart3`, `Database`, `CheckCircle2`, `ThemeToggle`, and `Link` from this file since those are now handled by the sub-components. Keep only the `getCachedSession` and `redirect` imports.
>
> Add this comment above the return: `// Visual rendering is delegated to landing sub-components. Auth logic above is unchanged.`"

---

## Sub-Phase 02.2: Landing Header Component

**File to Target:** `components/landing/landing-header.tsx` (new file)  
**Context for Copilot:** The landing page header is a sticky top bar with solid background (no backdrop blur, no opacity). It contains the SkillSync logotype on the left and two elements on the right: the theme toggle and a "Sign In" button. On mobile (< 640px), the "Sign In" button label shortens to an icon-only button or just "Login". The header must have exactly `h-14` height, a `border-b border-border` bottom edge, and `bg-background` solid background. It is a client component because it uses the ThemeToggle (which requires client-side state). No animations on the header itself — it appears instantly on load.

**The Copilot Prompt:**
> "Create `components/landing/landing-header.tsx` as a client component (`'use client'`).
>
> **Structure:**
> ```tsx
> <header className='sticky top-0 z-50 h-14 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8'>
>   <Logo />
>   <nav className='flex items-center gap-3'>
>     <ThemeToggle />
>     <SignInButton />
>   </nav>
> </header>
> ```
>
> **Logo element (inline, not a separate component):**
> - A `<Link href='/'>` wrapping a `<span>` with text `Skill` followed by `<span className='text-primary'>Sync.</span>`
> - Tailwind classes on the outer span: `font-sans text-lg font-black tracking-tight text-foreground select-none`
> - No icon, no image — pure typographic logotype
>
> **Sign In button:**
> - A `<Link href='/login'>` styled as a button
> - Tailwind classes: `inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-[#3E53A0] transition-colors duration-150`
> - `hover:bg-[#3E53A0]` maps to the reference's hover state (#3E53A0)
> - On `xs` screens (< 375px): hide the text, show only a `LogIn` Lucide icon (size 16)
> - On `sm`+ screens: show text `Sign In` with a `LogIn` icon (size 15) to the left
> - Import `LogIn` from `lucide-react`
> - Import `ThemeToggle` from `@/components/theme-toggle` (existing component, do not modify it)
>
> **Responsive rules:**
> - `px-4` on mobile, `px-6` on sm, `px-8` on lg — matches the content sections below
> - Header stays exactly `h-14` at all breakpoints
> - No dropdown, no hamburger in the header — the landing page has no sidebar
>
> **No animation on this component.** It renders instantly. Framer Motion is not imported here."

---

## Sub-Phase 02.3: Landing Hero Section

**File to Target:** `components/landing/landing-hero.tsx` (new file)  
**Context for Copilot:** The hero is a dense, left-aligned section with no large margins. It occupies the full width with `px-4 sm:px-6 lg:px-8` padding, and uses a two-column grid on desktop: left column has the headline, sub-text, and CTA buttons; right column shows a static dashboard preview mockup built from real Tailwind components (no images). The hero background is solid `bg-background` — no gradients, no decorative shapes, no radial glows. On mobile, the right column is hidden and the left column takes full width. The section has `py-14 lg:py-20` vertical padding — dense but not cramped. Framer Motion entrance animation staggers the headline, subtext, and buttons from bottom with opacity. Touch devices receive no motion (use CSS media query check inside useEffect).

**The Copilot Prompt:**
> "Create `components/landing/landing-hero.tsx` as a client component (`'use client'`).
>
> **Imports required:**
> - `motion, useReducedMotion` from `'framer-motion'`
> - `Link` from `'next/link'`
> - `ArrowRight, LogIn` from `'lucide-react'`
>
> **Outer section wrapper:**
> ```tsx
> <section className='w-full py-14 lg:py-20 px-4 sm:px-6 lg:px-8 border-b border-border'>
>   <div className='max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
>     <HeroLeft />
>     <HeroRight />  {/* hidden on mobile: add className='hidden lg:block' */}
>   </div>
> </section>
> ```
>
> **HeroLeft — Framer Motion staggered entrance:**
> Use `motion.div` as container with `variants` for stagger:
> ```ts
> const container = {
>   hidden: {},
>   visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
> }
> const item = {
>   hidden: { opacity: 0, y: 14 },
>   visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } }
> }
> ```
> Use `useReducedMotion()` to disable animation when user prefers reduced motion. Use `initial='hidden' animate='visible'` on the container.
>
> Elements inside HeroLeft (each wrapped in `motion.div` with `variants={item}`):
>
> 1. **Status badge:**
>    ```tsx
>    <div className='inline-flex items-center gap-2 h-7 px-3 rounded-sm bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.12em]'>
>      <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
>      Placement Season 2026 Live
>    </div>
>    ```
>
> 2. **Main headline:**
>    ```tsx
>    <h1 className='text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-black text-foreground leading-[1.08] tracking-tight'>
>      The Intelligent<br />
>      <span className='text-primary'>Placement</span> Ecosystem
>    </h1>
>    ```
>    No gradient text. The word "Placement" uses solid `text-primary`.
>
> 3. **Sub-text:**
>    ```tsx
>    <p className='text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[520px] font-normal'>
>      AMCAT-integrated intelligence hub for UPES. AI-native matching,
>      real-time drive analytics, and zero scheduling conflicts — for
>      students, faculty, and administrators.
>    </p>
>    ```
>
> 4. **CTA buttons row:**
>    ```tsx
>    <div className='flex flex-col xs:flex-row gap-3 pt-2'>
>      <Link href='/login'
>        className='inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-[#3E53A0] transition-colors duration-150'>
>        Student SSO Login
>        <ArrowRight size={15} />
>      </Link>
>      <Link href='/login?role=faculty'
>        className='inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors duration-150'>
>        <LogIn size={15} className='text-muted-foreground' />
>        Faculty / Admin
>      </Link>
>    </div>
>    ```
>
> 5. **Trust line (below buttons):**
>    ```tsx
>    <p className='text-[11px] text-muted-foreground font-medium tracking-wide'>
>      Microsoft SSO for students · Credentials for staff · Role-gated access
>    </p>
>    ```
>
> **HeroRight — Static dashboard preview mockup:**
> This is a non-functional visual replica of the dashboard layout to convey the product's density. It is purely decorative and does not render real data.
> ```tsx
> <div className='hidden lg:block'>
>   <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
>     {/* Mini topbar */}
>     <div className='h-10 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-2'>
>       <span className='w-2 h-2 rounded-full bg-sidebar-primary' />
>       <span className='text-[11px] font-bold text-sidebar-fg'>SkillSync</span>
>     </div>
>     {/* Body with mock sidebar + content */}
>     <div className='flex h-[260px]'>
>       {/* Mock sidebar icons */}
>       <div className='w-10 bg-sidebar flex flex-col items-center gap-3 pt-4'>
>         {[0,1,2,3,4].map(i => (
>           <div key={i} className={`w-5 h-5 rounded-sm ${i === 0 ? 'bg-sidebar-primary' : 'bg-sidebar-surface'}`} />
>         ))}
>       </div>
>       {/* Mock content area */}
>       <div className='flex-1 p-4 grid grid-cols-2 gap-3 bg-background overflow-hidden'>
>         {/* Greeting card */}
>         <div className='col-span-2 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-3'>
>           <div className='flex-1'>
>             <div className='w-24 h-2.5 rounded-sm bg-primary/40 mb-1.5' />
>             <div className='w-36 h-1.5 rounded-sm bg-primary/20' />
>           </div>
>           <div className='w-10 h-10 rounded-lg bg-primary/20' />
>         </div>
>         {/* Stats cards */}
>         {[
>           { label: 'AMCAT Score', value: '847', color: 'bg-primary' },
>           { label: 'Drive Rank', value: '#12', color: 'bg-[#3E53A0]' },
>           { label: 'Profile', value: '91%', color: 'bg-success' },
>           { label: 'Active Drives', value: '4', color: 'bg-warning' },
>         ].map(stat => (
>           <div key={stat.label} className='rounded-lg border border-border bg-card p-2.5'>
>             <div className={`w-4 h-4 rounded-sm ${stat.color} mb-2 opacity-80`} />
>             <div className='text-[10px] text-muted-foreground font-medium'>{stat.label}</div>
>             <div className='text-sm font-black text-foreground mt-0.5'>{stat.value}</div>
>           </div>
>         ))}
>       </div>
>     </div>
>   </div>
>   <p className='text-center text-[11px] text-muted-foreground mt-3 font-medium tracking-wide uppercase'>
>     Dashboard preview
>   </p>
> </div>
> ```
>
> **Touch/motion safety:**
> At the top of the component, check `const prefersReducedMotion = useReducedMotion()`. Pass `initial={prefersReducedMotion ? 'visible' : 'hidden'}` to the motion container so reduced-motion users see no animation."

---

## Sub-Phase 02.4: Feature Bento Grid Section

**File to Target:** `components/landing/landing-feature-grid.tsx` (new file)  
**Context for Copilot:** This section renders three feature cards in a horizontal grid layout on desktop and stacked on mobile. Each card represents a core platform capability with a real Lucide icon, a short headline, one sentence of description, and a small visual indicator (a static SVG bar or ring shape). Cards have solid `bg-card` background, `border border-border`, `rounded-xl`, and `p-5` padding. The section has `bg-background` background, `py-12` vertical padding, and `px-4 sm:px-6 lg:px-8` horizontal padding. Cards animate in with Framer Motion `whileInView` using `once: true` so they animate only on first scroll into view. The three features are: AMCAT Integration, AI-Native Drive Matching, and Conflict-Free Scheduling.

**The Copilot Prompt:**
> "Create `components/landing/landing-feature-grid.tsx` as a client component (`'use client'`).
>
> **Imports:**
> - `motion, useReducedMotion` from `'framer-motion'`
> - `BarChart3, Cpu, CalendarCheck, TrendingUp, Users, Shield` from `'lucide-react'`
>
> **Section wrapper:**
> ```tsx
> <section className='w-full py-12 px-4 sm:px-6 lg:px-8 bg-background border-b border-border'>
>   <div className='max-w-[1400px] mx-auto'>
>     <SectionLabel />
>     <FeatureCards />
>   </div>
> </section>
> ```
>
> **Section label (above the grid):**
> ```tsx
> <div className='mb-8'>
>   <span className='text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]'>
>     Platform Capabilities
>   </span>
>   <h2 className='text-2xl sm:text-3xl font-black text-foreground mt-1.5 tracking-tight'>
>     Built for placement-scale operations
>   </h2>
> </div>
> ```
>
> **FeatureCards grid:**
> ```tsx
> <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
>   {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
> </div>
> ```
>
> **Feature data array (define above the component):**
> ```ts
> const features = [
>   {
>     icon: BarChart3,
>     iconColor: 'text-primary',
>     iconBg: 'bg-primary/10',
>     title: 'AMCAT Score Integration',
>     description: 'Published AMCAT sessions are automatically ingested and normalized into student ranking scores. Zero manual entry.',
>     metric: { label: 'Avg. sync time', value: '< 2 min' },
>   },
>   {
>     icon: Cpu,
>     iconColor: 'text-[#3E53A0]',
>     iconBg: 'bg-[#3E53A0]/10',
>     title: 'AI-Native Drive Matching',
>     description: 'The ATS engine parses JDs and student profiles using vector embeddings to surface best-fit candidates automatically.',
>     metric: { label: 'Match accuracy', value: '94%' },
>   },
>   {
>     icon: CalendarCheck,
>     iconColor: 'text-success',
>     iconBg: 'bg-success/10',
>     title: 'Conflict-Free Scheduling',
>     description: 'Drives, deadlines, and shortlists are cross-checked in real time so no student is double-booked across concurrent drives.',
>     metric: { label: 'Conflicts prevented', value: '100%' },
>   },
> ]
> ```
>
> **FeatureCard component (inline, not exported):**
> Each card is a `motion.div` with `whileInView={{ opacity: 1, y: 0 }}`, `initial={{ opacity: 0, y: 16 }}`, `transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}`, `viewport={{ once: true, margin: '-40px' }}`.
>
> Card inner layout:
> ```tsx
> <motion.div
>   className='group rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200'
>   ...motionProps
> >
>   {/* Icon row */}
>   <div className='flex items-start justify-between'>
>     <div className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
>       <feature.icon size={20} className={feature.iconColor} />
>     </div>
>     {/* Metric pill */}
>     <div className='text-right'>
>       <div className='text-[10px] text-muted-foreground font-medium'>{feature.metric.label}</div>
>       <div className='text-sm font-black text-foreground'>{feature.metric.value}</div>
>     </div>
>   </div>
>   {/* Text */}
>   <div>
>     <h3 className='text-base font-bold text-foreground tracking-tight'>{feature.title}</h3>
>     <p className='text-sm text-muted-foreground mt-1.5 leading-relaxed font-normal'>{feature.description}</p>
>   </div>
>   {/* Bottom bar (decorative static progress) */}
>   <div className='mt-auto'>
>     <div className='w-full h-1 rounded-full bg-muted overflow-hidden'>
>       <div className={`h-full rounded-full ${feature.iconBg.replace('/10', '')} opacity-60`}
>         style={{ width: feature.metric.value.includes('%') ? feature.metric.value : '70%' }} />
>     </div>
>   </div>
> </motion.div>
> ```
>
> **Reduced motion:** Wrap the entire component output in a check: `const prefersReducedMotion = useReducedMotion()`. If true, render the cards without motion attributes (plain divs with same class names)."

---

## Sub-Phase 02.5: Landing Footer Strip

**File to Target:** `components/landing/landing-footer-strip.tsx` (new file)  
**Context for Copilot:** A minimal, dense footer strip. Server component (no motion, no client state). Shows three stat numbers on the left (students, drives, companies), the SkillSync logotype in the center, and a copyright line on the right. Background is `bg-card`, height is `py-6`, bordered on top `border-t border-border`. On mobile, stacks vertically with center alignment.

**The Copilot Prompt:**
> "Create `components/landing/landing-footer-strip.tsx` as a server component (no `'use client'` directive, no imports from Framer Motion).
>
> **Outer wrapper:**
> ```tsx
> <footer className='w-full py-6 px-4 sm:px-6 lg:px-8 bg-card border-t border-border'>
>   <div className='max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
>     <StatGroup />
>     <LogoMark />
>     <Copyright />
>   </div>
> </footer>
> ```
>
> **StatGroup — three platform stats:**
> ```tsx
> <div className='flex items-center gap-6'>
>   {[
>     { value: '2,400+', label: 'Students' },
>     { value: '180+', label: 'Drives' },
>     { value: '60+', label: 'Companies' },
>   ].map(s => (
>     <div key={s.label} className='text-center sm:text-left'>
>       <div className='text-base font-black text-foreground'>{s.value}</div>
>       <div className='text-[11px] text-muted-foreground font-medium tracking-wide uppercase'>{s.label}</div>
>     </div>
>   ))}
> </div>
> ```
>
> **LogoMark:**
> ```tsx
> <span className='font-sans text-base font-black tracking-tight text-foreground select-none'>
>   Skill<span className='text-primary'>Sync.</span>
> </span>
> ```
>
> **Copyright:**
> ```tsx
> <p className='text-[11px] text-muted-foreground font-medium text-center sm:text-right'>
>   &copy; {new Date().getFullYear()} UPES Placement Cell
> </p>
> ```
>
> This is a pure server component. No useState, no useEffect, no motion. No navigation links. No social icons."
