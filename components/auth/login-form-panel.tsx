'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronRight, Eye, EyeOff, Lock, LogIn } from 'lucide-react';

export interface LoginFormPanelProps {
  errorMessage: string | null;
  isStudentLoading: boolean;
  isStaffLoading: boolean;
  showStaffForm: boolean;
  staffEmail: string;
  staffPassword: string;
  showPassword: boolean;
  onStudentLogin: () => void;
  onShowStaffForm: () => void;
  onHideStaffForm: () => void;
  onStaffEmailChange: (v: string) => void;
  onStaffPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onStaffSubmit: (e: React.FormEvent) => void;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

const LOGIN_HIGHLIGHTS = [
  'AI Sandbox',
  'AMCAT Leaderboard',
  'Career Coach',
] as const;

export default function LoginFormPanel({
  errorMessage,
  isStudentLoading,
  isStaffLoading,
  showStaffForm,
  staffEmail,
  staffPassword,
  showPassword,
  onStudentLogin,
  onShowStaffForm,
  onHideStaffForm,
  onStaffEmailChange,
  onStaffPasswordChange,
  onTogglePassword,
  onStaffSubmit,
}: LoginFormPanelProps) {
  const shouldAnimate = !useReducedMotion();

  return (
    <div className='flex min-h-[100dvh] flex-col justify-center bg-zinc-50 px-4 py-10 sm:px-8 sm:py-12 lg:h-full lg:min-h-0 lg:px-10 xl:px-12 dark:bg-slate-950'>
      <div className='mx-auto w-full max-w-[460px] lg:mx-0'>

        {/* 1. Live badge */}
        <div className='mb-7 inline-flex h-7 items-center gap-2 rounded-sm border border-zinc-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900'>
          <span className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60' />
            <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
          </span>
          <span className='text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-slate-300'>
            Platform Live
          </span>
        </div>

        {/* 2. Logotype */}
        <h1 className='mb-2 select-none text-4xl font-black leading-none tracking-tight text-zinc-900 sm:text-5xl dark:text-slate-100'>
          Skill<span className='text-primary'>Sync.</span>
        </h1>
        <p className='mb-4 text-sm font-medium leading-relaxed text-zinc-600 dark:text-slate-300'>
          SkillSync — Where your skills meet the right opportunity.
        </p>
        <div className='mb-8 flex flex-wrap gap-2'>
          {LOGIN_HIGHLIGHTS.map((label) => (
            <span
              key={label}
              className='inline-flex h-7 items-center rounded-md border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            >
              {label}
            </span>
          ))}
        </div>

        {/* 3. Error message — AnimatePresence with slide-down */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              key='error'
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className='mb-4 overflow-hidden'
            >
              <div className='rounded-md border border-destructive/30 bg-destructive/8 px-4 py-3 flex items-start gap-3'>
                <AlertCircle size={16} className='text-destructive shrink-0 mt-0.5' />
                <div>
                  <p className='text-xs font-bold text-destructive uppercase tracking-wider mb-0.5'>Error</p>
                  <p className='text-sm text-destructive/90 font-medium'>{errorMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Button group — stagger container */}
        <motion.div
          variants={container}
          initial={shouldAnimate ? 'hidden' : 'visible'}
          animate='visible'
          className='space-y-3'
        >
          {/* 4a. Student SSO button */}
          <motion.div variants={item}>
            <button
              onClick={onStudentLogin}
              disabled={isStudentLoading || isStaffLoading}
              className='group flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900'
            >
              <div className='flex items-center gap-4'>
                <svg className='w-6 h-6 shrink-0' viewBox='0 0 21 21' fill='none' aria-hidden='true'>
                  <rect x='1' y='1' width='9' height='9' fill='#F25022' />
                  <rect x='11' y='1' width='9' height='9' fill='#7FBA00' />
                  <rect x='1' y='11' width='9' height='9' fill='#00A4EF' />
                  <rect x='11' y='11' width='9' height='9' fill='#FFB900' />
                </svg>
                <div className='text-left'>
                  <p className='text-sm font-bold text-zinc-900 dark:text-slate-100'>Student Login</p>
                  <p className='mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-slate-400'>
                    Continue with UPES Microsoft SSO
                  </p>
                </div>
              </div>
              {isStudentLoading
                ? <Loader2 size={18} className='text-primary animate-spin' />
                : <ChevronRight size={18} className='text-zinc-500 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary dark:text-slate-400' />
              }
            </button>
          </motion.div>

          {/* 4b. Faculty / Staff button and inline form */}
          <motion.div variants={item}>
            {!showStaffForm ? (
              <button
                onClick={onShowStaffForm}
                disabled={isStudentLoading}
                className='group flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 transition-all duration-150 hover:bg-zinc-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-6 h-6 flex items-center justify-center shrink-0'>
                    <Lock size={18} className='text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-slate-400 dark:group-hover:text-slate-100' />
                  </div>
                  <div className='text-left'>
                    <p className='text-sm font-bold text-zinc-900 dark:text-slate-100'>Faculty / Admin Login</p>
                    <p className='mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-slate-400'>Email &amp; password</p>
                  </div>
                </div>
                <ChevronRight size={18} className='text-zinc-500 dark:text-slate-400' />
              </button>
            ) : null}

            <AnimatePresence>
              {showStaffForm && (
                <motion.div
                  key='staff-form'
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  style={{ transformOrigin: 'top' }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                >
                  <form
                    onSubmit={onStaffSubmit}
                    className='space-y-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'
                  >
                    {/* Header row */}
                    <div className='flex items-center justify-between mb-1'>
                      <p className='text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-slate-100'>Staff Login</p>
                      <button
                        type='button'
                        onClick={onHideStaffForm}
                        className='text-[11px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100'
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Email input */}
                    <input
                      type='email'
                      placeholder='Email address'
                      value={staffEmail}
                      onChange={e => onStaffEmailChange(e.target.value)}
                      required
                      autoComplete='email'
                      className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow'
                    />

                    {/* Password input with toggle */}
                    <div className='relative'>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Password'
                        value={staffPassword}
                        onChange={e => onStaffPasswordChange(e.target.value)}
                        required
                        autoComplete='current-password'
                        className='w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow'
                      />
                      <span className='absolute right-0 top-0 w-10 h-10 flex items-center justify-center'>
                        <button
                          type='button'
                          onClick={onTogglePassword}
                          className='text-muted-foreground hover:text-foreground transition-colors'
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </span>
                    </div>

                    {/* Submit */}
                    <button
                      type='submit'
                      disabled={isStaffLoading}
                      className='w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2'
                    >
                      {isStaffLoading
                        ? <><Loader2 size={15} className='animate-spin' /> Signing in...</>
                        : <><LogIn size={15} /> Sign In</>
                      }
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* 5. Footnote */}
        <p className='mt-6 text-[11px] leading-relaxed text-zinc-500 dark:text-slate-400'>
          One platform for drives, AMCAT scoring, sandbox analysis, and career coaching.
          Students use UPES Microsoft SSO, while faculty and staff use assigned SkillSync credentials.
        </p>

      </div>
    </div>
  );
}
