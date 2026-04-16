import React from 'react';

const targetCompanies = ['Microsoft', 'Amazon', 'Deloitte', 'Infosys', 'Accenture', 'TCS'];

export default function LandingProofStrip() {
  return (
    <section id='proof' className='w-full border-b border-border bg-background px-4 py-14 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {[
            { value: 'Pilot', label: 'In Progress' },
            { value: 'AI-Powered', label: 'Ranking Engine' },
            { value: 'Multi-College', label: 'Architecture' },
          ].map((item) => (
            <div key={item.label} className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
              <p className='text-2xl font-black tracking-tight text-foreground'>{item.value}</p>
              <p className='mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Target Recruiting Partners
          </p>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
            {targetCompanies.map((company) => (
              <div
                key={company}
                className='rounded-xl border border-border bg-background px-3 py-3 text-center text-sm font-semibold text-foreground'
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
