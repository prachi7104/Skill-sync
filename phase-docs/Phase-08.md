# Phase 08: Global Header Enhancement + Command Palette (Cmd+K)

> **Scope:** Add a command palette trigger (Cmd+K / Ctrl+K keyboard shortcut) to the header across all three portals. Build the `CommandPalette` component using `cmdk` (already bundled with shadcn/ui). The palette searches drives, students (admin/faculty only), and companies using existing API routes. Add a subtle search trigger button in the header topbar that opens the palette.
> **Files to Target:** `components/shared/command-palette.tsx` (new), `components/shared/header-search-trigger.tsx` (new), all three portal layouts for the trigger insertion.
> **Dependencies:** Phase 06 fixes complete. `cmdk` is a transitive dependency of shadcn/ui — verify it is available with `npm list cmdk`.
> **Workflow:** After implementing, test Cmd+K (Mac) and Ctrl+K (Windows/Linux) from any authenticated portal page. Verify the palette opens, search input is focused, results appear within 300ms of typing. Verify Escape closes it. Verify it renders on top of everything (z-index 70+).

---

## Sub-Phase 08.1: Install and Verify cmdk

**File to Target:** Terminal  
**Context for Copilot:** `cmdk` is the headless command menu primitive used by shadcn/ui. It may already be installed as a transitive dependency. Verify first; install only if missing. The `@/components/ui/command.tsx` shadcn/ui component wraps `cmdk` — if this file exists, cmdk is available and we can use the shadcn/ui `Command` primitives directly instead of importing cmdk raw.

**The Copilot Prompt:**
> "Check if the shadcn/ui `Command` component exists at `components/ui/command.tsx`. If it exists, skip installation — proceed directly to Sub-Phase 08.2.
>
> If `components/ui/command.tsx` does NOT exist, add it via shadcn/ui CLI:
> ```bash
> npx shadcn-ui@latest add command
> ```
> This installs the `Command` component and its `cmdk` dependency automatically.
>
> After installation, verify the file exists at `components/ui/command.tsx` and contains exports for: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`.
>
> Do not modify `components/ui/command.tsx` — it is a shadcn/ui primitive and should stay unmodified."

---

## Sub-Phase 08.2: CommandPalette Component

**File to Target:** `components/shared/command-palette.tsx` (new file)  
**Context for Copilot:** The `CommandPalette` is a full-screen modal dialog that opens when the user presses Cmd+K or Ctrl+K or clicks the search trigger in the header. It uses the shadcn/ui `CommandDialog` (which wraps Radix Dialog + cmdk). The palette searches three categories in real-time as the user types: Drives (matching drive name or company), Students (admin/faculty only, matching name or SAP ID), and Companies. Search uses `fetch` to existing API endpoints with a 300ms debounce to avoid excessive calls on the free tier. Results display in grouped sections with icons. Empty state shows a 'No results' message. The component receives a `role` prop to determine which search categories to show.

**The Copilot Prompt:**
> "Create `components/shared/command-palette.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { useEffect, useState, useCallback } from 'react';
> import { useRouter } from 'next/navigation';
> import {
>   CommandDialog, CommandInput, CommandList, CommandEmpty,
>   CommandGroup, CommandItem, CommandSeparator
> } from '@/components/ui/command';
> import { Briefcase, Building2, GraduationCap, Search, ArrowRight } from 'lucide-react';
> ```
>
> **Props:**
> ```ts
> interface CommandPaletteProps {
>   open: boolean;
>   onOpenChange: (open: boolean) => void;
>   role: 'student' | 'faculty' | 'admin';
> }
> ```
>
> **Search result types:**
> ```ts
> interface SearchResult {
>   id: string;
>   label: string;
>   sublabel?: string;
>   href: string;
>   icon: React.ElementType;
>   category: 'drive' | 'student' | 'company';
> }
> ```
>
> **Component:**
> ```tsx
> export default function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
>   const router = useRouter();
>   const [query, setQuery] = useState('');
>   const [results, setResults] = useState<SearchResult[]>([]);
>   const [loading, setLoading] = useState(false);
>
>   // Debounced search — 300ms delay, cancelled on new input
>   const search = useCallback(async (q: string) => {
>     if (q.trim().length < 2) { setResults([]); return; }
>     setLoading(true);
>     try {
>       const endpoints: Promise<Response>[] = [
>         fetch(`/api/drives?search=${encodeURIComponent(q)}&limit=4`),
>       ];
>       if (role === 'admin' || role === 'faculty') {
>         endpoints.push(fetch(`/api/${role}/students?search=${encodeURIComponent(q)}&limit=4`));
>       }
>       if (role === 'student') {
>         endpoints.push(fetch(`/api/student/companies?search=${encodeURIComponent(q)}&limit=4`));
>       }
>
>       const responses = await Promise.allSettled(endpoints);
>       const allResults: SearchResult[] = [];
>
>       // Process drives
>       if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
>         const data = await responses[0].value.json();
>         (data.drives ?? []).forEach((d: { id: string; companyName: string; role: string }) => {
>           allResults.push({
>             id: d.id,
>             label: d.companyName,
>             sublabel: d.role,
>             href: role === 'admin' ? `/admin/drives` : role === 'faculty' ? `/faculty/drives` : `/student/drives`,
>             icon: Briefcase,
>             category: 'drive',
>           });
>         });
>       }
>
>       // Process students or companies
>       if (responses[1]?.status === 'fulfilled' && responses[1].value.ok) {
>         const data = await responses[1].value.json();
>         if (role === 'student') {
>           (data.companies ?? []).forEach((c: { id: string; name: string; industry: string }) => {
>             allResults.push({
>               id: c.id,
>               label: c.name,
>               sublabel: c.industry,
>               href: `/student/companies/${c.id}`,
>               icon: Building2,
>               category: 'company',
>             });
>           });
>         } else {
>           (data.students ?? []).forEach((s: { id: string; name: string; sapId: string }) => {
>             allResults.push({
>               id: s.id,
>               label: s.name,
>               sublabel: s.sapId,
>               href: role === 'admin' ? `/admin/students` : `/faculty/students`,
>               icon: GraduationCap,
>               category: 'student',
>             });
>           });
>         }
>       }
>
>       setResults(allResults);
>     } catch {
>       setResults([]);
>     } finally {
>       setLoading(false);
>     }
>   }, [role]);
>
>   // Debounce
>   useEffect(() => {
>     const timer = setTimeout(() => search(query), 300);
>     return () => clearTimeout(timer);
>   }, [query, search]);
>
>   // Reset on close
>   useEffect(() => {
>     if (!open) { setQuery(''); setResults([]); }
>   }, [open]);
>
>   const driveResults = results.filter(r => r.category === 'drive');
>   const otherResults = results.filter(r => r.category !== 'drive');
>
>   const handleSelect = (href: string) => {
>     router.push(href);
>     onOpenChange(false);
>   };
>
>   return (
>     <CommandDialog open={open} onOpenChange={onOpenChange}>
>       <CommandInput
>         placeholder='Search drives, students, companies...'
>         value={query}
>         onValueChange={setQuery}
>       />
>       <CommandList>
>         {loading && (
>           <div className='py-6 flex items-center justify-center'>
>             <div className='w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin' />
>           </div>
>         )}
>         {!loading && query.length >= 2 && results.length === 0 && (
>           <CommandEmpty>No results for &quot;{query}&quot;</CommandEmpty>
>         )}
>         {!loading && query.length < 2 && (
>           <div className='px-4 py-8 text-center'>
>             <Search size={24} className='text-muted-foreground mx-auto mb-2 opacity-40' />
>             <p className='text-[12px] text-muted-foreground'>Type at least 2 characters to search</p>
>           </div>
>         )}
>         {driveResults.length > 0 && (
>           <CommandGroup heading='Drives'>
>             {driveResults.map(result => (
>               <CommandItem
>                 key={result.id}
>                 onSelect={() => handleSelect(result.href)}
>                 className='flex items-center gap-3 cursor-pointer'
>               >
>                 <result.icon size={15} className='text-muted-foreground shrink-0' />
>                 <div className='min-w-0 flex-1'>
>                   <span className='text-sm font-semibold text-foreground'>{result.label}</span>
>                   {result.sublabel && (
>                     <span className='ml-2 text-[11px] text-muted-foreground'>{result.sublabel}</span>
>                   )}
>                 </div>
>                 <ArrowRight size={12} className='text-muted-foreground shrink-0' />
>               </CommandItem>
>             ))}
>           </CommandGroup>
>         )}
>         {driveResults.length > 0 && otherResults.length > 0 && <CommandSeparator />}
>         {otherResults.length > 0 && (
>           <CommandGroup heading={role === 'student' ? 'Companies' : 'Students'}>
>             {otherResults.map(result => (
>               <CommandItem
>                 key={result.id}
>                 onSelect={() => handleSelect(result.href)}
>                 className='flex items-center gap-3 cursor-pointer'
>               >
>                 <result.icon size={15} className='text-muted-foreground shrink-0' />
>                 <div className='min-w-0 flex-1'>
>                   <span className='text-sm font-semibold text-foreground'>{result.label}</span>
>                   {result.sublabel && (
>                     <span className='ml-2 text-[11px] text-muted-foreground'>{result.sublabel}</span>
>                   )}
>                 </div>
>                 <ArrowRight size={12} className='text-muted-foreground shrink-0' />
>               </CommandItem>
>             ))}
>           </CommandGroup>
>         )}
>       </CommandList>
>     </CommandDialog>
>   );
> }
> ```"

---

## Sub-Phase 08.3: Header Search Trigger Component

**File to Target:** `components/shared/header-search-trigger.tsx` (new file)  
**Context for Copilot:** A small client component that renders the search trigger button in the header and manages the `open` state for the `CommandPalette`. It registers the `Cmd+K` / `Ctrl+K` keyboard shortcut via a `useEffect`. The button shows a search icon + a keyboard shortcut hint (`⌘K` on Mac, `Ctrl+K` on Windows/Linux). On mobile (< 768px), only the icon is shown (no text). This component is inserted into each portal header.

**The Copilot Prompt:**
> "Create `components/shared/header-search-trigger.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { useState, useEffect } from 'react';
> import { Search } from 'lucide-react';
> import dynamic from 'next/dynamic';
>
> const CommandPalette = dynamic(
>   () => import('@/components/shared/command-palette'),
>   { ssr: false }
> );
> ```
> Using `dynamic()` with `ssr: false` keeps the command palette out of the server bundle — it only loads when the trigger is clicked or Cmd+K is pressed.
>
> **Props:**
> ```ts
> interface HeaderSearchTriggerProps {
>   role: 'student' | 'faculty' | 'admin';
> }
> ```
>
> **Component:**
> ```tsx
> export default function HeaderSearchTrigger({ role }: HeaderSearchTriggerProps) {
>   const [open, setOpen] = useState(false);
>   const [isMac, setIsMac] = useState(false);
>
>   useEffect(() => {
>     setIsMac(navigator.platform.toUpperCase().includes('MAC'));
>   }, []);
>
>   useEffect(() => {
>     const handleKeydown = (e: KeyboardEvent) => {
>       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
>         e.preventDefault();
>         setOpen(prev => !prev);
>       }
>     };
>     document.addEventListener('keydown', handleKeydown);
>     return () => document.removeEventListener('keydown', handleKeydown);
>   }, []);
>
>   return (
>     <>
>       <button
>         onClick={() => setOpen(true)}
>         className='flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 text-[12px] font-medium'
>         aria-label='Open command palette'
>       >
>         <Search size={14} />
>         <span className='hidden sm:inline'>Search</span>
>         <kbd className='hidden md:inline-flex items-center gap-0.5 text-[10px] font-bold opacity-60'>
>           {isMac ? '⌘' : 'Ctrl'}<span>K</span>
>         </kbd>
>       </button>
>
>       {open && (
>         <CommandPalette
>           open={open}
>           onOpenChange={setOpen}
>           role={role}
>         />
>       )}
>     </>
>   );
> }
> ```
>
> **Styling notes:**
> - The trigger button has `bg-muted/60 border border-border` — a subtle pill-style search box consistent with the reference UI's header search bar
> - On `xs`/`sm` screens: icon only (Search, 14px)
> - On `sm+`: icon + 'Search' text
> - On `md+`: icon + 'Search' + keyboard shortcut hint
> - The `CommandPalette` is dynamically imported to avoid adding it to the initial bundle"

---

## Sub-Phase 08.4: Wire Search Trigger into All Portal Headers

**File to Target:** `app/(admin)/layout.tsx`, `app/(faculty)/layout.tsx`, `app/(student)/layout.tsx`  
**Context for Copilot:** Add `HeaderSearchTrigger` into each portal's header. It should appear between the logo group (left side) and the user/sign-out group (right side) — centered in the header on desktop. On mobile, the trigger appears in the right group alongside the MobileNav hamburger.

**The Copilot Prompt:**
> "Add `HeaderSearchTrigger` to all three portal layouts. The change is identical for each — only the `role` prop differs.
>
> **For each layout file, make two changes:**
>
> **1. Add import:**
> ```tsx
> import HeaderSearchTrigger from '@/components/shared/header-search-trigger';
> ```
>
> **2. Insert the trigger in the header JSX** — place it between the left brand group and the right user group:
> ```tsx
> {/* ── Header ── */}
> <header className='h-14 shrink-0 sticky top-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6'>
>   {/* Left: Logo + badge */}
>   <div className='flex items-center gap-3'>
>     {/* ... existing logo/badge ... */}
>   </div>
>
>   {/* Center: Search trigger — grows to fill space on desktop */}
>   <div className='hidden sm:flex flex-1 justify-center px-4 max-w-xs lg:max-w-sm mx-auto'>
>     <HeaderSearchTrigger role='admin' />  {/* change role per portal */}
>   </div>
>
>   {/* Right: User info + controls */}
>   <div className='flex items-center gap-2 sm:gap-3'>
>     {/* ... existing user name, MobileNav, ThemeToggle, SignOutButton ... */}
>     {/* Add mobile search trigger here */}
>     <div className='sm:hidden'>
>       <HeaderSearchTrigger role='admin' />  {/* icon-only on mobile */}
>     </div>
>   </div>
> </header>
> ```
>
> **Role values per portal:**
> - `app/(admin)/layout.tsx`: `role='admin'`
> - `app/(faculty)/layout.tsx`: `role='faculty'`
> - `app/(student)/layout.tsx`: `role='student'`
>
> **Layout note:** The center `<div className='hidden sm:flex flex-1 justify-center px-4 max-w-xs lg:max-w-sm mx-auto'>` uses `flex-1` to push the trigger to the center of the available header space. The left and right groups are fixed-width content — the center div absorbs the remaining space. On mobile (`< sm`), the center trigger is hidden and the right-group trigger (icon-only) is shown instead, keeping the mobile header uncluttered."
