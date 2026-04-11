import React from 'react';

export default function LandingFooterStrip() {
  return (
    <footer className='w-full border-t border-border bg-background px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex w-full flex-col items-center justify-between gap-4 sm:flex-row'>
        {/* StatGroup — three platform stats */}
        <div className='flex items-center gap-6'>
          {[
            { value: '2,400+', label: 'Students' },
            { value: '180+', label: 'Drives' },
            { value: '60+', label: 'Companies' },
          ].map((s) => (
            <div key={s.label} className='text-center sm:text-left'>
              <div className='text-base font-black text-foreground'>{s.value}</div>
              <div className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>{s.label}</div>
            </div>
          ))}
        </div>

        {/* LogoMark */}
        <span className='select-none font-sans text-base font-black tracking-tight text-foreground'>
          Skill<span className='text-primary'>Sync.</span>
        </span>

        {/* Copyright */}
        <p className='text-center text-[11px] font-medium text-muted-foreground sm:text-right'>
          &copy; {new Date().getFullYear()} UPES Placement Cell
        </p>
      </div>
    </footer>
  );
}
