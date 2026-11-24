/**
 * Supabase API key configuration.
 *
 * SkillSync does not call the Supabase REST, Auth or Storage APIs: the app talks
 * to Postgres directly through Drizzle and DATABASE_URL, and institutional sign-in
 * is NextAuth (Microsoft Entra ID and staff credentials). These keys are therefore
 * optional and only matter for future Supabase API clients.
 *
 * Supported key formats are Supabase's current API keys:
 *   SUPABASE_SECRET_KEY                   sb_secret_...       server only
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  sb_publishable_...  safe to ship to browsers
 * The legacy JWT keys (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY) are
 * no longer read. Messages name variables only and never include their values.
 */
type Env = Record<string, string | undefined>;

const SECRET_PREFIX = "sb_secret_";
const PUBLISHABLE_PREFIX = "sb_publishable_";
const LEGACY_VARS = ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

function isLegacyServiceJwt(value: string): boolean {
  if (!value.startsWith("eyJ")) return false;
  try {
    const part = (value.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

export interface SupabaseKeyReport {
  /** Configurations that would leak a privileged key. The app refuses to start. */
  fatal: string[];
  /** Misconfigurations worth fixing that do not leak anything. */
  warnings: string[];
}

export function checkSupabaseKeys(env: Env = process.env): SupabaseKeyReport {
  const fatal: string[] = [];
  const warnings: string[] = [];

  for (const [name, raw] of Object.entries(env)) {
    const value = raw?.trim();
    if (!value || !name.startsWith("NEXT_PUBLIC_")) continue;
    if (value.startsWith(SECRET_PREFIX) || isLegacyServiceJwt(value)) {
      fatal.push(`${name} holds a Supabase secret or service-role key; NEXT_PUBLIC_ variables are sent to browsers.`);
    }
  }

  const secret = env.SUPABASE_SECRET_KEY?.trim();
  if (secret && !secret.startsWith(SECRET_PREFIX)) {
    warnings.push(`SUPABASE_SECRET_KEY is not an ${SECRET_PREFIX} key.`);
  }
  const publishable = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable && !publishable.startsWith(PUBLISHABLE_PREFIX)) {
    warnings.push(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not an ${PUBLISHABLE_PREFIX} key.`);
  }
  for (const name of LEGACY_VARS) {
    if (env[name]?.trim()) warnings.push(`${name} is set but no longer read; remove it after the key migration.`);
  }
  return { fatal, warnings };
}

export function supabaseSecretKey(env: Env = process.env): string | undefined {
  const value = env.SUPABASE_SECRET_KEY?.trim();
  return value?.startsWith(SECRET_PREFIX) ? value : undefined;
}

export function supabasePublishableKey(env: Env = process.env): string | undefined {
  const value = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return value?.startsWith(PUBLISHABLE_PREFIX) ? value : undefined;
}
