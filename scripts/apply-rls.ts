#!/usr/bin/env node

/**
 * Apply RLS Policies Script
 *
 * Reads setup-rls.sql and executes it against the Supabase database
 * using the DATABASE_URL (which should use service-role credentials).
 *
 * Usage:
 *   npx ts-node scripts/apply-rls.ts
 *   npm run apply-rls
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// ── Helpers ──────────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

function log(msg: string, color: keyof typeof C = 'reset') {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(72));
  log(title, 'bold');
  console.log('='.repeat(72) + '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function applyRLS() {
  const start = Date.now();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env.local', 'red');
    process.exit(1);
  }

  log('🔐 Connecting to database...', 'cyan');
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => { } });

  try {
    // 1. Test connection
    await sql`SELECT 1`;
    log('✅ Database connection established', 'green');

    // 2. Read SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'setup-rls.sql');
    log(`📄 Reading: ${sqlPath}`, 'cyan');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    if (!sqlContent.trim()) throw new Error('SQL file is empty');
    log(`✅ SQL loaded (${(sqlContent.length / 1024).toFixed(1)} KB)`, 'green');

    // 3. Execute
    section('🚀 APPLYING RLS POLICIES');
    log('⚙️  Executing setup-rls.sql...', 'yellow');
    await sql.unsafe(sqlContent);
    log('✅ RLS policies applied successfully!', 'green');

    // 4. Verify
    section('🔍 VERIFICATION');

    const policies = await sql`
      SELECT tablename, policyname, cmd, roles::text[]
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    log(`✅ Total policies: ${policies.length}`, 'green');

    // Group by table
    const byTable: Record<string, Array<Record<string, unknown>>> = {};
    for (const p of policies) {
      const tbl = String(p.tablename);
      if (!byTable[tbl]) byTable[tbl] = [];
      byTable[tbl].push(p);
    }

    console.log('\n📋 Policies by table:');
    for (const [table, tablePolicies] of Object.entries(byTable)) {
      log(`\n  📊 ${table} (${tablePolicies.length})`, 'bold');
      for (const p of tablePolicies) {
        log(`    • ${String(p.policyname)} [${String(p.cmd)}]`, 'blue');
      }
    }

    // Check helper function
    const fns = await sql`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'get_user_role'
    `;
    if (fns.length > 0) {
      log('\n✅ Helper function: get_user_role()', 'green');
    } else {
      log('\n⚠️  Warning: get_user_role() not found', 'yellow');
    }

    // Done
    section('✅ RLS SETUP COMPLETE');
    log(`⏱️  Completed in ${Date.now() - start}ms`, 'blue');
    log('🎉 Row-Level Security is now active!', 'green');

  } catch (err) {
    section('❌ RLS SETUP FAILED');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyRLS();
