'use client';

import { Search, Clock, X } from 'lucide-react';

interface DriveFilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  urgentOnly: boolean;
  onUrgentToggle: () => void;
  totalCount: number;
  filteredCount: number;
}

export default function DriveFilterBar({
  query, onQueryChange, urgentOnly, onUrgentToggle, totalCount, filteredCount
}: DriveFilterBarProps) {
  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
      {/* Search input */}
      <div className='relative w-full sm:w-72 lg:w-80'>
        <Search size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
        <input
          type='text'
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder='Search by company or role...'
          className='w-full h-8 pl-8 pr-8 text-sm bg-muted/60 border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors'
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Urgent toggle */}
      <button
        onClick={onUrgentToggle}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors ${
          urgentOnly
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
      >
        <Clock size={12} /> Closing Soon
      </button>

      {/* Result count — spacer pushes it to the right */}
      <p className='text-xs text-muted-foreground ml-auto'>
        {filteredCount === totalCount
          ? `${totalCount} drive${totalCount !== 1 ? 's' : ''}`
          : `${filteredCount} of ${totalCount}`}
      </p>
    </div>
  );
}
