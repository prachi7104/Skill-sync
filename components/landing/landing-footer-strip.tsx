import React from 'react';

export default function LandingFooterStrip() {
  return (
    <footer className='w-full border-t border-zinc-200/80 bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950'>
      <div className='flex w-full flex-col items-center justify-between gap-4 sm:flex-row'>
        {/* StatGroup — three platform stats */}
        <div className='flex items-center gap-6'>
          {[
            { value: '2,400+', label: 'Students' },
            { value: '180+', label: 'Drives' },
            { value: '60+', label: 'Companies' },
          ].map((s) => (
            <div key={s.label} className='text-center sm:text-left'>
              <div className='text-base font-black text-zinc-900 dark:text-slate-100'>{s.value}</div>
              <div className='text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-slate-400'>{s.label}</div>
            </div>
          ))}
        </div>

        {/* LogoMark */}
        <span className='select-none font-sans text-base font-black tracking-tight text-zinc-900 dark:text-slate-100'>
          Skill<span className='text-primary'>Sync.</span>
        </span>

        {/* Copyright */}
        <p className='text-center text-[11px] font-medium text-zinc-500 sm:text-right dark:text-slate-400'>
          &copy; {new Date().getFullYear()} UPES Placement Cell
        </p>
      </div>
    </footer>
  );
}
