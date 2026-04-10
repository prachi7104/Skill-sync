'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, IndianRupee, Award, ChevronRight, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriveCardProps {
  drive: {
    id: string;
    company: string;
    roleTitle: string;
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

function companyInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DriveCard({ drive, ranking }: DriveCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasRankPosition = Boolean(ranking && ranking.rankPosition > 0);

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.15 }}
      className='group relative bg-card rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-[border-color,box-shadow] duration-200 flex flex-col overflow-hidden'
    >
      {/* Rank badge — absolute top-right */}
      {ranking && (
        <Link
          href={`/student/drives/${drive.id}/ranking`}
          className='absolute top-3 right-3 z-10'
        >
          <span className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold border',
            hasRankPosition
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/60 border-border text-muted-foreground'
          )}>
            <Award size={10} />
            {hasRankPosition ? `#${ranking.rankPosition} · ${Math.round(ranking.matchScore)}%` : 'Pending'}
          </span>
        </Link>
      )}

      <div className='p-4 flex-1 space-y-3'>
        {/* Company initials + name + role */}
        <div className='flex items-start gap-3 pr-20'>
          <div className='w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0'>
            <span className='text-xs font-bold text-primary'>{companyInitials(drive.company)}</span>
          </div>
          <div className='min-w-0'>
            <h3 className='text-sm font-semibold text-foreground leading-snug truncate'>{drive.company}</h3>
            <p className='text-xs text-muted-foreground mt-0.5 truncate'>{drive.roleTitle}</p>
          </div>
        </div>

        {/* Info pills */}
        <div className='flex flex-wrap gap-1.5'>
          {drive.location && (
            <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
              <MapPin size={9} /> {drive.location}
            </span>
          )}
          {drive.packageOffered && (
            <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
              <IndianRupee size={9} /> {drive.packageOffered}
            </span>
          )}
          {drive.minCgpa && (
            <span className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5'>
              <GraduationCap size={9} /> Min {drive.minCgpa} CGPA
            </span>
          )}
          {drive.deadlineFormatted && (
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium rounded px-2 py-0.5',
              drive.isDeadlineSoon
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-muted/60 border border-border text-muted-foreground'
            )}>
              <Clock size={9} />
              {drive.isDeadlineSoon ? 'Closing ' : ''}{drive.deadlineFormatted}
            </span>
          )}
        </div>

        {/* Ranking result section */}
        {ranking ? (
          <div className='space-y-2 pt-1 border-t border-border'>
            {ranking.shortExplanation && (
              <p className='text-[11px] text-muted-foreground leading-relaxed line-clamp-2'>
                {ranking.shortExplanation}
              </p>
            )}
            <div className='flex flex-wrap gap-1'>
              {ranking.matchedSkills.slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className='inline-flex items-center text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5'
                >
                  + {skill}
                </span>
              ))}
              {ranking.missingSkills.slice(0, 2).map(skill => (
                <span
                  key={skill}
                  className='inline-flex items-center text-[9px] font-bold bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5'
                >
                  − {skill}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className='text-[11px] text-muted-foreground italic pt-1 border-t border-border'>
            Ranking not yet generated.
          </p>
        )}
      </div>

      {/* Footer CTA — only when ranked */}
      {ranking && (
        <Link
          href={`/student/drives/${drive.id}/ranking`}
          className='flex items-center justify-between px-4 py-2.5 border-t border-border text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors'
        >
          View Full Ranking
          <ChevronRight size={13} />
        </Link>
      )}
    </motion.div>
  );
}
