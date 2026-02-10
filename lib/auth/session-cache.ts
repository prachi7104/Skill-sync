/**
 * Cached session retrieval for Server Components
 * 
 * This uses React's cache() to ensure getServerSession is called
 * only ONCE per request, even if multiple server components need it.
 * 
 * Performance impact: Reduces 4 sequential session checks to 1.
 */

import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { incrementSessionCheck } from "@/lib/request-context";

/**
 * Cached session getter - use this instead of getServerSession directly.
 * 
 * React automatically deduplicates calls within the same request,
 * so calling this from multiple server components only hits NextAuth once.
 */
export const getCachedSession = cache(async () => {
    incrementSessionCheck();
    return await getServerSession(authOptions);
});

/**
 * Convenience wrapper that also checks if user is authenticated.
 * Returns null if no session.
 */
export const getCachedUser = cache(async () => {
    const session = await getCachedSession();
    return session?.user ?? null;
});
