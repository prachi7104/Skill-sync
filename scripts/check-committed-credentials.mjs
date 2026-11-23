#!/usr/bin/env node
/**
 * Fails when a tracked file contains something that looks like a real credential.
 *
 * Reports only "file:line  rule" — never the matched value — so the output is safe
 * to show in CI logs. Placeholders such as YOUR_DB_PASSWORD, <value>, "your-key" or
 * "..." are allowed. A line that intentionally holds a fake credential-shaped
 * fixture can be exempted with the comment `credential-check: allow`.
 *
 * Usage: node scripts/check-committed-credentials.mjs   (exit 1 on findings)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024;
const SKIP_FILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.(png|jpe?g|gif|webp|ico|pdf|xlsx|docx|woff2?|ttf|zip|gz)$/i;
const ALLOW_COMMENT = /credential-check:\s*allow/;
const PLACEHOLDER = /YOUR_|your[-_]|<[^<>]*>|x{4,}|not[-_]a[-_]real|placeholder|example|dummy|fake|changeme|change[-_]me|redacted|\.\.\./i;

// Provider-issued formats: any match is a finding unless it carries a placeholder marker.
const PROVIDER_RULES = [
  ["supabase-secret-key", /sb_secret_[A-Za-z0-9_-]{10,}/g],
  ["groq-api-key", /gsk_[A-Za-z0-9]{20,}/g],
  ["google-api-key", /AIza[0-9A-Za-z_-]{30,}/g],
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{30,}/g],
  ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["slack-token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  ["stripe-live-key", /\b[rs]k_live_[A-Za-z0-9]{16,}/g],
  ["private-key-block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["jwt", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ["cloudinary-url", /cloudinary:\/\/[^\s'"`]+:[^\s'"`]+@[^\s'"`]+/g],
];

// Connection strings with an embedded password.
const URL_WITH_PASSWORD = /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|rediss?|amqps?):\/\/([^\s:@/'"`]+):([^\s@/'"`]+)@([^\s/:'"`?]+)/g;
const SAFE_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|host|db|postgres|redis|\[::1\])$/i;
const SAFE_PASSWORDS = /^(password|pass|passwd|secret|test|postgres|build|root|admin|changeme)$/i;

// KEY=value lines (env files, shell snippets, Markdown code blocks) for secret-named variables.
const SECRET_NAME = /(SECRET|_KEY$|_KEY_|^KEY_|TOKEN|PASSWORD|PASSWD|DATABASE_URL|REDIS_URL|_DSN$|CLIENT_ID|TENANT_ID)/;
const ENV_ASSIGNMENT = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*["']?([^"'#\s]*)/;

/** Returns rule names found on one line. Never returns the matched text. */
export function scanLine(line) {
  if (ALLOW_COMMENT.test(line)) return [];
  const rules = [];
  for (const [rule, rx] of PROVIDER_RULES) {
    for (const match of line.matchAll(rx)) {
      if (!PLACEHOLDER.test(match[0])) rules.push(rule);
    }
  }
  for (const match of line.matchAll(URL_WITH_PASSWORD)) {
    const [, user, password, host] = match;
    const placeholder = PLACEHOLDER.test(user + password + host) || SAFE_HOSTS.test(host) || SAFE_PASSWORDS.test(password);
    if (!placeholder) rules.push("connection-string-password");
  }
  const assignment = line.match(ENV_ASSIGNMENT);
  if (assignment && SECRET_NAME.test(assignment[1])) {
    const value = assignment[2];
    const harmless = value === "" || PLACEHOLDER.test(value) || /^\$\{?[A-Za-z_]/.test(value) || /^(process\.env|secrets\.)/.test(value);
    if (!harmless && !rules.includes("connection-string-password") && !URL_WITH_PASSWORD.test(value)) {
      rules.push(`secret-assignment:${assignment[1]}`);
    }
    URL_WITH_PASSWORD.lastIndex = 0;
  }
  return [...new Set(rules)];
}

/** Scans text and returns [{ line, rule }] without any matched values. */
export function scanText(text) {
  const findings = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const rule of scanLine(line)) findings.push({ line: index + 1, rule });
  });
  return findings;
}

/** Scans every git-tracked file under root. */
export function scanRepository(root) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
  const findings = [];
  for (const file of files) {
    if (SKIP_FILES.test(file)) continue;
    const full = path.join(root, file);
    let size;
    try {
      size = statSync(full).size;
    } catch {
      continue; // deleted in the working tree
    }
    if (size > MAX_BYTES) continue;
    const buffer = readFileSync(full);
    if (buffer.includes(0)) continue; // binary
    for (const finding of scanText(buffer.toString("utf8"))) findings.push({ file, ...finding });
  }
  return findings;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const findings = scanRepository(root);
  if (findings.length === 0) {
    console.log("credential check: no credential-like values in tracked files");
  } else {
    for (const f of findings) console.error(`${f.file}:${f.line}  ${f.rule}`);
    console.error(`credential check: ${findings.length} finding(s). Replace the value with a placeholder and rotate it if it was real.`);
    process.exit(1);
  }
}
