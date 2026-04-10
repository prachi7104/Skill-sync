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
    <div className='flex flex-col justify-center min-h-[100dvh] lg:min-h-0 lg:h-full px-6 sm:px-10 lg:px-14 py-12 bg-background'>
      <div className='w-full max-w-[420px] mx-auto lg:mx-0'>

        {/* 1. Live badge */}
        <div className='inline-flex items-center gap-2 h-7 px-3 mb-8 rounded-sm bg-primary/10 border border-primary/20'>
          <span className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60' />
            <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
          </span>
          <span className='text-[11px] font-bold text-primary uppercase tracking-[0.12em]'>
            Placement Season 2026 Live
          </span>
        </div>

        {/* 2. Logotype */}
        <h1 className='text-5xl font-black tracking-tight text-foreground leading-none select-none mb-2'>
          Skill<span className='text-primary'>Sync.</span>
        </h1>
        <p className='text-sm text-muted-foreground mb-8 font-normal leading-relaxed'>
          AI-native placement ecosystem. Sign in to continue.
        </p>

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
              className='group w-full flex items-center justify-between px-5 py-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <div className='flex items-center gap-4'>
                <svg className='w-6 h-6 shrink-0' viewBox='0 0 21 21' fill='none' aria-hidden='true'>
                  <rect x='1' y='1' width='9' height='9' fill='#F25022' />
                  <rect x='11' y='1' width='9' height='9' fill='#7FBA00' />
                  <rect x='1' y='11' width='9' height='9' fill='#00A4EF' />
                  <rect x='11' y='11' width='9' height='9' fill='#FFB900' />
                </svg>
                <div className='text-left'>
                  <p className='text-sm font-bold text-foreground'>Student Login</p>
                  <p className='text-[11px] text-muted-foreground font-medium mt-0.5'>
                    @stu.upes.ac.in Microsoft account
                  </p>
                </div>
              </div>
              {isStudentLoading
                ? <Loader2 size={18} className='text-primary animate-spin' />
                : <ChevronRight size={18} className='text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150' />
              }
            </button>
          </motion.div>

          {/* 4b. Faculty / Staff button and inline form */}
          <motion.div variants={item}>
            {!showStaffForm ? (
              <button
                onClick={onShowStaffForm}
                disabled={isStudentLoading}
                className='group w-full flex items-center justify-between px-5 py-4 rounded-lg border border-border bg-background hover:border-border hover:bg-muted/60 transition-all duration-150 disabled:opacity-50'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-6 h-6 flex items-center justify-center shrink-0'>
                    <Lock size={18} className='text-muted-foreground group-hover:text-foreground transition-colors' />
                  </div>
                  <div className='text-left'>
                    <p className='text-sm font-bold text-foreground'>Faculty / Admin Login</p>
                    <p className='text-[11px] text-muted-foreground font-medium mt-0.5'>Email &amp; password</p>
                  </div>
                </div>
                <ChevronRight size={18} className='text-muted-foreground' />
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
                    className='rounded-lg border border-border bg-card p-5 space-y-3'
                  >
                    {/* Header row */}
                    <div className='flex items-center justify-between mb-1'>
                      <p className='text-xs font-bold text-foreground uppercase tracking-wider'>Staff Login</p>
                      <button
                        type='button'
                        onClick={onHideStaffForm}
                        className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
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
                      className='w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-[#3E53A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2'
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
        <p className='mt-6 text-[11px] text-muted-foreground leading-relaxed'>
          Students use UPES Microsoft SSO. Faculty and staff use their assigned SkillSync credentials.
          Contact your placement coordinator for access issues.
        </p>

      </div>
    </div>
  );
}
