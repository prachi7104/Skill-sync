"use client";
import { useAuth } from "@/lib/auth/hooks";
import Link from "next/link";
import SignOutButton from "./sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-8">
      <Link href="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
        Skill<span className="text-primary">Sync.</span>
      </Link>
      <div className="flex items-center gap-4" suppressHydrationWarning>
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        ) : isAuthenticated && user ? (
          <>
            <span className="hidden text-sm text-muted-foreground md:block">
              {user.name}
              <span className="ml-1 opacity-70">({user.role})</span>
            </span>
            <ThemeToggle />
            <SignOutButton />
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Sign In
          </Link>
          </>
        )}
      </div>
    </header>
  );
}
