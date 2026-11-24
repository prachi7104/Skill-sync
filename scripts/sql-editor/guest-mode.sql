-- SkillSync Guest Mode — additive, idempotent migration.
-- Apply ONLY to the dedicated demo Supabase project, via scripts/demo/migrate.ts
-- (which refuses the institutional project). Never run it against production.
--
-- Each guest visit gets its own throwaway "college" workspace. All guest rows
-- hang off that college with ON DELETE CASCADE, so deleting the college removes
-- the whole visit. demo_workspaces marks which colleges are guest workspaces.

CREATE TABLE IF NOT EXISTS public.demo_workspaces (
  college_id uuid PRIMARY KEY REFERENCES public.colleges(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  recruiter_user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_workspaces_expires ON public.demo_workspaces (expires_at);

-- Private resume storage: bytes live in a table with RLS enabled and no
-- policies, so neither the anon nor the authenticated Supabase role can read it.
CREATE TABLE IF NOT EXISTS public.demo_resume_files (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  filename varchar(255) NOT NULL,
  mime varchar(120) NOT NULL,
  data bytea NOT NULL CONSTRAINT demo_resume_size CHECK (octet_length(data) BETWEEN 1 AND 2097152),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_resume_jobs (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL CONSTRAINT demo_resume_job_status CHECK (status IN ('processing', 'failed', 'completed')),
  stage varchar(40),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS demo_resume_one_processing_per_student
  ON public.demo_resume_jobs (student_id) WHERE status = 'processing';

ALTER TABLE public.demo_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_resume_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_resume_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_workspaces, public.demo_resume_files, public.demo_resume_jobs FROM anon, authenticated;
