'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentProfileInput } from '@/lib/validations/student-profile';

const BRANCHES = [
  'B.Tech Computer Science Engineering',
  'B.Tech Computer Science Engineering (AI)',
  'B.Tech Computer Science Engineering (DS)',
  'B.Tech Computer Science Engineering (Cyber Security)',
  'B.Tech Information Technology',
  'B.Tech Electronics & Communication Engineering',
  'B.Tech Electrical Engineering',
  'B.Tech Mechanical Engineering',
  'B.Tech Civil Engineering',
  'B.Tech Petroleum Engineering',
  'B.Tech Chemical Engineering',
  'BCA',
  'MCA',
  'MBA',
  'B.Sc',
  'M.Tech',
  'M.Sc',
  'Ph.D',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TabIdentityProps {
  form: UseFormReturn<StudentProfileInput>;
  isEditing: boolean;
  profile: {
    rollNo?: string | null;
    sapId?: string | null;
    branch?: string | null;
    batchYear?: number | null;
    cgpa?: number | null;
    semester?: number | null;
    tenthPercentage?: number | null;
    twelfthPercentage?: number | null;
  };
  batchYears: number[];
}

function StatCell({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className='bg-muted/40 border border-border rounded p-3'>
      <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1'>{label}</p>
      <p className='text-sm font-semibold text-foreground'>{value ?? '—'}</p>
    </div>
  );
}

export default function TabIdentity({ form, isEditing, profile, batchYears }: TabIdentityProps) {
  if (!isEditing) {
    return (
      <div className='space-y-4'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Academic Details</h3>
        <div className='grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3'>
          <StatCell label='SAP ID' value={profile.sapId} />
          <StatCell label='Roll Number' value={profile.rollNo} />
          <StatCell label='Branch' value={profile.branch} />
          <StatCell label='Batch Year' value={profile.batchYear} />
          <StatCell label='Semester' value={profile.semester ? `Semester ${profile.semester}` : null} />
          <StatCell label='CGPA' value={profile.cgpa} />
          <StatCell label='10th Percentage' value={profile.tenthPercentage ? `${profile.tenthPercentage}%` : null} />
          <StatCell label='12th Percentage' value={profile.twelfthPercentage ? `${profile.twelfthPercentage}%` : null} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Academic Details</h3>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {/* SAP ID — locked once set, derived from college email */}
        {profile.sapId ? (
          <div>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5'>SAP ID</p>
            <div className='flex items-center gap-2 h-9 px-3 rounded-md bg-muted/60 border border-border text-sm text-foreground'>
              <span className='flex-1 font-mono'>{profile.sapId}</span>
              <Lock size={12} className='text-muted-foreground shrink-0' />
            </div>
            <p className='text-[10px] text-muted-foreground mt-1'>Auto-derived from college email. Contact admin to change.</p>
          </div>
        ) : (
          <FormField control={form.control} name='sapId' render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>SAP ID</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder='500XXXXXXX' className={`h-9 text-sm bg-muted/40 border-border${fieldState.error ? ' border-destructive' : ''}`} />
              </FormControl>
              <FormMessage className='text-xs' />
            </FormItem>
          )} />
        )}

        {/* Roll Number */}
        <FormField control={form.control} name='rollNo' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Roll Number</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder='R20XX XXXXXX' className='h-9 text-sm bg-muted/40 border-border' />
            </FormControl>
          </FormItem>
        )} />

        {/* Branch */}
        <FormField control={form.control} name='branch' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Branch</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
                  <SelectValue placeholder='Select branch' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* Batch Year */}
        <FormField control={form.control} name='batchYear' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Batch Year</FormLabel>
            <Select onValueChange={v => field.onChange(parseInt(v))} defaultValue={field.value?.toString() ?? ''}>
              <FormControl>
                <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
                  <SelectValue placeholder='Select batch year' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {batchYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* Semester */}
        <FormField control={form.control} name='semester' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>Semester</FormLabel>
            <Select onValueChange={v => field.onChange(parseInt(v))} defaultValue={field.value?.toString() ?? ''}>
              <FormControl>
                <SelectTrigger className='h-9 text-sm bg-muted/40 border-border'>
                  <SelectValue placeholder='Select semester' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SEMESTERS.map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* CGPA */}
        <FormField control={form.control} name='cgpa' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>CGPA</FormLabel>
            <FormControl>
              <Input
                type='number' step='0.01' min='0' max='10'
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                placeholder='e.g. 8.5'
                className='h-9 text-sm bg-muted/40 border-border'
              />
            </FormControl>
          </FormItem>
        )} />

        {/* 10th */}
        <FormField control={form.control} name='tenthPercentage' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>10th Percentage</FormLabel>
            <FormControl>
              <Input
                type='number' step='0.01' min='0' max='100'
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                placeholder='e.g. 92.5'
                className='h-9 text-sm bg-muted/40 border-border'
              />
            </FormControl>
          </FormItem>
        )} />

        {/* 12th */}
        <FormField control={form.control} name='twelfthPercentage' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>12th Percentage</FormLabel>
            <FormControl>
              <Input
                type='number' step='0.01' min='0' max='100'
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                placeholder='e.g. 88.0'
                className='h-9 text-sm bg-muted/40 border-border'
              />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
}
