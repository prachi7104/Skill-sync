'use client';

import Link from "next/link";
import { LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/70 dark:border-slate-800 dark:bg-slate-950/85 dark:supports-[backdrop-filter]:bg-slate-950/70">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <span className="select-none font-sans text-lg font-black tracking-tight text-zinc-900 dark:text-slate-100">
            Skill<span className="text-primary">Sync.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-colors duration-150 hover:bg-primary-hover"
          >
            <LogIn className="w-4 h-4 sm:w-[15px] sm:h-[15px]" />
            <span className="hidden min-[375px]:inline">Sign In</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
