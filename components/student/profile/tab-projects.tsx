'use client';

import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ExternalLink, Briefcase, FolderOpen } from 'lucide-react';
import type { StudentProfileInput } from '@/lib/validations/student-profile';

interface TabProjectsProps {
  form: UseFormReturn<StudentProfileInput>;
  isEditing: boolean;
  projectFields: UseFieldArrayReturn<StudentProfileInput, 'projects'>['fields'];
  appendProject: UseFieldArrayReturn<StudentProfileInput, 'projects'>['append'];
  removeProject: UseFieldArrayReturn<StudentProfileInput, 'projects'>['remove'];
  workFields: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['fields'];
  appendWork: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['append'];
  removeWork: UseFieldArrayReturn<StudentProfileInput, 'workExperience'>['remove'];
  profile: { projects?: any[]; workExperience?: any[] };
}

export default function TabProjects({
  form,
  isEditing,
  projectFields,
  appendProject,
  removeProject,
  workFields,
  appendWork,
  removeWork,
  profile
}: TabProjectsProps) {
  const inputClass = "bg-muted/40 border-border text-foreground rounded-md focus:ring-primary w-full";

  if (!isEditing) {
    return (
      <div className='space-y-8'>
        {/* Work Experience View */}
        <div>
          <div className='flex items-center gap-2 mb-4'>
            <Briefcase className='w-4 h-4 text-primary' />
            <h3 className='text-xs font-semibold text-foreground tracking-widest uppercase'>Work Experience</h3>
          </div>
          {(!profile.workExperience || profile.workExperience.length === 0) ? (
            <p className='text-sm text-muted-foreground italic'>No work experience added.</p>
          ) : (
            <div className='space-y-3'>
              {profile.workExperience.map((exp: any, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h4 className='text-sm font-semibold text-foreground'>{exp.company}</h4>
                      <p className='text-xs text-muted-foreground mt-0.5'>{exp.role}</p>
                    </div>
                  </div>
                  <div className='text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5'>
                    <span>{exp.startDate} {exp.endDate ? `- ${exp.endDate}` : '- Present'}</span>
                    {exp.location && (
                      <>
                        <span>•</span>
                        <span>{exp.location}</span>
                      </>
                    )}
                  </div>
                  {exp.description && (
                    <p className='text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap'>{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects View */}
        <div>
          <div className='flex items-center gap-2 mb-4'>
            <FolderOpen className='w-4 h-4 text-primary' />
            <h3 className='text-xs font-semibold text-foreground tracking-widest uppercase'>Projects</h3>
          </div>
          {(!profile.projects || profile.projects.length === 0) ? (
            <p className='text-sm text-muted-foreground italic'>No projects added.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {profile.projects.map((p: any, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4 flex flex-col'>
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='text-sm font-semibold text-foreground leading-tight'>{p.title}</h4>
                    {p.url && (
                      <a href={p.url} target='_blank' rel='noreferrer' className='hover:text-primary transition-colors shrink-0'>
                        <ExternalLink size={14} className='text-muted-foreground hover:text-foreground' />
                      </a>
                    )}
                  </div>
                  
                  {p.description && (
                    <p className='text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed'>{p.description}</p>
                  )}
                  
                  {p.techStack && p.techStack.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50 auto-mt'>
                      {p.techStack.map((tech: string, techIdx: number) => (
                        <span key={techIdx} className='bg-muted border border-border rounded px-2 py-0.5 text-[10px] font-medium text-foreground'>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-10'>
      {/* Work Experience Edit Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Work Experience</h3>
        </div>
        
        <div className='space-y-4 mb-4'>
          {workFields.map((field, idx) => (
            <div key={field.id} className='p-6 bg-muted/20 border border-border rounded-md relative space-y-4'>
              <button type='button' onClick={() => removeWork(idx)} className='absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-white transition-colors'><Trash2 className='w-4 h-4' /></button>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mr-8'>
                <FormField control={form.control} name={`workExperience.${idx}.role`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Role</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <FormField control={form.control} name={`workExperience.${idx}.company`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Company</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <FormField control={form.control} name={`workExperience.${idx}.startDate`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Start Date</FormLabel><FormControl><Input type='month' className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <FormField control={form.control} name={`workExperience.${idx}.endDate`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>End Date</FormLabel><FormControl><Input type='month' className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <div className='md:col-span-2'>
                  <FormField control={form.control} name={`workExperience.${idx}.location`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Location</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                </div>
              </div>
              <FormField control={form.control} name={`workExperience.${idx}.description`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Description</FormLabel><FormControl><textarea className={`${inputClass} min-h-[100px] py-3 px-3 w-full text-sm rounded-md border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary`} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
            </div>
          ))}
        </div>

        <button type='button' onClick={() => appendWork({ company: '', role: '', description: '', startDate: '', endDate: '', location: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors'>
          <Plus className='w-3 h-3' /> Add Work Experience
        </button>
      </div>

      {/* Projects Edit Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>Projects</h3>
        </div>

        <div className='space-y-4 mb-4'>
          {projectFields.map((field, idx) => (
            <div key={field.id} className='p-6 bg-muted/20 border border-border rounded-md relative space-y-4'>
              <button type='button' onClick={() => removeProject(idx)} className='absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-white transition-colors'><Trash2 className='w-4 h-4' /></button>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mr-8'>
                <FormField control={form.control} name={`projects.${idx}.title`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Title</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <FormField control={form.control} name={`projects.${idx}.url`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>URL</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                <div className='md:col-span-2'>
                  <FormField control={form.control} name={`projects.${idx}.techStack`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Tech Stack (comma separated)</FormLabel><FormControl><Input className={inputClass + " h-9 text-sm"} value={f.value?.join(', ') || ''} onChange={(e) => f.onChange(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/></FormControl></FormItem>} />
                </div>
              </div>
              <FormField control={form.control} name={`projects.${idx}.description`} render={({field: f}) => <FormItem><FormLabel className='text-xs text-muted-foreground font-bold uppercase'>Description</FormLabel><FormControl><textarea className={`${inputClass} min-h-[80px] py-3 px-3 w-full text-sm rounded-md border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary`} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
            </div>
          ))}
        </div>

        <button type='button' onClick={() => appendProject({ title: '', description: '', techStack: [], url: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors'>
          <Plus className='w-3 h-3' /> Add Project
        </button>
      </div>
    </div>
  );
}
