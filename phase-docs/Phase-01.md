# Phase 01: Foundation & Dependency Setup

> **Scope:** Non-visual groundwork only. No UI components are written in this phase. All subsequent phases depend on this phase being complete and verified first.
> **Branch:** `ui/enterprise-saas-redesign`
> **Workflow:** After completing all sub-phases, run `npm run dev` and confirm the app boots without errors before committing.

---

## Sub-Phase 01.1: Install Framer Motion and Recharts

**File to Target:** Terminal — `package.json` is updated automatically  
**Context for Copilot:** This Next.js 14 App Router project currently has no animation library and no chart library. Framer Motion 11 is required for all component animations, entrance sequences, sidebar collapse, and mouse-reactive 3D tilt effects on interactive cards. Recharts 2 is required for all data visualizations: AMCAT score bars, profile completion rings, drive analytics, hub score trends, and admin system metrics. Both are production dependencies. Bundle size matters on the Vercel Hobby plan — import discipline is mandatory.

**The Copilot Prompt:**
> "Run the following command in the project root to install the two required production dependencies:
>
> `npm install framer-motion@11 recharts@2`
>
> After installation:
> 1. Confirm `framer-motion` at version `^11.x` and `recharts` at version `^2.x` appear under `dependencies` in `package.json`.
> 2. Do not install `@types/recharts` — Recharts ships its own TypeScript definitions since v2.
> 3. Do not install `framer-motion` as a dev dependency — it is used in production components.
> 4. Confirm no peer dependency conflicts are printed. If conflicts appear, use `--legacy-peer-deps` and document the reason.
>
> **Import discipline rules (enforce across all future phases):**
> - Framer Motion: always import named exports: `import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'`. Never `import * from 'framer-motion'`.
> - Recharts: always import named chart components: `import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts'`. Never import the entire library.
> - Below-the-fold animated sections (anything not visible in the first viewport): wrap with `next/dynamic` and `ssr: false` to defer their bundle load. Above-the-fold `motion.*` elements are imported directly.
>
> **Scale note:** These two libraries add approximately 40–60KB gzipped to the client bundle. This is acceptable on Vercel Hobby but must not increase further. Do not install additional animation or chart libraries in any subsequent phase."

---

## Sub-Phase 01.2: Design Token System Rewrite

**File to Target:** `app/globals.css`  
**Context for Copilot:** The current token system uses a generic slate/indigo palette that does not match the reference design. The reference defines a precise 6-color palette. All values must be converted to HSL and mapped into the existing shadcn/ui CSS variable naming convention. A new set of sidebar-specific tokens must also be added — the sidebar is always rendered dark regardless of the active theme, so its tokens are defined identically in both `:root` and `.dark`. The radius system must be updated to match the reference's large card corners. The current `--radius: 6px` is too small; the reference uses approximately 12px at the card level.

**The Copilot Prompt:**
> "Rewrite `app/globals.css` completely. Preserve the three Tailwind directives at the top and the `@layer base` structure. Replace all CSS custom property values with the exact values below.
>
> **`:root` block (light mode):**
> ```css
> --background: 210 12% 93%;
> --foreground: 226 71% 11%;
> --card: 0 0% 100%;
> --card-foreground: 226 71% 11%;
> --popover: 0 0% 100%;
> --popover-foreground: 226 71% 11%;
> --primary: 227 68% 61%;
> --primary-foreground: 0 0% 100%;
> --secondary: 214 22% 84%;
> --secondary-foreground: 226 71% 11%;
> --muted: 214 22% 89%;
> --muted-foreground: 227 25% 40%;
> --accent: 227 68% 96%;
> --accent-foreground: 226 71% 11%;
> --destructive: 0 72% 51%;
> --destructive-foreground: 0 0% 100%;
> --border: 214 22% 84%;
> --input: 214 22% 84%;
> --ring: 227 68% 61%;
> --radius: 12px;
> --success: 160 84% 39%;
> --success-foreground: 0 0% 100%;
> --warning: 38 92% 50%;
> --warning-foreground: 0 0% 100%;
> --info: 227 68% 61%;
> --info-foreground: 0 0% 100%;
> /* Sidebar tokens — invariant, always dark */
> --sidebar: 226 71% 11%;
> --sidebar-surface: 227 25% 26%;
> --sidebar-fg: 210 12% 93%;
> --sidebar-fg-muted: 214 22% 55%;
> --sidebar-primary: 227 68% 61%;
> --sidebar-primary-hover: 227 44% 44%;
> --sidebar-border: 227 20% 18%;
> --sidebar-active-bg: 227 25% 26%;
> ```
>
> **`.dark` block (dark mode):**
> ```css
> --background: 226 71% 7%;
> --foreground: 210 12% 93%;
> --card: 227 25% 14%;
> --card-foreground: 210 12% 93%;
> --popover: 227 25% 14%;
> --popover-foreground: 210 12% 93%;
> --primary: 227 68% 61%;
> --primary-foreground: 0 0% 100%;
> --secondary: 227 25% 26%;
> --secondary-foreground: 210 12% 93%;
> --muted: 227 25% 20%;
> --muted-foreground: 214 22% 60%;
> --accent: 227 44% 30%;
> --accent-foreground: 210 12% 93%;
> --destructive: 0 72% 51%;
> --destructive-foreground: 0 0% 100%;
> --border: 227 25% 22%;
> --input: 227 25% 20%;
> --ring: 227 68% 61%;
> --radius: 12px;
> --success: 160 84% 39%;
> --success-foreground: 0 0% 100%;
> --warning: 38 92% 50%;
> --warning-foreground: 0 0% 100%;
> --info: 227 68% 61%;
> --info-foreground: 0 0% 100%;
> /* Sidebar tokens — identical to light mode, sidebar never changes */
> --sidebar: 226 71% 11%;
> --sidebar-surface: 227 25% 26%;
> --sidebar-fg: 210 12% 93%;
> --sidebar-fg-muted: 214 22% 55%;
> --sidebar-primary: 227 68% 61%;
> --sidebar-primary-hover: 227 44% 44%;
> --sidebar-border: 227 20% 18%;
> --sidebar-active-bg: 227 25% 26%;
> ```
>
> **`@layer base` body rule — update to:**
> ```css
> body {
>   @apply bg-background text-foreground;
>   font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
>   -webkit-font-smoothing: antialiased;
>   -moz-osx-font-smoothing: grayscale;
> }
> ```
> Remove the `* { @apply border-border }` universal border rule — it applies visible borders to all elements and causes visual noise. Components define their own borders explicitly.
>
> **Add a new `@layer utilities` block at the bottom for scrollbar styling:**
> ```css
> @layer utilities {
>   ::-webkit-scrollbar { width: 5px; height: 5px; }
>   ::-webkit-scrollbar-track { background: transparent; }
>   ::-webkit-scrollbar-thumb {
>     background: hsl(var(--border));
>     border-radius: 3px;
>   }
>   ::-webkit-scrollbar-thumb:hover {
>     background: hsl(var(--muted-foreground));
>   }
>   * { scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent; }
> }
> ```
>
> Do not add any other rules. Do not add typography styles, component defaults, or animation utilities in this file — those belong in Tailwind config or component files."

---

## Sub-Phase 01.3: Tailwind Configuration Extension

**File to Target:** `tailwind.config.ts`  
**Context for Copilot:** The existing Tailwind config uses the shadcn/ui token pattern with HSL CSS variables. It must be extended to: (1) expose the new sidebar tokens as named Tailwind color classes, (2) update the radius scale to match the new 12px base, (3) add the Inter font as `font-heading` alias so existing code that uses `font-heading` now renders Inter instead of Plus Jakarta Sans without requiring a find-and-replace, (4) add custom keyframe animations for sidebar collapse, skeleton shimmer, and chart entrance. The `tailwindcss-animate` plugin remains.

**The Copilot Prompt:**
> "Update `tailwind.config.ts` with the following changes. Do not remove existing configuration — only extend or update existing values.
>
> **1. Font family — update `fontFamily` to alias `heading` to Inter:**
> ```ts
> fontFamily: {
>   sans: ['var(--font-inter)', 'sans-serif'],
>   heading: ['var(--font-inter)', 'sans-serif'], // alias to Inter; Jakarta remains loaded but unused
> },
> ```
>
> **2. Colors — add sidebar token group to the `colors` extension:**
> ```ts
> sidebar: {
>   DEFAULT: 'hsl(var(--sidebar))',
>   surface: 'hsl(var(--sidebar-surface))',
>   fg: 'hsl(var(--sidebar-fg))',
>   'fg-muted': 'hsl(var(--sidebar-fg-muted))',
>   primary: 'hsl(var(--sidebar-primary))',
>   'primary-hover': 'hsl(var(--sidebar-primary-hover))',
>   border: 'hsl(var(--sidebar-border))',
>   'active-bg': 'hsl(var(--sidebar-active-bg))',
> },
> ```
> This allows using classes like `bg-sidebar`, `text-sidebar-fg`, `bg-sidebar-surface`, etc. in sidebar components.
>
> **3. Border radius — update `borderRadius` to use the new 12px base:**
> ```ts
> borderRadius: {
>   none: '0',
>   sm: 'calc(var(--radius) - 8px)',   // 4px — badges, chips, tiny elements
>   DEFAULT: 'calc(var(--radius) - 4px)', // 8px — buttons, inputs, small cards
>   md: 'calc(var(--radius) - 4px)',   // 8px
>   lg: 'var(--radius)',               // 12px — cards, panels, modals
>   xl: 'calc(var(--radius) + 4px)',   // 16px — large feature cards
>   '2xl': 'calc(var(--radius) + 8px)', // 20px — hero section elements
>   full: '9999px',                    // pills, avatars
> },
> ```
>
> **4. Keyframes — add to the existing `keyframes` block:**
> ```ts
> 'shimmer': {
>   '0%': { backgroundPosition: '-200% 0' },
>   '100%': { backgroundPosition: '200% 0' },
> },
> 'fade-up': {
>   '0%': { opacity: '0', transform: 'translateY(12px)' },
>   '100%': { opacity: '1', transform: 'translateY(0)' },
> },
> 'fade-in': {
>   '0%': { opacity: '0' },
>   '100%': { opacity: '1' },
> },
> 'scale-in': {
>   '0%': { opacity: '0', transform: 'scale(0.95)' },
>   '100%': { opacity: '1', transform: 'scale(1)' },
> },
> ```
>
> **5. Animation utilities — add to the existing `animation` block:**
> ```ts
> 'shimmer': 'shimmer 2s linear infinite',
> 'fade-up': 'fade-up 0.35s ease-out forwards',
> 'fade-in': 'fade-in 0.25s ease-out forwards',
> 'scale-in': 'scale-in 0.2s ease-out forwards',
> ```
>
> **6. Screens — add a `xs` breakpoint for very small mobile:**
> ```ts
> screens: {
>   xs: '375px',
>   sm: '640px',
>   md: '768px',
>   lg: '1024px',
>   xl: '1280px',
>   '2xl': '1400px',
> },
> ```
> This `xs` breakpoint is used for minimum safe padding on phones like iPhone SE.
>
> Do not remove `tailwindcss-animate` from plugins. Do not add any other plugins."

---

## Sub-Phase 01.4: PWA Infrastructure Setup

**File to Target:** `public/manifest.json` (new file), `public/sw.js` (new file), `app/layout.tsx` (meta additions only)  
**Context for Copilot:** The app targets mobile users (students checking AMCAT scores on campus) and must be installable as a PWA on Android and iOS. The Vercel Hobby plan serves static files from the CDN for free — the manifest and service worker are static assets, so there is no compute cost. The service worker uses a network-first strategy for all API routes and a cache-first strategy for the app shell (HTML, CSS, JS, fonts). API responses are never cached to prevent stale data. Only the student profile object is eligible for IndexedDB caching (handled in a later phase). The offline fallback is a minimal `/offline` page. Icons must be placed at `public/icons/icon-192.png` and `public/icons/icon-512.png` — create placeholder instructions for these (actual icon files are provided separately).

**The Copilot Prompt:**
> "Create the following three files for PWA support. Do not modify any existing page logic.
>
> **File 1: `public/manifest.json`**
> Create a Web App Manifest with the following properties:
> - `name`: `'SkillSync — Placement Intelligence Hub'`
> - `short_name`: `'SkillSync'`
> - `description`: `'AI-Native Placement Ecosystem for UPES students and faculty'`
> - `start_url`: `'/'`
> - `display`: `'standalone'`
> - `background_color`: `'#ECEEF0'` (matches light mode background)
> - `theme_color`: `'#5A77DF'` (matches --primary)
> - `orientation`: `'portrait-primary'`
> - `scope`: `'/'`
> - `lang`: `'en-IN'`
> - `icons` array with two entries:
>   - `{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }`
>   - `{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }`
> - `categories`: `['education', 'productivity']`
> - `screenshots`: empty array (can be populated later)
>
> **File 2: `public/sw.js`**
> Write a vanilla JavaScript service worker with the following exact behavior:
>
> ```js
> const CACHE_NAME = 'skillsync-shell-v1';
> const SHELL_ASSETS = ['/', '/login', '/offline'];
>
> self.addEventListener('install', event => {
>   event.waitUntil(
>     caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
>   );
>   self.skipWaiting();
> });
>
> self.addEventListener('activate', event => {
>   event.waitUntil(
>     caches.keys().then(keys =>
>       Promise.all(
>         keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
>       )
>     )
>   );
>   self.clients.claim();
> });
>
> self.addEventListener('fetch', event => {
>   const url = new URL(event.request.url);
>   // Never intercept API routes — always network, allow graceful failure
>   if (url.pathname.startsWith('/api/')) return;
>   // Never intercept POST/PUT/PATCH/DELETE
>   if (event.request.method !== 'GET') return;
>   // Cache-first for static assets (fonts, images, _next/static)
>   if (
>     url.pathname.startsWith('/_next/static/') ||
>     url.pathname.startsWith('/fonts/') ||
>     url.pathname.startsWith('/icons/')
>   ) {
>     event.respondWith(
>       caches.match(event.request).then(cached =>
>         cached || fetch(event.request).then(res => {
>           const clone = res.clone();
>           caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
>           return res;
>         })
>       )
>     );
>     return;
>   }
>   // Network-first for all pages, fall back to cache, then offline page
>   event.respondWith(
>     fetch(event.request)
>       .then(res => {
>         const clone = res.clone();
>         caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
>         return res;
>       })
>       .catch(() =>
>         caches.match(event.request).then(cached =>
>           cached || caches.match('/offline')
>         )
>       )
>   );
> });
> ```
>
> **File 3: `app/layout.tsx` — add PWA meta tags only**
> In the existing `export const metadata` object, add the following fields alongside the existing `title`, `description`, and `icons`:
> ```ts
> manifest: '/manifest.json',
> appleWebApp: {
>   capable: true,
>   statusBarStyle: 'default',
>   title: 'SkillSync',
> },
> formatDetection: { telephone: false },
> themeColor: [
>   { media: '(prefers-color-scheme: light)', color: '#5A77DF' },
>   { media: '(prefers-color-scheme: dark)', color: '#08112F' },
> ],
> viewport: {
>   width: 'device-width',
>   initialScale: 1,
>   maximumScale: 1, // prevents auto-zoom on iOS inputs
>   userScalable: false,
> },
> ```
>
> Also add a `<script>` tag in the `<body>` of the root layout (after `<ClientToaster />`) to register the service worker:
> ```tsx
> <script
>   dangerouslySetInnerHTML={{
>     __html: `
>       if ('serviceWorker' in navigator) {
>         window.addEventListener('load', function() {
>           navigator.serviceWorker.register('/sw.js');
>         });
>       }
>     `,
>   }}
> />
> ```
>
> **Also create a minimal `app/offline/page.tsx`:**
> This is a simple server component that renders a centered message: 'You are offline. Please check your connection and try again.' Use `bg-background text-foreground min-h-screen flex items-center justify-center` for the wrapper. Include a `WifiOff` Lucide icon (size 40, `text-muted-foreground`) above the text. No buttons, no links — keep it minimal. The page title should be 'Offline — SkillSync'."

---

## Sub-Phase 01.5: Sidebar Collapse State Store

**File to Target:** `lib/stores/sidebar-store.ts` (new file)  
**Context for Copilot:** The collapsible sidebar requires a globally accessible, persistent collapse state. The existing project uses Zustand (`lib/stores/profile-store.ts`) as the state management pattern — follow the same pattern. The sidebar state must persist across page navigations and page reloads using `localStorage` via Zustand's `persist` middleware. On mobile (window width < 768px), the sidebar is never in the expanded rail mode — it slides in as a full overlay drawer via the mobile nav component. The store must be a client-side-only module with `'use client'` directive (Zustand stores are always client-side).

**The Copilot Prompt:**
> "Create a new file `lib/stores/sidebar-store.ts` following the exact pattern used in `lib/stores/profile-store.ts`.
>
> The file must:
> 1. Start with `'use client';` directive.
> 2. Import `create` from `'zustand'` and `persist` from `'zustand/middleware'`.
> 3. Define a TypeScript interface `SidebarStore` with the following shape:
>    ```ts
>    interface SidebarStore {
>      isCollapsed: boolean;
>      toggle: () => void;
>      collapse: () => void;
>      expand: () => void;
>    }
>    ```
> 4. Export a `useSidebarStore` hook created with `create<SidebarStore>()(persist((...) => ({ ... }), { name: 'skillsync-sidebar' }))`.
> 5. Initial state: `isCollapsed: false` (sidebar starts expanded on desktop).
> 6. `toggle`: flips `isCollapsed` using `set(state => ({ isCollapsed: !state.isCollapsed }))`.
> 7. `collapse`: sets `isCollapsed: true`.
> 8. `expand`: sets `isCollapsed: false`.
> 9. The `persist` storage key is `'skillsync-sidebar'` (stored in `localStorage`).
>
> **Important constraints:**
> - Do not add any React hooks, effects, or references to `window` in this store file.
> - Do not import any UI libraries or components in this file.
> - The store is consumed only by client components — it will never be used in Server Components or layouts directly.
> - When consuming this store in sidebar components, use `useEffect` to detect `window.innerWidth < 768` on mount and call `collapse()` if true, to ensure mobile starts in the correct (hidden/collapsed) state without persisted desktop state bleeding into mobile views."
