# SkillSync — RLS Scripts

Row-Level Security (RLS) automation for the SkillSync Supabase database.

## Quick Start

```bash
# 1. Apply all RLS policies (idempotent)
npm run apply-rls

# 2. Verify policies were applied
npm run verify-rls

# 3. Run automated tests
npm run test-rls
```

## Scripts

| Script | Purpose |
| --- | --- |
| `setup-rls.sql` | All 23 RLS policies, helper function, and indexes |
| `apply-rls.ts` | Executes setup-rls.sql against the database |
| `verify-rls.ts` | Verifies policies exist and RLS is enabled |
| `test-rls.ts` | Creates test data, validates access, cleans up |

## Architecture

SkillSync uses **Supabase Auth** with three roles:

| Role | Access |
| --- | --- |
| `student` | Own profile (users + students), active drives (read-only), own rankings |
| `faculty` | Own profile, full drive CRUD, all rankings for own drives, manage sample JDs |
| `admin` | Full access to all tables |

### Key Schema Facts

- `students.id` **IS** the FK to `users.id` (same UUID, no separate `user_id`)
- RLS policies use `auth.uid()` to get the current user's ID
- `get_user_role()` helper function reads the user's role from the `users` table
- `service_role` has unrestricted INSERT access for backend operations

### Policy Naming Convention

```
{table}_{operation}_{scope}
```

Examples:
- `users_select_own` — users can read their own row
- `drives_select_active_students` — students can read active drives
- `sample_jds_insert_faculty` — faculty can insert sample JDs

## Environment

Requires `.env.local` with:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Tables & Policy Counts

| Table | SELECT | INSERT | UPDATE | DELETE | Total |
| --- | --- | --- | --- | --- | --- |
| users | 1 | 1 | 1 | 1 | 4 |
| students | 1 | 1 | 1 | 1 | 4 |
| drives | 2 | 1 | 1 | — | 4 |
| rankings | 2 | 1 | — | — | 3 |
| jobs | 1 | 1 | 1 | — | 3 |
| sample_jds | 1 | 1 | 1 | 1 | 4 |
| **Total** | | | | | **22+** |

## Troubleshooting

### "permission denied for table X"
Policies haven't been applied. Run `npm run apply-rls`.

### "function get_user_role() does not exist"
The helper function wasn't created. Run `npm run apply-rls` — it creates the function.

### Tests fail with "X policies expected, Y found"
Means some policies weren't applied. Check `npm run apply-rls` output for SQL errors.

### Need to reset all policies?
The SQL script is idempotent (DROP POLICY IF EXISTS before CREATE). Just re-run `npm run apply-rls`.
