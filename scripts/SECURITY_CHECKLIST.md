# Security Checklist

Pre-deployment and ongoing security review for SkillSync RLS.

## Pre-Deployment

- [ ] Run `npm run apply-rls` against production database
- [ ] Run `npm run verify-rls` — all checks must pass
- [ ] Run `npm run test-rls` — all tests must pass
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to the client
- [ ] Verify `DATABASE_URL` is NOT in any client-side code
- [ ] Verify admin client (`lib/supabase/admin.ts`) is only used in server-side code
- [ ] Check that `NEXT_PUBLIC_` prefix is only on anon key and URL
- [ ] Verify `.env.local` is in `.gitignore`

## RLS Configuration

- [ ] RLS is enabled on ALL 6 tables (users, students, drives, rankings, jobs, sample_jds)
- [ ] `get_user_role()` helper function exists in public schema
- [ ] All 22+ policies are applied (check via `verify-rls`)
- [ ] `service_role` INSERT policies exist for backend-managed tables
- [ ] No `TO public` policies (all use `TO authenticated` or `TO service_role`)

## Access Control Verification

### Students
- [ ] Can only read their own `users` row
- [ ] Can only read/update their own `students` row
- [ ] Can only see `is_active = true` drives
- [ ] Can only see rankings where `student_id = auth.uid()`
- [ ] Cannot create drives, rankings, or jobs
- [ ] Cannot delete any records
- [ ] Can read all `sample_jds`

### Faculty
- [ ] Can read/update their own `users` row
- [ ] Can CRUD drives where `created_by = auth.uid()`
- [ ] Can read rankings for their own drives only
- [ ] Can create/read/update jobs (faculty or admin role)
- [ ] Can CRUD `sample_jds` (where `is_deletable = true` for delete)
- [ ] Cannot access other users' profiles
- [ ] Cannot modify student records

### Admin
- [ ] Full read access to all tables
- [ ] Full write access to users, drives, rankings, jobs
- [ ] Can manage all sample_jds
- [ ] Cannot bypass RLS when using regular Supabase client (only admin client)

## API Security

- [ ] All API routes use `createServerClient()` (not admin) by default
- [ ] Admin client used only for: user creation, job processing, embedding generation
- [ ] No raw SQL queries in API routes (use Supabase client or Drizzle)
- [ ] Authentication checked before database access in API routes
- [ ] Error messages don't leak schema details to clients

## Monitoring

- [ ] Supabase dashboard: check for RLS policy violations in logs
- [ ] Monitor for unexpected `permission denied` errors
- [ ] Review new tables/columns for RLS policy coverage
- [ ] Re-run `npm run verify-rls` after any schema migration

## When Adding New Tables

1. Enable RLS: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. Force RLS for owner: `ALTER TABLE new_table FORCE ROW LEVEL SECURITY;`
3. Add appropriate SELECT/INSERT/UPDATE/DELETE policies
4. Add `service_role` INSERT policy if backend needs direct access
5. Update `verify-rls.ts` with new expected policies
6. Update `setup-rls.sql` with new policy definitions
7. Re-run `npm run apply-rls` and `npm run test-rls`
