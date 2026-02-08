import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// import { Database } from '@/lib/db/schema'; // We will define this later, or use 'any' for now if not ready

/**
 * Server-side Supabase Client
 * 
 * This function returns a Supabase client instance configured for Server Components,
 * Route Handlers, and Server Actions.
 * 
 * SECURITY:
 * - Reads `sb-access-token` and `sb-refresh-token` from cookies.
 * - This allows the server to act *on behalf of the authenticated user*.
 * - RLS policies are enforced based on the user's session.
 * 
 * USAGE:
 * - Use for: Fetching data in Server Components, validating session in middleware/API routes.
 * - Do NOT use for: Client Components (it relies on Node.js `headers/cookies`).
 */
export const createServerClient = () => {
    const cookieStore = cookies();

    // Cast to 'any' for now until we have database types generated
    return createServerComponentClient<any>({ cookies: () => cookieStore });
};
