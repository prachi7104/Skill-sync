-- ============================================================
-- Migration 0004: Embedding dimension 384 → 768 + keepalive
-- 
-- WHY: Switched from @xenova/transformers (384-dim, broken on Vercel)
--      to Gemini text-embedding-004 (768-dim, free tier API).
--
-- RUN IN: Supabase SQL Editor
-- RUN BEFORE: Deploying code changes that use 768-dim embeddings
-- 
-- AFTER RUNNING: All stored embeddings become NULL and must be
-- regenerated. The embedding worker (pg_cron) handles this automatically.
-- Faculty ranking will show "pending" until embeddings regenerate.
-- ============================================================

-- Step 1: Drop existing vector indexes (required before altering column type)
DROP INDEX IF EXISTS students_embedding_idx;
DROP INDEX IF EXISTS drives_jd_embedding_idx;

-- Step 2: Change students embedding column to vector(768)
ALTER TABLE students
  ALTER COLUMN embedding TYPE vector(768)
  USING NULL;

-- Step 3: Change drives jd_embedding column to vector(768)
ALTER TABLE drives
  ALTER COLUMN jd_embedding TYPE vector(768)
  USING NULL;

-- Step 4: Recreate IVFFlat indexes for new dimension
-- lists=100 is appropriate for up to ~100K rows
CREATE INDEX students_embedding_idx
  ON students USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX drives_jd_embedding_idx
  ON drives USING ivfflat (jd_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 5: Enable required extensions for pg_cron keepalive
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 6: Keepalive — prevents free project from pausing after 7 days inactivity
-- Runs every 4 days at 9am UTC
SELECT cron.unschedule('keepalive') FROM cron.job WHERE jobname = 'keepalive';
SELECT cron.schedule(
  'keepalive',
  '0 9 */4 * *',
  $$ SELECT 1; $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'keepalive';
