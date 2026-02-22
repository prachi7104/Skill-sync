-- ============================================================
-- Migration 0005: Schema sync — add any missing columns
--
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- Run in Supabase SQL Editor after migration 0004.
--
-- Covers columns present in schema.ts that are NOT in any
-- prior migration (0000–0003):
--   - sandbox_usage_today, sandbox_reset_date
--   - detailed_analysis_* (4 columns)
--   - resume_text, resume_parsed_at
--   - profile_completeness, onboarding_step
-- ============================================================

-- ── Students table: sandbox daily quota ──────────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS sandbox_usage_today integer NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sandbox_reset_date varchar(10);

-- sandbox_usage_month + sandbox_month_reset_date are already in migration 0001,
-- but included here with IF NOT EXISTS for safety:
ALTER TABLE students ADD COLUMN IF NOT EXISTS sandbox_usage_month integer NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sandbox_month_reset_date varchar(7);

-- ── Students table: detailed analysis quota ───────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS detailed_analysis_usage_today integer NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS detailed_analysis_reset_date varchar(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS detailed_analysis_usage_month integer NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS detailed_analysis_month_reset_date varchar(7);

-- ── Students table: resume pipeline ──────────────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_text text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_parsed_at timestamp with time zone;

-- resume_filename, resume_mime, resume_uploaded_at, parsed_resume_json
-- are already in migration 0001 — included here with IF NOT EXISTS for safety:
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_filename varchar(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_mime varchar(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_uploaded_at timestamp with time zone;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parsed_resume_json jsonb;

-- ── Students table: profile tracking ─────────────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_completeness integer NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0;

-- Verify all columns exist:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'students'
--   ORDER BY ordinal_position;
