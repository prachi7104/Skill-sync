# Phase 03: Login Page Redesign

> **Scope:** Full visual rewrite of `app/login/page.tsx` and extraction into sub-components. Every line of authentication logic — `signIn("azure-ad")`, `signIn("staff-credentials")`, error handling, `useSearchParams`, loading states — is preserved byte-for-byte. Only the JSX structure and Tailwind classes change.
> **Branch:** `ui/enterprise-saas-redesign`
> **Dependencies:** Phase 01 complete (tokens live, Framer Motion installed). No dependency on Phase 02.
> **Workflow:** After implementing, test all three flows in browser: (1) Student SSO button triggers Azure AD redirect, (2) Faculty/Admin button expands inline form, (3) wrong credentials shows error message and auto-clears after 6 seconds. Verify on mobile (375px) and desktop (1280px).

---

## Sub-Phase 03.1: Login Page Shell Restructure

**File to Target:** `app/login/page.tsx`  
**Context for Copilot:** The current file is a single large client component (`LoginForm`) wrapped in a `Suspense` boundary inside `LoginPage`. The auth logic (state variables, handlers, `useEffect` for error clearing) lives entirely in `LoginForm`. The refactor keeps all auth logic in `LoginForm` but moves the JSX into two sub-components: `LoginFormPanel` (left side — the form UI) and `LoginBrandPanel` (right side — the dark branded panel). `LoginForm` passes props down to `LoginFormPanel`. The `Suspense` wrapper and `LoginPage` export stay unchanged.

**The Copilot Prompt:**
> "Refactor `app/login/page.tsx` with the following changes. Do not alter any state declarations, event handlers, `useEffect`, or `signIn` calls — these stay exactly as-is in `LoginForm`.
>
> **Step 1 — Add two imports at the top of the file:**
> ```tsx
> import LoginFormPanel from '@/components/auth/login-form-panel';
> import LoginBrandPanel from '@/components/auth/login-brand-panel';
> ```
>
> **Step 2 — Replace the entire `return` statement inside `LoginForm` with:**
> ```tsx
> return (
>   <div className='min-h-screen bg-background font-sans grid grid-cols-1 lg:grid-cols-[1fr_1fr]'>
>     <LoginFormPanel
>       errorMessage={errorMessage}
>       isStudentLoading={isStudentLoading}
>       isStaffLoading={isStaffLoading}
>       showStaffForm={showStaffForm}
>       staffEmail={staffEmail}
>       staffPassword={staffPassword}
>       showPassword={showPassword}
>       onStudentLogin={handleStudentLogin}
>       onShowStaffForm={() => setShowStaffForm(true)}
>       onHideStaffForm={() => { setShowStaffForm(false); setErrorMessage(null); }}
>       onStaffEmailChange={(v) => setStaffEmail(v)}
>       onStaffPasswordChange={(v) => setStaffPassword(v)}
>       onTogglePassword={() => setShowPassword(v => !v)}
>       onStaffSubmit={handleStaffLogin}
>     />
>     <LoginBrandPanel />
>   </div>
> );
> ```
>
> **Step 3 — Remove from `LoginForm`** all JSX that was previously in the return statement. All state and handler function bodies remain.
>
> The `LoginPage` export at the bottom of the file stays completely unchanged:
> ```tsx
> export default function LoginPage() {
>   return (
>     <Suspense fallback={...}>
>       <LoginForm />
>     </Suspense>
>   );
> }
> ```
>
> **TypeScript:** Define and export a `LoginFormPanelProps` interface in `components/auth/login-form-panel.tsx` for the props listed above. Import it in `page.tsx` if needed, or rely on TypeScript inference — whichever avoids duplication."

---

## Sub-Phase 03.2: Login Form Panel Component

**File to Target:** `components/auth/login-form-panel.tsx` (new file)  
**Context for Copilot:** This is the left half of the login page — the form UI. It is a client component that receives all auth state and handlers as props. It does not own any state. The panel has a solid `bg-background` surface, full height (`min-h-screen` on mobile, `h-full` on desktop when inside the grid), and uses `flex flex-col justify-center` for vertical centering. The content is constrained to `max-w-[420px]` and padded `px-6 sm:px-10 lg:px-16 py-12`. Framer Motion is used for: (1) the error message sliding in from above, (2) the staff credentials form expanding with height animation, (3) each button entrance on mount with a stagger. Touch motion disabled via `useReducedMotion`.

**The Copilot Prompt:**
> "Create `components/auth/login-form-panel.tsx` as a client component (`'use client'`).
>
> **Props interface:**
> ```ts
> interface LoginFormPanelProps {
>   errorMessage: string | null;
>   isStudentLoading: boolean;
>   isStaffLoading: boolean;
>   showStaffForm: boolean;
>   staffEmail: string;
>   staffPassword: string;
>   showPassword: boolean;
>   onStudentLogin: () => void;
>   onShowStaffForm: () => void;
>   onHideStaffForm: () => void;
>   onStaffEmailChange: (v: string) => void;
>   onStaffPasswordChange: (v: string) => void;
>   onTogglePassword: () => void;
>   onStaffSubmit: (e: React.FormEvent) => void;
> }
> ```
>
> **Imports:**
> - `motion, AnimatePresence, useReducedMotion` from `'framer-motion'`
> - `Loader2, AlertCircle, ChevronRight, Eye, EyeOff, Lock, LogIn` from `'lucide-react'`
>
> **Outer wrapper:**
> ```tsx
> <div className='flex flex-col justify-center min-h-screen lg:min-h-0 lg:h-full px-6 sm:px-10 lg:px-14 py-12 bg-background'>
>   <div className='w-full max-w-[420px] mx-auto lg:mx-0'>
>     {/* Content below */}
>   </div>
> </div>
> ```
>
> **Inside the constrained div, in order:**
>
> **1. Live badge:**
> ```tsx
> <div className='inline-flex items-center gap-2 h-7 px-3 mb-8 rounded-sm bg-primary/10 border border-primary/20'>
>   <span className='relative flex h-2 w-2'>
>     <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60' />
>     <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
>   </span>
>   <span className='text-[11px] font-bold text-primary uppercase tracking-[0.12em]'>
>     Placement Season 2026 Live
>   </span>
> </div>
> ```
>
> **2. Logotype:**
> ```tsx
> <h1 className='text-5xl font-black tracking-tight text-foreground leading-none select-none mb-2'>
>   Skill<span className='text-primary'>Sync.</span>
> </h1>
> <p className='text-sm text-muted-foreground mb-8 font-normal leading-relaxed'>
>   AI-native placement ecosystem. Sign in to continue.
> </p>
> ```
>
> **3. Error message — AnimatePresence with slide-down:**
> ```tsx
> <AnimatePresence>
>   {errorMessage && (
>     <motion.div
>       key='error'
>       initial={{ opacity: 0, y: -8, height: 0 }}
>       animate={{ opacity: 1, y: 0, height: 'auto' }}
>       exit={{ opacity: 0, y: -8, height: 0 }}
>       transition={{ duration: 0.22, ease: 'easeOut' }}
>       className='mb-4 overflow-hidden'
>     >
>       <div className='rounded-md border border-destructive/30 bg-destructive/8 px-4 py-3 flex items-start gap-3'>
>         <AlertCircle size={16} className='text-destructive shrink-0 mt-0.5' />
>         <div>
>           <p className='text-xs font-bold text-destructive uppercase tracking-wider mb-0.5'>Error</p>
>           <p className='text-sm text-destructive/90 font-medium'>{errorMessage}</p>
>         </div>
>       </div>
>     </motion.div>
>   )}
> </AnimatePresence>
> ```
>
> **4. Button group — `motion.div` stagger container:**
> ```tsx
> const shouldAnimate = !useReducedMotion();
> const container = {
>   hidden: {},
>   visible: { transition: { staggerChildren: 0.07 } }
> };
> const item = {
>   hidden: { opacity: 0, y: 10 },
>   visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }
> };
> ```
> Wrap buttons in `<motion.div variants={container} initial={shouldAnimate ? 'hidden' : 'visible'} animate='visible' className='space-y-3'>`.
>
> **4a. Student SSO button** (wrapped in `<motion.div variants={item}>`):
> ```tsx
> <button
>   onClick={onStudentLogin}
>   disabled={isStudentLoading || isStaffLoading}
>   className='group w-full flex items-center justify-between px-5 py-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
> >
>   <div className='flex items-center gap-4'>
>     {/* Microsoft logo SVG — 4 colored squares */}
>     <svg className='w-6 h-6 shrink-0' viewBox='0 0 21 21' fill='none' aria-hidden='true'>
>       <rect x='1' y='1' width='9' height='9' fill='#F25022'/>
>       <rect x='11' y='1' width='9' height='9' fill='#7FBA00'/>
>       <rect x='1' y='11' width='9' height='9' fill='#00A4EF'/>
>       <rect x='11' y='11' width='9' height='9' fill='#FFB900'/>
>     </svg>
>     <div className='text-left'>
>       <p className='text-sm font-bold text-foreground'>Student Login</p>
>       <p className='text-[11px] text-muted-foreground font-medium mt-0.5'>
>         @stu.upes.ac.in Microsoft account
>       </p>
>     </div>
>   </div>
>   {isStudentLoading
>     ? <Loader2 size={18} className='text-primary animate-spin' />
>     : <ChevronRight size={18} className='text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150' />
>   }
> </button>
> ```
>
> **4b. Faculty / Staff button and inline form** (wrapped in `<motion.div variants={item}>`):
>
> When `!showStaffForm`:
> ```tsx
> <button
>   onClick={onShowStaffForm}
>   disabled={isStudentLoading}
>   className='group w-full flex items-center justify-between px-5 py-4 rounded-lg border border-border bg-background hover:border-border hover:bg-muted/60 transition-all duration-150 disabled:opacity-50'
> >
>   <div className='flex items-center gap-4'>
>     <div className='w-6 h-6 flex items-center justify-center shrink-0'>
>       <Lock size={18} className='text-muted-foreground group-hover:text-foreground transition-colors' />
>     </div>
>     <div className='text-left'>
>       <p className='text-sm font-bold text-foreground'>Faculty / Admin Login</p>
>       <p className='text-[11px] text-muted-foreground font-medium mt-0.5'>Email & password</p>
>     </div>
>   </div>
>   <ChevronRight size={18} className='text-muted-foreground' />
> </button>
> ```
>
> When `showStaffForm`, replace the button with an `AnimatePresence`-driven inline form:
> ```tsx
> <AnimatePresence>
>   {showStaffForm && (
>     <motion.div
>       key='staff-form'
>       initial={{ opacity: 0, height: 0 }}
>       animate={{ opacity: 1, height: 'auto' }}
>       exit={{ opacity: 0, height: 0 }}
>       transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
>       className='overflow-hidden'
>     >
>       <form
>         onSubmit={onStaffSubmit}
>         className='rounded-lg border border-border bg-card p-5 space-y-3'
>       >
>         {/* Header row */}
>         <div className='flex items-center justify-between mb-1'>
>           <p className='text-xs font-bold text-foreground uppercase tracking-wider'>Staff Login</p>
>           <button
>             type='button'
>             onClick={onHideStaffForm}
>             className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
>           >
>             Cancel
>           </button>
>         </div>
>         {/* Email input */}
>         <input
>           type='email'
>           placeholder='Email address'
>           value={staffEmail}
>           onChange={e => onStaffEmailChange(e.target.value)}
>           required
>           autoComplete='email'
>           className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow'
>         />
>         {/* Password input with toggle */}
>         <div className='relative'>
>           <input
>             type={showPassword ? 'text' : 'password'}
>             placeholder='Password'
>             value={staffPassword}
>             onChange={e => onStaffPasswordChange(e.target.value)}
>             required
>             autoComplete='current-password'
>             className='w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow'
>           />
>           <button
>             type='button'
>             onClick={onTogglePassword}
>             className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
>             aria-label={showPassword ? 'Hide password' : 'Show password'}
>           >
>             {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
>           </button>
>         </div>
>         {/* Submit */}
>         <button
>           type='submit'
>           disabled={isStaffLoading}
>           className='w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-[#3E53A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2'
>         >
>           {isStaffLoading
>             ? <><Loader2 size={15} className='animate-spin' /> Signing in...</>
>             : <><LogIn size={15} /> Sign In</>
>           }
>         </button>
>       </form>
>     </motion.div>
>   )}
> </AnimatePresence>
> ```
>
> **5. Footnote below buttons:**
> ```tsx
> <p className='mt-6 text-[11px] text-muted-foreground leading-relaxed'>
>   Students use UPES Microsoft SSO. Faculty and staff use their assigned SkillSync credentials.
>   Contact your placement coordinator for access issues.
> </p>
> ```
>
> **Accessibility:**
> - All interactive elements have clear focus rings via `focus:ring-2 focus:ring-ring`
> - Password toggle button has `aria-label`
> - Loader icons have `aria-hidden` or are decorative — no extra aria needed since labels describe the action
> - Form inputs have `autoComplete` attributes set"

---

## Sub-Phase 03.3: Login Brand Panel Component

**File to Target:** `components/auth/login-brand-panel.tsx` (new file)  
**Context for Copilot:** The right half of the login page — visible only on `lg+` screens. It is a purely decorative, server-compatible component with no interactivity. Its background is always the deep navy `bg-sidebar` (using the new CSS variable, so it is always `#08112F` regardless of theme). It contains: a large logotype in white at the top-left, a short tagline below it, a centered 3D illustration placeholder (a `div` with dashed border and a `MonitorSmartphone` Lucide icon — replaced by the actual illustration asset later), and three capability pills at the bottom. No Framer Motion in this component — it is a static panel.

**The Copilot Prompt:**
> "Create `components/auth/login-brand-panel.tsx`. This component has NO `'use client'` directive — it is a server component.
>
> **Imports:**
> - `MonitorSmartphone, Sparkles, Shield, BarChart3` from `'lucide-react'`
> - No Framer Motion imports
>
> **Outer wrapper — always dark, full height:**
> ```tsx
> <div className='hidden lg:flex flex-col justify-between h-full min-h-screen bg-sidebar px-12 py-12 relative overflow-hidden'>
>   {/* Top: branding */}
>   {/* Middle: illustration */}
>   {/* Bottom: pills */}
> </div>
> ```
>
> **Top section (branding):**
> ```tsx
> <div>
>   <span className='font-sans text-2xl font-black tracking-tight text-sidebar-fg select-none'>
>     Skill<span className='text-sidebar-primary'>Sync.</span>
>   </span>
>   <p className='mt-3 text-sm text-sidebar-fg-muted font-normal leading-relaxed max-w-[280px]'>
>     The placement intelligence hub for UPES — connecting students, faculty, and administrators through AI-native workflows.
>   </p>
> </div>
> ```
>
> **Middle section (illustration placeholder — centered):**
> ```tsx
> <div className='flex-1 flex items-center justify-center py-8'>
>   <div className='w-full max-w-[340px] aspect-[4/3] rounded-xl border border-sidebar-border bg-sidebar-surface flex flex-col items-center justify-center gap-4'>
>     <MonitorSmartphone size={48} className='text-sidebar-primary opacity-60' />
>     <p className='text-[12px] text-sidebar-fg-muted font-medium text-center px-6'>
>       {/* Replace this div with the actual 3D illustration PNG in the assets phase */}
>       Dashboard illustration goes here
>     </p>
>   </div>
> </div>
> ```
> Add an HTML comment inside: `{/* TODO Phase-assets: Replace with <Image src='/illustrations/login-hero.png' ... /> */}`
>
> **Bottom section (three capability pills):**
> ```tsx
> <div className='flex flex-col gap-2.5'>
>   <p className='text-[11px] font-bold text-sidebar-fg-muted uppercase tracking-[0.12em] mb-1'>
>     Platform capabilities
>   </p>
>   {[
>     { icon: BarChart3, label: 'AMCAT Score Integration' },
>     { icon: Sparkles, label: 'AI-Native Drive Matching' },
>     { icon: Shield, label: 'Role-Gated Access Control' },
>   ].map(({ icon: Icon, label }) => (
>     <div key={label} className='flex items-center gap-3 h-9 px-3 rounded-md bg-sidebar-surface/60 border border-sidebar-border'>
>       <Icon size={14} className='text-sidebar-primary shrink-0' />
>       <span className='text-[12px] font-semibold text-sidebar-fg'>{label}</span>
>     </div>
>   ))}
> </div>
> ```
>
> **Background decorative element (subtle, not glassy):**
> Inside the outer wrapper, add a `<div>` absolutely positioned at top-right:
> ```tsx
> <div
>   aria-hidden='true'
>   className='absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sidebar-primary opacity-[0.06] pointer-events-none'
> />
> ```
> This is a solid circle with very low opacity — not a blur effect, not glassmorphism. Just a subtle shape.
>
> **Responsive:** The entire component is `hidden lg:flex` — it does not render on mobile or tablet at all. On mobile, the form panel takes full screen width."

---

## Sub-Phase 03.4: Remove Obsolete Login Dependencies

**File to Target:** `app/login/page.tsx`  
**Context for Copilot:** After extracting the JSX into sub-components, several imports in `page.tsx` are now unused. Removing them prevents TypeScript warnings and keeps the file clean. The auth logic imports (`signIn`, `useSearchParams`, `useRouter`, `Suspense`, `useState`, `useEffect`) must stay. The `Image` import from `next/image` is now unused (the campus image is gone — the brand panel uses a div placeholder). The UI icon imports (`Loader2`, `AlertCircle`, `Sparkles`, `ChevronRight`, `Eye`, `EyeOff`, `Lock`) are now unused in `page.tsx` itself.

**The Copilot Prompt:**
> "In `app/login/page.tsx`, remove the following imports that are no longer used in this file after the JSX extraction:
>
> - `Image` from `'next/image'`
> - `Loader2` from `'lucide-react'`
> - `AlertCircle` from `'lucide-react'`
> - `Sparkles` from `'lucide-react'`
> - `ChevronRight` from `'lucide-react'`
> - `Eye` from `'lucide-react'`
> - `EyeOff` from `'lucide-react'`
> - `Lock` from `'lucide-react'`
>
> Keep all of: `signIn` from `'next-auth/react'`, `useSearchParams`, `useRouter` from `'next/navigation'`, `Suspense`, `useEffect`, `useState` from `'react'`.
>
> Also keep the `AUTH_ERRORS` constant object — it is still referenced in the handler functions inside `LoginForm`.
>
> After cleanup, run TypeScript check (`npx tsc --noEmit`) to confirm zero type errors in `app/login/page.tsx`. If the TypeScript check reveals the `LoginFormPanelProps` type is needed here, import it from `@/components/auth/login-form-panel`."

---

## Sub-Phase 03.5: Login Page Mobile Layout Verification

**File to Target:** `app/login/page.tsx`, `components/auth/login-form-panel.tsx`  
**Context for Copilot:** On mobile (< 1024px), the brand panel is hidden and the form panel must occupy the full viewport width and height. The grid collapses to a single column. This sub-phase ensures the mobile layout is dense and correct: the logotype is visible, the live badge renders, both buttons are fully tappable (minimum 44px touch target height), the staff form expands without layout overflow, and the error message does not push content out of view. This sub-phase contains no new component creation — only verification instructions and targeted fixes.

**The Copilot Prompt:**
> "Verify and fix the login page mobile layout by checking the following points in `components/auth/login-form-panel.tsx`. Make targeted edits only — do not restructure the component.
>
> **Check 1 — Touch target heights:**
> The Student SSO button uses `py-4` which gives approximately 52px height — this is correct.
> The Faculty button uses `py-4` — correct.
> The form Submit button uses `h-10` (40px) — this meets the 40px minimum but is below Apple's recommended 44px. Update to `h-11` (44px).
> The password toggle button is `absolute` positioned — wrap it in a `<span className='w-10 h-10 flex items-center justify-center'>` to ensure the touch area is adequate.
>
> **Check 2 — No horizontal overflow:**
> The outer panel wrapper uses `px-6 sm:px-10 lg:px-14`. On a 375px screen, `px-6` = 24px each side → 327px content width. Confirm the `max-w-[420px]` inner container does not cause overflow at 375px. It should not since 420 > 327 is false — `max-w` constrains, does not force minimum width. Confirm this is correct.
>
> **Check 3 — Staff form height animation on mobile:**
> The `AnimatePresence` height animation uses `height: 0` → `height: 'auto'`. On mobile Safari, animating `height: auto` with Framer Motion works correctly only when the parent is not `overflow: hidden`. Confirm the parent `<motion.div className='overflow-hidden'>` wraps correctly. If the form clips, change the animation to use `scaleY` with `originY: 0` instead:
> ```ts
> initial={{ opacity: 0, scaleY: 0 }}
> animate={{ opacity: 1, scaleY: 1 }}
> exit={{ opacity: 0, scaleY: 0 }}
> style={{ transformOrigin: 'top' }}
> transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
> ```
>
> **Check 4 — Viewport height on mobile:**
> The form panel uses `min-h-screen lg:min-h-0`. On iOS Safari with the address bar showing, `100vh` can be larger than the visible area. Replace `min-h-screen` with `min-h-[100dvh] lg:min-h-0` to use the dynamic viewport height unit which accounts for mobile browser chrome.
>
> **Check 5 — No `backdrop-blur` anywhere:**
> Search the login page and its sub-components for any class containing `backdrop-blur`, `bg-opacity`, `bg-background/`, or `bg-white/`. Remove any found. All backgrounds must be fully solid."
