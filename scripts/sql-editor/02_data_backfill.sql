-- 02_data_backfill.sql
-- Backfill data to align with new code logic. Run after deploying code changes.

BEGIN;

-- 1. Backfill amcat_results.email from users table where student_id is linked
UPDATE amcat_results ar
SET email = lower(trim(u.email))
FROM users u
WHERE ar.student_id = u.id
  AND ar.email IS NULL
  AND u.email IS NOT NULL;

-- 2. Set rank_position = 0 for ineligible rankings
-- (New code will do this automatically for future rankings)
UPDATE rankings
SET rank_position = 0,
    updated_at = NOW()
WHERE is_eligible = false
  AND rank_position <> 0;

-- 3. Recompute contiguous rank positions for eligible students per drive
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY drive_id
           ORDER BY match_score DESC, semantic_score DESC, student_id ASC
         ) AS new_rank
  FROM rankings
  WHERE is_eligible = true
)
UPDATE rankings r
SET rank_position = n.new_rank,
    updated_at = NOW()
FROM numbered n
WHERE r.id = n.id
  AND r.rank_position <> n.new_rank;

-- 4. Remove orphaned rankings (student no longer in students table)
DELETE FROM rankings rk
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.id = rk.student_id
);

COMMIT;
