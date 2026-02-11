-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SkillSync — Production Database Setup Script
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Usage: Execute this script against a fresh PostgreSQL database (e.g., Supabase).
-- It sets up:
-- 1. Extensions (pgvector)
-- 2. Schema (Tables, Enums, Relations)
-- 3. Row Level Security (RLS) Policies
-- 4. Performance Indexes (HNSW for vectors, B-Tree for lookups)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. EXTENSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. SCHEMA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$ BEGIN
 CREATE TYPE "public"."batch_category" AS ENUM('alpha', 'beta', 'gamma');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."job_type" AS ENUM('parse_resume', 'generate_embedding', 'enhance_jd', 'rank_students');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('student', 'faculty', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"microsoft_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_microsoft_id_unique" UNIQUE("microsoft_id")
);

CREATE TABLE IF NOT EXISTS "students" (
	"id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"sap_id" varchar(9),
	"roll_no" varchar(11),
	"phone" varchar(20),
	"linkedin" varchar(500),
	"tenth_percentage" real,
	"twelfth_percentage" real,
	"cgpa" real,
	"semester" integer,
	"branch" varchar(100),
	"batch_year" integer,
	"category" "batch_category",
	"projects" jsonb DEFAULT '[]'::jsonb,
	"work_experience" jsonb DEFAULT '[]'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"coding_profiles" jsonb DEFAULT '[]'::jsonb,
	"research_papers" jsonb DEFAULT '[]'::jsonb,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"soft_skills" jsonb DEFAULT '[]'::jsonb,
	"resume_url" text,
	"resume_filename" varchar(255),
	"resume_mime" varchar(100),
	"resume_uploaded_at" timestamp with time zone,
	"parsed_resume_json" jsonb,
	"resume_text" text,
	"resume_parsed_at" timestamp with time zone,
	"embedding" vector(384),
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"sandbox_usage_today" integer DEFAULT 0 NOT NULL,
	"sandbox_reset_date" varchar(10),
	"sandbox_usage_month" integer DEFAULT 0 NOT NULL,
	"sandbox_month_reset_date" varchar(7),
	"detailed_analysis_usage_today" integer DEFAULT 0 NOT NULL,
	"detailed_analysis_reset_date" varchar(10),
	"detailed_analysis_usage_month" integer DEFAULT 0 NOT NULL,
	"detailed_analysis_month_reset_date" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_sap_id_unique" UNIQUE("sap_id"),
	CONSTRAINT "students_roll_no_unique" UNIQUE("roll_no")
);

CREATE TABLE IF NOT EXISTS "drives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"company" varchar(255) NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"location" varchar(255),
	"package_offered" varchar(100),
	"raw_jd" text NOT NULL,
	"enhanced_jd" text,
	"parsed_jd" jsonb,
	"jd_embedding" vector(384),
	"min_cgpa" real,
	"eligible_branches" jsonb,
	"eligible_batch_years" jsonb,
	"eligible_categories" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL REFERENCES "drives"("id") ON DELETE CASCADE,
	"student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
	"match_score" real NOT NULL,
	"semantic_score" real NOT NULL,
	"structured_score" real NOT NULL,
	"matched_skills" jsonb NOT NULL,
	"missing_skills" jsonb NOT NULL,
	"short_explanation" text NOT NULL,
	"detailed_explanation" text NOT NULL,
	"rank_position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"model_used" varchar(100),
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sample_jds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"jd_text" text NOT NULL,
	"is_deletable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_jds ENABLE ROW LEVEL SECURITY;

-- Role resolution helper
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS table policies
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_service" ON users;
CREATE POLICY "users_insert_service" ON users FOR INSERT TO service_role WITH CHECK (true);

-- STUDENTS table policies
DROP POLICY IF EXISTS "students_select_own" ON students;
CREATE POLICY "students_select_own" ON students FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_select_faculty_admin" ON students;
CREATE POLICY "students_select_faculty_admin" ON students FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_insert_service" ON students;
CREATE POLICY "students_insert_service" ON students FOR INSERT TO service_role WITH CHECK (true);

-- DRIVES table policies
DROP POLICY IF EXISTS "drives_select_active" ON drives;
CREATE POLICY "drives_select_active" ON drives FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "drives_insert_faculty_admin" ON drives;
CREATE POLICY "drives_insert_faculty_admin" ON drives FOR INSERT WITH CHECK (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "drives_update_created_by" ON drives;
CREATE POLICY "drives_update_created_by" ON drives FOR UPDATE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "drives_delete_created_by" ON drives;
CREATE POLICY "drives_delete_created_by" ON drives FOR DELETE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));

-- RANKINGS table policies
DROP POLICY IF EXISTS "rankings_select_own" ON rankings;
CREATE POLICY "rankings_select_own" ON rankings FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "rankings_select_faculty_admin" ON rankings;
CREATE POLICY "rankings_select_faculty_admin" ON rankings FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "rankings_insert_service" ON rankings;
CREATE POLICY "rankings_insert_service" ON rankings FOR INSERT TO service_role WITH CHECK (true);

-- JOBS table policies
DROP POLICY IF EXISTS "jobs_select_admin" ON jobs;
CREATE POLICY "jobs_select_admin" ON jobs FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "jobs_insert_service" ON jobs;
CREATE POLICY "jobs_insert_service" ON jobs FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "jobs_update_service" ON jobs;
CREATE POLICY "jobs_update_service" ON jobs FOR UPDATE TO service_role USING (true);

-- SAMPLE_JDS table policies
DROP POLICY IF EXISTS "sample_jds_select_all" ON sample_jds;
CREATE POLICY "sample_jds_select_all" ON sample_jds FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sample_jds_insert_admin" ON sample_jds;
CREATE POLICY "sample_jds_insert_admin" ON sample_jds FOR INSERT WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "sample_jds_update_admin" ON sample_jds;
CREATE POLICY "sample_jds_update_admin" ON sample_jds FOR UPDATE USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "sample_jds_delete_admin" ON sample_jds;
CREATE POLICY "sample_jds_delete_admin" ON sample_jds FOR DELETE USING (get_user_role() = 'admin');

-- 4. INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- USERS Table Indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON users(email);

-- STUDENTS Table Indexes
CREATE INDEX IF NOT EXISTS "idx_students_sap_id" ON students(sap_id);
CREATE INDEX IF NOT EXISTS "idx_students_batch_branch" ON students(batch_year, branch);
CREATE INDEX IF NOT EXISTS "idx_students_cgpa" ON students(cgpa);
CREATE INDEX IF NOT EXISTS "idx_students_category" ON students(category);
CREATE INDEX IF NOT EXISTS "idx_students_onboarding_step" ON students(onboarding_step);
CREATE INDEX IF NOT EXISTS "idx_students_profile_completeness" ON students(profile_completeness);

-- Vector Index (Students) - HNSW
CREATE INDEX IF NOT EXISTS "idx_students_embedding" 
ON students 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- DRIVES Table Indexes
CREATE INDEX IF NOT EXISTS "idx_drives_created_by" ON drives(created_by);
CREATE INDEX IF NOT EXISTS "idx_drives_active_recent" ON drives(is_active, created_at DESC);

-- Vector Index (Drives) - HNSW
CREATE INDEX IF NOT EXISTS "idx_drives_jd_embedding" 
ON drives 
USING hnsw (jd_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- RANKINGS Table Indexes
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_id" ON rankings(drive_id);
CREATE INDEX IF NOT EXISTS "idx_rankings_student_id" ON rankings(student_id);
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_student" ON rankings(drive_id, student_id);
CREATE INDEX IF NOT EXISTS "idx_rankings_drive_score" ON rankings(drive_id, match_score DESC);

-- JOBS Table Indexes
CREATE INDEX IF NOT EXISTS "idx_jobs_processing" ON jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS "idx_jobs_type_status" ON jobs(type, status);
