# Phase 10: Student Profile Page Redesign

> **Scope:** Redesign the student profile page (`app/(student)/student/profile/`) from its current monolithic `profile-view.tsx` into a structured, tab-based enterprise layout. The page keeps its existing form logic, API calls, and react-hook-form / useFieldArray handlers entirely intact — only the JSX structure and visual design changes. New sub-components are extracted for the header, tab navigation, and each tab's content.
> **Files to Target:** `app/(student)/student/profile/profile-view.tsx` (restructure JSX), `components/student/profile/profile-header.tsx` (new), `components/student/profile/tab-identity.tsx` (new), `components/student/profile/tab-skills.tsx` (new), `components/student/profile/tab-projects.tsx` (new), `components/student/profile/tab-docs.tsx` (new).
> **Dependencies:** Phase 07 complete (RadialBarChart pattern established). `computeCompleteness` from `lib/profile/completeness` and `toResumeDownloadUrl` from `lib/resume/download-url` are already imported in `profile-view.tsx` — reuse them.
> **Workflow:** After implementing, navigate to `/student/profile`. Verify: header shows avatar with completion ring, tabs switch without page reload, edit mode activates form fields, resume upload still works, save/cancel still work.

---

## Sub-Phase 10.1: Profile Header Component

**File to Target:** `components/student/profile/profile-header.tsx` (new file)
**Context for Copilot:** The profile header is a horizontal strip across the top of the profile page. It shows: a large avatar circle with initials (no images — initials only), a `RadialBarChart` wrapping the avatar showing profile completion 0–100%, name + email + SAP ID metadata, and an Edit / Save / Cancel button group. The completion ring uses the same Recharts `RadialBarChart` pattern from Phase 07 `DashboardGreetingCard`. The header is a read-only display component — all state (isEditing, onSave, onCancel) is passed in as props.

**The Copilot Prompt:**
> "Create `components/student/profile/profile-header.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
> import { Pencil, X, Save, Loader2, Mail, Hash, Calendar } from 'lucide-react';
> import { motion } from 'framer-motion';
> ```
>
> **Props:**
> ```ts
> interface ProfileHeaderProps {
>   name: string;
>   email: string;
>   sapId?: string | null;
>   rollNo?: string | null;
>   batchYear?: number | null;
>   branch?: string | null;
>   completeness: number;           // 0-100 integer
>   isEditing: boolean;
>   isLoading: boolean;
>   onEdit: () => void;
>   onSave: () => void;
>   onCancel: () => void;
> }
> ```
>
> **Component:**
> ```tsx
> export default function ProfileHeader({
>   name, email, sapId, rollNo, batchYear, branch,
>   completeness, isEditing, isLoading, onEdit, onSave, onCancel
> }: ProfileHeaderProps) {
>   const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
>
>   const ringData = [
>     { value: completeness, fill: 'hsl(var(--primary))' },
>     { value: 100 - completeness, fill: 'hsl(var(--muted))' },
>   ];
>
>   const completenessColor =
>     completeness >= 80 ? 'text-emerald-500' :
>     completeness >= 50 ? 'text-amber-500' : 'text-destructive';
>
>   return (
>     <div className='bg-card border border-border rounded-lg p-5 sm:p-6'>
>       <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
>
>         {/* Avatar + Ring */}
>         <div className='relative shrink-0 w-20 h-20'>
>           <ResponsiveContainer width='100%' height='100%'>
>             <RadialBarChart
>               cx='50%' cy='50%'
>               innerRadius='70%' outerRadius='100%'
>               startAngle={90} endAngle={-270}
>               data={ringData}
>               barSize={5}
>             >
>               <RadialBar dataKey='value' cornerRadius={4} isAnimationActive={false} />
>             </RadialBarChart>
>           </ResponsiveContainer>
>           {/* Initials centered over ring */}
>           <div className='absolute inset-[10px] rounded-full bg-primary flex items-center justify-center'>
>             <span className='text-sm font-bold text-white tracking-wide'>{initials}</span>
>           </div>
>         </div>
>
>         {/* Name + metadata */}
>         <div className='flex-1 min-w-0'>
>           <div className='flex items-start justify-between gap-4'>
>             <div>
>               <h2 className='text-xl font-semibold text-foreground leading-tight'>{name}</h2>
>               <p className='text-sm text-muted-foreground mt-0.5'>{email}</p>
>             </div>
>             {/* Completion badge */}
>             <span className={`text-sm font-bold shrink-0 ${completenessColor}`}>
>               {completeness}% complete
>             </span>
>           </div>
>
>           {/* Metadata pills */}
>           <div className='flex flex-wrap gap-2 mt-3'>
>             {sapId && (
>               <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
>                 <Hash size={10} /> SAP {sapId}
>               </span>
>             )}
>             {rollNo && (
>               <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
>                 <Hash size={10} /> {rollNo}
>               </span>
>             )}
>             {branch && (
>               <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
>                 {branch}
>               </span>
>             )}
>             {batchYear && (
>               <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
>                 <Calendar size={10} /> Batch {batchYear}
>               </span>
>             )}
>           </div>
>         </div>
>       </div>
>
>       {/* Action buttons — full width row below on mobile */}
>       <div className='flex items-center gap-2 mt-4 pt-4 border-t border-border'>
>         {!isEditing ? (
>           <button
>             onClick={onEdit}
>             className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors'
>           >
>             <Pencil size={13} /> Edit Profile
>           </button>
>         ) : (
>           <>
>             <button
>               onClick={onSave}
>               disabled={isLoading}
>               className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors'
>             >
>               {isLoading ? <Loader2 size={13} className='animate-spin' /> : <Save size={13} />}
>               Save Changes
>             </button>
>             <button
>               onClick={onCancel}
>               disabled={isLoading}
>               className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
>             >
>               <X size={13} /> Cancel
>             </button>
>           </>
>         )}
>       </div>
>     </div>
>   );
> }
> ```"

---

## Sub-Phase 10.2: Tab Navigation Shell

**File to Target:** `components/student/profile/profile-tab-nav.tsx` (new file)
**Context for Copilot:** A simple tab strip with four tabs: Identity, Skills, Projects, and Documents. Uses Framer Motion `layoutId` for the animated underline indicator. The active tab state is managed in the parent (`profile-view.tsx`) and passed down via props. Each tab button should display an icon from Lucide at 14px. On mobile the tab labels truncate to icons only (hide text below `sm` breakpoint). This is a lightweight presentational component only — no data fetching.

**The Copilot Prompt:**
> "Create `components/student/profile/profile-tab-nav.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { motion } from 'framer-motion';
> import { User, Zap, FolderOpen, FileText } from 'lucide-react';
> ```
>
> **Types:**
> ```ts
> export type ProfileTab = 'identity' | 'skills' | 'projects' | 'documents';
>
> interface ProfileTabNavProps {
>   active: ProfileTab;
>   onChange: (tab: ProfileTab) => void;
> }
>
> const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
>   { id: 'identity', label: 'Identity', icon: User },
>   { id: 'skills',   label: 'Skills',   icon: Zap },
>   { id: 'projects', label: 'Projects', icon: FolderOpen },
>   { id: 'documents',label: 'Documents',icon: FileText },
> ];
> ```
>
> **Component:**
> ```tsx
> export default function ProfileTabNav({ active, onChange }: ProfileTabNavProps) {
>   return (
>     <div className='flex items-end gap-0 border-b border-border overflow-x-auto scrollbar-none'>
>       {TABS.map(({ id, label, icon: Icon }) => (
>         <button
>           key={id}
>           onClick={() => onChange(id)}
>           className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
>             active === id
>               ? 'text-foreground'
>               : 'text-muted-foreground hover:text-foreground'
>           }`}
>         >
>           <Icon size={14} className='shrink-0' />
>           <span className='hidden sm:inline'>{label}</span>
>           {active === id && (
>             <motion.div
>               layoutId='profile-tab-indicator'
>               className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full'
>               transition={{ type: 'spring', stiffness: 500, damping: 40 }}
>             />
>           )}
>         </button>
>       ))}
>     </div>
>   );
> }
> ```"

---

## Sub-Phase 10.3: Identity Tab

**File to Target:** `components/student/profile/tab-identity.tsx` (new file)
**Context for Copilot:** The identity tab shows academic data in view mode and becomes a form in edit mode. View mode uses a 2-column or 3-column grid of labeled stat cells — `label` in muted text above, `value` in foreground semi-bold below. Edit mode wraps inputs in a `<Form>` context provided by the parent via `react-hook-form`. The `form` object, `isEditing` flag, and all select options are passed as props from `profile-view.tsx` which already holds the `useForm()` instance.

**The Copilot Prompt:**
> "Create `components/student/profile/tab-identity.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { UseFormReturn } from 'react-hook-form';
> import { FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form';
> import { Input } from '@/components/ui/input';
> import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
> import type { StudentProfileInput } from '@/lib/validations/student-profile';
> ```
>
> **Branches and batch year options** (keep consistent with existing profile-view.tsx constants):
> ```ts
> const BRANCHES = [
>   'B.Tech Computer Science Engineering',
>   'B.Tech Computer Science Engineering (AI)',
>   'B.Tech Computer Science Engineering (DS)',
>   'B.Tech Computer Science Engineering (Cyber Security)',
>   'B.Tech Information Technology',
>   'B.Tech Electronics & Communication Engineering',
>   'B.Tech Electrical Engineering',
>   'B.Tech Mechanical Engineering',
>   'B.Tech Civil Engineering',
>   'B.Tech Petroleum Engineering',
>   'B.Tech Chemical Engineering',
>   'BCA',
>   'MCA',
>   'MBA',
>   'B.Sc',
>   'M.Tech',
>   'M.Sc',
>   'Ph.D',
> ];
>
> const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
> ```
>
> **Props:**
> ```ts
> interface TabIdentityProps {
>   form: UseFormReturn<StudentProfileInput>;
>   isEditing: boolean;
>   profile: {
>     rollNo?: string | null;
>     sapId?: string | null;
>     branch?: string | null;
>     batchYear?: number | null;
>     cgpa?: number | null;
>     semester?: number | null;
>     tenthPercentage?: number | null;
>     twelfthPercentage?: number | null;
>   };
>   batchYears: number[];
> }
> ```
>
> **StatCell sub-component (for view mode):**
> ```tsx
> function StatCell({ label, value }: { label: string; value: string | number | null | undefined }) {
>   return (
>     <div className='bg-muted/40 border border-border rounded p-3'>
>       <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1'>{label}</p>
>       <p className='text-sm font-semibold text-foreground'>{value ?? '—'}</p>
>     </div>
>   );
> }
> ```
>
> **Component:**
> ```tsx
> export default function TabIdentity({ form, isEditing, profile, batchYears }: TabIdentityProps) {
>   if (!isEditing) {
>     return (
>       <div className='space-y-4'>
>         <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Academic Details</h3>
>         <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
>           <StatCell label='SAP ID' value={profile.sapId} />
>           <StatCell label='Roll Number' value={profile.rollNo} />
>           <StatCell label='Branch' value={profile.branch} />
>           <StatCell label='Batch Year' value={profile.batchYear} />
>           <StatCell label='Semester' value={profile.semester ? `Semester ${profile.semester}` : null} />
>           <StatCell label='CGPA' value={profile.cgpa} />
>           <StatCell label='10th Percentage' value={profile.tenthPercentage ? `${profile.tenthPercentage}%` : null} />
>           <StatCell label='12th Percentage' value={profile.twelfthPercentage ? `${profile.twelfthPercentage}%` : null} />
>         </div>
>       </div>
>     );
>   }
>
>   return (
>     <div className='space-y-6'>
>       <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Academic Details</h3>
>
>       <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
>         {/* SAP ID */}
>         <FormField control={form.control} name='sapId' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>SAP ID</FormLabel>
>             <FormControl>
>               <Input {...field} value={field.value ?? ''} placeholder='500XXXXXXX' className='h-9 text-sm bg-muted/40 border-border' />
>             </FormControl>
>           </FormItem>
>         )} />
>
>         {/* Roll Number */}
>         <FormField control={form.control} name='rollNo' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Roll Number</FormLabel>
>             <FormControl>
>               <Input {...field} value={field.value ?? ''} placeholder='R20XX XXXXXX' className='h-9 text-sm bg-muted/40 border-border' />
>             </FormControl>
>           </FormItem>
>         )} />
>
>         {/* Branch */}
>         <FormField control={form.control} name='branch' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Branch</FormLabel>
>             <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
>               <FormControl>
>                 <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
>                   <SelectValue placeholder='Select branch' />
>                 </SelectTrigger>
>               </FormControl>
>               <SelectContent>
>                 {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
>               </SelectContent>
>             </Select>
>           </FormItem>
>         )} />
>
>         {/* Batch Year */}
>         <FormField control={form.control} name='batchYear' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Batch Year</FormLabel>
>             <Select onValueChange={v => field.onChange(parseInt(v))} defaultValue={field.value?.toString() ?? ''}>
>               <FormControl>
>                 <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
>                   <SelectValue placeholder='Select batch year' />
>                 </SelectTrigger>
>               </FormControl>
>               <SelectContent>
>                 {batchYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
>               </SelectContent>
>             </Select>
>           </FormItem>
>         )} />
>
>         {/* Semester */}
>         <FormField control={form.control} name='semester' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Semester</FormLabel>
>             <Select onValueChange={v => field.onChange(parseInt(v))} defaultValue={field.value?.toString() ?? ''}>
>               <FormControl>
>                 <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
>                   <SelectValue placeholder='Select semester' />
>                 </SelectTrigger>
>               </FormControl>
>               <SelectContent>
>                 {SEMESTERS.map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
>               </SelectContent>
>             </Select>
>           </FormItem>
>         )} />
>
>         {/* CGPA */}
>         <FormField control={form.control} name='cgpa' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>CGPA</FormLabel>
>             <FormControl>
>               <Input
>                 type='number' step='0.01' min='0' max='10'
>                 {...field}
>                 value={field.value ?? ''}
>                 onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
>                 placeholder='e.g. 8.5'
>                 className='h-9 text-sm bg-muted/40 border-border'
>               />
>             </FormControl>
>           </FormItem>
>         )} />
>
>         {/* 10th */}
>         <FormField control={form.control} name='tenthPercentage' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>10th Percentage</FormLabel>
>             <FormControl>
>               <Input
>                 type='number' step='0.01' min='0' max='100'
>                 {...field}
>                 value={field.value ?? ''}
>                 onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
>                 placeholder='e.g. 92.5'
>                 className='h-9 text-sm bg-muted/40 border-border'
>               />
>             </FormControl>
>           </FormItem>
>         )} />
>
>         {/* 12th */}
>         <FormField control={form.control} name='twelfthPercentage' render={({ field }) => (
>           <FormItem>
>             <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>12th Percentage</FormLabel>
>             <FormControl>
>               <Input
>                 type='number' step='0.01' min='0' max='100'
>                 {...field}
>                 value={field.value ?? ''}
>                 onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
>                 placeholder='e.g. 88.0'
>                 className='h-9 text-sm bg-muted/40 border-border'
>               />
>             </FormControl>
>           </FormItem>
>         )} />
>       </div>
>     </div>
>   );
> }
> ```"

---

## Sub-Phase 10.4: Skills Tab and Projects Tab

**File to Target:** `components/student/profile/tab-skills.tsx` (new file) and `components/student/profile/tab-projects.tsx` (new file)
**Context for Copilot:** Both are display components that show read-only data in view mode and inline form arrays in edit mode using `useFieldArray` from `react-hook-form`. The `fields`, `append`, and `remove` functions are passed as props from `profile-view.tsx` which already sets them up. Proficiency is displayed visually as 5 dot indicators (filled vs muted) in view mode. Skills grid uses `flex flex-wrap gap-2` for badges. Projects use a card-per-project layout with `bg-muted/40 border border-border rounded-lg p-4`.

**The Copilot Prompt for tab-skills.tsx:**
> "Create `components/student/profile/tab-skills.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
> import { FormField, FormControl, FormItem } from '@/components/ui/form';
> import { Input } from '@/components/ui/input';
> import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
> import { Plus, Trash2, Zap } from 'lucide-react';
> import type { StudentProfileInput } from '@/lib/validations/student-profile';
> ```
>
> **Props:**
> ```ts
> interface TabSkillsProps {
>   form: UseFormReturn<StudentProfileInput>;
>   isEditing: boolean;
>   skillFields: UseFieldArrayReturn<StudentProfileInput, 'skills'>['fields'];
>   appendSkill: UseFieldArrayReturn<StudentProfileInput, 'skills'>['append'];
>   removeSkill: UseFieldArrayReturn<StudentProfileInput, 'skills'>['remove'];
>   softSkillInput: string;
>   setSoftSkillInput: (v: string) => void;
>   profile: { skills?: any[]; softSkills?: string[] };
> }
> ```
>
> **Proficiency dots sub-component (view mode):**
> ```tsx
> function ProficiencyDots({ value }: { value: number }) {
>   return (
>     <span className='flex items-center gap-0.5'>
>       {Array.from({ length: 5 }).map((_, i) => (
>         <span
>           key={i}
>           className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-primary' : 'bg-border'}`}
>         />
>       ))}
>     </span>
>   );
> }
> ```
>
> **View mode JSX (inside the component when !isEditing):**
> ```tsx
> <div className='space-y-6'>
>   <div>
>     <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3'>Technical Skills</h3>
>     {(!profile.skills || profile.skills.length === 0) ? (
>       <p className='text-sm text-muted-foreground italic'>No skills added yet.</p>
>     ) : (
>       <div className='flex flex-wrap gap-2'>
>         {profile.skills.map((skill: any, i: number) => (
>           <div
>             key={i}
>             className='inline-flex items-center gap-2 bg-muted/50 border border-border rounded px-3 py-1.5'
>           >
>             <span className='text-sm font-medium text-foreground'>{skill.name}</span>
>             {skill.proficiency && <ProficiencyDots value={skill.proficiency} />}
>             {skill.category && (
>               <span className='text-[10px] font-medium text-muted-foreground border-l border-border pl-2'>
>                 {skill.category}
>               </span>
>             )}
>           </div>
>         ))}
>       </div>
>     )}
>   </div>
>
>   <div>
>     <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3'>Soft Skills</h3>
>     {(!profile.softSkills || profile.softSkills.length === 0) ? (
>       <p className='text-sm text-muted-foreground italic'>No soft skills added yet.</p>
>     ) : (
>       <div className='flex flex-wrap gap-2'>
>         {profile.softSkills.map((s: string, i: number) => (
>           <span
>             key={i}
>             className='inline-flex items-center text-sm font-medium bg-muted/50 border border-border rounded px-3 py-1'
>           >
>             {s}
>           </span>
>         ))}
>       </div>
>     )}
>   </div>
> </div>
> ```
>
> **Edit mode JSX** — for each `skillFields` entry show a 3-column row: name (Input), proficiency (Select 1-5), category (Input), with a Trash2 remove button. Below the list, an 'Add Skill' button calls `appendSkill({ name: '', proficiency: 3, category: '' })`. Soft skills edit: a text input with enter-key handler that pushes to the array via `form.setValue('softSkills', [...existing, newValue])`, displayed as dismissible badges.
>
> Keep the edit mode implementation matching the existing logic in `profile-view.tsx` for skill fields — just relocate the JSX here. The `softSkillInput` state and `setSoftSkillInput` setter are passed from the parent to maintain the same controlled-input pattern."

**The Copilot Prompt for tab-projects.tsx:**
> "Create `components/student/profile/tab-projects.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
> import { FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form';
> import { Input } from '@/components/ui/input';
> import { Plus, Trash2, ExternalLink, Briefcase, FolderOpen } from 'lucide-react';
> import type { StudentProfileInput } from '@/lib/validations/student-profile';
> ```
>
> **Props:**
> ```ts
> interface TabProjectsProps {
>   form: UseFormReturn<StudentProfileInput>;
>   isEditing: boolean;
>   projectFields: UseFieldArrayReturn<StudentProfileInput, 'projects'>['fields'];
>   appendProject: UseFieldArrayReturn<StudentProfileInput, 'projects'>['append'];
>   removeProject: UseFieldArrayReturn<StudentProfileInput, 'projects'>['remove'];
>   workFields: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['fields'];
>   appendWork: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['append'];
>   removeWork: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['remove'];
>   profile: { projects?: any[]; workExperience?: any[] };
> }
> ```
>
> **View mode for projects:**
> - Each project: `bg-muted/40 border border-border rounded-lg p-4`
> - Title in `text-sm font-semibold text-foreground`
> - Description in `text-xs text-muted-foreground mt-1 line-clamp-2`
> - Tech stack: array of pills `bg-muted border border-border rounded px-2 py-0.5 text-[10px] font-medium`
> - Dates: `text-[11px] text-muted-foreground`
> - URL: `<a href={url} target='_blank'>` with ExternalLink icon 11px
>
> **View mode for work experience:**
> - Each entry: same card style as projects
> - Company in `text-sm font-semibold`, role in `text-xs text-muted-foreground`
> - Date range + location in `text-[11px] text-muted-foreground`
> - Description in `text-xs text-muted-foreground mt-2`
>
> **Edit mode**: Keep the existing field array logic from `profile-view.tsx` verbatim — just move the JSX into this file. Each project/work entry is an expandable form card with all its fields. 'Add Project' and 'Add Work Experience' buttons at the bottom of each section."

---

## Sub-Phase 10.5: Documents Tab + Wire Up profile-view.tsx

**File to Target:** `components/student/profile/tab-docs.tsx` (new file) and `app/(student)/student/profile/profile-view.tsx` (restructure)
**Context for Copilot:** The documents tab consolidates the resume card, certifications, coding profiles, achievements, and research papers into one section. After creating `tab-docs.tsx`, restructure `profile-view.tsx` to use all four new tab components inside a tabbed layout, replacing the current scrolling single-column JSX with the `ProfileHeader` + `ProfileTabNav` + tab content area pattern. Keep all existing state variables, handlers, `useForm`, `useFieldArray` instances, and API call functions — only the returned JSX changes.

**The Copilot Prompt for tab-docs.tsx:**
> "Create `components/student/profile/tab-docs.tsx` as a client component (`'use client'`).
>
> **Imports:**
> ```tsx
> import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
> import { FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form';
> import { Input } from '@/components/ui/input';
> import { Plus, Trash2, FileText, Upload, Download, Loader2, Award, Code2, BookOpen, Trophy, ExternalLink } from 'lucide-react';
> import type { StudentProfileInput } from '@/lib/validations/student-profile';
> ```
>
> **Props:**
> ```ts
> interface TabDocsProps {
>   form: UseFormReturn<StudentProfileInput>;
>   isEditing: boolean;
>   // Resume props
>   resumeUrl?: string | null;
>   resumeFilename?: string | null;
>   resumeMime?: string | null;
>   resumeDownloadUrl: string | null;
>   resumeDownloadLabel: string;
>   isUploading: boolean;
>   isPollingParse: boolean;
>   onResumeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   // Field arrays (passed from parent)
>   certFields: any[];
>   appendCert: (v: any) => void;
>   removeCert: (i: number) => void;
>   codingFields: any[];
>   appendCoding: (v: any) => void;
>   removeCoding: (i: number) => void;
>   achievementFields: any[];
>   appendAchievement: (v: any) => void;
>   removeAchievement: (i: number) => void;
>   researchFields: any[];
>   appendResearch: (v: any) => void;
>   removeResearch: (i: number) => void;
>   profile: {
>     certifications?: any[];
>     codingProfiles?: any[];
>     achievements?: any[];
>     researchPapers?: any[];
>   };
> }
> ```
>
> **Resume card (both modes):**
> ```tsx
> <div className='bg-muted/40 border border-border rounded-lg p-4'>
>   <div className='flex items-center justify-between mb-3'>
>     <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2'>
>       <FileText size={12} /> Resume
>     </h4>
>     <label className={`inline-flex items-center gap-2 h-7 px-3 rounded text-xs font-medium cursor-pointer transition-colors ${
>       isUploading || isPollingParse
>         ? 'bg-muted text-muted-foreground cursor-not-allowed'
>         : 'border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground'
>     }`}>
>       {isUploading ? <><Loader2 size={11} className='animate-spin' /> Uploading...</> :
>        isPollingParse ? <><Loader2 size={11} className='animate-spin' /> Parsing...</> :
>        <><Upload size={11} /> {resumeUrl ? 'Replace' : 'Upload'}</>}
>       <input type='file' accept='.pdf,.docx' className='sr-only' onChange={onResumeFileChange} disabled={isUploading || isPollingParse} />
>     </label>
>   </div>
>   {resumeUrl ? (
>     <div className='flex items-center justify-between'>
>       <p className='text-sm font-medium text-foreground truncate'>{resumeFilename || 'resume'}</p>
>       {resumeDownloadUrl && (
>         <a href={resumeDownloadUrl} target='_blank' rel='noreferrer'
>           className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'>
>           <Download size={11} /> {resumeDownloadLabel}
>         </a>
>       )}
>     </div>
>   ) : (
>     <p className='text-xs text-muted-foreground italic'>No resume uploaded. Upload a PDF or DOCX (max 5MB).</p>
>   )}
> </div>
> ```
>
> **View mode for each section** (certifications, coding profiles, achievements, research papers):
> - Use the same `bg-muted/40 border border-border rounded-lg p-4` card per item pattern
> - Section heading: `text-xs font-semibold text-muted-foreground uppercase tracking-widest` with icon
> - Empty state: `text-xs text-muted-foreground italic`
>
> **Edit mode**: Move the existing field array JSX from `profile-view.tsx` for certifications, coding profiles, achievements, and research papers into this component verbatim."

**The Copilot Prompt to restructure profile-view.tsx:**
> "Restructure `app/(student)/student/profile/profile-view.tsx` to use the new tab-based layout. Keep ALL existing state, handlers, useForm, useFieldArray, API call functions, and the Dialog for parse choice intact — only replace the returned JSX.
>
> **Add imports at top:**
> ```tsx
> import ProfileHeader from '@/components/student/profile/profile-header';
> import ProfileTabNav, { type ProfileTab } from '@/components/student/profile/profile-tab-nav';
> import TabIdentity from '@/components/student/profile/tab-identity';
> import TabSkills from '@/components/student/profile/tab-skills';
> import TabProjects from '@/components/student/profile/tab-projects';
> import TabDocs from '@/components/student/profile/tab-docs';
> import { AnimatePresence, motion } from 'framer-motion';
> ```
>
> **Add tab state after existing state declarations:**
> ```tsx
> const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
> ```
>
> **Replace the returned JSX with:**
> ```tsx
> return (
>   <>
>     {/* Parse choice dialog — keep intact from existing code */}
>     <Dialog open={parseChoiceDialogOpen} onOpenChange={setParseChoiceDialogOpen}>
>       {/* ... existing dialog content unchanged ... */}
>     </Dialog>
>
>     <div className='max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-24 md:pb-8'>
>       {/* Header */}
>       <ProfileHeader
>         name={user.name}
>         email={user.email}
>         sapId={profile.sapId}
>         rollNo={profile.rollNo}
>         batchYear={profile.batchYear}
>         branch={profile.branch}
>         completeness={score}
>         isEditing={isEditing}
>         isLoading={isLoading}
>         onEdit={() => setIsEditing(true)}
>         onSave={form.handleSubmit(onSubmit)}
>         onCancel={() => { setIsEditing(false); form.reset(); }}
>       />
>
>       {/* Tab navigation */}
>       <div className='bg-card border border-border rounded-lg overflow-hidden'>
>         <ProfileTabNav active={activeTab} onChange={setActiveTab} />
>
>         {/* Tab content */}
>         <Form {...form}>
>           <AnimatePresence mode='wait' initial={false}>
>             <motion.div
>               key={activeTab}
>               initial={{ opacity: 0, y: 4 }}
>               animate={{ opacity: 1, y: 0 }}
>               exit={{ opacity: 0, y: -4 }}
>               transition={{ duration: 0.15 }}
>               className='p-5 sm:p-6'
>             >
>               {activeTab === 'identity' && (
>                 <TabIdentity
>                   form={form}
>                   isEditing={isEditing}
>                   profile={profile}
>                   batchYears={batchYears}
>                 />
>               )}
>               {activeTab === 'skills' && (
>                 <TabSkills
>                   form={form}
>                   isEditing={isEditing}
>                   skillFields={skillFields}
>                   appendSkill={appendSkill}
>                   removeSkill={removeSkill}
>                   softSkillInput={softSkillInput}
>                   setSoftSkillInput={setSoftSkillInput}
>                   profile={profile}
>                 />
>               )}
>               {activeTab === 'projects' && (
>                 <TabProjects
>                   form={form}
>                   isEditing={isEditing}
>                   projectFields={projectFields}
>                   appendProject={appendProject}
>                   removeProject={removeProject}
>                   workFields={workFields}
>                   appendWork={appendWork}
>                   removeWork={removeWork}
>                   profile={profile}
>                 />
>               )}
>               {activeTab === 'documents' && (
>                 <TabDocs
>                   form={form}
>                   isEditing={isEditing}
>                   resumeUrl={profile.resumeUrl}
>                   resumeFilename={profile.resumeFilename}
>                   resumeMime={profile.resumeMime}
>                   resumeDownloadUrl={resumeDownloadUrl}
>                   resumeDownloadLabel={resumeDownloadLabel}
>                   isUploading={isUploading}
>                   isPollingParse={isPollingParse}
>                   onResumeFileChange={handleResumeFileChange}
>                   certFields={certFields}
>                   appendCert={appendCert}
>                   removeCert={removeCert}
>                   codingFields={codingFields}
>                   appendCoding={appendCoding}
>                   removeCoding={removeCoding}
>                   achievementFields={achievementFields}
>                   appendAchievement={appendAchievement}
>                   removeAchievement={removeAchievement}
>                   researchFields={researchFields}
>                   appendResearch={appendResearch}
>                   removeResearch={removeResearch}
>                   profile={profile}
>                 />
>               )}
>             </motion.div>
>           </AnimatePresence>
>         </Form>
>       </div>
>     </div>
>   </>
> );
> ```
>
> **Important notes:**
> - `onSubmit` is the existing form submit handler — do not rename it
> - `handleResumeFileChange` is the existing file input handler that opens the parse choice dialog — preserve the name
> - `projectFields`, `appendProject`, `removeProject`, `workFields`, `appendWork`, `removeWork`, `certFields`, `appendCert`, `removeCert`, `codingFields`, `appendCoding`, `removeCoding`, `achievementFields`, `appendAchievement`, `removeAchievement`, `researchFields`, `appendResearch`, `removeResearch` — all must be declared via `useFieldArray` in the component body before the return, exactly as they were in the original file
> - The `<Form {...form}>` wrapper must enclose all tab content so FormField components work correctly
> - Do NOT remove the existing `Dialog` for parse choice — keep it rendered unconditionally at the top of the JSX tree"
