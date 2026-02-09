# RLS Quick Reference

## Commands

```bash
npm run apply-rls     # Apply/re-apply all policies
npm run verify-rls    # Verify policies are in place
npm run test-rls      # Run automated RLS tests
```

## Supabase Clients

| Module | When to use | RLS? |
| --- | --- | --- |
| `lib/supabase/client.ts` | Client Components | ✅ Enforced |
| `lib/supabase/server.ts` | Server Components / Route Handlers | ✅ Enforced |
| `lib/supabase/admin.ts` | Backend jobs, migrations, seeding | ❌ Bypassed |

## Role Matrix

| Action | student | faculty | admin |
| --- | --- | --- | --- |
| Read own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Read all users | ❌ | ❌ | ✅ |
| Read own student record | ✅ | ❌ | ✅ |
| Update own student record | ✅ | ❌ | ✅ |
| Read active drives | ✅ (active only) | ✅ (own) | ✅ |
| Create drives | ❌ | ✅ | ✅ |
| Update drives | ❌ | ✅ (own) | ✅ |
| Read rankings | ✅ (own) | ✅ (own drives) | ✅ |
| Read sample JDs | ✅ | ✅ | ✅ |
| Manage sample JDs | ❌ | ✅ | ✅ |
| View/create jobs | ❌ | ✅ | ✅ |

## API Route Pattern

```typescript
// ✅ Correct: server client respects RLS
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('drives')
    .select('*');
  // Students auto-filtered to active drives only
  return Response.json(data);
}

// ✅ Correct: admin client for backend operations
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  // Only for trusted server-side operations
  const { data } = await supabaseAdmin
    .from('users')
    .insert({ ... });
}
```

## RLS auth.uid() Mapping

```
users     → id = auth.uid()
students  → id = auth.uid()          ← students.id IS the FK
drives    → created_by = auth.uid()
rankings  → student_id = auth.uid()  ← student's UUID
jobs      → role check via get_user_role()
sample_jds → public read, faculty/admin write
```

## Helper Function

```sql
get_user_role() → 'student' | 'faculty' | 'admin'
-- Reads from users table using auth.uid()
```
