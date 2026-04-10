# Phase 07: Student Dashboard — 3-Column Bento Grid

> **Scope:** Full redesign of the student dashboard page. Removes `OnboardingBanner` from the layout (per Q4 — it becomes a dashboard card). Implements a dense 3-column bento grid showing real data: AMCAT score bar chart, leaderboard rank, greeting card, profile completion ring, active drives list. All data is fetched server-side and passed to client chart components.
> **Files to Target:** `app/(student)/student/dashboard/page.tsx`, `app/(student)/layout.tsx` (remove OnboardingBanner), new components in `components/student/dashboard/`
> **Dependencies:** Phase 06 fixes complete. Phase 01 tokens and Recharts available.
> **Workflow:** After implementing, verify at `/student/dashboard`. Check: bento grid renders at 1280px (3 cols), 768px (2 cols), 375px (1 col). AMCAT chart shows data or skeleton. Drives list is scrollable. Onboarding card only appears when `onboardingRequired` is true.

---

## Sub-Phase 07.1: Remove OnboardingBanner from Layout

**File to Target:** `app/(student)/layout.tsx`  
**Context for Copilot:** Per the confirmed design decision (Q4: Option B), the `OnboardingBanner` component is removed from the layout shell. Its function — showing onboarding progress to the student — moves into the dashboard page as a full-featured card. Removing it from the layout eliminates the height overflow bug (`calc(100vh - 56px)` not accounting for banner height). The `OnboardingBanner` component file is kept but no longer rendered in the layout.

**The Copilot Prompt:**
> "In `app/(student)/layout.tsx`, make the following two changes only:
>
> **1. Remove the import:**
> ```tsx
> // REMOVE this line:
> import OnboardingBanner from '@/components/student/onboarding-banner';
> ```
>
> **2. Remove the render call:**
> ```tsx
> // REMOVE this line from the JSX (between the header and the body div):
> <OnboardingBanner />
> ```
>
> Do not delete the `onboarding-banner.tsx` component file — it is preserved for potential future use.
> Do not change any other part of the layout.
> After removing the banner, the student layout body div `style={{ height: 'calc(100vh - 56px)' }}` is now exactly correct — header is always 56px, no dynamic elements push it."

---

## Sub-Phase 07.2: Dashboard Page Server Shell

**File to Target:** `app/(student)/student/dashboard/page.tsx`  
**Context for Copilot:** This is a server component that fetches all data needed by the dashboard in a single pass. It fetches: (1) the student's AMCAT score history (last 6 sessions) from the AMCAT API, (2) the student's current leaderboard rank, (3) the count of active drives the student is eligible for, (4) the student's profile completion percentage (using the same 7-field formula from the layout). Data is passed as plain props to client components. If any fetch fails, it is caught and the component passes `null` — client components render skeleton states for null data. This is a `force-dynamic` page since student data changes frequently.

**The Copilot Prompt:**
> "Rewrite `app/(student)/student/dashboard/page.tsx` (or create it if it doesn't exist at this exact path — check for the file in the `(student)` route group).
>
> **File structure:**
> ```tsx
> export const dynamic = 'force-dynamic';
>
> import { requireRole, getStudentProfile } from '@/lib/auth/helpers';
> import DashboardGreetingCard from '@/components/student/dashboard/dashboard-greeting-card';
> import DashboardAMCATChart from '@/components/student/dashboard/dashboard-amcat-chart';
> import DashboardDrivesPanel from '@/components/student/dashboard/dashboard-drives-panel';
> import DashboardOnboardingCard from '@/components/student/dashboard/dashboard-onboarding-card';
> import DashboardStatsRow from '@/components/student/dashboard/dashboard-stats-row';
>
> export default async function StudentDashboardPage() {
>   const user = await requireRole(['student']);
>   const profile = await getStudentProfile(user.id);
>
>   // Compute onboarding progress (same logic as layout)
>   const onboardingFields = [
>     !!profile?.sapId, !!profile?.rollNo, !!profile?.cgpa,
>     !!profile?.branch, !!profile?.batchYear,
>     typeof profile?.tenthPercentage === 'number',
>     typeof profile?.twelfthPercentage === 'number',
>   ];
>   const onboardingProgress = Math.round(
>     (onboardingFields.filter(Boolean).length / onboardingFields.length) * 100
>   );
>   const onboardingRequired = onboardingProgress < 100;
>
>   // Fetch AMCAT data — graceful failure
>   let amcatData: { session: string; score: number }[] | null = null;
>   let leaderboardRank: number | null = null;
>   let activeDrivesCount: number | null = null;
>
>   try {
>     const [amcatRes, rankRes, drivesRes] = await Promise.allSettled([
>       fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/amcat?studentId=${user.id}`, { cache: 'no-store' }),
>       fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/rank?studentId=${user.id}`, { cache: 'no-store' }),
>       fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/student/drives/active?studentId=${user.id}`, { cache: 'no-store' }),
>     ]);
>
>     if (amcatRes.status === 'fulfilled' && amcatRes.value.ok) {
>       amcatData = await amcatRes.value.json();
>     }
>     if (rankRes.status === 'fulfilled' && rankRes.value.ok) {
>       const rankJson = await rankRes.value.json();
>       leaderboardRank = rankJson.rank ?? null;
>     }
>     if (drivesRes.status === 'fulfilled' && drivesRes.value.ok) {
>       const drivesJson = await drivesRes.value.json();
>       activeDrivesCount = drivesJson.count ?? null;
>     }
>   } catch {
>     // All data defaults to null — components show skeletons
>   }
>
>   return (
>     <div className='space-y-5'>
>
>       {/* Onboarding card — only when incomplete */}
>       {onboardingRequired && (
>         <DashboardOnboardingCard progress={onboardingProgress} />
>       )}
>
>       {/* Stats row — 4 metric chips */}
>       <DashboardStatsRow
>         amcatScore={amcatData?.[0]?.score ?? null}
>         leaderboardRank={leaderboardRank}
>         activeDrives={activeDrivesCount}
>         profileCompletion={onboardingProgress}
>       />
>
>       {/* 3-column bento grid */}
>       <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
>
>         {/* Left: AMCAT chart */}
>         <div className='xl:col-span-1 md:col-span-2'>
>           <DashboardAMCATChart
>             data={amcatData}
>             studentName={user.name ?? 'Student'}
>           />
>         </div>
>
>         {/* Center: Greeting + profile ring */}
>         <div className='xl:col-span-1'>
>           <DashboardGreetingCard
>             studentName={user.name ?? 'Student'}
>             profileCompletion={onboardingProgress}
>             onboardingRequired={onboardingRequired}
>           />
>         </div>
>
>         {/* Right: Active drives */}
>         <div className='xl:col-span-1'>
>           <DashboardDrivesPanel studentId={user.id} />
>         </div>
>
>       </div>
>     </div>
>   );
> }
> ```
>
> **Important:** If the API routes `/api/student/amcat`, `/api/student/rank`, or `/api/student/drives/active` do not exist, the `Promise.allSettled` will catch the failures and all data will be `null`. Components must handle `null` gracefully with skeleton states. Do not create the API routes in this phase — use existing ones if available."

---

## Sub-Phase 07.3: Dashboard Stats Row

**File to Target:** `components/student/dashboard/dashboard-stats-row.tsx` (new file)  
**Context for Copilot:** A horizontal strip of 4 compact metric cards rendered above the bento grid. Shows: AMCAT Score, Leaderboard Rank, Active Drives count, Profile Completion %. Each card is `bg-card border border-border rounded-lg`. Values are bold and large. Labels are small muted text. When data is `null`, show a shimmer skeleton using the `animate-shimmer` Tailwind class from Phase 01. Framer Motion stagger entrance from left. This is a client component because it uses Framer Motion.

**The Copilot Prompt:**
> "Create `components/student/dashboard/dashboard-stats-row.tsx` as a client component (`'use client'`).
>
> **Props:**
> ```ts
> interface DashboardStatsRowProps {
>   amcatScore: number | null;
>   leaderboardRank: number | null;
>   activeDrives: number | null;
>   profileCompletion: number;
> }
> ```
>
> **Stats config array:**
> ```ts
> import { BarChart3, Trophy, Briefcase, UserCircle } from 'lucide-react';
>
> const getStats = (props: DashboardStatsRowProps) => [
>   {
>     label: 'AMCAT Score',
>     value: props.amcatScore !== null ? String(props.amcatScore) : null,
>     icon: BarChart3,
>     iconColor: 'text-primary',
>     iconBg: 'bg-primary/10',
>     suffix: '',
>   },
>   {
>     label: 'Leaderboard Rank',
>     value: props.leaderboardRank !== null ? `#${props.leaderboardRank}` : null,
>     icon: Trophy,
>     iconColor: 'text-warning',
>     iconBg: 'bg-warning/10',
>     suffix: '',
>   },
>   {
>     label: 'Active Drives',
>     value: props.activeDrives !== null ? String(props.activeDrives) : null,
>     icon: Briefcase,
>     iconColor: 'text-success',
>     iconBg: 'bg-success/10',
>     suffix: '',
>   },
>   {
>     label: 'Profile Complete',
>     value: String(props.profileCompletion),
>     icon: UserCircle,
>     iconColor: 'text-[#3E53A0]',
>     iconBg: 'bg-[#3E53A0]/10',
>     suffix: '%',
>   },
> ];
> ```
>
> **Layout:**
> ```tsx
> import { motion } from 'framer-motion';
>
> const container = {
>   hidden: {},
>   visible: { transition: { staggerChildren: 0.06 } }
> };
> const item = {
>   hidden: { opacity: 0, y: 8 },
>   visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } }
> };
>
> export default function DashboardStatsRow(props: DashboardStatsRowProps) {
>   const stats = getStats(props);
>   return (
>     <motion.div
>       variants={container}
>       initial='hidden'
>       animate='visible'
>       className='grid grid-cols-2 xl:grid-cols-4 gap-3'
>     >
>       {stats.map(stat => (
>         <motion.div
>           key={stat.label}
>           variants={item}
>           className='bg-card border border-border rounded-lg p-4 flex items-start gap-3'
>         >
>           <div className={`w-9 h-9 rounded-md ${stat.iconBg} flex items-center justify-center shrink-0`}>
>             <stat.icon size={18} className={stat.iconColor} />
>           </div>
>           <div className='min-w-0'>
>             <p className='text-[11px] text-muted-foreground font-medium truncate'>{stat.label}</p>
>             {stat.value !== null ? (
>               <p className='text-xl font-black text-foreground leading-tight mt-0.5'>
>                 {stat.value}<span className='text-sm font-semibold text-muted-foreground'>{stat.suffix}</span>
>               </p>
>             ) : (
>               <div className='h-7 w-16 mt-1 rounded-sm bg-muted overflow-hidden'>
>                 <div className='h-full w-full animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' />
>               </div>
>             )}
>           </div>
>         </motion.div>
>       ))}
>     </motion.div>
>   );
> }
> ```"

---

## Sub-Phase 07.4: Dashboard AMCAT Chart Card

**File to Target:** `components/student/dashboard/dashboard-amcat-chart.tsx` (new file)  
**Context for Copilot:** The AMCAT chart card is the left-column anchor of the bento grid. It shows a bar chart of the student's AMCAT scores across sessions using Recharts `BarChart`. Each bar shows the session name on X-axis and score on Y-axis. The bars are primary blue (`#5A77DF`). The highest score session has a distinct accent (`#3E53A0`). The card has a header row with title + "View all" link. When `data` is `null`, render skeleton bars. The chart uses `ResponsiveContainer` so it fills the card width. Mouse-reactive tilt using `useMotionValue` — disabled on touch via `useReducedMotion`.

**The Copilot Prompt:**
> "Create `components/student/dashboard/dashboard-amcat-chart.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
> import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
> import Link from 'next/link';
> import { BarChart3, ArrowUpRight } from 'lucide-react';
> import { useRef } from 'react';
> ```
>
> **Props:**
> ```ts
> interface DashboardAMCATChartProps {
>   data: { session: string; score: number }[] | null;
>   studentName: string;
> }
> ```
>
> **Mouse-reactive tilt setup (disable on touch):**
> ```tsx
> const prefersReducedMotion = useReducedMotion();
> const cardRef = useRef<HTMLDivElement>(null);
> const mouseX = useMotionValue(0);
> const mouseY = useMotionValue(0);
> const rotateX = useTransform(mouseY, [-0.5, 0.5], ['3deg', '-3deg']);
> const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-3deg', '3deg']);
>
> const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
>   if (prefersReducedMotion || !cardRef.current) return;
>   const rect = cardRef.current.getBoundingClientRect();
>   mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
>   mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
> };
> const handleMouseLeave = () => {
>   mouseX.set(0);
>   mouseY.set(0);
> };
> ```
>
> **Card outer wrapper:**
> ```tsx
> <motion.div
>   ref={cardRef}
>   onMouseMove={handleMouseMove}
>   onMouseLeave={handleMouseLeave}
>   style={prefersReducedMotion ? {} : { rotateX, rotateY, transformPerspective: 800 }}
>   className='bg-card border border-border rounded-xl p-5 h-full flex flex-col'
> >
>   {/* Header row */}
>   <div className='flex items-center justify-between mb-4'>
>     <div className='flex items-center gap-2'>
>       <div className='w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center'>
>         <BarChart3 size={16} className='text-primary' />
>       </div>
>       <div>
>         <p className='text-[13px] font-bold text-foreground'>AMCAT Score History</p>
>         <p className='text-[11px] text-muted-foreground'>Last 6 sessions</p>
>       </div>
>     </div>
>     <Link
>       href='/student/leaderboard'
>       className='flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-[#3E53A0] transition-colors duration-150'
>     >
>       View all <ArrowUpRight size={13} />
>     </Link>
>   </div>
>
>   {/* Chart area */}
>   <div className='flex-1 min-h-[180px]'>
>     {data && data.length > 0 ? (
>       <>
>         {/* Best score callout */}
>         <div className='mb-3 flex items-baseline gap-1.5'>
>           <span className='text-3xl font-black text-foreground'>
>             {Math.max(...data.map(d => d.score))}
>           </span>
>           <span className='text-[12px] text-muted-foreground font-medium'>best score</span>
>         </div>
>         <ResponsiveContainer width='100%' height={140}>
>           <BarChart data={data} barSize={28}>
>             <XAxis
>               dataKey='session'
>               tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
>               axisLine={false}
>               tickLine={false}
>             />
>             <YAxis hide domain={['dataMin - 50', 'dataMax + 20']} />
>             <Tooltip
>               cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
>               contentStyle={{
>                 background: 'hsl(var(--card))',
>                 border: '1px solid hsl(var(--border))',
>                 borderRadius: '8px',
>                 fontSize: '12px',
>                 fontWeight: 600,
>                 padding: '6px 10px',
>               }}
>               itemStyle={{ color: 'hsl(var(--foreground))' }}
>               labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
>             />
>             <Bar dataKey='score' radius={[4, 4, 0, 0]}>
>               {data.map((entry, index) => {
>                 const isHighest = entry.score === Math.max(...data.map(d => d.score));
>                 return (
>                   <Cell
>                     key={`cell-${index}`}
>                     fill={isHighest ? '#3E53A0' : '#5A77DF'}
>                     opacity={isHighest ? 1 : 0.75}
>                   />
>                 );
>               })}
>             </Bar>
>           </BarChart>
>         </ResponsiveContainer>
>       </>
>     ) : (
>       /* Skeleton bars when data is null */
>       <div className='flex flex-col gap-3 h-full justify-end'>
>         <div className='h-5 w-20 rounded-sm bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' />
>         <div className='flex items-end gap-2 h-[140px]'>
>           {[60, 80, 70, 90, 65, 85].map((h, i) => (
>             <div
>               key={i}
>               className='flex-1 rounded-sm bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]'
>               style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
>             />
>           ))}
>         </div>
>       </div>
>     )}
>   </div>
> </motion.div>
> ```"

---

## Sub-Phase 07.5: Dashboard Greeting Card + Drives Panel + Onboarding Card

**File to Target:** `components/student/dashboard/dashboard-greeting-card.tsx`, `components/student/dashboard/dashboard-drives-panel.tsx`, `components/student/dashboard/dashboard-onboarding-card.tsx` (all new files)  
**Context for Copilot:** Three remaining bento cells. The greeting card (center column) shows a personalized hello, a profile completion ring using Recharts `RadialBarChart`, and a link to the profile page. The drives panel (right column) shows a list of active drives with company name, deadline, and eligibility badge — fetched client-side via SWR or a fetch call. The onboarding card (top of page, full width, only when `onboardingRequired`) shows a progress bar with the `onboardingProgress` percentage and a CTA button to `/student/onboarding`.

**The Copilot Prompt:**
> "Create three files. Each is a client component.
>
> ---
>
> **File 1: `components/student/dashboard/dashboard-greeting-card.tsx`**
>
> Props: `{ studentName: string; profileCompletion: number; onboardingRequired: boolean }`
>
> Imports: `RadialBarChart, RadialBar, ResponsiveContainer` from `'recharts'`; `UserCircle, ArrowRight` from `'lucide-react'`; `Link` from `'next/link'`
>
> Layout:
> ```tsx
> <div className='bg-card border border-border rounded-xl p-5 flex flex-col gap-5 h-full'>
>   {/* Greeting */}
>   <div>
>     <p className='text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-1'>Welcome back</p>
>     <h2 className='text-xl font-black text-foreground tracking-tight leading-tight'>
>       {/* Show first name only */}
>       {studentName.split(' ')[0]}
>     </h2>
>   </div>
>
>   {/* Profile completion ring */}
>   <div className='flex items-center gap-4'>
>     <div className='relative w-20 h-20 shrink-0'>
>       <ResponsiveContainer width='100%' height='100%'>
>         <RadialBarChart
>           cx='50%' cy='50%'
>           innerRadius='70%' outerRadius='100%'
>           startAngle={90} endAngle={-270}
>           data={[{ value: profileCompletion, fill: '#5A77DF' }]}
>         >
>           <RadialBar dataKey='value' background={{ fill: 'hsl(var(--muted))' }} cornerRadius={8} />
>         </RadialBarChart>
>       </ResponsiveContainer>
>       {/* Center percentage label */}
>       <div className='absolute inset-0 flex items-center justify-center'>
>         <span className='text-sm font-black text-foreground'>{profileCompletion}%</span>
>       </div>
>     </div>
>     <div>
>       <p className='text-[13px] font-bold text-foreground'>Profile Complete</p>
>       <p className='text-[11px] text-muted-foreground mt-0.5 leading-relaxed'>
>         {profileCompletion === 100
>           ? 'Your profile is fully set up.'
>           : `${100 - profileCompletion}% remaining to unlock all features.`
>         }
>       </p>
>     </div>
>   </div>
>
>   {/* CTA */}
>   <Link
>     href={onboardingRequired ? '/student/onboarding' : '/student/profile'}
>     className='mt-auto flex items-center gap-2 text-[12px] font-bold text-primary hover:text-[#3E53A0] transition-colors duration-150'
>   >
>     {onboardingRequired ? 'Complete setup' : 'View profile'}
>     <ArrowRight size={13} />
>   </Link>
> </div>
> ```
>
> ---
>
> **File 2: `components/student/dashboard/dashboard-drives-panel.tsx`**
>
> Props: `{ studentId: string }`
>
> This is a client component that fetches active drives on mount. Use `useState` + `useEffect` to fetch from `/api/student/drives?active=true`. Show a loading skeleton while fetching. On error, show an empty state.
>
> ```tsx
> 'use client';
> import { useEffect, useState } from 'react';
> import Link from 'next/link';
> import { Briefcase, ArrowUpRight, Clock } from 'lucide-react';
>
> interface Drive {
>   id: string;
>   companyName: string;
>   role: string;
>   deadline: string;
>   isEligible: boolean;
> }
>
> export default function DashboardDrivesPanel({ studentId }: { studentId: string }) {
>   const [drives, setDrives] = useState<Drive[] | null>(null);
>   const [loading, setLoading] = useState(true);
>
>   useEffect(() => {
>     fetch(`/api/student/drives?active=true&studentId=${studentId}`)
>       .then(r => r.ok ? r.json() : null)
>       .then(data => { setDrives(data?.drives ?? []); setLoading(false); })
>       .catch(() => { setDrives([]); setLoading(false); });
>   }, [studentId]);
>
>   return (
>     <div className='bg-card border border-border rounded-xl p-5 h-full flex flex-col'>
>       <div className='flex items-center justify-between mb-4'>
>         <div className='flex items-center gap-2'>
>           <div className='w-8 h-8 rounded-md bg-success/10 flex items-center justify-center'>
>             <Briefcase size={16} className='text-success' />
>           </div>
>           <p className='text-[13px] font-bold text-foreground'>Active Drives</p>
>         </div>
>         <Link href='/student/drives' className='flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-[#3E53A0] transition-colors duration-150'>
>           All <ArrowUpRight size={13} />
>         </Link>
>       </div>
>
>       <div className='flex-1 space-y-2 overflow-y-auto'>
>         {loading ? (
>           [1,2,3].map(i => (
>             <div key={i} className='h-14 rounded-lg bg-muted animate-shimmer bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]' style={{ animationDelay: `${i * 0.1}s` }} />
>           ))
>         ) : drives && drives.length > 0 ? (
>           drives.slice(0, 4).map(drive => (
>             <Link
>               key={drive.id}
>               href={`/student/drives`}
>               className='flex items-start justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 group'
>             >
>               <div className='min-w-0 flex-1'>
>                 <p className='text-[13px] font-bold text-foreground truncate'>{drive.companyName}</p>
>                 <p className='text-[11px] text-muted-foreground truncate mt-0.5'>{drive.role}</p>
>               </div>
>               <div className='ml-3 shrink-0 flex flex-col items-end gap-1'>
>                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${drive.isEligible ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
>                   {drive.isEligible ? 'Eligible' : 'Ineligible'}
>                 </span>
>                 <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
>                   <Clock size={9} /> {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
>                 </span>
>               </div>
>             </Link>
>           ))
>         ) : (
>           <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
>             <Briefcase size={28} className='text-muted-foreground opacity-40 mb-2' />
>             <p className='text-[12px] text-muted-foreground'>No active drives at the moment.</p>
>           </div>
>         )}
>       </div>
>     </div>
>   );
> }
> ```
>
> ---
>
> **File 3: `components/student/dashboard/dashboard-onboarding-card.tsx`**
>
> Props: `{ progress: number }`
>
> A prominent, full-width card shown only when onboarding is incomplete:
> ```tsx
> 'use client';
> import Link from 'next/link';
> import { motion } from 'framer-motion';
> import { CheckCircle2, ArrowRight } from 'lucide-react';
>
> export default function DashboardOnboardingCard({ progress }: { progress: number }) {
>   return (
>     <motion.div
>       initial={{ opacity: 0, y: -8 }}
>       animate={{ opacity: 1, y: 0 }}
>       transition={{ duration: 0.3, ease: 'easeOut' }}
>       className='bg-primary/8 border border-primary/25 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4'
>     >
>       <div className='flex-1'>
>         <div className='flex items-center gap-2 mb-2'>
>           <CheckCircle2 size={16} className='text-primary shrink-0' />
>           <p className='text-[13px] font-bold text-foreground'>Complete your profile setup</p>
>         </div>
>         <div className='w-full h-1.5 rounded-full bg-primary/20 overflow-hidden'>
>           <motion.div
>             initial={{ width: 0 }}
>             animate={{ width: `${progress}%` }}
>             transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
>             className='h-full rounded-full bg-primary'
>           />
>         </div>
>         <p className='text-[11px] text-muted-foreground mt-1.5'>
>           {progress}% complete — fill in your academics, SAP ID, and roll number to unlock all features.
>         </p>
>       </div>
>       <Link
>         href='/student/onboarding'
>         className='shrink-0 flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-bold hover:bg-[#3E53A0] transition-colors duration-150'
>       >
>         Continue setup
>         <ArrowRight size={13} />
>       </Link>
>     </motion.div>
>   );
> }
> ```
> Note: `bg-primary/8` uses 8% opacity — if this appears too faint in the browser, change to `bg-primary/10`."
