"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator
} from '@/components/ui/command';
import { Briefcase, Building2, GraduationCap, Search, ArrowRight } from 'lucide-react';
import { normalizeCompanyName } from '@/lib/content-utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'student' | 'faculty' | 'admin';
}

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  category: 'drive' | 'student' | 'company';
}

export default function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search — 300ms delay, cancelled on new input
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const endpoints: Promise<Response>[] = [
        fetch(`/api/drives?search=${encodeURIComponent(q)}&limit=4`),
      ];
      if (role === 'admin' || role === 'faculty') {
        endpoints.push(fetch(`/api/${role}/students/search?q=${encodeURIComponent(q)}&page=1&limit=4`));
      }
      if (role === 'student') {
        endpoints.push(fetch(`/api/student/experiences?mode=suggestions&q=${encodeURIComponent(q)}`));
      }

      const responses = await Promise.allSettled(endpoints);
      const allResults: SearchResult[] = [];

      // Process drives
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        const data = await responses[0].value.json();
        (data.drives ?? []).forEach((d: { id: string; company?: string; companyName?: string; roleTitle?: string; role?: string }) => {
          allResults.push({
            id: d.id,
            label: d.companyName ?? d.company ?? 'Drive',
            sublabel: d.role ?? d.roleTitle,
            href: role === 'admin' ? `/admin/drives` : role === 'faculty' ? `/faculty/drives` : `/student/drives`,
            icon: Briefcase,
            category: 'drive',
          });
        });
      }

      // Process students or companies
      if (responses[1]?.status === 'fulfilled' && responses[1].value.ok) {
        const data = await responses[1].value.json();
        if (role === 'student') {
          (data.suggestions ?? []).forEach((name: string, index: number) => {
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
        } else {
          (data.students ?? []).forEach((s: { id: string; name: string; sapId: string }) => {
            allResults.push({
              id: s.id,
              label: s.name,
              sublabel: s.sapId,
              href: role === 'admin' ? `/admin/students` : `/faculty/students`,
              icon: GraduationCap,
              category: 'student',
            });
          });
        }
      }

      setResults(allResults);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

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
          <CommandGroup heading={role === 'student' ? 'Companies' : 'Students'}>
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
