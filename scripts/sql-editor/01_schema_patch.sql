-- 01_schema_patch.sql
-- Idempotent schema changes. Safe to re-run.

-- 1. Add email column to amcat_results if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amcat_results' AND column_name = 'email'
  ) THEN
    ALTER TABLE amcat_results ADD COLUMN email varchar(320);
  END IF;
END
$$;

-- 2. Index for faster student matching lookups during AMCAT import
CREATE INDEX IF NOT EXISTS idx_amcat_results_session_student_id
  ON amcat_results(session_id, student_id);

-- 3. Index for faster orphan cleanup in rankings
CREATE INDEX IF NOT EXISTS idx_rankings_student_id
  ON rankings(student_id);

-- 4. Add updated_at to amcat_results if missing (needed for ON CONFLICT DO UPDATE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amcat_results' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE amcat_results
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT NOW();
  END IF;
END
$$;
