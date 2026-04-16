"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Standardized auth hook for Client Components.
 * Wraps useSession to provide consistent return values.
 */
export function useAuth() {
    const { data: session, status } = useSession();

    const user = session?.user || null;
    const role = user?.role || null;
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated";

    return {
        user,
        role,
        isLoading,
        isAuthenticated,
    };
}

/**
 * Enforces authentication in a Client Component.
 * Redirects to / if the user is not authenticated.
 * Returns the loading state to allow showing a spinner while ensuring auth.
 */
export function useRequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/?callbackUrl=" + window.location.pathname);
        }
    }, [isLoading, isAuthenticated, router]);

    return { isLoading };
}

/**
 * Enforces specific roles in a Client Component.
 * Redirects to /unauthorized if the user lacks the required role.
 * Also enforces authentication (redirects to / if not logged in).
 *
 * @param allowedRoles Array of allowed roles (e.g., ['admin'])
 */
export function useRequireRole(allowedRoles: string[]) {
    const { isAuthenticated, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.push("/?callbackUrl=" + window.location.pathname);
            return;
        }

        if (role && !allowedRoles.includes(role)) {
            router.push("/unauthorized");
        }
    }, [isLoading, isAuthenticated, role, allowedRoles, router]);

    return { isLoading };
}
