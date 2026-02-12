-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SkillSync — Production Database Setup Script  (v2 — idempotent)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Usage:  Execute this script against a PostgreSQL database (e.g. Supabase SQL Editor).
--         It is SAFE TO RE-RUN: tables are dropped and recreated.
--
-- Sections:
--   1.  Extensions
--   2.  Enums
--   3.  Utility functions (updated_at trigger)
--   4.  Tables (users → students → drives → rankings → jobs → sample_jds)
--   5.  Row-Level Security (RLS) policies
--   6.  Indexes (B-tree, HNSW, GIN)
--   7.  Seed data (admin / faculty users)
--
-- ⚠️  WARNING: This script drops tables with CASCADE. ALL existing data will be lost.
--    Only run this on a fresh db or when you intentionally want to reset.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  1. EXTENSIONS                                                         │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS vector;    -- pgvector for embedding storage
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  2. ENUMS  (idempotent via DO/EXCEPTION)                               │
-- └──────────────────────────────────────────────────────────────────────────┘

DO $$ BEGIN CREATE TYPE "public"."role"           AS ENUM('student', 'faculty', 'admin');                                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."batch_category" AS ENUM('alpha', 'beta', 'gamma');                                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_status"     AS ENUM('pending', 'processing', 'completed', 'failed');               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."job_type"       AS ENUM('parse_resume', 'generate_embedding', 'enhance_jd', 'rank_students'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  3. UTILITY — auto-update `updated_at` trigger function                │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  4. TABLES  (DROP CASCADE + CREATE for idempotent re-runs)             │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Drop in reverse dependency order
DROP TABLE IF EXISTS jobs       CASCADE;
DROP TABLE IF EXISTS rankings   CASCADE;
DROP TABLE IF EXISTS sample_jds CASCADE;
DROP TABLE IF EXISTS drives     CASCADE;
DROP TABLE IF EXISTS students   CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- ── users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    email        varchar(320) NOT NULL,
    name         varchar(255) NOT NULL,
    role         "role"       NOT NULL DEFAULT 'student',
    microsoft_id varchar(255),
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique        UNIQUE (email),
    CONSTRAINT users_microsoft_id_unique UNIQUE (microsoft_id)
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── students (1:1 extension of users where role = 'student') ────────────────
CREATE TABLE students (
    id                               uuid         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    sap_id                           varchar(9),
    roll_no                          varchar(11),
    phone                            varchar(20),
    linkedin                         varchar(500),

    -- Academics
    tenth_percentage                 real,
    twelfth_percentage               real,
    cgpa                             real,
    semester                         integer,
    branch                           varchar(100),
    batch_year                       integer,
    category                         "batch_category",

    -- Profile sections (JSONB)
    projects                         jsonb NOT NULL DEFAULT '[]'::jsonb,
    work_experience                  jsonb NOT NULL DEFAULT '[]'::jsonb,
    skills                           jsonb NOT NULL DEFAULT '[]'::jsonb,
    certifications                   jsonb NOT NULL DEFAULT '[]'::jsonb,
    coding_profiles                  jsonb NOT NULL DEFAULT '[]'::jsonb,
    research_papers                  jsonb NOT NULL DEFAULT '[]'::jsonb,
    achievements                     jsonb NOT NULL DEFAULT '[]'::jsonb,
    soft_skills                      jsonb NOT NULL DEFAULT '[]'::jsonb,

    -- Resume
    resume_url                       text,
    resume_filename                  varchar(255),
    resume_mime                      varchar(100),
    resume_uploaded_at               timestamptz,
    parsed_resume_json               jsonb,
    resume_text                      text,
    resume_parsed_at                 timestamptz,

    -- Embedding (384-dim, all-MiniLM-L6-v2)
    embedding                        vector(384),

    -- Progress tracking
    profile_completeness             integer NOT NULL DEFAULT 0,
    onboarding_step                  integer NOT NULL DEFAULT 0,

    -- Sandbox limits (daily / monthly)
    sandbox_usage_today              integer NOT NULL DEFAULT 0,
    sandbox_reset_date               varchar(10),
    sandbox_usage_month              integer NOT NULL DEFAULT 0,
    sandbox_month_reset_date         varchar(7),

    -- Detailed analysis limits (daily / monthly)
    detailed_analysis_usage_today    integer NOT NULL DEFAULT 0,
    detailed_analysis_reset_date     varchar(10),
    detailed_analysis_usage_month    integer NOT NULL DEFAULT 0,
    detailed_analysis_month_reset_date varchar(7),

    -- Timestamps
    created_at                       timestamptz NOT NULL DEFAULT now(),
    updated_at                       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT students_sap_id_unique  UNIQUE (sap_id),
    CONSTRAINT students_roll_no_unique UNIQUE (roll_no)
);

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── drives (placement drives created by faculty/admin) ──────────────────────
CREATE TABLE drives (
    id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by          uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company             varchar(255) NOT NULL,
    role_title          varchar(255) NOT NULL,
    location            varchar(255),
    package_offered     varchar(100),
    raw_jd              text         NOT NULL,
    enhanced_jd         text,
    parsed_jd           jsonb,
    jd_embedding        vector(384),
    min_cgpa            real,
    eligible_branches   jsonb,
    eligible_batch_years jsonb,
    eligible_categories jsonb,
    is_active           boolean      NOT NULL DEFAULT true,
    deadline            timestamptz,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_drives_updated_at
    BEFORE UPDATE ON drives
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── rankings (one per drive + student pair) ─────────────────────────────────
CREATE TABLE rankings (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id             uuid NOT NULL REFERENCES drives(id)   ON DELETE CASCADE,
    student_id           uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    match_score          real NOT NULL,
    semantic_score       real NOT NULL,
    structured_score     real NOT NULL,
    matched_skills       jsonb NOT NULL,
    missing_skills       jsonb NOT NULL,
    short_explanation    text  NOT NULL,
    detailed_explanation text  NOT NULL,
    rank_position        integer NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rankings_drive_student_unique UNIQUE (drive_id, student_id)
);

CREATE TRIGGER trg_rankings_updated_at
    BEFORE UPDATE ON rankings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── jobs (async job queue — DB-as-queue pattern) ────────────────────────────
CREATE TABLE jobs (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    type         "job_type"    NOT NULL,
    status       "job_status"  NOT NULL DEFAULT 'pending',
    payload      jsonb         NOT NULL,
    result       jsonb,
    error        text,
    retry_count  integer       NOT NULL DEFAULT 0,
    max_retries  integer       NOT NULL DEFAULT 3,
    priority     integer       NOT NULL DEFAULT 5,
    model_used   varchar(100),
    latency_ms   integer,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── sample_jds (pre-loaded JD templates) ────────────────────────────────────
CREATE TABLE sample_jds (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    title        varchar(255) NOT NULL,
    company      varchar(255) NOT NULL,
    jd_text      text         NOT NULL,
    is_deletable boolean      NOT NULL DEFAULT true,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sample_jds_updated_at
    BEFORE UPDATE ON sample_jds
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  5. ROW-LEVEL SECURITY (RLS)                                           │
-- │                                                                        │
-- │  Strategy:  The Next.js app connects via the Supabase `service_role`   │
-- │  connection string, which BYPASSES RLS entirely. All access control     │
-- │  is enforced server-side by NextAuth + requireRole() helpers.          │
-- │                                                                        │
-- │  RLS is enabled as defense-in-depth for any direct Supabase client     │
-- │  access (e.g. Supabase Studio, future mobile clients).                 │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Enable RLS on all tables
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_jds ENABLE ROW LEVEL SECURITY;

-- Role resolution helper (for direct Supabase client access)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
    SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── USERS ───────────────────────────────────────────────────────────────────
CREATE POLICY "users_select_own"      ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin"    ON users FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "users_update_own"      ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_service"  ON users FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "users_update_service"  ON users FOR UPDATE TO service_role USING (true);
CREATE POLICY "users_delete_service"  ON users FOR DELETE TO service_role USING (true);
CREATE POLICY "users_select_service"  ON users FOR SELECT TO service_role USING (true);

-- ── STUDENTS ────────────────────────────────────────────────────────────────
CREATE POLICY "students_select_own"            ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "students_select_faculty_admin"  ON students FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));
CREATE POLICY "students_update_own"            ON students FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "students_insert_service"        ON students FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "students_update_service"        ON students FOR UPDATE TO service_role USING (true);
CREATE POLICY "students_delete_service"        ON students FOR DELETE TO service_role USING (true);
CREATE POLICY "students_select_service"        ON students FOR SELECT TO service_role USING (true);

-- ── DRIVES ──────────────────────────────────────────────────────────────────
CREATE POLICY "drives_select_authenticated"    ON drives FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "drives_insert_faculty_admin"    ON drives FOR INSERT WITH CHECK (get_user_role() IN ('faculty', 'admin'));
CREATE POLICY "drives_update_owner"            ON drives FOR UPDATE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));
CREATE POLICY "drives_delete_owner"            ON drives FOR DELETE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));
CREATE POLICY "drives_all_service"             ON drives FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── RANKINGS ────────────────────────────────────────────────────────────────
CREATE POLICY "rankings_select_own"            ON rankings FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "rankings_select_faculty_admin"  ON rankings FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));
CREATE POLICY "rankings_all_service"           ON rankings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── JOBS ────────────────────────────────────────────────────────────────────
CREATE POLICY "jobs_select_admin"              ON jobs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "jobs_all_service"               ON jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── SAMPLE_JDS ──────────────────────────────────────────────────────────────
CREATE POLICY "sample_jds_select_authenticated" ON sample_jds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sample_jds_manage_admin"         ON sample_jds FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "sample_jds_all_service"          ON sample_jds FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  6. INDEXES                                                            │
-- └──────────────────────────────────────────────────────────────────────────┘

-- ── Users ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_microsoft_id ON users (microsoft_id) WHERE microsoft_id IS NOT NULL;

-- ── Students ────────────────────────────────────────────────────────────────
CREATE INDEX idx_students_sap_id               ON students (sap_id)  WHERE sap_id IS NOT NULL;
CREATE INDEX idx_students_batch_branch         ON students (batch_year, branch);
CREATE INDEX idx_students_cgpa                 ON students (cgpa)    WHERE cgpa IS NOT NULL;
CREATE INDEX idx_students_category             ON students (category) WHERE category IS NOT NULL;
CREATE INDEX idx_students_onboarding_step      ON students (onboarding_step);
CREATE INDEX idx_students_profile_completeness ON students (profile_completeness);

-- Vector index — HNSW for fast approximate nearest-neighbor on embeddings
CREATE INDEX idx_students_embedding ON students
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index on skills JSONB for fast containment queries (e.g. @> '["Python"]')
CREATE INDEX idx_students_skills_gin ON students USING gin (skills jsonb_path_ops);

-- ── Drives ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_drives_created_by     ON drives (created_by);
CREATE INDEX idx_drives_active_recent  ON drives (is_active, created_at DESC);

CREATE INDEX idx_drives_jd_embedding ON drives
    USING hnsw (jd_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ── Rankings ────────────────────────────────────────────────────────────────
CREATE INDEX idx_rankings_drive_id      ON rankings (drive_id);
CREATE INDEX idx_rankings_student_id    ON rankings (student_id);
CREATE INDEX idx_rankings_drive_score   ON rankings (drive_id, match_score DESC);

-- ── Jobs ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_jobs_processing    ON jobs (status, priority DESC, created_at ASC);
CREATE INDEX idx_jobs_type_status   ON jobs (type, status);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  7. SEED DATA — Admin & Faculty users                                  │
-- │                                                                        │
-- │  ⚠️  UPDATE the email addresses below with your actual admin/faculty   │
-- │     emails before running.                                             │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Admin user
INSERT INTO users (email, name, role) VALUES
    ('aniruddhvijay@outlook.com', 'Aniruddh Vijay', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = now();

-- Faculty user
INSERT INTO users (email, name, role) VALUES
    ('aniruddh2026@hotmail.com', 'Aniruddh Faculty', 'faculty')
ON CONFLICT (email) DO UPDATE SET role = 'faculty', updated_at = now();


COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Done! Verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
--   SELECT * FROM users WHERE role IN ('admin', 'faculty');
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
