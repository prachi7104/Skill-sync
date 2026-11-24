/**
 * Resolves the database connection for guest-mode maintenance scripts and
 * prints which Supabase project it targets. Never prints credentials.
 *
 * Supabase direct hosts (db.<ref>.supabase.co) are IPv6-only. When the machine
 * has no IPv6 route, set DATABASE_POOLER_HOST (e.g. aws-1-ap-south-1.pooler.supabase.com)
 * to use the IPv4 session pooler with the same credentials.
 */
import fs from "node:fs";
import path from "node:path";

export function readEnvFile(key: string): string | undefined {
  for (const file of [".env.local", ".env", "../.env"]) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const line = fs.readFileSync(full, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).replace(/^["']|["']$/g, "");
  }
  return undefined;
}

export function projectRefOf(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.match(/^db\.([a-z]{20})\.supabase\.co$/)?.[1]
    ?? parsed.username.split(".")[1] ?? parsed.hostname;
}

export function loadDatabaseUrl(): { url: string; ref: string } {
  let url = process.env.DATABASE_URL ?? readEnvFile("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL is not configured");
  const ref = projectRefOf(url);
  const pooler = process.env.DATABASE_POOLER_HOST ?? readEnvFile("DATABASE_POOLER_HOST");
  const parsed = new URL(url);
  if (pooler && parsed.hostname === `db.${ref}.supabase.co`) {
    parsed.hostname = pooler;
    parsed.port = "5432";
    parsed.username = `${parsed.username}.${ref}`;
    url = parsed.toString();
  }
  console.log(`[guest-db] target project: ${ref} via ${new URL(url).hostname}`);
  return { url, ref };
}
