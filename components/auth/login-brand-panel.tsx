import {
  BarChart3,
  Box,
  Briefcase,
  Shield,
  Sparkles,
} from 'lucide-react';

const PLATFORM_FEATURES = [
  {
    icon: Box,
    title: 'AI Sandbox',
    detail: 'Run resume-to-JD analysis with instant score breakdowns.',
  },
  {
    icon: BarChart3,
    title: 'AMCAT Scoring',
    detail: 'Track session scores, categories, and leaderboard rank.',
  },
  {
    icon: Sparkles,
    title: 'Career Coach',
    detail: 'Get personalized upskilling suggestions by drive eligibility.',
  },
  {
    icon: Briefcase,
    title: 'Drive Hub',
    detail: 'Manage applications, rankings, and placement operations in one place.',
  },
] as const;

const ACCESS_RULES = [
  'Students: Microsoft SSO (@stu.upes.ac.in)',
  'Faculty/Admin: Credentials-based access',
] as const;

export default function LoginBrandPanel() {
  return (
    <aside className='relative hidden min-h-screen flex-col justify-between overflow-hidden border-l border-zinc-200 bg-zinc-100 px-10 py-10 text-zinc-900 lg:flex dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20'
      />

      <div className='relative z-10'>
        <span className='select-none font-sans text-2xl font-black tracking-tight'>
          Skill<span className='text-primary'>Sync.</span>
        </span>
        <h2 className='mt-5 max-w-[18ch] text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-slate-100'>
          One-stop complete placement platform
        </h2>
        <p className='mt-3 max-w-[38ch] text-sm leading-relaxed text-zinc-600 dark:text-slate-300'>
          SkillSync brings scoring, sandbox analysis, drive workflows, and career guidance into one connected system.
        </p>
      </div>

      <div className='relative z-10 my-8 grid gap-3'>
        {PLATFORM_FEATURES.map(({ icon: Icon, title, detail }) => (
          <div key={title} className='rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80'>
            <div className='mb-2 flex items-center gap-2'>
              <span className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary'>
                <Icon size={16} />
              </span>
              <p className='text-sm font-bold text-zinc-900 dark:text-slate-100'>{title}</p>
            </div>
            <p className='text-xs leading-relaxed text-zinc-600 dark:text-slate-300'>{detail}</p>
          </div>
        ))}
      </div>

      <div className='relative z-10 rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80'>
        <p className='mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-slate-400'>
          Access Modes
        </p>
        <div className='space-y-2'>
          {ACCESS_RULES.map((rule) => (
            <div key={rule} className='flex items-center gap-2 text-xs text-zinc-700 dark:text-slate-300'>
              <Shield size={13} className='text-primary' />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
