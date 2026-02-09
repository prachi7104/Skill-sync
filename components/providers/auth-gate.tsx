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
 *  - After mount, checks session and redirects unauthenticated users to /login
 *    for protected routes.
 *  - Never branches JSX based on auth state during the hydration-critical
 *    first render.
 *
 * Public routes (login, unauthorized, root) are excluded from the redirect.
 */

const PUBLIC_PATHS = ["/login", "/unauthorized", "/api"];

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
            router.replace("/login?callbackUrl=" + encodeURIComponent(pathname));
        }
    }, [mounted, status, pathname, router]);

    // Always render children — the server and first client render are identical.
    // Auth redirects happen imperatively via useEffect AFTER hydration.
    return <>{children}</>;
}
