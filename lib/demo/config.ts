/**
 * Guest mode runs inside the main SkillSync app. It is off unless
 * ENABLE_GUEST_ACCESS=true, so an institutional deployment that never sets the
 * flag exposes no guest routes or sign-in provider.
 */
export function guestAccessEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.ENABLE_GUEST_ACCESS === "true" && guestDatabaseApproved(env);
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/**
 * Guest mode writes throwaway colleges, users and files on every visit, so the
 * flag alone is not enough: the database must also be one approved for guest
 * data. Approved means a loopback database (local development and tests), no
 * database at all, or the Supabase project named by GUEST_DATABASE_PROJECT_REF,
 * which must be a dedicated demo project and never the institutional one.
 */
export function guestDatabaseApproved(env: Record<string, string | undefined> = process.env): boolean {
  const raw = env.DATABASE_URL?.trim();
  if (!raw) return true;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (LOOPBACK_HOSTS.has(host)) return true;
  const ref = env.GUEST_DATABASE_PROJECT_REF?.trim().toLowerCase();
  if (!ref || !/^[a-z0-9]{20}$/.test(ref)) return false;
  if (INSTITUTIONAL_PROJECT_REFS.has(ref)) return false;
  if (env.INSTITUTIONAL_DATABASE_PROJECT_REF?.trim().toLowerCase() === ref) return false;
  // The deployment's Supabase API (service-role and storage clients) must be the same demo project.
  for (const supabaseUrl of [env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_URL]) {
    if (supabaseUrl?.trim() && !isSupabaseProjectUrl(supabaseUrl.trim(), ref)) return false;
  }
  // Direct connections use db.<ref>.supabase.co; the pooler uses the user postgres.<ref>.
  return host === `db.${ref}.supabase.co` || decodeURIComponent(url.username).toLowerCase() === `postgres.${ref}`;
}

/**
 * The institutional production project. Hard-coded so that no environment
 * variable, however misconfigured, can point guest data at it. A project ref
 * is not a secret: it is part of the public Supabase URL.
 */
export const INSTITUTIONAL_PROJECT_REFS: ReadonlySet<string> = new Set(["egpolgptmeuxxkiqyozp"]);

function isSupabaseProjectUrl(raw: string, ref: string): boolean {
  try {
    return new URL(raw).hostname.toLowerCase() === `${ref}.supabase.co`;
  } catch {
    return false;
  }
}

export const GUEST_EMAIL_DOMAIN_SUFFIX = ".demo.invalid";
export const GUEST_SESSION_HOURS = 24;

/** Paths a guest session may use. Everything else is institutional and blocked for guests. */
export function isGuestAllowedPath(path: string): boolean {
  if (path === "/" || path === "/guest" || path.startsWith("/guest/")) return true;
  if (path.startsWith("/api/demo/") || path === "/api/demo") return true;
  // NextAuth's own endpoints only — not institutional routes that live under
  // /api/auth such as change-password.
  if (/^\/api\/auth\/(?:session|csrf|providers|signin|signout|callback|error|_log)(?:\/|$)/.test(path)) return true;
  if (path.startsWith("/_next/")) return true;
  // Only the real public assets: an extension alone is not enough, because a
  // dynamic institutional route would also match e.g. /api/drives/x.js.
  if (["/favicon.ico", "/robots.txt", "/manifest.json", "/sw.js"].includes(path)) return true;
  return /^\/icons\/[\w.-]+\.(?:png|svg|ico|webp)$/.test(path);
}
