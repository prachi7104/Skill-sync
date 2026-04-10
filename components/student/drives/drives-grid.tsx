'use client';

import { useState, useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import DriveFilterBar from './drive-filter-bar';
import DriveCard from './drive-card';

export interface SerializedDrive {
  id: string;
  company: string;
  roleTitle: string;
  location?: string | null;
  packageOffered?: string | null;
  minCgpa?: number | null;
  deadlineFormatted?: string | null;
  isDeadlineSoon: boolean;
}

export interface SerializedRanking {
  rankPosition: number;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation?: string | null;
}

interface DrivesGridProps {
  drives: SerializedDrive[];
  rankingMap: Record<string, SerializedRanking>;
}

export default function DrivesGrid({ drives, rankingMap }: DrivesGridProps) {
  const [query, setQuery] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return drives.filter(d => {
      if (urgentOnly && !d.isDeadlineSoon) return false;
      if (!q) return true;
      return (
        d.company.toLowerCase().includes(q) ||
        d.roleTitle.toLowerCase().includes(q)
      );
    });
  }, [drives, query, urgentOnly]);

  return (
    <div className='space-y-4'>
      <DriveFilterBar
        query={query}
        onQueryChange={setQuery}
        urgentOnly={urgentOnly}
        onUrgentToggle={() => setUrgentOnly(p => !p)}
        totalCount={drives.length}
        filteredCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 rounded-lg border border-dashed border-border bg-card/30'>
          <Briefcase size={36} className='text-muted-foreground mb-3 opacity-40' />
          <p className='text-sm font-medium text-muted-foreground'>No drives match your filters</p>
          <button
            onClick={() => { setQuery(''); setUrgentOnly(false); }}
            className='mt-3 text-xs text-primary hover:underline'
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {filtered.map(drive => (
            <DriveCard
              key={drive.id}
              drive={drive}
              ranking={rankingMap[drive.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
