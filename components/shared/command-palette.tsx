"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator
} from '@/components/ui/command';
import { Briefcase, Building2, GraduationCap, Search, ArrowRight } from 'lucide-react';
import { normalizeCompanyName } from '@/lib/content-utils';
import { safeFetch } from '@/lib/api';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'student' | 'faculty' | 'admin';
}

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  category: 'drive' | 'student' | 'company';
}

export default function CommandPalette({ open, onOpenChange, userRole }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search — 300ms delay, cancelled on new input
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const endpoint1 = safeFetch<{ drives?: Array<{ id: string; company?: string; companyName?: string; roleTitle?: string; role?: string }> }>(
        `/api/drives?search=${encodeURIComponent(q)}&limit=4`
      );
      const endpoint2 = (userRole === 'admin' || userRole === 'faculty') 
        ? safeFetch<{ students?: Array<{ id: string; name: string; sapId: string }> }>(`/api/${userRole}/students/search?q=${encodeURIComponent(q)}&page=1&limit=4`)
        : Promise.resolve({ data: null, error: null });
      const endpoint3 = userRole === 'student'
        ? safeFetch<{ suggestions?: string[] }>(`/api/student/experiences?mode=suggestions&q=${encodeURIComponent(q)}`)
        : Promise.resolve({ data: null, error: null });

      const [drivesRes, studentsRes, companiesRes] = await Promise.all([endpoint1, endpoint2, endpoint3]);
      const allResults: SearchResult[] = [];

      // Process drives
      if (drivesRes.data?.drives) {
        drivesRes.data.drives.forEach((d) => {
          allResults.push({
            id: d.id,
            label: d.companyName ?? d.company ?? 'Drive',
            sublabel: d.role ?? d.roleTitle,
            href: userRole === 'admin' ? `/admin/drives` : userRole === 'faculty' ? `/faculty/drives` : `/student/drives`,
            icon: Briefcase,
            category: 'drive',
          });
        });
      }

      // Process students or companies
      if (userRole === 'student' && companiesRes.data?.suggestions) {
        companiesRes.data.suggestions.forEach((name: string, index: number) => {
            const companySlug = normalizeCompanyName(name);
            allResults.push({
              id: `${companySlug}-${index}`,
              label: name,
              sublabel: 'Experience wall',
              href: `/student/companies/${companySlug}`,
              icon: Building2,
              category: 'company',
            });
          });
      } else if ((userRole === 'admin' || userRole === 'faculty') && studentsRes.data?.students) {
          studentsRes.data.students.forEach((s) => {
            allResults.push({
              id: s.id,
              label: s.name,
              sublabel: s.sapId,
              href: userRole === 'admin' ? `/admin/students` : `/faculty/students`,
              icon: GraduationCap,
              category: 'student',
            });
          });
      }

      setResults(allResults);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); }
  }, [open]);

  const driveResults = results.filter(r => r.category === 'drive');
  const otherResults = results.filter(r => r.category !== 'drive');

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder='Search drives, students, companies...'
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className='py-6 flex items-center justify-center'>
            <div className='w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin' />
          </div>
        )}
        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No results for &quot;{query}&quot;</CommandEmpty>
        )}
        {!loading && query.length < 2 && (
          <div className='px-4 py-8 text-center'>
            <Search size={24} className='text-muted-foreground mx-auto mb-2 opacity-40' />
            <p className='text-[12px] text-muted-foreground'>Start typing to search drives, students, or companies.</p>
            <p className='mt-1 text-[11px] text-muted-foreground'>Minimum 2 characters required.</p>
          </div>
        )}
        {driveResults.length > 0 && (
          <CommandGroup heading='Drives'>
            {driveResults.map(result => (
               <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className='flex items-center gap-3 cursor-pointer'
              >
                <result.icon size={15} className='text-muted-foreground shrink-0' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm font-semibold text-foreground'>{result.label}</span>
                  {result.sublabel && (
                    <span className='ml-2 text-[11px] text-muted-foreground'>{result.sublabel}</span>
                  )}
                </div>
                <ArrowRight size={12} className='text-muted-foreground shrink-0' />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {driveResults.length > 0 && otherResults.length > 0 && <CommandSeparator />}
        {otherResults.length > 0 && (
          <CommandGroup heading={userRole === 'student' ? 'Companies' : 'Students'}>
            {otherResults.map(result => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className='flex items-center gap-3 cursor-pointer'
              >
                <result.icon size={15} className='text-muted-foreground shrink-0' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm font-semibold text-foreground'>{result.label}</span>
                  {result.sublabel && (
                    <span className='ml-2 text-[11px] text-muted-foreground'>{result.sublabel}</span>
                  )}
                </div>
                <ArrowRight size={12} className='text-muted-foreground shrink-0' />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
