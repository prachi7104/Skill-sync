import { createClient } from '@supabase/supabase-js';

// WARNING: This key has FULL ACCESS to your database. It bypasses Row Level Security.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey || !supabaseUrl) {
    // This error will only be thrown on the server where process.env is available
    // It acts as a safeguard against accidental client-side bundling
    throw new Error('Supabase Service Role Key or URL is missing. Check your .env.local file.');
}

/**
 * Admin / Service-Role Supabase Client
 * 
 * This client is initialized with the Service Role Key, granting it SUPERUSER privileges.
 * It bypasses all RLS policies.
 * 
 * SECURITY WARNING:
 * - NEVER import this file in Client Components or expose it to the browser.
 * - This client has full read/write/delete access to the entire database.
 * - Use ONLY for: trusted server-side operations (e.g., background jobs, webhooks, seeding, migrations).
 * - Ensure session persistence is disabled to prevent leaking tokens.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false, // Essential for admin context to avoid session caching
        autoRefreshToken: false,
    },
});
