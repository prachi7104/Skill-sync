#!/usr/bin/env node

/**
 * Verify RLS Policies Script
 *
 * Checks that all expected policies are installed, RLS is enabled on
 * every table, and the helper function exists.
 *
 * Usage:
 *   npx ts-node scripts/verify-rls.ts
 *   npm run verify-rls
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ── Expected state ──────────────────────────────────────────────────────────

const EXPECTED_POLICIES: Record<string, { name: string; cmd: string }[]> = {
  users: [
    { name: 'users_select_own', cmd: 'SELECT' },
    { name: 'users_select_admin', cmd: 'SELECT' },
    { name: 'users_update_own', cmd: 'UPDATE' },
    { name: 'users_insert_service', cmd: 'INSERT' },
  ],
  students: [
    { name: 'students_select_own', cmd: 'SELECT' },
    { name: 'students_select_faculty_admin', cmd: 'SELECT' },
    { name: 'students_update_own', cmd: 'UPDATE' },
    { name: 'students_insert_service', cmd: 'INSERT' },
  ],
  drives: [
    { name: 'drives_select_active', cmd: 'SELECT' },
    { name: 'drives_insert_faculty_admin', cmd: 'INSERT' },
    { name: 'drives_update_created_by', cmd: 'UPDATE' },
    { name: 'drives_delete_created_by', cmd: 'DELETE' },
  ],
  rankings: [
    { name: 'rankings_select_own', cmd: 'SELECT' },
    { name: 'rankings_select_faculty_admin', cmd: 'SELECT' },
    { name: 'rankings_insert_service', cmd: 'INSERT' },
  ],
  jobs: [
    { name: 'jobs_select_admin', cmd: 'SELECT' },
    { name: 'jobs_insert_service', cmd: 'INSERT' },
    { name: 'jobs_update_service', cmd: 'UPDATE' },
  ],
  sample_jds: [
    { name: 'sample_jds_select_all', cmd: 'SELECT' },
    { name: 'sample_jds_insert_admin', cmd: 'INSERT' },
    { name: 'sample_jds_update_admin', cmd: 'UPDATE' },
    { name: 'sample_jds_delete_admin', cmd: 'DELETE' },
  ],
};

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

async function verifyRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env.local', 'red');
    process.exit(1);
  }

  log('🔐 Connecting to database...', 'cyan');
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  try {
    await sql`SELECT 1`;
    log('✅ Database connection established\n', 'green');

    section('🔍 VERIFYING RLS POLICIES BY TABLE');

    for (const [tableName, expectedPolicies] of Object.entries(EXPECTED_POLICIES)) {
      log(`\n📊 Checking table: ${tableName}`, 'cyan');

      // Check RLS enabled
      const rlsCheck = await sql`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = ${tableName} AND relnamespace = 'public'::regnamespace
      `;
      const rlsEnabled = rlsCheck.length > 0 && rlsCheck[0].relrowsecurity;
      if (rlsEnabled) {
        log('  ✅ RLS enabled', 'green');
      } else {
        log('  ❌ RLS NOT enabled', 'red');
        failed++;
        continue;
      }

      // Check policies
      const actualPolicies = await sql`
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = ${tableName}
      `;
      const actualNames = new Set(actualPolicies.map((p) => p.policyname));

      const missing: string[] = [];
      const extra: string[] = [];

      for (const ep of expectedPolicies) {
        if (!actualNames.has(ep.name)) {
          missing.push(ep.name);
        }
      }

      const expectedNames = new Set(expectedPolicies.map((p) => p.name));
      for (const ap of actualPolicies) {
        if (!expectedNames.has(ap.policyname)) {
          extra.push(ap.policyname);
        }
      }

      if (missing.length === 0 && extra.length === 0) {
        log(`  ✅ All ${expectedPolicies.length} policies present`, 'green');
        passed++;
      } else {
        if (missing.length > 0) {
          log(`  ❌ Missing: ${missing.join(', ')}`, 'red');
          failed++;
        }
        if (extra.length > 0) {
          log(`  ⚠️  Extra: ${extra.join(', ')}`, 'yellow');
          warnings++;
        }
      }
    }

    // Check helper function
    section('🔧 CHECKING HELPER FUNCTIONS');

    const fns = await sql`
      SELECT routine_name, security_type
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'get_user_role'
    `;

    if (fns.length > 0) {
      log(`✅ get_user_role() exists (security: ${fns[0].security_type})`, 'green');
    } else {
      log('❌ get_user_role() not found', 'red');
      failed++;
    }

    // Summary
    section('📊 VERIFICATION SUMMARY');
    const totalTables = Object.keys(EXPECTED_POLICIES).length;
    log(`Total tables checked: ${totalTables}`, 'blue');
    log(`✅ Passed: ${passed}`, 'green');
    if (failed > 0) log(`❌ Failed: ${failed}`, 'red');
    if (warnings > 0) log(`⚠️  Warnings: ${warnings}`, 'yellow');

    if (failed === 0) {
      log('\n🎉 All RLS policies verified successfully!', 'green');
    } else {
      log('\n💡 Fix: run `npm run apply-rls` then re-verify.', 'yellow');
    }

    await sql.end();
    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    section('❌ VERIFICATION FAILED');
    console.error(err instanceof Error ? err.message : err);
    await sql.end();
    process.exit(1);
  }
}

verifyRLS();
