"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[hsl(226,71%,11%)] flex flex-col">
      <header className="h-14 border-b border-zinc-200/80 dark:border-slate-800 flex items-center px-4 sm:px-6">
        <a href="/" className="font-sans text-base font-black tracking-tight text-zinc-900 dark:text-slate-100 select-none">
          Skill<span className="text-primary">Sync.</span>
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <FileQuestion size={32} className="text-primary" aria-hidden="true" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400 mb-2">
          404 — Page Not Found
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-slate-100 mb-3">
          This page doesn&apos;t exist
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-slate-400 mb-8">
          The link you followed may be broken, or the page may have been removed.
          Check the URL or head back to where you came from.
        </p>

        <div className="flex flex-col xs:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <Home size={15} aria-hidden="true" />
            Go to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md border border-zinc-300 dark:border-slate-700 text-sm font-semibold text-zinc-900 dark:text-slate-100 transition-colors hover:bg-zinc-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Go Back
          </button>
        </div>
      </main>
    </div>
  );
}
