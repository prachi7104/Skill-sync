/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Centralized Environment Variable Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * All env-var reads go through this module so missing/malformed values
 * fail fast at startup instead of silently at runtime.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    // Skip validation during:
    // 1. Test environments (vitest/jest)
    // 2. Next.js `next build` static analysis phase
    if (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return "";
    }
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Add it to your .env file or environment.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}

// ── Microsoft / Azure AD ────────────────────────────────────────────────────
export const MICROSOFT_CLIENT_ID = requireEnv("MICROSOFT_CLIENT_ID");
export const MICROSOFT_CLIENT_SECRET = requireEnv("MICROSOFT_CLIENT_SECRET");
export const MICROSOFT_TENANT_ID = requireEnv("MICROSOFT_TENANT_ID");

// ── Database ────────────────────────────────────────────────────────────────
export const DATABASE_URL = requireEnv("DATABASE_URL");

// ── NextAuth ────────────────────────────────────────────────────────────────
export const NEXTAUTH_SECRET = requireEnv("NEXTAUTH_SECRET");
export const NEXTAUTH_URL = optionalEnv("NEXTAUTH_URL", "http://localhost:3000");

// ── Role Assignment ─────────────────────────────────────────────────────────
/**
 * Email domain for student accounts (auto-created on first sign-in).
 * Any Microsoft account with this domain is automatically a student.
 * Example: "stu.upes.ac.in"
 */
export const STUDENT_EMAIL_DOMAIN = requireEnv("STUDENT_EMAIL_DOMAIN").toLowerCase();

// ── Admin / Security ────────────────────────────────────────────────────────
export const ADMIN_EMAIL = requireEnv("ADMIN_EMAIL");
export const CRON_SECRET = requireEnv("CRON_SECRET");

// ── Cloudinary ──────────────────────────────────────────────────────────────
export const CLOUDINARY_CLOUD_NAME = optionalEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
export const CLOUDINARY_API_KEY = optionalEnv("CLOUDINARY_API_KEY");
export const CLOUDINARY_API_SECRET = optionalEnv("CLOUDINARY_API_SECRET");

// ── Supabase ────────────────────────────────────────────────────────────────
export const SUPABASE_URL = optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// ── AI Providers (Free Tier) ────────────────────────────────────────────────
export const GROQ_API_KEY = optionalEnv("GROQ_API_KEY");
export const MISTRAL_API_KEY = optionalEnv("MISTRAL_API_KEY");
export const GOOGLE_GENERATIVE_AI_API_KEY = optionalEnv("GOOGLE_GENERATIVE_AI_API_KEY");

// ── Convenience export for all env vars ─────────────────────────────────────
export const env = {
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID,
  DATABASE_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  STUDENT_EMAIL_DOMAIN,
  ADMIN_EMAIL,
  CRON_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GROQ_API_KEY,
  MISTRAL_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
};