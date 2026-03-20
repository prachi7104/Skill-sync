-- ============================================================================
-- SkillSync Performance Indexes + Scheduled Cleanup
-- ============================================================================
-- Run in Supabase SQL Editor.
--
-- Fix admin health timeout: index for completeness filter
CREATE INDEX IF NOT EXISTS idx_students_completeness
  ON public.students(college_id, profile_completeness);

-- Embedding status check (admin health page)
CREATE INDEX IF NOT EXISTS idx_students_embedding_null
  ON public.students(college_id) WHERE embedding IS NULL;

-- Student eligibility queries (branch/batch/cgpa/category)
CREATE INDEX IF NOT EXISTS idx_students_eligibility
  ON public.students(college_id, branch, batch_year, cgpa, category);

-- Faculty drives list
CREATE INDEX IF NOT EXISTS idx_drives_created_by_college
  ON public.drives(college_id, created_by, created_at DESC);

-- Rankings sorted by score
CREATE INDEX IF NOT EXISTS idx_rankings_drive_score
  ON public.rankings(drive_id, match_score DESC) WHERE is_eligible = true;

-- Job queue polling (most critical for cron performance)
CREATE INDEX IF NOT EXISTS idx_jobs_queue_poll
  ON public.jobs(type, status, priority DESC, created_at ASC)
  WHERE status = 'pending';

-- Clean up ai_rate_limits daily (pg_cron)
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *',
  $$DELETE FROM ai_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours'$$
);
