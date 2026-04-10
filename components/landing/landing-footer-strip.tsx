import React from 'react';

export default function LandingFooterStrip() {
  return (
    <footer className='w-full py-6 px-4 sm:px-6 lg:px-8 bg-card border-t border-border'>
      <div className='max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
        {/* StatGroup — three platform stats */}
        <div className='flex items-center gap-6'>
          {[
            { value: '2,400+', label: 'Students' },
            { value: '180+', label: 'Drives' },
            { value: '60+', label: 'Companies' },
          ].map((s) => (
            <div key={s.label} className='text-center sm:text-left'>
              <div className='text-base font-black text-foreground'>{s.value}</div>
              <div className='text-[11px] text-muted-foreground font-medium tracking-wide uppercase'>{s.label}</div>
            </div>
          ))}
        </div>

        {/* LogoMark */}
        <span className='font-sans text-base font-black tracking-tight text-foreground select-none'>
          Skill<span className='text-primary'>Sync.</span>
        </span>

        {/* Copyright */}
        <p className='text-[11px] text-muted-foreground font-medium text-center sm:text-right'>
          &copy; {new Date().getFullYear()} UPES Placement Cell
        </p>
      </div>
    </footer>
  );
}
