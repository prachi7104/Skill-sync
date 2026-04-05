-- Phase 4: Resources publication state normalization
-- Canonical source of truth is resources.status.

-- Backfill status from legacy boolean where needed.
UPDATE resources
SET status = COALESCE(
  status,
  CASE WHEN COALESCE(is_published, false) THEN 'published' ELSE 'draft' END
)
WHERE status IS NULL;

ALTER TABLE resources
  ALTER COLUMN status SET DEFAULT 'published';

ALTER TABLE resources
  ALTER COLUMN status SET NOT NULL;

-- Remove legacy dual-truth column once status is canonical.
ALTER TABLE resources
  DROP COLUMN IF EXISTS is_published;
