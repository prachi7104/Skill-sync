import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Client-side Supabase Client
 * 
 * This client is safe to use in Client Components (components with 'use client').
 * It automatically handles OAuth redirects and session persistence in the browser.
 * 
 * SECURITY:
 * - This client only has access to NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * - These keys are "browser-safe" and restricted by Row Level Security (RLS) policies on the database.
 * - It cannot bypass RLS.
 * 
 * USAGE:
 * - Use for: Auth (login/signup), reading/writing public data, subscribing to real-time events.
 * - Do NOT use for: Admin tasks, bypassing RLS, or server-side logic (use server client instead).
 */
export const createClient = () => createClientComponentClient();

// Singleton instance for convenience in event handlers/effects
export const supabase = createClient();
