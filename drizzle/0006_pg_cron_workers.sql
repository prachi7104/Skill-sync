-- Migration 0006: pg_cron worker schedules
-- 
-- OPTIONAL: Use Supabase pg_cron for sub-daily job processing.
-- Vercel Hobby tier now uses a single daily cron (/api/cron/process-all).
-- pg_cron calls your Vercel API endpoints via HTTP using pg_net.
--
-- BEFORE RUNNING:
--   1. Deploy your app to Vercel first (you need the live URL)
--   2. Replace YOUR_APP_URL with your actual Vercel URL
--      Example: skillsync-abc123.vercel.app
--   3. Replace YOUR_CRON_SECRET with the value of your CRON_SECRET env var
--   4. Ensure migration 0004 has been run (pg_net extension must be enabled)
--
-- RUN IN: Supabase SQL Editor
-- ============================================================

-- Remove any stale schedules first (safe to re-run)
DO $$
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job 
  WHERE jobname IN ('process-resumes','process-embeddings','process-jd-enhancement','process-rankings');
END $$;

-- Resume parse jobs: every 2 minutes
SELECT cron.schedule(
  'process-resumes',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/process-resumes',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Embedding jobs: every 3 minutes
SELECT cron.schedule(
  'process-embeddings',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/process-embeddings',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- JD enhancement jobs: every 5 minutes
SELECT cron.schedule(
  'process-jd-enhancement',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/process-jd-enhancement',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Ranking jobs: every 10 minutes
SELECT cron.schedule(
  'process-rankings',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL/api/cron/process-rankings',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify all schedules were created:
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
