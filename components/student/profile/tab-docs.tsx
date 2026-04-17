'use client';

import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { FormField, FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, FileText, Upload, Download, Loader2, Award, Code2, BookOpen, Trophy, ExternalLink } from 'lucide-react';
import type {
  StudentProfileInput,
  certificationSchema,
  codingProfileSchema,
  achievementSchema,
  researchPaperSchema
} from '@/lib/validations/student-profile';
import { z } from 'zod';

type Certification = z.infer<typeof certificationSchema>;
type CodingProfile = z.infer<typeof codingProfileSchema>;
type Achievement = z.infer<typeof achievementSchema>;
type ResearchPaper = z.infer<typeof researchPaperSchema>;

interface TabDocsProps {
  form: UseFormReturn<StudentProfileInput>;
  isEditing: boolean;
  resumeUrl?: string | null;
  resumeFilename?: string | null;
  resumeDownloadUrl: string | null;
  resumeDownloadLabel: string;
  isUploading: boolean;
  isPollingParse: boolean;
  onResumeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  certFields: UseFieldArrayReturn<StudentProfileInput, 'certifications'>['fields'];
  appendCert: UseFieldArrayReturn<StudentProfileInput, 'certifications'>['append'];
  removeCert: UseFieldArrayReturn<StudentProfileInput, 'certifications'>['remove'];
  codingFields: UseFieldArrayReturn<StudentProfileInput, 'codingProfiles'>['fields'];
  appendCoding: UseFieldArrayReturn<StudentProfileInput, 'codingProfiles'>['append'];
  removeCoding: UseFieldArrayReturn<StudentProfileInput, 'codingProfiles'>['remove'];
  achievementFields: UseFieldArrayReturn<StudentProfileInput, 'achievements'>['fields'];
  appendAchievement: UseFieldArrayReturn<StudentProfileInput, 'achievements'>['append'];
  removeAchievement: UseFieldArrayReturn<StudentProfileInput, 'achievements'>['remove'];
  researchFields: UseFieldArrayReturn<StudentProfileInput, 'researchPapers'>['fields'];
  appendResearch: UseFieldArrayReturn<StudentProfileInput, 'researchPapers'>['append'];
  removeResearch: UseFieldArrayReturn<StudentProfileInput, 'researchPapers'>['remove'];
  profile: {
    certifications?: Certification[];
    codingProfiles?: CodingProfile[];
    achievements?: Achievement[];
    researchPapers?: ResearchPaper[];
  };
}

export default function TabDocs({
  form,
  isEditing,
  resumeUrl,
  resumeFilename,
  resumeDownloadUrl,
  resumeDownloadLabel,
  isUploading,
  isPollingParse,
  onResumeFileChange,
  certFields,
  appendCert,
  removeCert,
  codingFields,
  appendCoding,
  removeCoding,
  achievementFields,
  appendAchievement,
  removeAchievement,
  researchFields,
  appendResearch,
  removeResearch,
  profile
}: TabDocsProps) {
  const inputClass = "bg-muted/40 border-border text-foreground rounded-md focus:ring-primary w-full";

  return (
    <div className='space-y-10'>
      
      {/* Resume Section */}
      <div className='bg-muted/40 border border-border rounded-lg p-4'>
        <div className='flex items-center justify-between mb-3'>
          <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2'>
            <FileText size={12} /> Resume
          </h4>
          {isEditing && (
            <label className={`inline-flex items-center gap-2 h-7 px-3 rounded text-xs font-medium cursor-pointer transition-colors ${
              isUploading || isPollingParse
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}>
              {isUploading ? <><Loader2 size={11} className='animate-spin' /> Uploading...</> :
              isPollingParse ? <><Loader2 size={11} className='animate-spin' /> Parsing...</> :
              <><Upload size={11} /> {resumeUrl ? 'Replace' : 'Upload'}</>}
              <input type='file' accept='.pdf,.docx' className='sr-only' onChange={onResumeFileChange} disabled={isUploading || isPollingParse} />
            </label>
          )}
        </div>
        {resumeUrl ? (
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <p className='min-w-0 text-sm font-medium text-foreground truncate'>{resumeFilename || 'resume'}</p>
            {resumeDownloadUrl && (
              <a href={resumeDownloadUrl} target='_blank' rel='noreferrer'
                className='inline-flex items-center gap-1.5 self-start text-xs font-medium text-primary hover:underline sm:self-auto'>
                <Download size={11} /> {resumeDownloadLabel}
              </a>
            )}
          </div>
        ) : (
          <p className='text-xs text-muted-foreground italic'>No resume uploaded. Upload a PDF or DOCX (max 5MB).</p>
        )}
      </div>

      {/* Certifications Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-widest'>
            <Award className='w-4 h-4 text-warning' /> Certifications
          </h3>
        </div>

        {!isEditing ? (
          <div className='space-y-3'>
            {(!profile.certifications || profile.certifications.length === 0) ? (
              <p className='text-xs text-muted-foreground italic'>No certifications added.</p>
            ) : (
              profile.certifications.map((cert: Certification, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4 flex justify-between items-center'>
                  <div>
                    <h4 className='text-sm font-semibold text-foreground'>{cert.title}</h4>
                    <p className='text-xs text-muted-foreground mt-1'>{cert.issuer} • {cert.dateIssued}</p>
                  </div>
                  {cert.url && (
                    <a href={cert.url} target='_blank' rel='noreferrer' className='p-2 hover:bg-muted/60 rounded-md transition-colors'>
                      <ExternalLink className='w-4 h-4 text-muted-foreground hover:text-foreground' />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {certFields.map((field, idx) => (
              <div key={field.id} className='p-5 bg-muted/20 border border-border rounded-lg relative space-y-4'>
                <button type='button' onClick={() => removeCert(idx)} className='absolute top-4 right-4 text-destructive p-2 hover:bg-destructive/10 rounded-md transition-colors'><Trash2 className='w-4 h-4' /></button>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:pr-12'>
                  <FormField control={form.control} name={`certifications.${idx}.title`} render={({field: f, fieldState}) => <FormItem><FormControl><Input className={`${inputClass}${fieldState.error ? ' border-destructive' : ''}`} placeholder='Title *' {...f} value={f.value ?? ''}/></FormControl><FormMessage className='text-xs' /></FormItem>} />
                  <FormField control={form.control} name={`certifications.${idx}.issuer`} render={({field: f, fieldState}) => <FormItem><FormControl><Input className={`${inputClass}${fieldState.error ? ' border-destructive' : ''}`} placeholder='Issuer *' {...f} value={f.value ?? ''}/></FormControl><FormMessage className='text-xs' /></FormItem>} />
                  <FormField control={form.control} name={`certifications.${idx}.dateIssued`} render={({field: f}) => <FormItem><FormControl><Input type='month' className={inputClass} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  <FormField control={form.control} name={`certifications.${idx}.url`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='URL (optional)' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                </div>
              </div>
            ))}
            <button type='button' onClick={() => appendCert({ title: '', issuer: '', url: '', dateIssued: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-warning hover:text-primary-hover transition-colors'>
              <Plus className='w-3 h-3' /> Add Certification
            </button>
          </div>
        )}
      </div>

      {/* Coding Profiles Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-widest'>
            <Code2 className='w-4 h-4 text-info' /> Coding Profiles
          </h3>
        </div>

        {!isEditing ? (
          <div className='space-y-3'>
            {(!profile.codingProfiles || profile.codingProfiles.length === 0) ? (
              <p className='text-xs text-muted-foreground italic'>No profiles linked.</p>
            ) : (
              profile.codingProfiles.map((cp: CodingProfile, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4'>
                  <a href={cp.url || '#'} target='_blank' rel='noreferrer' className='flex items-center justify-between group'>
                    <div>
                      <h4 className='text-sm font-semibold text-foreground group-hover:text-primary transition-colors'>{cp.platform}</h4>
                      {cp.username && <p className='text-xs text-muted-foreground mt-0.5'>{cp.username}</p>}
                    </div>
                    {cp.url && <ExternalLink className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors' />}
                  </a>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {codingFields.map((field, idx) => (
              <div key={field.id} className='p-5 bg-muted/20 border border-border rounded-lg relative space-y-4'>
                <button type='button' onClick={() => removeCoding(idx)} className='absolute top-4 right-4 text-destructive p-2 hover:bg-destructive/10 rounded-md transition-colors'><Trash2 className='w-4 h-4' /></button>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:pr-12'>
                  <FormField control={form.control} name={`codingProfiles.${idx}.platform`} render={({field: f, fieldState}) => <FormItem><FormControl><Input className={`${inputClass}${fieldState.error ? ' border-destructive' : ''}`} placeholder='Platform * (e.g. GitHub, LeetCode)' {...f} value={f.value ?? ''}/></FormControl><FormMessage className='text-xs' /></FormItem>} />
                  <FormField control={form.control} name={`codingProfiles.${idx}.username`} render={({field: f, fieldState}) => <FormItem><FormControl><Input className={`${inputClass}${fieldState.error ? ' border-destructive' : ''}`} placeholder='Username *' {...f} value={f.value ?? ''}/></FormControl><FormMessage className='text-xs' /></FormItem>} />
                  <div className='md:col-span-2'>
                    <FormField control={form.control} name={`codingProfiles.${idx}.url`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='Profile URL (optional)' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  </div>
                </div>
              </div>
            ))}
            <button type='button' onClick={() => appendCoding({ platform: '', username: '', url: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-info hover:text-primary transition-colors'>
              <Plus className='w-3 h-3' /> Add Profile
            </button>
          </div>
        )}
      </div>

      {/* Achievements Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-widest'>
            <Trophy className='w-4 h-4 text-warning' /> Achievements
          </h3>
        </div>

        {!isEditing ? (
          <div className='space-y-3'>
            {(!profile.achievements || profile.achievements.length === 0) ? (
              <p className='text-xs text-muted-foreground italic'>No achievements added.</p>
            ) : (
              profile.achievements.map((ach: Achievement, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-foreground'>{ach.title}</h4>
                  <p className='text-[11px] text-muted-foreground mt-1 mb-2 uppercase tracking-wide'>{ach.issuer} • {ach.date}</p>
                  <p className='text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap'>{ach.description}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {achievementFields.map((field, idx) => (
              <div key={field.id} className='p-5 bg-muted/20 border border-border rounded-lg relative space-y-4'>
                <button type='button' onClick={() => removeAchievement(idx)} className='absolute top-4 right-4 text-destructive p-2 hover:bg-destructive/10 rounded-md transition-colors'><Trash2 className='w-4 h-4' /></button>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:pr-12'>
                  <FormField control={form.control} name={`achievements.${idx}.title`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='Title' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  <FormField control={form.control} name={`achievements.${idx}.issuer`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='Issuer/Organization' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  <div className='md:col-span-2'>
                    <FormField control={form.control} name={`achievements.${idx}.date`} render={({field: f}) => <FormItem><FormControl><Input type='month' className={inputClass} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  </div>
                </div>
                <FormField control={form.control} name={`achievements.${idx}.description`} render={({field: f}) => <FormItem><FormControl><textarea className={`${inputClass} min-h-[80px] py-3 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-muted/40 border`} placeholder='Description' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
              </div>
            ))}
            <button type='button' onClick={() => appendAchievement({ title: '', description: '', date: '', issuer: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-warning hover:text-primary-hover transition-colors'>
              <Plus className='w-3 h-3' /> Add Achievement
            </button>
          </div>
        )}
      </div>

      {/* Research Papers Container */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-widest'>
            <BookOpen className='w-4 h-4 text-info' /> Research Papers
          </h3>
        </div>

        {!isEditing ? (
          <div className='space-y-3'>
            {(!profile.researchPapers || profile.researchPapers.length === 0) ? (
              <p className='text-xs text-muted-foreground italic'>No research papers added.</p>
            ) : (
              profile.researchPapers.map((paper: ResearchPaper, i: number) => (
                <div key={i} className='bg-muted/40 border border-border rounded-lg p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='text-sm font-semibold text-foreground'>{paper.title}</h4>
                    {paper.url && (
                      <a href={paper.url} target='_blank' rel='noreferrer' className='hover:text-primary transition-colors'>
                        <ExternalLink className='w-4 h-4 text-muted-foreground hover:text-foreground' />
                      </a>
                    )}
                  </div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-3'>Published: {paper.datePublished}</p>
                  <p className='text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap'>{paper.abstract}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {researchFields.map((field, idx) => (
              <div key={field.id} className='p-5 bg-muted/20 border border-border rounded-lg relative space-y-4'>
                <button type='button' onClick={() => removeResearch(idx)} className='absolute top-4 right-4 text-destructive p-2 hover:bg-destructive/10 rounded-md transition-colors'><Trash2 className='w-4 h-4' /></button>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:pr-12'>
                  <FormField control={form.control} name={`researchPapers.${idx}.title`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='Paper Title' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  <FormField control={form.control} name={`researchPapers.${idx}.datePublished`} render={({field: f}) => <FormItem><FormControl><Input type='month' className={inputClass} {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  <div className='md:col-span-2'>
                    <FormField control={form.control} name={`researchPapers.${idx}.url`} render={({field: f}) => <FormItem><FormControl><Input className={inputClass} placeholder='URL to paper' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
                  </div>
                </div>
                <FormField control={form.control} name={`researchPapers.${idx}.abstract`} render={({field: f}) => <FormItem><FormControl><textarea className={`${inputClass} min-h-[80px] py-3 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary border bg-muted/40`} placeholder='Abstract' {...f} value={f.value ?? ''}/></FormControl></FormItem>} />
              </div>
            ))}
            <button type='button' onClick={() => appendResearch({ title: '', abstract: '', url: '', datePublished: '' })} className='inline-flex items-center gap-2 text-xs font-medium text-info hover:text-primary transition-colors'>
              <Plus className='w-3 h-3' /> Add Research Paper
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
