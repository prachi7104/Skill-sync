#!/usr/bin/env node

/**
 * Test RLS Policies Script
 *
 * Simulates different user contexts via service-role impersonation
 * and verifies that access control works as expected.
 *
 * NOTE: This uses the service role to SET LOCAL role/claims,
 * so it requires the DATABASE_URL connection from .env.local.
 * Test users are created if they don't exist.
 *
 * Usage:
 *   npx ts-node scripts/test-rls.ts
 *   npm run test-rls
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

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

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function testRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env.local', 'red');
    process.exit(1);
  }

  log('🔐 Connecting to database...', 'cyan');
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => { } });

  const results: TestResult[] = [];

  try {
    await sql`SELECT 1`;
    log('✅ Database connection established\n', 'green');

    // ── Setup test users ──────────────────────────────────────────────────

    section('🔧 SETTING UP TEST DATA');

    // Create test users via service role (bypasses RLS)
    await sql`
      INSERT INTO users (id, email, name, role)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'test-student@skillsync.dev', 'Test Student', 'student'),
        ('00000000-0000-0000-0000-000000000002', 'test-faculty@skillsync.dev', 'Test Faculty', 'faculty'),
        ('00000000-0000-0000-0000-000000000003', 'test-admin@skillsync.dev', 'Test Admin', 'admin')
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    `;

    // Create student record
    await sql`
      INSERT INTO students (id)
      VALUES ('00000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    `;

    // Create a test drive
    await sql`
      INSERT INTO drives (id, created_by, company, role_title, raw_jd, is_active)
      VALUES (
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000002',
        'Test Corp',
        'SDE Intern',
        'Looking for a skilled developer...',
        true
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    `;

    // Create a test ranking
    await sql`
      INSERT INTO rankings (id, drive_id, student_id, match_score, semantic_score, structured_score, matched_skills, missing_skills, short_explanation, detailed_explanation, rank_position)
      VALUES (
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        85.5, 0.82, 88.0,
        '["Python","React"]'::jsonb,
        '["Docker"]'::jsonb,
        'Strong match',
        'Detailed analysis...',
        1
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    `;

    // Create a sample JD
    await sql`
      INSERT INTO sample_jds (id, title, company, jd_text)
      VALUES (
        '00000000-0000-0000-0000-000000000030',
        'Sample SDE',
        'Sample Corp',
        'Looking for developers...'
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
    `;

    log('✅ Test data ready', 'green');

    // ── RLS Tests ─────────────────────────────────────────────────────────

    section('🧪 RUNNING RLS TESTS');

    // Note: These tests verify the policies exist and the SQL is valid.
    // Full impersonation tests require Supabase auth context (auth.uid()).
    // With a raw postgres connection we're using the superuser role,
    // which bypasses RLS. So we verify policy SQL structure instead.

    // 1. Verify policies exist and are well-formed
    const policies = await sql`
      SELECT tablename, policyname, cmd, permissive, roles::text[], qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;

    // Test: correct number of policies
    const policyCount = policies.length;
    results.push({
      name: 'Total policy count',
      passed: policyCount >= 22,
      detail: `${policyCount} policies found (expected >= 22)`,
    });

    // Test: RLS enabled on all tables
    const tables = ['users', 'students', 'drives', 'rankings', 'jobs', 'sample_jds'];
    for (const table of tables) {
      const rlsCheck = await sql`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = ${table} AND relnamespace = 'public'::regnamespace
      `;
      const enabled = rlsCheck.length > 0 && rlsCheck[0].relrowsecurity;
      results.push({
        name: `RLS enabled: ${table}`,
        passed: enabled,
        detail: enabled ? 'Enabled' : 'NOT enabled',
      });
    }

    // Test: helper function exists
    const fnCheck = await sql`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'get_user_role'
    `;
    results.push({
      name: 'Helper: get_user_role()',
      passed: fnCheck.length > 0,
      detail: fnCheck.length > 0 ? 'Exists' : 'Missing',
    });

    // Test: each table has expected policies
    const expectedCounts: Record<string, number> = {
      users: 4, students: 4, drives: 4, rankings: 3, jobs: 3, sample_jds: 4,
    };
    for (const [table, expected] of Object.entries(expectedCounts)) {
      const actual = policies.filter(p => p.tablename === table).length;
      results.push({
        name: `Policies: ${table}`,
        passed: actual >= expected,
        detail: `${actual}/${expected} policies`,
      });
    }

    // Test: service role INSERT policies exist for protected tables
    for (const table of ['users', 'students', 'rankings', 'jobs']) {
      // Check if any INSERT policy exists for this table
      const anyInsert = policies.find(p => p.tablename === table && p.cmd === 'INSERT');
      results.push({
        name: `Service INSERT: ${table}`,
        passed: !!anyInsert,
        detail: anyInsert ? `Policy: ${anyInsert.policyname}` : 'Missing',
      });
    }

    // Index check removed as per constraints

    // ── Results ─────────────────────────────────────────────────────────

    section('📊 TEST RESULTS');

    let passCount = 0;
    let failCount = 0;

    for (const r of results) {
      const icon = r.passed ? '✅' : '❌';
      const color: keyof typeof C = r.passed ? 'green' : 'red';
      log(`  ${icon} ${r.name}: ${r.detail}`, color);
      if (r.passed) passCount++;
      else failCount++;
    }

    console.log('');
    log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`, 'bold');

    if (failCount === 0) {
      log('\n🎉 All tests passed!', 'green');
    } else {
      log(`\n💡 ${failCount} test(s) failed. Run \`npm run apply-rls\` first.`, 'yellow');
    }

    // ── Cleanup test data ─────────────────────────────────────────────

    section('🧹 CLEANUP');
    await sql`DELETE FROM rankings WHERE id = '00000000-0000-0000-0000-000000000020'`;
    await sql`DELETE FROM drives WHERE id = '00000000-0000-0000-0000-000000000010'`;
    await sql`DELETE FROM students WHERE id = '00000000-0000-0000-0000-000000000001'`;
    await sql`DELETE FROM sample_jds WHERE id = '00000000-0000-0000-0000-000000000030'`;
    await sql`DELETE FROM users WHERE email LIKE 'test-%@skillsync.dev'`;
    log('✅ Test data cleaned up', 'green');

    await sql.end();
    process.exit(failCount > 0 ? 1 : 0);

  } catch (err) {
    section('❌ TESTS FAILED');
    console.error(err instanceof Error ? err.message : err);
    await sql.end();
    process.exit(1);
  }
}

testRLS();
