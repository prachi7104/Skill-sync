import { MonitorSmartphone, Sparkles, Shield, BarChart3 } from 'lucide-react';

const CAPABILITIES = [
  { icon: BarChart3,        label: 'AMCAT Score Integration' },
  { icon: Sparkles,         label: 'AI-Native Drive Matching' },
  { icon: Shield,           label: 'Role-Gated Access Control' },
] as const;

export default function LoginBrandPanel() {
  return (
    <div className='hidden lg:flex flex-col justify-between h-full min-h-screen bg-sidebar px-12 py-12 relative overflow-hidden'>

      {/* Decorative background circle — subtle, not glassy */}
      <div
        aria-hidden='true'
        className='absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sidebar-primary opacity-[0.06] pointer-events-none'
      />

      {/* Top: branding */}
      <div>
        <span className='font-sans text-2xl font-black tracking-tight text-sidebar-fg select-none'>
          Skill<span className='text-sidebar-primary'>Sync.</span>
        </span>
        <p className='mt-3 text-sm text-sidebar-fg-muted font-normal leading-relaxed max-w-[280px]'>
          The placement intelligence hub for UPES — connecting students, faculty, and administrators through AI-native workflows.
        </p>
      </div>

      {/* Middle: illustration placeholder */}
      <div className='flex-1 flex items-center justify-center py-8'>
        <div className='w-full max-w-[340px] aspect-[4/3] rounded-xl border border-sidebar-border bg-sidebar-surface flex flex-col items-center justify-center gap-4'>
          <MonitorSmartphone size={48} className='text-sidebar-primary opacity-60' />
          {/* TODO Phase-assets: Replace with <Image src='/illustrations/login-hero.png' alt='SkillSync dashboard' fill className='object-cover rounded-xl' /> */}
          <p className='text-[12px] text-sidebar-fg-muted font-medium text-center px-6'>
            Dashboard illustration goes here
          </p>
        </div>
      </div>

      {/* Bottom: capability pills */}
      <div className='flex flex-col gap-2.5'>
        <p className='text-[11px] font-bold text-sidebar-fg-muted uppercase tracking-[0.12em] mb-1'>
          Platform capabilities
        </p>
        {CAPABILITIES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className='flex items-center gap-3 h-9 px-3 rounded-md bg-sidebar-surface/60 border border-sidebar-border'
          >
            <Icon size={14} className='text-sidebar-primary shrink-0' />
            <span className='text-[12px] font-semibold text-sidebar-fg'>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
