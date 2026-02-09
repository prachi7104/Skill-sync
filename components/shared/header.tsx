"use client";

import { useAuth } from "@/lib/auth/hooks";
import { signOut } from "next-auth/react";
import Link from "next/link";

/**
 * App header. 
 * Uses suppressHydrationWarning on the user section because auth state
 * differs between server (no session) and client (cached session).
 * This is the correct Next.js pattern for auth-dependent UI.
 */
export default function Header() {
    const { user, isAuthenticated, isLoading } = useAuth();

    return (
        <header className="border-b bg-white p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold text-blue-600">
                        SkillSync
                    </Link>
                </div>

                <div className="flex items-center gap-4" suppressHydrationWarning>
                    {isLoading ? (
                        <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
                    ) : isAuthenticated && user ? (
                        <>
                            <span className="text-sm text-gray-600">
                                {user.name} ({user.role})
                            </span>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
