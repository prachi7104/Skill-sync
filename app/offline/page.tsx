import type { Metadata } from "next";
import { WifiOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline — SkillSync",
};

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[hsl(226,71%,11%)] flex flex-col">
      <header className="h-14 border-b border-zinc-200/80 dark:border-slate-800 flex items-center px-4 sm:px-6">
        <span className="font-sans text-base font-black tracking-tight text-zinc-900 dark:text-slate-100 select-none">
          Skill<span className="text-primary">Sync.</span>
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
          <WifiOff size={32} className="text-muted-foreground" aria-hidden="true" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400 mb-2">
          No Connection
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-slate-100 mb-3">
          You&apos;re offline
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-slate-400 mb-8">
          Check your internet connection and try again.
          Your progress is saved and will sync when you&apos;re back online.
        </p>

        {/* Retry button — needs client script since this is a static offline page */}
        <button
          {...{ onclick: "window.location.reload()" }}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Try Again
        </button>
      </main>
    </div>
  );
}
