"use client";
import { useAuth } from "@/lib/auth/hooks";
import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
      <Link href="/" className="text-xl font-black tracking-tight text-white">
        Skill<span className="text-indigo-500">Sync.</span>
      </Link>
      <div className="flex items-center gap-4" suppressHydrationWarning>
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-800 animate-pulse rounded-xl" />
        ) : isAuthenticated && user ? (
          <>
            <span className="text-sm text-slate-400 hidden md:block">
              {user.name}
              <span className="text-slate-600 ml-1">({user.role})</span>
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link href="/login"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
