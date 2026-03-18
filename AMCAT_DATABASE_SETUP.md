# AMCAT Database Setup & Migration Guide

## Overview

This guide covers setting up AMCAT database tables and migrating existing installations to support AMCAT functionality.

---

## Prerequisites

- PostgreSQL 14+
- Drizzle ORM migrations configured
- Access to database superuser or migration role
- Vector extension enabled (already configured in schema)

---

## Database Schema

### Table: amcat_sessions

Stores AMCAT test session metadata.

```sql
CREATE TABLE amcat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  academic_year VARCHAR(50),
  batch_year VARCHAR(50),
  test_date TIMESTAMP,
  
  -- Scoring configuration
  weights JSONB NOT NULL DEFAULT '{
    "automata": 50,
    "automata_fix": 20,
    "cp": 10,
    "cs": 10,
    "quant": 10
  }'::jsonb,
  
  thresholds JSONB NOT NULL DEFAULT '{
    "alpha": 60,
    "beta": 40
  }'::jsonb,
  
  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_college_id (college_id),
  INDEX idx_published (is_published)
);
```

### Table: amcat_results

Stores individual student AMCAT test results.

```sql
CREATE TABLE amcat_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  college_id UUID NOT NULL,
  
  -- Student identification
  sap_id VARCHAR(50) NOT NULL,
  student_id UUID,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  
  -- Scores
  cs_score DECIMAL(5, 2) NOT NULL,
  cp_score DECIMAL(5, 2) NOT NULL,
  automata_score DECIMAL(5, 2) NOT NULL,
  automata_fix_score DECIMAL(5, 2) NOT NULL,
  quant_score DECIMAL(5, 2) NOT NULL,
  
  -- Computation
  total_score DECIMAL(5, 2) NOT NULL,
  category VARCHAR(20) NOT NULL, -- 'alpha', 'beta', 'gamma'
  rank_in_session INTEGER,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (session_id) REFERENCES amcat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (session_id, sap_id),
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_college_id (college_id),
  INDEX idx_student_id (student_id),
  INDEX idx_category (category),
  INDEX idx_sap_id (sap_id)
);
```

### Table: student_roster

Stores student information for linking with AMCAT results.

```sql
CREATE TABLE student_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL,
  
  -- Student identification
  sap_id VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  
  -- Academic info
  course VARCHAR(50),
  branch VARCHAR(50),
  batch_year VARCHAR(50),
  roll_no VARCHAR(50),
  programme_name VARCHAR(255),
  
  -- System linking
  student_id UUID,
  linked_at TIMESTAMP,
  imported_from VARCHAR(50), -- 'amcat', 'ats', etc.
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (college_id, sap_id),
  
  -- Indexes
  INDEX idx_college_id (college_id),
  INDEX idx_sap_id (sap_id),
  INDEX idx_student_id (student_id),
  INDEX idx_email (email)
);
```

---

## Migration Steps

### Step 1: Backup Database

```bash
# Create backup
pg_dump -h localhost -U postgres -d skillsync > backup_$(date +%Y%m%d).sql

# Verify backup
pg_restore --list backup_20250115.sql | head -20
```

### Step 2: Run Drizzle Migrations

```bash
# Generate migration (if not already created)
npm run drizzle:generate -- --name add_amcat_tables

# Run migrations
npm run drizzle:migrate

# Verify migration applied
npm run drizzle:verify
```

### Step 3: Verify Table Structure

```sql
-- Check amcat_sessions table
\d amcat_sessions

-- Check amcat_results table
\d amcat_results

-- Check student_roster table
\d student_roster

-- Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('amcat_sessions', 'amcat_results', 'student_roster');
```

### Step 4: Set Permissions

```sql
-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE 
  ON amcat_sessions, amcat_results, student_roster 
  TO app_user;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public 
  TO app_user;

-- Verify permissions
SELECT grantee, privilege_type 
FROM role_table_grants 
WHERE table_name IN ('amcat_sessions', 'amcat_results', 'student_roster');
```

---

## Row-Level Security (RLS)

### Enable RLS on AMCAT Tables

```sql
-- Enable RLS
ALTER TABLE amcat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE amcat_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_roster ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if migrating
DROP POLICY IF EXISTS "amcat_sessions_college_isolation" ON amcat_sessions;
DROP POLICY IF EXISTS "amcat_results_college_isolation" ON amcat_results;
DROP POLICY IF EXISTS "student_roster_college_isolation" ON student_roster;

-- Create college isolation policies
CREATE POLICY "amcat_sessions_college_isolation" ON amcat_sessions
  USING (college_id = auth.jwt() ->> 'college_id'::text);

CREATE POLICY "amcat_results_college_isolation" ON amcat_results
  USING (college_id = auth.jwt() ->> 'college_id'::text);

CREATE POLICY "student_roster_college_isolation" ON student_roster
  USING (college_id = auth.jwt() ->> 'college_id'::text);

-- Admin bypass policies
CREATE POLICY "amcat_sessions_admin_bypass" ON amcat_sessions
  USING (auth.has_role('amcat_management')
    OR auth.has_role('admin'));
```

### Verify RLS

```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('amcat_sessions', 'amcat_results', 'student_roster');
-- Expected: all have rowsecurity = true

-- List policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('amcat_sessions', 'amcat_results', 'student_roster');
```

---

## Indexes for Performance

### Add Performance Indexes

```sql
-- Session queries
CREATE INDEX idx_amcat_sessions_college_published 
  ON amcat_sessions(college_id, is_published);

-- Results queries
CREATE INDEX idx_amcat_results_session_category 
  ON amcat_results(session_id, category);

CREATE INDEX idx_amcat_results_student_rank 
  ON amcat_results(student_id, rank_in_session);

-- Roster queries
CREATE INDEX idx_student_roster_college_linked 
  ON student_roster(college_id, student_id) 
  WHERE student_id IS NOT NULL;

-- Search indexes
CREATE INDEX idx_amcat_results_email_lower 
  ON amcat_results(LOWER(email));

CREATE INDEX idx_student_roster_email_lower 
  ON student_roster(LOWER(email));
```

### Verify Indexes

```sql
-- List all AMCAT indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('amcat_sessions', 'amcat_results', 'student_roster') 
ORDER BY tablename;
```

---

## Data Validation

### Post-Migration Checks

```sql
-- Check table structure
SELECT COUNT(*) FROM amcat_sessions;          -- Should be 0 initially
SELECT COUNT(*) FROM amcat_results;           -- Should be 0 initially
SELECT COUNT(*) FROM student_roster;          -- Check count

-- Verify constraints
SELECT constraint_type, constraint_name 
FROM information_schema.table_constraints 
WHERE table_name IN ('amcat_sessions', 'amcat_results', 'student_roster');

-- Check foreign keys
SELECT constraint_name, table_name, column_name, referenced_table, referenced_column 
FROM information_schema.referential_constraints 
WHERE table_name IN ('amcat_sessions', 'amcat_results', 'student_roster');

-- Verify unique constraints
SELECT constraint_name, column_name 
FROM information_schema.constraint_column_usage 
WHERE table_name IN ('amcat_sessions', 'amcat_results');
```

---

## Testing After Migration

### Run Test Suite

```bash
# Run AMCAT tests specifically
npm run test phase9-amcat-import

# Expected output:
# PASS  tests/phase9-amcat-import.test.ts (7 suites)
#   ✓ Session Creation
#   ✓ CSV Parsing
#   ✓ Student Linking
#   ✓ Dashboard Display
#   ✓ Ranking Filters
#   ✓ Integration Test
```

### Manual Testing

```bash
# Verify system readiness
npx tsx scripts/amcat-verify.ts

# Expected: ✓ System Ready for Import

# Test admin API endpoints
curl -X GET http://localhost:3000/api/admin/amcat \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 200 OK, empty sessions array

# Test file upload endpoint
curl -X POST http://localhost:3000/api/admin/amcat \
  -F "file=@test-data.csv" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 201 Created, session object
```

---

## Production Deployment

### Pre-Deployment

```bash
# 1. Backup production database
pg_dump -h prod-db -U admin -d skillsync > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations in staging first
npm run drizzle:migrate -- --staging

# 3. Run full test suite
npm run test

# 4. Deploy to production
npm run deploy

# 5. Verify migration applied
npx tsx scripts/amcat-verify.ts
```

### Post-Deployment

```bash
# 1. Check system health
npx tsx scripts/amcat-verify.ts

# 2. Monitor logs
tail -f /var/log/app.log | grep "amcat"

# 3. Test critical paths
npm run test phase9-amcat-import -- --prod

# 4. Manual verification
curl https://yourapp.com/admin/amcat (admin access)
curl https://yourapp.com/api/student/amcat (student API)
```

---

## Rollback Procedure

### If Migration Fails

```bash
# 1. Identify last working backup
ls -la backup_*.sql

# 2. Restore database
psql -h localhost -U postgres < backup_20250115.sql

# 3. Verify restoration
psql -h localhost -U postgres -d skillsync \
  -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"

# 4. Re-deploy previous code version
npm run deploy --version <previous-version>

# 5. Verify
npx tsx scripts/amcat-verify.ts
```

---

## Maintenance

### Regular Maintenance

```sql
-- Weekly: Analyze table statistics
ANALYZE amcat_sessions;
ANALYZE amcat_results;
ANALYZE student_roster;

-- Weekly: Check for bloat
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('amcat_sessions', 'amcat_results', 'student_roster');

-- Monthly: Reindex if needed
REINDEX TABLE amcat_sessions;
REINDEX TABLE amcat_results;
REINDEX TABLE student_roster;
```

### Monitoring Queries

```sql
-- Check for unlinked students
SELECT COUNT(*) as unlinked_count
FROM amcat_results
WHERE student_id IS NULL;

-- Check category distribution
SELECT category, COUNT(*) as count
FROM amcat_results
GROUP BY category
ORDER BY count DESC;

-- Check for duplicate SAP IDs per session
SELECT session_id, sap_id, COUNT(*) as count
FROM amcat_results
GROUP BY session_id, sap_id
HAVING COUNT(*) > 1;

-- Check linking success rate
SELECT 
  COUNT(*) as total,
  COUNT(student_id) as linked,
  ROUND(100.0 * COUNT(student_id) / COUNT(*), 2) as linked_pct
FROM amcat_results;
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Foreign key constraint violation"
- **Cause:** College ID or user ID doesn't exist
- **Solution:** Check colleges and users tables exist

**Issue:** "Duplicate key value violates unique constraint"
- **Cause:** Duplicate (session_id, sap_id) or (college_id, sap_id)
- **Solution:** Check for duplicate records in source data

**Issue:** "Permission denied on table amcat_results"
- **Cause:** App user doesn't have permissions
- **Solution:** Re-run GRANT commands

### Getting Help

```bash
# Collect diagnostic info
npm run diagnostic > diagnostic_$(date +%Y%m%d_%H%M%S).log

# Check logs
tail -100 /var/log/app.log

# Run verification
npx tsx scripts/amcat-verify.ts
```

---

## Checklist

- [ ] Database backup created
- [ ] Drizzle migrations run
- [ ] Table structure verified
- [ ] Permissions granted
- [ ] RLS enabled
- [ ] Indexes created
- [ ] Tests pass
- [ ] Production verification complete
- [ ] Monitoring setup
- [ ] Rollback procedure documented

---

Last Updated: January 2025
Contact: data-team@skillsync.local
