-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_jds ENABLE ROW LEVEL SECURITY;

-- 2. Role resolution helper
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. USERS table policies
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_service" ON users;
CREATE POLICY "users_insert_service" ON users FOR INSERT TO service_role WITH CHECK (true);

-- 4. STUDENTS table policies
DROP POLICY IF EXISTS "students_select_own" ON students;
CREATE POLICY "students_select_own" ON students FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_select_faculty_admin" ON students;
CREATE POLICY "students_select_faculty_admin" ON students FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_insert_service" ON students;
CREATE POLICY "students_insert_service" ON students FOR INSERT TO service_role WITH CHECK (true);

-- 5. DRIVES table policies
DROP POLICY IF EXISTS "drives_select_active" ON drives;
CREATE POLICY "drives_select_active" ON drives FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "drives_insert_faculty_admin" ON drives;
CREATE POLICY "drives_insert_faculty_admin" ON drives FOR INSERT WITH CHECK (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "drives_update_created_by" ON drives;
CREATE POLICY "drives_update_created_by" ON drives FOR UPDATE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "drives_delete_created_by" ON drives;
CREATE POLICY "drives_delete_created_by" ON drives FOR DELETE USING (created_by = auth.uid() AND get_user_role() IN ('faculty', 'admin'));

-- 6. RANKINGS table policies
DROP POLICY IF EXISTS "rankings_select_own" ON rankings;
CREATE POLICY "rankings_select_own" ON rankings FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "rankings_select_faculty_admin" ON rankings;
CREATE POLICY "rankings_select_faculty_admin" ON rankings FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));

DROP POLICY IF EXISTS "rankings_insert_service" ON rankings;
CREATE POLICY "rankings_insert_service" ON rankings FOR INSERT TO service_role WITH CHECK (true);

-- 7. JOBS table policies
DROP POLICY IF EXISTS "jobs_select_admin" ON jobs;
CREATE POLICY "jobs_select_admin" ON jobs FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "jobs_insert_service" ON jobs;
CREATE POLICY "jobs_insert_service" ON jobs FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "jobs_update_service" ON jobs;
CREATE POLICY "jobs_update_service" ON jobs FOR UPDATE TO service_role USING (true);

-- 8. SAMPLE_JDS table policies
DROP POLICY IF EXISTS "sample_jds_select_all" ON sample_jds;
CREATE POLICY "sample_jds_select_all" ON sample_jds FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sample_jds_insert_admin" ON sample_jds;
CREATE POLICY "sample_jds_insert_admin" ON sample_jds FOR INSERT WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "sample_jds_update_admin" ON sample_jds;
CREATE POLICY "sample_jds_update_admin" ON sample_jds FOR UPDATE USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "sample_jds_delete_admin" ON sample_jds;
CREATE POLICY "sample_jds_delete_admin" ON sample_jds FOR DELETE USING (get_user_role() = 'admin');
