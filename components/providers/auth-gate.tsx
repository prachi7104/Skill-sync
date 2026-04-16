"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * AuthGate wraps the app content below SessionProvider.
 *
 * Purpose:
 *  - Renders children with identical markup during SSR AND first client render
 *    (avoids hydration mismatch).
 *  - After mount, checks session and redirects unauthenticated users to /
 *    for protected routes.
 *  - Never branches JSX based on auth state during the hydration-critical
 *    first render.
 *
 * Public routes (root, unauthorized, API) are excluded from the redirect.
 */

const PUBLIC_PATHS = ["/unauthorized", "/api"];

function isPublicPath(pathname: string): boolean {
    if (pathname === "/") return true;
    return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (status === "loading") return;

        if (status === "unauthenticated" && !isPublicPath(pathname)) {
            router.replace("/?callbackUrl=" + encodeURIComponent(pathname));
        }
    }, [mounted, status, pathname, router]);

    // Show skeleton while session is loading on protected routes to avoid
    // flashing protected content before redirect.
    if (!mounted || (status === "loading" && !isPublicPath(pathname))) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}
