'use client';

import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { FormField, FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';
import type { StudentProfileInput, skillSchema } from '@/lib/validations/student-profile';
import { z } from 'zod';

type Skill = z.infer<typeof skillSchema>;

interface TabSkillsProps {
  form: UseFormReturn<StudentProfileInput>;
  isEditing: boolean;
  skillFields: UseFieldArrayReturn<StudentProfileInput, 'skills'>['fields'];
  appendSkill: UseFieldArrayReturn<StudentProfileInput, 'skills'>['append'];
  removeSkill: UseFieldArrayReturn<StudentProfileInput, 'skills'>['remove'];
  softSkillInput: string;
  setSoftSkillInput: (v: string) => void;
  profile: { skills?: Skill[]; softSkills?: string[] };
}

function ProficiencyDots({ value }: { value: number }) {
  return (
    <span className='flex items-center gap-0.5 ml-1'>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </span>
  );
}

export default function TabSkills({
  form,
  isEditing,
  skillFields,
  appendSkill,
  removeSkill,
  softSkillInput,
  setSoftSkillInput,
  profile
}: TabSkillsProps) {
  const inputClass = "bg-muted/40 border-border h-9 text-sm focus:ring-primary w-full";

  if (!isEditing) {
    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-sm font-bold text-foreground uppercase tracking-wider mb-3'>Technical Skills</h3>
          {(!profile.skills || profile.skills.length === 0) ? (
            <p className='text-sm text-muted-foreground italic'>No skills added yet.</p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {profile.skills.map((skill: Skill, i: number) => (
                <div
                  key={i}
                  className='inline-flex items-center gap-2 bg-muted/50 border border-border rounded px-3 py-1.5'
                >
                  <span className='text-sm font-medium text-foreground'>{skill.name}</span>
                  {(skill.proficiency !== undefined && skill.proficiency > 0) && <ProficiencyDots value={skill.proficiency} />}
                  {skill.category && (
                    <span className='text-[10px] font-medium text-muted-foreground border-l border-border pl-2'>
                      {skill.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className='text-sm font-bold text-foreground uppercase tracking-wider mb-3'>Soft Skills</h3>
          {(!profile.softSkills || profile.softSkills.length === 0) ? (
            <p className='text-sm text-muted-foreground italic'>No soft skills added yet.</p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {profile.softSkills.map((s: string, i: number) => (
                <span
                  key={i}
                  className='inline-flex items-center text-sm font-medium bg-muted/50 border border-border rounded px-3 py-1'
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Technical Skills Edit */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-bold text-foreground uppercase tracking-wider'>Technical Skills</h3>
        </div>
        
        <div className='space-y-3 mb-4'>
          {skillFields.map((field, idx) => {
            const nameError = form.formState.errors.skills?.[idx]?.name;
            const hasError = !!nameError;
            return (
            <div key={field.id} className='flex w-full flex-col gap-2 sm:flex-row sm:items-start'>
              <FormField control={form.control} name={`skills.${idx}.name`} render={({field: f}) => (
                <FormItem className='w-full sm:flex-1'><FormControl>
                  <div className='relative'>
                    <Input 
                      className={`${inputClass} ${hasError ? 'border-destructive bg-destructive/5' : ''}`} 
                      placeholder='React, Python, etc.' 
                      {...f} 
                      value={f.value ?? ''}
                    />
                    {hasError && (
                      <AlertCircle className='absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive' />
                    )}
                  </div>
                </FormControl>
                {hasError && <FormMessage className='text-xs mt-1' />}
                </FormItem>
              )} />
              
              <FormField control={form.control} name={`skills.${idx}.proficiency` as const} render={({field: f}) => (
                <FormItem className='w-full sm:w-32'>
                  <Select onValueChange={(v) => f.onChange(parseInt(v))} value={f.value?.toString() ?? ''}>
                    <FormControl>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder='Level' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <SelectItem key={lvl} value={lvl.toString()}>Level {lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name={`skills.${idx}.category` as const} render={({field: f}) => (
                <FormItem className='w-full sm:w-48'><FormControl><Input className={inputClass} placeholder='e.g. Frontend' {...f} value={f.value ?? ''}/></FormControl></FormItem>
              )} />

              <button type='button' onClick={() => removeSkill(idx)} className='h-9 w-9 self-end rounded bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-white sm:self-auto'>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
            );
          })}
        </div>
        
        <button type='button' onClick={() => appendSkill({ name: '', proficiency: 3, category: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors'>
          <Plus className='w-3 h-3' /> Add Skill
        </button>
      </div>

      {/* Soft Skills Edit */}
      <div>
        <h3 className='text-sm font-bold text-foreground uppercase tracking-wider mb-4'>Soft Skills</h3>
        
        <div className='flex flex-wrap gap-2 mb-3'>
          {(form.watch('softSkills') || []).map((skill: string, idx: number) => (
            <span key={idx} className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border text-foreground text-sm font-medium rounded'>
              {skill}
              <button type='button' onClick={() => {
                const current = form.getValues('softSkills') || [];
                form.setValue('softSkills', current.filter((_, i) => i !== idx), { shouldDirty: true });
              }} className='text-muted-foreground hover:text-foreground outline-none'>
                <X className='w-3 h-3' />
              </button>
            </span>
          ))}
        </div>

        <div className='flex gap-2 w-full sm:w-80'>
          <Input 
            value={softSkillInput} 
            onChange={(e) => setSoftSkillInput(e.target.value)} 
            placeholder='e.g. Leadership, Communication' 
            className={inputClass} 
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                e.preventDefault();
                if(softSkillInput.trim()) {
                  form.setValue('softSkills', [...(form.getValues('softSkills') || []), softSkillInput.trim()], { shouldDirty: true });
                  setSoftSkillInput('');
                }
              }
            }}
          />
          <button type='button' onClick={() => {
            if(softSkillInput.trim()) {
              form.setValue('softSkills', [...(form.getValues('softSkills') || []), softSkillInput.trim()], { shouldDirty: true });
              setSoftSkillInput('');
            }
          }} className='h-9 px-3 bg-muted/60 hover:bg-muted text-foreground border border-border rounded transition-colors shrink-0 flex items-center justify-center'>
            <Plus className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
