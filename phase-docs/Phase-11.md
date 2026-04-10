# Phase 11: Student Drives Page Redesign

> **Scope:** Redesign the student drives page (`app/(student)/student/drives/page.tsx`) to match the enterprise aesthetic. The page remains a server component for initial data load (SSR eligibility filter). A new client component `DriveFilterBar` handles live search and urgency filtering on the client side without refetching from the server. Drive cards get a full visual redesign: denser layout, enterprise color tokens, matched/missing skills displayed as compact pills, rank badge repositioned, and a proper footer CTA strip. Empty and incomplete-profile states are redesigned consistently.
> **Files to Target:** `app/(student)/student/drives/page.tsx` (restructure JSX), `components/student/drives/drive-filter-bar.tsx` (new), `components/student/drives/drive-card.tsx` (new), `components/student/drives/drives-grid.tsx` (new client wrapper).
> **Dependencies:** Phase 06 fixes complete. Existing imports (`requireStudentProfile`, `expandBranches`, `drives`, `rankings` from drizzle schema) are all preserved.
> **Workflow:** After implementing, navigate to `/student/drives`. Verify: drives render in grid, filter bar narrows results live, deadline urgency toggle shows only soon-deadline drives, rank badge appears on ranked drives, cards link to `/student/drives/[id]/ranking`, empty state renders when no eligible drives exist, incomplete-profile banner renders when branch/CGPA/batch missing.

---

## Sub-Phase 11.1: Drive Card Component

**File to Target:** `components/student/drives/drive-card.tsx` (new file)
**Context for Copilot:** The `DriveCard` is a pure presentational component. It receives a fully serialized drive object and optional ranking data as props (no fetch inside). The card uses `bg-card border border-border rounded-lg` with a hover state of `hover:border-primary/40 hover:shadow-sm`. Layout: company logo placeholder (initials in a 40px square), company name + role title, info pills row (location, package, CGPA, deadline), rank section (if ranked), and a footer CTA. The deadline urgency logic (< 3 days) runs via a prop rather than a live Date.now() to keep it predictable. Framer Motion `whileHover` adds a subtle `y: -1` lift on desktop only (guard with `useReducedMotion`).

**The Copilot Prompt:**
> "Create `components/student/drives/drive-card.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import Link from 'next/link';
> import { motion, useReducedMotion } from 'framer-motion';
> import { MapPin, IndianRupee, Award, ChevronRight, Clock, GraduationCap } from 'lucide-react';
> import { cn } from '@/lib/utils';
> ```
>
> **Props:**
> ```ts
> interface DriveCardProps {
>   drive: {
>     id: string;
>     company: string;
>     roleTitle: string;
>     location?: string | null;
>     packageOffered?: string | null;
>     minCgpa?: number | null;
>     deadline?: string | null;     // ISO date string, pre-formatted by server
>     deadlineFormatted?: string | null;
>     isDeadlineSoon: boolean;
>   };
>   ranking?: {
>     rankPosition: number;
>     matchScore: number;
>     matchedSkills: string[];
>     missingSkills: string[];
>     shortExplanation?: string | null;
>   } | null;
> }
> ```
>
> **Company initials helper:**
> ```ts
> function companyInitials(name: string): string {
>   return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
> }
> ```
>
> **Component:**
> ```tsx
> export default function DriveCard({ drive, ranking }: DriveCardProps) {
>   const shouldReduceMotion = useReducedMotion();
>   const hasRankPosition = Boolean(ranking && ranking.rankPosition > 0);
>
>   return (
>     <motion.div
>       whileHover={shouldReduceMotion ? undefined : { y: -1 }}
>       transition={{ duration: 0.15 }}
>       className='group relative bg-card rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-[border-color,box-shadow] duration-200 flex flex-col overflow-hidden'
>     >
>       {/* Rank badge — absolute top-right */}
>       {ranking && (
>         <Link
>           href={`/student/drives/${drive.id}/ranking`}
>           className='absolute top-3 right-3 z-10'
>         >
>           <span className={cn(
>             'inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold border',
>             hasRankPosition
>               ? 'bg-primary/10 border-primary/30 text-primary'
>               : 'bg-muted/60 border-border text-muted-foreground'
>           )}>
>             <Award size={10} />
>             {hasRankPosition ? `#${ranking.rankPosition} · ${Math.round(ranking.matchScore)}%` : 'Pending'}
>           </span>
>         </Link>
>       )}
>
>       <div className='p-4 flex-1 space-y-3'>
>         {/* Company initials + name + role */}
>         <div className='flex items-start gap-3 pr-20'>
>           <div className='w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0'>
>             <span className='text-xs font-bold text-primary'>{companyInitials(drive.company)}</span>
>           </div>
>           <div className='min-w-0'>
>             <h3 className='text-sm font-semibold text-foreground leading-snug truncate'>{drive.company}</h3>
>             <p className='text-xs text-muted-foreground mt-0.5 truncate'>{drive.roleTitle}</p>
>           </div>
>         </div>
>
>         {/* Info pills */}
>         <div className='flex flex-wrap gap-1.5'>
>           {drive.location && (
>             <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
>               <MapPin size={9} /> {drive.location}
>             </span>
>           )}
>           {drive.packageOffered && (
>             <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
>               <IndianRupee size={9} /> {drive.packageOffered}
>             </span>
>           )}
>           {drive.minCgpa && (
>             <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
>               <GraduationCap size={9} /> Min {drive.minCgpa} CGPA
>             </span>
>           )}
>           {drive.deadlineFormatted && (
>             <span className={cn(
>               'inline-flex items-center gap-1 text-[10px] font-medium rounded px-2 py-0.5',
>               drive.isDeadlineSoon
>                 ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
>                 : 'bg-muted/60 border border-border text-muted-foreground'
>             )}>
>               <Clock size={9} />
>               {drive.isDeadlineSoon ? 'Closing ' : ''}{drive.deadlineFormatted}
>             </span>
>           )}
>         </div>
>
>         {/* Ranking result section */}
>         {ranking ? (
>           <div className='space-y-2 pt-1 border-t border-border'>
>             {ranking.shortExplanation && (
>               <p className='text-[11px] text-muted-foreground leading-relaxed line-clamp-2'>
>                 {ranking.shortExplanation}
>               </p>
>             )}
>             <div className='flex flex-wrap gap-1'>
>               {ranking.matchedSkills.slice(0, 4).map(skill => (
>                 <span
>                   key={skill}
>                   className='inline-flex items-center text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5'
>                 >
>                   + {skill}
>                 </span>
>               ))}
>               {ranking.missingSkills.slice(0, 2).map(skill => (
>                 <span
>                   key={skill}
>                   className='inline-flex items-center text-[9px] font-bold bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5'
>                 >
>                   − {skill}
>                 </span>
>               ))}
>             </div>
>           </div>
>         ) : (
>           <p className='text-[11px] text-muted-foreground italic pt-1 border-t border-border'>
>             Ranking not yet generated.
>           </p>
>         )}
>       </div>
>
>       {/* Footer CTA — only when ranked */}
>       {ranking && (
>         <Link
>           href={`/student/drives/${drive.id}/ranking`}
>           className='flex items-center justify-between px-4 py-2.5 border-t border-border text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors'
>         >
>           View Full Ranking
>           <ChevronRight size={13} />
>         </Link>
>       )}
>     </motion.div>
>   );
> }
> ```"

---

## Sub-Phase 11.2: Drive Filter Bar Component

**File to Target:** `components/student/drives/drive-filter-bar.tsx` (new file)
**Context for Copilot:** A client component that renders a search input and a toggle button for "Closing Soon" filter. It receives the current `query` and `urgentOnly` state + their setters from the parent `DrivesGrid` client wrapper. The search input is 100% wide on mobile, up to 320px wide on desktop. The "Closing Soon" toggle button uses a filled/outline style to indicate active state. No API calls — this component only manages state that filters the already-loaded drives list passed to it.

**The Copilot Prompt:**
> "Create `components/student/drives/drive-filter-bar.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { Search, Clock, X } from 'lucide-react';
> ```
>
> **Props:**
> ```ts
> interface DriveFilterBarProps {
>   query: string;
>   onQueryChange: (q: string) => void;
>   urgentOnly: boolean;
>   onUrgentToggle: () => void;
>   totalCount: number;
>   filteredCount: number;
> }
> ```
>
> **Component:**
> ```tsx
> export default function DriveFilterBar({
>   query, onQueryChange, urgentOnly, onUrgentToggle, totalCount, filteredCount
> }: DriveFilterBarProps) {
>   return (
>     <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
>       {/* Search input */}
>       <div className='relative w-full sm:w-72 lg:w-80'>
>         <Search size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
>         <input
>           type='text'
>           value={query}
>           onChange={e => onQueryChange(e.target.value)}
>           placeholder='Search by company or role...'
>           className='w-full h-8 pl-8 pr-8 text-sm bg-muted/60 border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors'
>         />
>         {query && (
>           <button
>             onClick={() => onQueryChange('')}
>             className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
>           >
>             <X size={12} />
>           </button>
>         )}
>       </div>
>
>       {/* Urgent toggle */}
>       <button
>         onClick={onUrgentToggle}
>         className={`inline-flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors ${
>           urgentOnly
>             ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
>             : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
>         }`}
>       >
>         <Clock size={12} /> Closing Soon
>       </button>
>
>       {/* Result count — spacer pushes it to the right */}
>       <p className='text-xs text-muted-foreground ml-auto'>
>         {filteredCount === totalCount
>           ? `${totalCount} drive${totalCount !== 1 ? 's' : ''}`
>           : `${filteredCount} of ${totalCount}`}
>       </p>
>     </div>
>   );
> }
> ```"

---

## Sub-Phase 11.3: Drives Grid Client Wrapper

**File to Target:** `components/student/drives/drives-grid.tsx` (new file)
**Context for Copilot:** A client component that receives the full eligible drives list + ranking map from the server page, manages filter state (`query`, `urgentOnly`), applies client-side filtering, and renders the `DriveFilterBar` + grid of `DriveCard` components. This keeps the server page as a zero-client-JS SSR shell while moving interactivity here. The filtering is case-insensitive and matches against `drive.company` and `drive.roleTitle`. The `urgentOnly` filter shows only drives where `isDeadlineSoon === true`.

**The Copilot Prompt:**
> "Create `components/student/drives/drives-grid.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { useState, useMemo } from 'react';
> import { Briefcase } from 'lucide-react';
> import DriveFilterBar from './drive-filter-bar';
> import DriveCard from './drive-card';
> ```
>
> **Serialized types (safe for server → client boundary):**
> ```ts
> export interface SerializedDrive {
>   id: string;
>   company: string;
>   roleTitle: string;
>   location?: string | null;
>   packageOffered?: string | null;
>   minCgpa?: number | null;
>   deadlineFormatted?: string | null;
>   isDeadlineSoon: boolean;
> }
>
> export interface SerializedRanking {
>   rankPosition: number;
>   matchScore: number;
>   matchedSkills: string[];
>   missingSkills: string[];
>   shortExplanation?: string | null;
> }
>
> interface DrivesGridProps {
>   drives: SerializedDrive[];
>   rankingMap: Record<string, SerializedRanking>;
> }
> ```
>
> **Component:**
> ```tsx
> export default function DrivesGrid({ drives, rankingMap }: DrivesGridProps) {
>   const [query, setQuery] = useState('');
>   const [urgentOnly, setUrgentOnly] = useState(false);
>
>   const filtered = useMemo(() => {
>     const q = query.toLowerCase().trim();
>     return drives.filter(d => {
>       if (urgentOnly && !d.isDeadlineSoon) return false;
>       if (!q) return true;
>       return (
>         d.company.toLowerCase().includes(q) ||
>         d.roleTitle.toLowerCase().includes(q)
>       );
>     });
>   }, [drives, query, urgentOnly]);
>
>   return (
>     <div className='space-y-4'>
>       <DriveFilterBar
>         query={query}
>         onQueryChange={setQuery}
>         urgentOnly={urgentOnly}
>         onUrgentToggle={() => setUrgentOnly(p => !p)}
>         totalCount={drives.length}
>         filteredCount={filtered.length}
>       />
>
>       {filtered.length === 0 ? (
>         <div className='flex flex-col items-center justify-center py-20 rounded-lg border border-dashed border-border bg-card/30'>
>           <Briefcase size={36} className='text-muted-foreground mb-3 opacity-40' />
>           <p className='text-sm font-medium text-muted-foreground'>No drives match your filters</p>
>           <button
>             onClick={() => { setQuery(''); setUrgentOnly(false); }}
>             className='mt-3 text-xs text-primary hover:underline'
>           >
>             Clear filters
>           </button>
>         </div>
>       ) : (
>         <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
>           {filtered.map(drive => (
>             <DriveCard
>               key={drive.id}
>               drive={drive}
>               ranking={rankingMap[drive.id] ?? null}
>             />
>           ))}
>         </div>
>       )}
>     </div>
>   );
> }
> ```"

---

## Sub-Phase 11.4: Drives Page Restructure

**File to Target:** `app/(student)/student/drives/page.tsx` (restructure)
**Context for Copilot:** Keep the server-side data fetching logic entirely intact (eligibility filter, ranking query, `requireStudentProfile`). Replace the JSX with a new layout that:
1. Serializes drives and rankings into plain objects safe for the server→client boundary
2. Delegates the interactive grid to the `DrivesGrid` client component
3. Handles the "incomplete profile" and "no eligible drives" states directly in server JSX (they don't need client interactivity)

**The Copilot Prompt:**
> "Restructure `app/(student)/student/drives/page.tsx`. Keep all existing imports and data-fetch logic. Add the following imports:
>
> ```tsx
> import { format } from 'date-fns';
> import DrivesGrid, { type SerializedDrive, type SerializedRanking } from '@/components/student/drives/drives-grid';
> import Link from 'next/link'; // keep if already there
> import { TriangleAlert } from 'lucide-react';
> ```
>
> **After the existing data fetch (eligible drives + studentRankings), serialize the data:**
> ```tsx
> const serializedDrives: SerializedDrive[] = eligible.map(drive => {
>   const isDeadlineSoon = drive.deadline
>     ? new Date(drive.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
>     : false;
>   return {
>     id: drive.id,
>     company: drive.company,
>     roleTitle: drive.roleTitle,
>     location: drive.location ?? null,
>     packageOffered: drive.packageOffered ?? null,
>     minCgpa: drive.minCgpa ?? null,
>     deadlineFormatted: drive.deadline
>       ? format(new Date(drive.deadline), 'MMM d, yyyy')
>       : null,
>     isDeadlineSoon,
>   };
> });
>
> const serializedRankingMap: Record<string, SerializedRanking> = {};
> studentRankings.forEach(r => {
>   serializedRankingMap[r.driveId] = {
>     rankPosition: r.rankPosition ?? 0,
>     matchScore: r.matchScore ?? 0,
>     matchedSkills: (r.matchedSkills ?? []) as string[],
>     missingSkills: (r.missingSkills ?? []) as string[],
>     shortExplanation: r.shortExplanation ?? null,
>   };
> });
> ```
>
> **Replace the returned JSX with:**
> ```tsx
> return (
>   <div className='max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24 md:pb-8'>
>
>     {/* Page header */}
>     <div>
>       <h1 className='text-2xl font-semibold text-foreground'>Placement Drives</h1>
>       <p className='text-sm text-muted-foreground mt-0.5'>
>         {eligible.length} active {eligible.length === 1 ? 'drive' : 'drives'} matching your profile
>       </p>
>     </div>
>
>     {/* Incomplete profile warning */}
>     {hasIncompleteProfile && (
>       <div className='flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3'>
>         <TriangleAlert size={15} className='text-amber-500 mt-0.5 shrink-0' />
>         <div>
>           <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>Profile incomplete</p>
>           <p className='text-xs text-muted-foreground mt-0.5'>
>             Add your branch, CGPA, and batch year to see all eligible drives.{' '}
>             <Link href='/student/profile' className='text-primary hover:underline font-medium'>
>               Update profile
>             </Link>
>           </p>
>         </div>
>       </div>
>     )}
>
>     {/* No drives at all (eligible = 0 and profile is complete) */}
>     {eligible.length === 0 && !hasIncompleteProfile && (
>       <div className='flex flex-col items-center justify-center py-24 rounded-lg border border-dashed border-border bg-card/30'>
>         <Briefcase size={36} className='text-muted-foreground mb-3 opacity-40' />
>         <h3 className='text-sm font-semibold text-foreground mb-1'>No eligible drives yet</h3>
>         <p className='text-xs text-muted-foreground max-w-xs text-center leading-relaxed'>
>           No active drives match your branch, batch year, and CGPA. Check back soon.
>         </p>
>       </div>
>     )}
>
>     {/* Interactive drives grid — client component */}
>     {eligible.length > 0 && (
>       <DrivesGrid
>         drives={serializedDrives}
>         rankingMap={serializedRankingMap}
>       />
>     )}
>   </div>
> );
> ```
>
> **Styling principles applied:**
> - Page header: `text-2xl font-semibold` (not `text-4xl font-black` — enterprise scale)
> - Max width `max-w-6xl` with horizontal padding `px-4 sm:px-6` — no large centering margins
> - Bottom padding `pb-24 md:pb-8` for mobile bottom tab bar clearance
> - Warning uses amber tokens, not generic `warning` (amber is universally supported)
> - No emojis in empty state — Briefcase icon only"

---

## Sub-Phase 11.5: Cleanup and Verify

**Context for Copilot:** After all components are created and the page is restructured, verify correctness and remove any dead code.

**The Copilot Prompt:**
> "After completing the drives page restructure, perform the following checks:
>
> 1. **Verify `app/(student)/student/drives/page.tsx`** no longer contains any inline JSX for drive cards — that JSX is now entirely in `DriveCard`. The server page should only contain: data fetching, serialization, and the four JSX blocks: page header, incomplete-profile warning, empty-state, `<DrivesGrid>`.
>
> 2. **Verify `DrivesGrid` receives plain serializable props**: no `Date` objects, no Drizzle model instances — only strings, numbers, booleans, and arrays of those primitives. The serialization step in the page converts all Dates to formatted strings and all nullable fields to `null`.
>
> 3. **Check the `Briefcase` import** in `page.tsx` — it must be imported from `lucide-react` for the empty-state JSX: `import { Briefcase, TriangleAlert } from 'lucide-react';`
>
> 4. **Verify TypeScript** — run `tsc --noEmit` and fix any type errors in the new components. Common issues:
>    - `rankPosition` may be `null` in the Drizzle schema — add `?? 0` during serialization (already handled in the template above)
>    - `matchedSkills` / `missingSkills` are `unknown` from Drizzle JSONB — cast with `as string[]`
>    - `drive.deadline` may be `Date | null` — calling `.getTime()` on a `Date` is safe; convert to string via `new Date(drive.deadline).getTime()`
>
> 5. **Verify the `[driveId]/ranking` sub-route** still works unchanged — the restructure only touches `page.tsx` and adds new components; it does not touch `[driveId]/ranking/page.tsx` or `[driveId]/ranking/analysis-panel.tsx`.
>
> 6. **Mobile check**: On a 375px viewport, drive cards stack to a single column (`sm:grid-cols-2` means 1 column below 640px), the filter bar search is full width, and the urgent toggle appears below the search input. The bottom tab bar clearance `pb-24` ensures cards are not hidden behind the tab bar."
