'use client';

import Link from "next/link";
import { LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/">
        <span className="font-sans text-lg font-black tracking-tight text-foreground select-none">
          Skill<span className="text-primary">Sync.</span>
        </span>
      </Link>
      <nav className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-[#3E53A0] transition-colors duration-150"
        >
          <LogIn className="w-4 h-4 sm:w-[15px] sm:h-[15px]" />
          <span className="hidden min-[375px]:inline">Sign In</span>
        </Link>
      </nav>
    </header>
  );
}
