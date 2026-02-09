# RLS Architecture

## Overview

SkillSync implements **database-level access control** using Supabase Row-Level Security (RLS).
Every query through the Supabase client is automatically filtered based on the authenticated user's
identity and role—no application-level authorization code needed for basic CRUD.

## System Design

```
┌──────────────────────────────────────────────────┐
│ Next.js Application                              │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Client     │  │ Server     │  │ Admin       │ │
│  │ Components │  │ Components │  │ (backend)   │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│        │               │               │        │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐ │
│  │ client.ts  │  │ server.ts  │  │ admin.ts   │ │
│  │ (anon key) │  │ (anon key) │  │ (svc role) │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
└────────┼───────────────┼───────────────┼────────┘
         │               │               │
         ▼               ▼               ▼
┌──────────────────────────────────────────────────┐
│ Supabase / PostgreSQL                            │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ RLS Policies (23 policies)                  │ │
│  │                                             │ │
│  │  auth.uid() → user identity                 │ │
│  │  get_user_role() → student|faculty|admin    │ │
│  │                                             │ │
│  │  anon key  → RLS enforced ✅               │ │
│  │  svc role  → RLS bypassed ❌               │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Tables                                      │ │
│  │  users · students · drives                  │ │
│  │  rankings · jobs · sample_jds               │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Student reads their rankings

```
1. Student logs in → Supabase auth sets auth.uid() = student's UUID
2. Client calls: supabase.from('rankings').select('*')
3. PostgreSQL evaluates: rankings_select_own policy
   → WHERE student_id = auth.uid()
4. Only that student's rankings are returned
```

### Faculty creates a drive

```
1. Faculty logs in → auth.uid() = faculty's UUID
2. Server calls: supabase.from('drives').insert({ ... })
3. PostgreSQL evaluates: drives_insert_faculty policy
   → WITH CHECK (get_user_role() IN ('faculty', 'admin'))
4. Insert succeeds only if the user is faculty or admin
```

### Backend creates a ranking (service role)

```
1. Ranking engine runs server-side
2. Uses supabaseAdmin (service role key)
3. Service role bypasses ALL RLS
4. rankings_insert_service policy allows the INSERT
5. No auth.uid() needed
```

## Schema Relationships

```
users (id: uuid PK)
  ├── students (id: uuid PK+FK → users.id)     ← 1:1, same UUID
  ├── drives   (created_by → users.id)          ← 1:many
  └── (role: student | faculty | admin)

drives (id: uuid PK)
  └── rankings (drive_id → drives.id)           ← 1:many
        └── (student_id → students.id)

jobs (id: uuid PK)                              ← standalone, role-gated
sample_jds (id: uuid PK)                        ← standalone, public read
```

### Critical: `students.id = users.id`

The `students` table uses the **same UUID** as the `users` table.
There is NO separate `user_id` column. This means:

- `students.id = auth.uid()` (not `students.user_id = auth.uid()`)
- When joining, `students.id = users.id`
- The 1:1 relationship is enforced at the schema level

## Policy Design Principles

1. **Least privilege**: Users see only what they need
2. **Defense in depth**: RLS + application checks + API validation
3. **Idempotent deployment**: DROP IF EXISTS → CREATE POLICY
4. **Service role escape hatch**: Backend ops bypass RLS via admin client
5. **Role hierarchy**: admin > faculty > student (not inherited—explicit per policy)

## Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

- `SECURITY DEFINER`: Runs with owner privileges (can read `users` table)
- `STABLE`: PostgreSQL can cache the result within a transaction
- Used in policies that need role-based checks (drives, rankings, jobs, sample_jds)

## Performance

Six indexes support common RLS filter patterns:

| Index | Supports |
| --- | --- |
| `idx_drives_created_by` | Faculty drive lookups |
| `idx_drives_is_active` | Student active-drive filter |
| `idx_rankings_student_id` | Student ranking lookups |
| `idx_rankings_drive_id` | Faculty ranking lookups per drive |
| `idx_jobs_status` | Job queue filtering |
| `idx_jobs_created_at` | Job ordering |

## File Map

```
lib/
  supabase/
    client.ts      → Browser client (RLS enforced)
    server.ts      → Server client (RLS enforced)
    admin.ts       → Service role (RLS bypassed)
  db/
    schema.ts      → Drizzle ORM schema (source of truth)

scripts/
  setup-rls.sql    → All policies, function, indexes
  apply-rls.ts     → Execute SQL against database
  verify-rls.ts    → Verify policies exist
  test-rls.ts      → Automated access tests
  README.md        → This directory's docs
  QUICK_REFERENCE.md → Cheat sheet
  SECURITY_CHECKLIST.md → Pre-deploy audit
  ARCHITECTURE.md  → This file
```
