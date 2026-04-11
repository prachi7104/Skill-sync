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
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      {/* Search input */}
      <div className='relative w-full sm:w-72 lg:w-80'>
        <Search size={13} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
        <input
          type='text'
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder='Search by company or role...'
          className='w-full h-9 rounded-md border border-border bg-background pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50'
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground'
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Urgent toggle */}
      <button
        onClick={onUrgentToggle}
        className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
          urgentOnly
            ? 'bg-warning/15 border-warning/40 text-warning'
            : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Clock size={12} /> Closing Soon
      </button>

      {/* Result count — spacer pushes it to the right */}
      <p className='ml-auto text-xs text-muted-foreground'>
        {filteredCount === totalCount
          ? `${totalCount} drive${totalCount !== 1 ? 's' : ''}`
          : `${filteredCount} of ${totalCount}`}
      </p>
    </div>
  );
}
