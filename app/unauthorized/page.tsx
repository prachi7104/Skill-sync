"use client";
import Link from "next/link";
import { ShieldOff, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[hsl(226,71%,11%)] flex flex-col">
      <header className="h-14 border-b border-zinc-200/80 dark:border-slate-800 flex items-center px-4 sm:px-6">
        <a href="/" className="font-sans text-base font-black tracking-tight text-zinc-900 dark:text-slate-100 select-none">
          Skill<span className="text-primary">Sync.</span>
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-6">
          <ShieldOff size={32} className="text-destructive" aria-hidden="true" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400 mb-2">
          403 — Access Denied
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-slate-100 mb-3">
          You don&apos;t have access
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-slate-400 mb-8">
          You don&apos;t have permission to view this page. If you believe this
          is an error, contact your placement coordinator.
        </p>

        <div className="flex flex-col xs:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <Home size={15} aria-hidden="true" />
            Go to Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md border border-zinc-300 dark:border-slate-700 text-sm font-semibold text-zinc-900 dark:text-slate-100 transition-colors hover:bg-zinc-100 dark:hover:bg-slate-800"
          >
            <LogIn size={15} aria-hidden="true" />
            Sign In Again
          </Link>
        </div>
      </main>
    </div>
  );
}
