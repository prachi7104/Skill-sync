-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0008: Attach role trigger + update pg_cron rankings schedule
--
-- WHAT THIS DOES:
--   1. Attaches handle_new_user_roles() to the users table so every new INSERT
--      sets the correct role. Without this trigger all new users become students.
--   2. Reschedules the rankings cron from every-10-minutes to every-1-minute
--      so ranking jobs are processed within 60s of being queued.
--
-- HOW TO RUN:
--   Option A (recommended): Supabase SQL Editor — paste and run directly.
--   Option B: npx drizzle-kit push  (if your DB user has superuser privileges)
--
-- BEFORE RUNNING SECTION 2:
--   Replace YOUR_APP_URL    → your Vercel URL, e.g. skillsync-xyz.vercel.app
--   Replace YOUR_CRON_SECRET → value of your CRON_SECRET environment variable
-- ════════════════════════════════════════════════════════════════════════════

-- ── Section 1: Role Trigger ───────────────────────────────────────────────
-- Safe to re-run: DROP IF EXISTS before CREATE.

DROP TRIGGER IF EXISTS trg_handle_new_user_roles ON public.users;

CREATE TRIGGER trg_handle_new_user_roles
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_roles();

-- Verify:
-- SELECT trigger_name FROM information_schema.triggers
-- WHERE trigger_schema = 'public' AND trigger_name = 'trg_handle_new_user_roles';


-- ── Section 2: Fix Existing User Roles ───────────────────────────────────
-- Trigger only fires on future inserts. Existing users that signed in before
-- this migration may be stuck with role='student'. Fix them manually.
-- Add or edit rows below for your actual admin/faculty email addresses.

UPDATE public.users
SET    role       = 'faculty',
       updated_at = now()
WHERE  email  = 'aniruddhvijay@outlook.com'
  AND  role  != 'faculty';

UPDATE public.users
SET    role       = 'admin',
       updated_at = now()
WHERE  email  = 'aniruddh2026@hotmail.com'
  AND  role  != 'admin';


-- ── Section 3: pg_cron Rankings Schedule → every 1 minute ────────────────
-- The old schedule fired every 10 minutes ('*/10 * * * *').
-- With MAX_JOBS_PER_TICK = 1 the route completes in <60s per job.
-- Firing every minute means a queued ranking is picked up within 60 seconds.

DO $$
BEGIN
  -- Remove old 10-minute schedule if it exists
  PERFORM cron.unschedule(jobname)
  FROM    cron.job
  WHERE   jobname = 'process-rankings';
END $$;

SELECT cron.schedule(
  'process-rankings',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://https://skill-sync-iota-three.vercel.app/api/cron/process-rankings',
    headers := '{"Authorization": "Bearer TfPqRKJzIx952Um1NiXHDOS4Mh7Q8Zso3jpEVadCYuWgnyk0tl6cBLwGrAveFb", "Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'process-rankings';
-- Expected: schedule = '* * * * *'


-- ── Section 4: Clear Stale Embeddings ─────────────────────────────────────
-- All embeddings generated before the model-name fix (text-embedding-004 →
-- gemini-embedding-001) are invalid. Clear them so the worker regenerates them.
-- Skip this section if you already ran it from SkillSync_DB_Fixes.sql.

UPDATE public.students
SET    embedding   = NULL,
       updated_at  = now()
WHERE  embedding IS NOT NULL;

UPDATE public.drives
SET    jd_embedding = NULL,
       updated_at   = now()
WHERE  jd_embedding IS NOT NULL;


-- ── Section 5: Re-queue Embedding Jobs ───────────────────────────────────
-- Cancel stale embedding jobs and re-queue for all students with content.
-- Skip this section if you already ran it from SkillSync_DB_Fixes.sql.

UPDATE public.jobs
SET    status     = 'failed',
       error      = 'Superseded — model name fixed, re-queued',
       updated_at = now()
WHERE  type   = 'generate_embedding'
  AND  status IN ('pending', 'processing');

INSERT INTO public.jobs (type, status, payload, priority)
SELECT
  'generate_embedding',
  'pending',
  jsonb_build_object('targetType', 'student', 'targetId', id),
  5
FROM public.students
WHERE resume_url IS NOT NULL
   OR jsonb_array_length(COALESCE(skills, '[]'::jsonb)) > 0;

INSERT INTO public.jobs (type, status, payload, priority)
SELECT
  'enhance_jd',
  'pending',
  jsonb_build_object('driveId', id),
  7
FROM public.drives
WHERE is_active = true;


-- ── Section 6: Recover Stuck Jobs ─────────────────────────────────────────
UPDATE public.jobs
SET    status     = 'pending',
       updated_at = now()
WHERE  status      = 'processing'
  AND  updated_at  < now() - interval '5 minutes'
  AND  retry_count < max_retries;

