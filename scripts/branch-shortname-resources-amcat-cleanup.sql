-- SkillSync one-shot data migration
-- Date: 2026-04-05
-- Purpose:
-- 1) resources: consolidate to status-only and drop is_published
-- 2) AMCAT: delete all draft sessions and their results
-- 3) branches: migrate legacy CSE-* values to short names everywhere

BEGIN;

-- ============================================================================
-- 1) RESOURCES: Consolidate dual status columns
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'resources'
      AND column_name = 'is_published'
  ) THEN
    UPDATE resources
    SET status = COALESCE(
      status,
      CASE WHEN COALESCE(is_published, false) THEN 'published' ELSE 'draft' END
    )
    WHERE status IS NULL;
  END IF;
END $$;

ALTER TABLE resources ALTER COLUMN status SET DEFAULT 'published';
ALTER TABLE resources ALTER COLUMN status SET NOT NULL;
ALTER TABLE resources DROP COLUMN IF EXISTS is_published;

-- ============================================================================
-- 2) AMCAT: Delete all draft sessions
-- ============================================================================
DELETE FROM amcat_results
WHERE session_id IN (
  SELECT id FROM amcat_sessions WHERE status = 'draft'
);

DELETE FROM amcat_sessions
WHERE status = 'draft';

-- ============================================================================
-- 3) BRANCHES: Rename CSE-* -> short names in all tables
-- ============================================================================

-- 3a) students.branch
UPDATE students
SET branch = CASE branch
  WHEN 'CSE-AIML' THEN 'AIML'
  WHEN 'CSE-DS' THEN 'Data Science'
  WHEN 'CSE-CCVT' THEN 'CCVT'
  WHEN 'CSE-Cyber' THEN 'CSF'
  WHEN 'CSE-Blockchain' THEN 'Blockchain'
  WHEN 'CSE-Fullstack' THEN 'Full Stack'
  WHEN 'CSE-IoT' THEN 'IoT'
  WHEN 'CSE-GG' THEN 'GG'
  ELSE branch
END
WHERE branch LIKE 'CSE-%';

-- 3b) drives.eligible_branches (jsonb text array)
UPDATE drives
SET eligible_branches = (
  SELECT jsonb_agg(
    CASE val
      WHEN 'CSE-AIML' THEN 'AIML'
      WHEN 'CSE-DS' THEN 'Data Science'
      WHEN 'CSE-CCVT' THEN 'CCVT'
      WHEN 'CSE-Cyber' THEN 'CSF'
      WHEN 'CSE-Blockchain' THEN 'Blockchain'
      WHEN 'CSE-Fullstack' THEN 'Full Stack'
      WHEN 'CSE-IoT' THEN 'IoT'
      WHEN 'CSE-GG' THEN 'GG'
      ELSE val
    END
  )
  FROM jsonb_array_elements_text(eligible_branches) AS val
)
WHERE eligible_branches IS NOT NULL
  AND eligible_branches::text LIKE '%CSE-%';

-- 3c) student_roster.branch
UPDATE student_roster
SET branch = CASE branch
  WHEN 'CSE-AIML' THEN 'AIML'
  WHEN 'CSE-DS' THEN 'Data Science'
  WHEN 'CSE-CCVT' THEN 'CCVT'
  WHEN 'CSE-Cyber' THEN 'CSF'
  WHEN 'CSE-Blockchain' THEN 'Blockchain'
  WHEN 'CSE-Fullstack' THEN 'Full Stack'
  WHEN 'CSE-IoT' THEN 'IoT'
  WHEN 'CSE-GG' THEN 'GG'
  ELSE branch
END
WHERE branch LIKE 'CSE-%';

-- 3d) experiences.branch
UPDATE experiences
SET branch = CASE branch
  WHEN 'CSE-AIML' THEN 'AIML'
  WHEN 'CSE-DS' THEN 'Data Science'
  WHEN 'CSE-CCVT' THEN 'CCVT'
  WHEN 'CSE-Cyber' THEN 'CSF'
  WHEN 'CSE-Blockchain' THEN 'Blockchain'
  WHEN 'CSE-Fullstack' THEN 'Full Stack'
  WHEN 'CSE-IoT' THEN 'IoT'
  WHEN 'CSE-GG' THEN 'GG'
  ELSE branch
END
WHERE branch LIKE 'CSE-%';

COMMIT;

-- Post-run verification queries:
-- SELECT branch, count(*) FROM students GROUP BY branch ORDER BY count(*) DESC;
-- SELECT company_name, eligible_branches FROM drives ORDER BY created_at DESC LIMIT 20;
-- SELECT status, count(*) FROM amcat_sessions GROUP BY status;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'is_published';
