'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PrioritySkill = {
  skill: string;
  why_critical: string;
  resource?: {
    type?: string;
    name?: string;
    url_description?: string;
  };
};

type CareerCoachPayload = {
  summary?: string;
  priority_skills?: PrioritySkill[];
  amcat_tip?: string;
  message?: string;
  suggestion?: string;
  error?: string;
  cached?: boolean;
};

interface DashboardCareerCoachCardProps {
  className?: string;
}

export default function DashboardCareerCoachCard({ className }: DashboardCareerCoachCardProps) {
  const [payload, setPayload] = useState<CareerCoachPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCoach() {
      setLoading(true);
      setErrorText(null);

      try {
        const res = await fetch('/api/student/career-coach', { cache: 'no-store' });
        const data = (await res.json()) as CareerCoachPayload;

        if (ignore) return;

        if (!res.ok) {
          setPayload(null);
          setErrorText(data.error || data.message || 'Unable to load career coach insights right now.');
          return;
        }

        if (data.message || data.error || !data.priority_skills?.length) {
          setPayload(data);
          setErrorText(data.message || data.suggestion || data.error || 'Career coach is waiting for more drive data.');
          return;
        }

        setPayload(data);
      } catch {
        if (!ignore) {
          setPayload(null);
          setErrorText('Unable to load career coach insights right now.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadCoach();

    return () => {
      ignore = true;
    };
  }, []);

  const topSkills = payload?.priority_skills ?? [];

  return (
    <section className={cn('flex min-h-[260px] flex-col rounded-2xl border border-border bg-card/95 p-5 sm:min-h-[300px] sm:p-6 xl:min-h-[320px]', className)}>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
            <Sparkles size={16} className='text-primary' />
          </div>
          <div>
            <p className='text-[13px] font-bold tracking-tight text-foreground'>Career Coach</p>
            <p className='text-[11px] uppercase tracking-[0.08em] text-muted-foreground'>Skill gaps and next best moves</p>
          </div>
        </div>
        <Badge variant='info' className='text-[11px] font-semibold'>Live guidance</Badge>
      </div>

      <div className='min-h-0 flex-1 xl:overflow-y-auto xl:pr-1'>
        {loading ? (
          <div className='flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' aria-hidden='true' />
            <span className='sr-only'>Loading career coach insights</span>
          </div>
        ) : payload && !errorText ? (
          <div className='space-y-4'>
            <div className='rounded-xl border border-border bg-background/40 p-4'>
              <p className='text-sm font-semibold text-foreground'>
                {payload.summary || payload.amcat_tip || 'Your roadmap is ready.'}
              </p>
              {payload.amcat_tip ? (
                <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>{payload.amcat_tip}</p>
              ) : null}
            </div>

            {topSkills.length > 0 ? (
              <div className='space-y-2'>
                {topSkills.slice(0, 3).map((skill, index) => (
                  <div key={skill.skill} className='rounded-xl border border-border bg-background/40 p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-bold text-foreground'>{skill.skill}</p>
                        <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>{skill.why_critical}</p>
                      </div>
                      <Badge variant={index === 0 ? 'warning' : 'neutral'} className='text-[10px] font-semibold'>
                        <Target size={10} className='mr-1' /> {index === 0 ? 'Highest' : 'Next'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground'>
            {errorText || 'Career coach guidance is not available yet.'}
          </div>
        )}
      </div>

      <Link
        href='/student/career-coach'
        className={cn(
          'mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-primary transition-colors duration-150 hover:text-primary-hover',
          loading && 'pointer-events-none opacity-80',
        )}
      >
        Open career coach
        <ArrowRight size={13} />
      </Link>
    </section>
  );
}