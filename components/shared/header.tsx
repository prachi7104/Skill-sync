"use client";
import { useAuth } from "@/lib/auth/hooks";
import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50">
      <Link href="/" className="text-sm font-semibold text-foreground tracking-tight">
        SkillSync
      </Link>
      <div className="flex items-center gap-3" suppressHydrationWarning>
        {isLoading ? (
          <div className="h-6 w-16 bg-muted animate-pulse rounded-md" />
        ) : isAuthenticated && user ? (
          <>
            <span className="text-xs text-muted-foreground hidden md:block">
              {user.name}
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link href="/login"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/85 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
