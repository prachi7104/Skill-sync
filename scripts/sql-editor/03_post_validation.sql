-- 03_post_validation.sql
-- Verify everything is correct. All queries should return expected results.

-- 1. No ineligible row should have rank_position > 0
SELECT COUNT(*) AS bad_ineligible_ranks
FROM rankings
WHERE is_eligible = false AND rank_position > 0;
-- EXPECTED: 0

-- 2. All eligible rows should have rank_position >= 1
SELECT COUNT(*) AS bad_eligible_ranks
FROM rankings
WHERE is_eligible = true AND rank_position < 1;
-- EXPECTED: 0

-- 3. No duplicate rank positions within a drive (among eligible)
SELECT drive_id, rank_position, COUNT(*) AS cnt
FROM rankings
WHERE is_eligible = true AND rank_position > 0
GROUP BY drive_id, rank_position
HAVING COUNT(*) > 1;
-- EXPECTED: 0 rows

-- 4. Verify matched_count logic (compare old vs new)
SELECT
  s.session_name,
  COUNT(r.id) AS total_results_old_matched_count,
  COUNT(r.student_id) AS correct_matched_count
FROM amcat_results r
JOIN amcat_sessions s ON s.id = r.session_id
GROUP BY s.session_name;

-- 5. Verify no orphaned rankings remain
SELECT COUNT(*) AS orphaned
FROM rankings rk
LEFT JOIN students s ON s.id = rk.student_id
WHERE s.id IS NULL;
-- EXPECTED: 0

-- 6. Verify amcat email backfill coverage
SELECT
  COUNT(*) AS total,
  COUNT(email) AS with_email,
  COUNT(*) - COUNT(email) AS missing_email
FROM amcat_results
WHERE student_id IS NOT NULL;

-- 7. Check resource attachment counts (baseline for Cloudinary monitoring)
SELECT
  COUNT(*) AS total_resources,
  COUNT(attachment_url) AS with_attachment,
  COUNT(*) - COUNT(attachment_url) AS body_only
FROM resources;
