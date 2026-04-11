import React from 'react';

const companies = ['Microsoft', 'Amazon', 'Deloitte', 'Infosys', 'Accenture', 'TCS'];

export default function LandingProofStrip() {
  return (
    <section id='proof' className='w-full border-b border-zinc-200/80 bg-zinc-50 px-4 py-14 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[hsl(226,71%,11%)]'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {[
            { value: '2,400+', label: 'Students' },
            { value: '180+', label: 'Drives' },
            { value: '60+', label: 'Companies' },
          ].map((item) => (
            <div key={item.label} className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <p className='text-2xl font-black tracking-tight text-zinc-900 dark:text-slate-100'>{item.value}</p>
              <p className='mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-slate-400'>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
            {companies.map((company) => (
              <div
                key={company}
                className='rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-sm font-semibold text-zinc-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
