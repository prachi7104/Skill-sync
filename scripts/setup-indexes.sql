-- Optimizing Database Indexes for SkillSync
-- Target: Supabase Free Tier (PostgreSQL + pgvector)

-- 1. USERS Table Indexes
-- Purpose: Fast email lookups for auth
CREATE INDEX IF NOT EXISTS "idx_users_email" ON users(email);

-- 2. STUDENTS Table Indexes
-- Purpose: Fast profile lookups and eligibility filtering
CREATE INDEX IF NOT EXISTS "idx_students_sap_id" ON students(sap_id); -- Unique lookup
CREATE INDEX IF NOT EXISTS "idx_students_batch_branch" ON students(batch_year, branch); -- Eligibility filtering
CREATE INDEX IF NOT EXISTS "idx_students_cgpa" ON students(cgpa); -- Eligibility threshold
CREATE INDEX IF NOT EXISTS "idx_students_category" ON students(category); -- Eligibility filtering by tier
CREATE INDEX IF NOT EXISTS "idx_students_onboarding_step" ON students(onboarding_step); -- Onboarding queries
CREATE INDEX IF NOT EXISTS "idx_students_profile_completeness" ON students(profile_completeness); -- Sorting/Filtering

-- 3. Vector Index (Students)
-- Purpose: Fast semantic search for candidate matching
-- Algorithm: HNSW (Hierarchical Navigable Small World)
-- Metric: Cosine Similarity (vector_cosine_ops)
CREATE INDEX IF NOT EXISTS "idx_students_embedding" 
ON students 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 4. DRIVES Table Indexes
-- Purpose: Dashboard filtering and creator lookups
CREATE INDEX IF NOT EXISTS "idx_drives_created_by" ON drives(created_by);
CREATE INDEX IF NOT EXISTS "idx_drives_active_recent" ON drives(is_active, created_at DESC);

-- 5. Vector Index (Drives)
-- Purpose: Reverse matching (Student -> Jobs)
CREATE INDEX IF NOT EXISTS "idx_drives_jd_embedding" 
ON drives 
USING hnsw (jd_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 6. RANKINGS Table Indexes
-- Purpose: Leaderboard queries and student result lookups
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_id" ON rankings(drive_id);
CREATE INDEX IF NOT EXISTS "idx_rankings_student_id" ON rankings(student_id);
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_student" ON rankings(drive_id, student_id); -- Composite for upsert/lookup
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_score" ON rankings(drive_id, match_score DESC);

-- 7. JOBS Table Indexes
-- Purpose: Efficient queue polling (DB-as-queue pattern)
CREATE INDEX IF NOT EXISTS "idx_jobs_processing" ON jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS "idx_jobs_type_status" ON jobs(type, status);
