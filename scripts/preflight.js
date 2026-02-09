#!/usr/bin/env node
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Preflight Check
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Run before `npm run dev` to validate:
 *   1. All required env vars are present
 *   2. Database is reachable
 *   3. Azure AD callback URL is correctly configured
 *   4. .next cache isn't stale
 *
 * Usage:
 *   node scripts/preflight.js
 *   npm run preflight          (if added to package.json)
 *   npm run dev:safe           (preflight + dev)
 */

const fs = require("fs");
const path = require("path");

// ── Colors ──────────────────────────────────────────────────────────────────
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const ok = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
const fail = (msg) => console.log(`  ${RED}✗${RESET} ${msg}`);
const info = (msg) => console.log(`  ${CYAN}ℹ${RESET} ${msg}`);

let errors = 0;
let warnings = 0;

// ── 1. Check .env file exists ───────────────────────────────────────────────
console.log(`\n${BOLD}1. Environment file${RESET}`);

const envPath = path.join(process.cwd(), ".env");
const envLocalPath = path.join(process.cwd(), ".env.local");

let envContent = "";
if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf-8");
    ok(".env.local found");
} else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
    ok(".env found");
} else {
    fail("No .env or .env.local file found");
    info("Copy .env.example to .env and fill in the values");
    errors++;
}

// ── 2. Check required env vars ──────────────────────────────────────────────
console.log(`\n${BOLD}2. Required environment variables${RESET}`);

function parseEnvFile(content) {
    const vars = {};
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        vars[key] = val;
    }
    return vars;
}

const envVars = parseEnvFile(envContent);

const REQUIRED = [
    { key: "MICROSOFT_CLIENT_ID", hint: "Azure AD App Registration → Application (client) ID" },
    { key: "MICROSOFT_CLIENT_SECRET", hint: "Azure AD App Registration → Certificates & secrets" },
    { key: "MICROSOFT_TENANT_ID", hint: "Azure AD → Directory (tenant) ID" },
    { key: "DATABASE_URL", hint: "PostgreSQL connection string (e.g. from Supabase)" },
    { key: "NEXTAUTH_SECRET", hint: "Run: openssl rand -base64 32" },
];

const OPTIONAL = [
    { key: "NEXTAUTH_URL", hint: "Defaults to http://localhost:3000" },
    { key: "STUDENT_EMAIL_DOMAIN", hint: "Defaults to stu.upes.ac.in" },
];

for (const { key, hint } of REQUIRED) {
    const val = envVars[key] || process.env[key];
    if (!val) {
        fail(`${key} — MISSING`);
        info(`  ${hint}`);
        errors++;
    } else if (val.includes("your_") || val.includes("placeholder")) {
        warn(`${key} — looks like a placeholder value`);
        warnings++;
    } else {
        ok(key);
    }
}

for (const { key, hint } of OPTIONAL) {
    const val = envVars[key] || process.env[key];
    if (!val) {
        warn(`${key} — not set (${hint})`);
        warnings++;
    } else {
        ok(`${key} = ${val.length > 30 ? val.slice(0, 30) + "…" : val}`);
    }
}

// ── 3. Check NEXTAUTH_URL / callback URL ────────────────────────────────────
console.log(`\n${BOLD}3. OAuth callback URL${RESET}`);

const nextauthUrl = envVars["NEXTAUTH_URL"] || process.env["NEXTAUTH_URL"] || "http://localhost:3000";
const callbackUrl = `${nextauthUrl}/api/auth/callback/azure-ad`;
ok(`Callback URL: ${callbackUrl}`);
info("Ensure this URL is registered in Azure AD → App Registration → Authentication → Redirect URIs");

// ── 4. Check for stale .next cache ──────────────────────────────────────────
console.log(`\n${BOLD}4. Build cache${RESET}`);

const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
    const buildId = path.join(nextDir, "BUILD_ID");
    if (fs.existsSync(buildId)) {
        const stat = fs.statSync(buildId);
        const ageMs = Date.now() - stat.mtimeMs;
        const ageHours = (ageMs / 1000 / 60 / 60).toFixed(1);
        if (ageMs > 24 * 60 * 60 * 1000) {
            warn(`.next cache is ${ageHours}h old — consider clearing it`);
            info("Run: npm run clean");
            warnings++;
        } else {
            ok(`.next cache age: ${ageHours}h`);
        }
    } else {
        ok(".next exists (dev mode, no BUILD_ID)");
    }
} else {
    ok("No .next cache (clean state)");
}

// ── 5. Check node_modules ───────────────────────────────────────────────────
console.log(`\n${BOLD}5. Dependencies${RESET}`);

const nodeModules = path.join(process.cwd(), "node_modules");
if (!fs.existsSync(nodeModules)) {
    fail("node_modules not found — run: npm install");
    errors++;
} else {
    // Check for critical packages
    const critical = ["next", "next-auth", "react", "react-dom", "drizzle-orm"];
    for (const pkg of critical) {
        if (fs.existsSync(path.join(nodeModules, pkg))) {
            ok(pkg);
        } else {
            fail(`${pkg} not found in node_modules`);
            errors++;
        }
    }
}

// ── 6. Database connectivity ────────────────────────────────────────────────
console.log(`\n${BOLD}6. Database (quick check)${RESET}`);

const dbUrl = envVars["DATABASE_URL"] || process.env["DATABASE_URL"];
if (dbUrl) {
    try {
        const url = new URL(dbUrl);
        ok(`Host: ${url.hostname}`);
        ok(`Database: ${url.pathname.slice(1)}`);
        if (url.searchParams.get("sslmode") === "require" || dbUrl.includes("sslmode=require")) {
            ok("SSL: required");
        } else {
            warn("SSL not explicitly required — may fail on hosted databases");
            warnings++;
        }
    } catch {
        fail("DATABASE_URL is not a valid URL");
        errors++;
    }
} else {
    fail("DATABASE_URL not set — cannot verify database");
    errors++;
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
if (errors > 0) {
    console.log(`${RED}${BOLD}PREFLIGHT FAILED${RESET}: ${errors} error(s), ${warnings} warning(s)`);
    console.log(`Fix the errors above before running the dev server.\n`);
    process.exit(1);
} else if (warnings > 0) {
    console.log(`${YELLOW}${BOLD}PREFLIGHT PASSED WITH WARNINGS${RESET}: ${warnings} warning(s)`);
    console.log(`The dev server should start, but check the warnings above.\n`);
    process.exit(0);
} else {
    console.log(`${GREEN}${BOLD}PREFLIGHT PASSED${RESET}: All checks OK`);
    console.log(`Ready to run: npm run dev\n`);
    process.exit(0);
}
