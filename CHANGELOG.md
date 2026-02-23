# SkillSync — Session Changelog
> Branch: `fixed_bug` · Date: 2026-02-22

---

## 1. Safety & Configuration Fixes

### `lib/guardrails/sandbox-limits.ts`
- Lowered free-tier limits to avoid API over-consumption:
  - `DAILY_LIMIT` 100 → 5
  - `MONTHLY_LIMIT` 500 → 30
  - `DETAILED_DAILY_LIMIT` 100 → 3
  - `DETAILED_MONTHLY_LIMIT` 500 → 15

### `lib/env.ts`
- `STUDENT_EMAIL_DOMAIN` changed from `optionalEnv` (with fallback) to `requireEnv` — server will refuse to start if this variable is missing.

### `.env.example`
- Created comprehensive template covering all required and optional variables (Database, Supabase, AI Services, Auth, App Config, Cron).

### `scripts/reset-db.ts`
- Added a production guard at the top: detects remote Supabase `DATABASE_URL` and prompts for confirmation (`delete everything`) before running any destructive truncation.

### `middleware.ts`
- Removed verbose per-request `console.log` that fired on every 200/304.
- Added targeted `401` log for unauthenticated requests to aid debugging.

---

## 2. Migration Cleanup

### `drizzle/0002_aberrant_purifiers.sql` — **DELETED**
- Was an exact duplicate of `0001_add_missing_student_columns.sql`.

### `drizzle/meta/_journal.json`
- Removed the `0002_aberrant_purifiers` entry and re-indexed `0003`'s `idx` from 3 → 2 to keep the journal contiguous.

### `drizzle/0004_vector_768_keepalive.sql` — **NEW**
- Updates embedding column dimensions and sets up a pg_cron keepalive job.

### `drizzle/0005_schema_sync.sql` — **NEW**
- Idempotent (`IF NOT EXISTS`) migration that adds all columns present in `schema.ts` but missing from prior migrations.

### `drizzle/0006_pg_cron_workers.sql` — **NEW**
- Schedules all four background worker HTTP calls via Supabase `pg_cron` + `pg_net`, replacing Vercel Cron (Pro-plan only):
  - Resumes parser — every 2 min
  - Embeddings generator — every 3 min
  - JD enhancement — every 5 min
  - Rankings — every 10 min

---

## 3. Onboarding Bug Fixes

### `app/(student)/student/onboarding/welcome/page.tsx`
- **Bug**: step guard was `onboardingStep < 0` (never fires). Students at step 1+ could navigate back to the welcome page, click "Get Started" again, and land on the resume page a second time — making it appear duplicated.
- **Fix**: changed condition to `onboardingStep > 0` — anyone past step 0 is immediately forwarded to their actual current step.

### `lib/validations/student-profile.ts`
- **Bug**: `projectSchema.description` had `max(500)`. AI-parsed project descriptions are routinely 500–1500 chars, causing a Zod validation failure when the student clicked Continue on the projects step → "Something went wrong".
- **Fix**: raised limit to `max(2000)`.

---

## 4. Sandbox AI Quality — Skill Recognition

### `lib/ats/constants.ts` — `SKILL_ALIASES`
Massively expanded to cover common real-world variants:

| Group | New aliases added |
|---|---|
| Node.js | `nodejs`, `node js`, `node` |
| JavaScript | `js` (lowercase), ES variant strings |
| TypeScript | `ts` (lowercase) |
| React | `reactjs`, `React Native` |
| Next.js | `nextjs`, `next js` |
| Mobile | `Android`, `iOS`, `Swift`, `Flutter/Dart` |
| SQL | `sql`, `pl/sql`, `t-sql`, `tsql` |
| Cloud | AWS service names (`ec2`, `s3`, `lambda`), GCP (`cloud run`, `bigquery`) |
| CS fundamentals | `DSA`, `OOP`, `OOPS`, `algorithms`, `object-oriented` |
| System Design | `HLD`, `LLD`, `high level design`, `scalability` |
| CI/CD | `cicd`, `pipeline`, `continuous integration/deployment` |
| General | `Kotlin`, `Keras`, `Matplotlib`, `Redux`, `Nginx`, `Svelte`, `Gatsby` |

### `lib/ats/semantic-skills.ts` — `TECHNOLOGY_CAPABILITY_MAP`
Added ~50 missing entries for the semantic (70%) matching path:

- **`nodejs` / `node js` / `node`** → JavaScript + Backend Development
- **`typescript` / `ts`** → **JavaScript** (critical: TS is a JS superset, so TS knowledge implies JS)
- **`js`** → JavaScript (direct skill + web inference)
- **`reactjs`**, **`nextjs`**, **`vuejs`** — no-dot variants now recognized
- **`react native` / `react-native`** → React + JavaScript + Mobile Development
- **`angular`** → now also infers JavaScript
- **`kotlin`** → Android Development + Mobile Development
- **`swift`** → iOS Development + Mobile Development
- **`flutter` / `dart`** → Mobile Development + Frontend
- **`android` / `android sdk` / `jetpack compose`** → Android + Mobile
- **`sql`** → SQL databases + Database Management
- **`java` / `python` / `c++` / `cpp`** — plain language keywords now produce capability inferences

### `lib/ats/semantic-skills.ts` — `SKILL_CATEGORY_MAP`
Added 6 new JD-facing categories so when a JD requires these skills, the matcher checks the student's tech stack:

| JD Skill | Matches against |
|---|---|
| `javascript` | node.js, nodejs, react, express, next.js, vue.js, angular, js … |
| `typescript` | typescript, ts, angular, next.js, nestjs … |
| `sql` | mysql, postgresql, postgres, sqlite, oracle, rdbms … |
| `mobile development` | react native, flutter, dart, kotlin, swift, android, ios … |
| `android development` | kotlin, java, android sdk, jetpack compose … |
| `ios development` | swift, swiftui, xcode, objective-c … |
