-- Ensure each college has a unique student email domain mapping.
CREATE UNIQUE INDEX IF NOT EXISTS colleges_student_domain_unique_idx
ON colleges (student_domain);
