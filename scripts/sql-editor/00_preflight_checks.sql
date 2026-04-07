-- 00_preflight_checks.sql
-- Run BEFORE any code deploy. Read-only diagnostics.

-- 1. Check if email column exists on amcat_results
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'amcat_results' AND column_name = 'email';

-- 2. Check rankings rank_position nullability
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'rankings' AND column_name = 'rank_position';

-- 3. Count unmatched AMCAT results (student_id IS NULL)
SELECT
  s.session_name,
  COUNT(*) AS total_results,
  COUNT(r.student_id) AS matched,
  COUNT(*) - COUNT(r.student_id) AS unmatched
FROM amcat_results r
JOIN amcat_sessions s ON s.id = r.session_id
GROUP BY s.session_name
ORDER BY s.session_name;

-- 4. Count ineligible rankings
SELECT
  d.company,
  d.role_title,
  COUNT(*) AS total_rankings,
  COUNT(CASE WHEN rk.is_eligible = false THEN 1 END) AS ineligible_count,
  COUNT(CASE WHEN rk.is_eligible = true THEN 1 END) AS eligible_count
FROM rankings rk
JOIN drives d ON d.id = rk.drive_id
GROUP BY d.company, d.role_title
ORDER BY d.company;

-- 5. Check for duplicate session/sap_id pairs
SELECT session_id, sap_id, COUNT(*) AS cnt
FROM amcat_results
GROUP BY session_id, sap_id
HAVING COUNT(*) > 1;

-- 6. Check for orphaned rankings (student no longer exists)
SELECT COUNT(*) AS orphaned_rankings
FROM rankings rk
LEFT JOIN students s ON s.id = rk.student_id
WHERE s.id IS NULL;

-- 7. Verify unique constraints exist
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('amcat_results'::regclass, 'rankings'::regclass)
  AND contype = 'u';
