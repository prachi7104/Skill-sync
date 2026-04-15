'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, IndianRupee, Award, ChevronRight, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriveCardProps {
  drive: {
    id: string;
    company?: string | null;
    roleTitle?: string | null;
    location?: string | null;
    packageOffered?: string | null;
    minCgpa?: number | null;
    deadline?: string | null;     // ISO date string, pre-formatted by server
    deadlineFormatted?: string | null;
    isDeadlineSoon: boolean;
  };
  ranking?: {
    rankPosition: number;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    shortExplanation?: string | null;
  } | null;
}

function companyInitials(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

export default function DriveCard({ drive, ranking }: DriveCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasRankPosition = Boolean(ranking && ranking.rankPosition > 0);
  const companyName = drive.company?.trim() || 'Company';
  const roleTitle = drive.roleTitle?.trim() || 'Role not specified';
  const location = drive.location?.trim();
  const packageOffered = drive.packageOffered?.trim();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.15 }}
      className='group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-sm'
    >
      <div className='flex-1 space-y-3 p-4'>
        {/* Company initials + name + role + rank badge inline */}
        <div className='flex items-start gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10'>
            <span className='text-xs font-bold text-primary'>{companyInitials(companyName)}</span>
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='truncate text-sm font-semibold leading-snug text-foreground' title={companyName}>{companyName}</h3>
            <p className='mt-0.5 truncate text-xs text-muted-foreground' title={roleTitle}>{roleTitle}</p>
          </div>
          {ranking && (
            <Link
              href={`/student/drives/${drive.id}/ranking`}
              className='shrink-0'
            >
              <span className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold whitespace-nowrap',
                hasRankPosition
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted border-border text-muted-foreground'
              )}>
                <Award size={10} />
                {hasRankPosition ? `#${ranking.rankPosition} · ${Math.round(ranking.matchScore)}%` : 'Pending'}
              </span>
            </Link>
          )}
        </div>

        {/* Info pills */}
        <div className='flex flex-wrap gap-1.5'>
          {location && (
            <span className='inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <MapPin size={9} /> {location}
            </span>
          )}
          {packageOffered && (
            <span className='inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <IndianRupee size={9} /> {packageOffered}
            </span>
          )}
          {drive.minCgpa != null && (
            <span className='inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <GraduationCap size={9} /> Min {drive.minCgpa} CGPA
            </span>
          )}
          {drive.deadlineFormatted && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium',
              drive.isDeadlineSoon
                ? 'bg-warning/10 border border-warning/30 text-warning'
                : 'bg-muted border-border text-muted-foreground'
            )}>
              <Clock size={9} />
              {drive.isDeadlineSoon ? 'Closing ' : ''}{drive.deadlineFormatted}
            </span>
          )}
        </div>

        {/* Ranking result section */}
        {ranking ? (
          <div className='space-y-2 border-t border-border pt-1'>
            {ranking.shortExplanation && (
              <p className='line-clamp-2 text-[11px] leading-relaxed text-muted-foreground'>
                {ranking.shortExplanation}
              </p>
            )}
            <div className='flex max-h-12 flex-wrap gap-1 overflow-hidden'>
              {ranking.matchedSkills.slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className='inline-flex max-w-[100px] items-center gap-0.5 truncate rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success border border-success/20'
                >
                  <span className='shrink-0'>+</span>
                  <span className='truncate'>{skill}</span>
                </span>
              ))}
              {ranking.missingSkills.slice(0, 2).map(skill => (
                <span
                  key={skill}
                  className='inline-flex max-w-[100px] items-center gap-0.5 truncate rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive border border-destructive/20'
                >
                  <span className='shrink-0'>−</span>
                  <span className='truncate'>{skill}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className='border-t border-border pt-1 text-[11px] italic text-muted-foreground'>
            Ranking not yet generated.
          </p>
        )}
      </div>

      {/* Footer CTA — only when ranked */}
      {ranking && (
        <Link
          href={`/student/drives/${drive.id}/ranking`}
          className='flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5'
        >
          View Full Ranking
          <ChevronRight size={13} />
        </Link>
      )}
    </motion.div>
  );
}
