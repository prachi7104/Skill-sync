# AMCAT Deployment Checklist

## Pre-Deployment Verification

### Code Quality & Testing
- [ ] Run test suite: `npm run test phase9-amcat-import`
  - Expected: All 7 test suites pass
  - Tests: Session creation, CSV parsing, student linking, dashboard, ranking filters, integration
  
- [ ] Run all tests: `npm run test`
  - Expected: No failures
  
- [ ] Build verification: `npm run build`
  - Expected: No type errors, build succeeds
  
- [ ] Lint check: `npm run lint`
  - Expected: No errors or warnings

### System Verification
- [ ] Run verification script: `npx tsx scripts/amcat-verify.ts`
  - Expected: ✓ System Ready for Import
  - Must check: Colleges configured, tables exist, columns present

### Database Check
- [ ] Verify colleges are configured in database
  - Query: `SELECT * FROM colleges LIMIT 5`
  - Expected: At least 1 college present

- [ ] Check student roster populated
  - Query: `SELECT COUNT(*) FROM student_roster`
  - Expected: Row count > 0 for each college

- [ ] Verify tables are empty (first import)
  - Query: `SELECT COUNT(*) FROM amcat_sessions, amcat_results`
  - Expected: 0 records (or acceptable count if redeploying)

---

## Pre-Deployment Documentation

### Files to Create/Verify
- [x] `public/amcat-template.csv` - ✅ Created
- [x] `AMCAT_IMPORT_GUIDE.md` - ✅ Created
- [x] `AMCAT_IMPORT_RUNBOOK.md` - ✅ Created
- [x] `AMCAT_IMPLEMENTATION_SUMMARY.md` - ✅ Created
- [x] `tests/phase9-amcat-import.test.ts` - ✅ Created
- [x] `scripts/amcat-verify.ts` - ✅ Created

### Documentation Deployment
- [ ] Copy to docs server or wiki:
  - AMCAT_IMPORT_GUIDE.md (Admin guide)
  - AMCAT_IMPORT_RUNBOOK.md (Quick reference)
  - AMCAT_IMPLEMENTATION_SUMMARY.md (Technical overview)

- [ ] Email admin team:
  - Links to guides
  - Quick start instructions
  - Support contact

---

## Deployment Steps

### Step 1: Code Deployment
```bash
# Build and validate
npm run build

# Run full test suite
npm run test

# Deploy to production
npm run deploy  # or your deploy command
```

### Step 2: Post-Deployment Verification
```bash
# Verify system in production
npx tsx scripts/amcat-verify.ts

# Check admin panel works
curl https://yourapp.com/admin/amcat
# Expected: 200 OK (if authenticated)

# Check template is accessible
curl https://yourapp.com/amcat-template.csv
# Expected: CSV headers returned
```

### Step 3: Admin Access Setup
- [ ] Grant `amcat_management` role to admins
  - Database: Update user permissions
  - Verify: Admins can see `/admin/amcat`

- [ ] Test admin upload
  - [ ] Download template
  - [ ] Upload test CSV with 5-10 rows
  - [ ] Verify data appears
  - [ ] Verify categories assigned
  - [ ] Test publish functionality

### Step 4: Faculty Notification
- [ ] Create communications:
  - [ ] "What is AMCAT category?" explainer
  - [ ] How categories affect drive eligibility
  - [ ] How to filter drives by category
  
- [ ] Send to faculty team:
  - [ ] Links to documentation
  - [ ] Example category distributions
  - [ ] Drive filter instructions

### Step 5: Student Communication
- [ ] Prepare student messaging:
  - [ ] When AMCAT scores will appear
  - [ ] What categories mean
  - [ ] How category affects placement opportunities
  
- [ ] Post to student portal/email after first import

---

## Rollout Plan

### Phase 1: Soft Launch (1-2 days)
**Objective:** Test with one college

- [ ] Upload first college's AMCAT data
- [ ] Verify all students linked correctly
- [ ] Check categories assigned properly
- [ ] Monitor for any errors
- [ ] Get feedback from that college's admin

**Success Criteria:**
- ✓ 95%+ students linked
- ✓ No upload errors
- ✓ Categories look correct
- ✓ Admin manual spot-check passes

### Phase 2: Controlled Rollout (1 week)
**Objective:** Import data from 3-5 more colleges

- [ ] Stagger uploads (1-2 colleges per day)
- [ ] Monitor each upload for issues
- [ ] Track any support requests
- [ ] Verify leaderboards work

**Success Criteria:**
- ✓ No recurring issues
- ✓ < 5% unlinked students
- ✓ Zero system errors
- ✓ Faculty using filters successfully

### Phase 3: Full Rollout
**Objective:** Complete all colleges

- [ ] Upload remaining college data
- [ ] Conduct faculty training if needed
- [ ] Send communication to students
- [ ] Move AMCAT to "ready for production" status

---

## Monitoring Post-Deployment

### Daily Checks (First Week)
```bash
# System health
npx tsx scripts/amcat-verify.ts

# Error logs
tail -f /var/log/app.log | grep "amcat"

# Database metrics
SELECT 
  COUNT(*) as session_count,
  COUNT(DISTINCT college_id) as college_count,
  COUNT(*) as student_count
FROM amcat_results;
```

### Weekly Checks (Ongoing)
- [ ] Performance metrics (query response times)
- [ ] Student leaderboard access patterns
- [ ] Any reported bugs
- [ ] Drive creation using AMCAT filters

### Monthly Reviews
- [ ] Category distribution trends
- [ ] Placement outcomes by category
- [ ] Feedback from admins/faculty
- [ ] Feature requests

---

## Rollback Plan

**If Critical Issue Found:**

### Immediate Action (< 15 min)
```bash
# 1. Stop accepting new uploads
npx tsx scripts/disable-amcat-uploads.ts

# 2. Roll back deployment
npm run deploy --version <previous-version>

# 3. Verify system
npx tsx scripts/amcat-verify.ts
```

### Investigation (During maintenance window)
- [ ] Identify root cause
- [ ] Check test suite for gaps
- [ ] Fix issue in code
- [ ] Add new tests to prevent recurrence

### Re-deployment
- [ ] Add specific test for bug
- [ ] Verify all tests pass
- [ ] Deploy fix
- [ ] Manual testing
- [ ] Re-enable uploads

---

## Success Criteria

### Deployment Success
- ✅ No build errors
- ✅ All tests pass (phase9-amcat-import.test.ts)
- ✅ Verification script reports "Ready"
- ✅ Admin panel accessible
- ✅ Template downloadable

### Data Import Success
- ✅ 95%+ students linked (first college)
- ✅ Categories assigned correctly
- ✅ Leaderboard shows rankings
- ✅ Faculty can filter by category
- ✅ Students see scores on dashboard

### Production Success (After 1 week)
- ✅ Zero critical incidents
- ✅ < 5% unlinked students across all imports
- ✅ Faculty using categorization in drives
- ✅ Support requests minimal
- ✅ Performance adequate (queries < 1s)

---

## Support Escalation

### Level 1 (Admin Self-Service)
**Issue:** "CSV won't upload"
**Solution:** 
- Verify CSV format matches template
- Check file size < 10MB
- Try different file (test data)

**Issue:** "Students not linked"
**Solution:**
- Download verification script output
- Check SAP IDs match exactly
- Query student_roster for count

### Level 2 (Technical Support)
**Issue:** "Upload succeeds but no category assigned"
**Solution:**
- Run verification script
- Check AMCAT parser logs
- Verify score computation
- Test with known data

### Level 3 (Engineering)
**Issue:** "System errors during import"
**Solution:**
- Check error logs
- Review test coverage
- Fix bug and redeploy
- Add regression test

---

## Documentation Links

**For Admins:** `AMCAT_IMPORT_GUIDE.md`
- Step-by-step import workflow
- Troubleshooting guide
- Category explanation

**For Operators:** `AMCAT_IMPORT_RUNBOOK.md`
- Quick reference checklist
- Common operations
- Verification commands

**For Engineers:** `AMCAT_IMPLEMENTATION_SUMMARY.md`
- System architecture
- API endpoints
- Test coverage
- Code locations

---

## Sign-Off

**Deploy By:** [Date]
**Deployed By:** [Engineer]
**Verified By:** [QA/Admin]

**Pre-Deployment Checklist Complete:** [ ] Yes [ ] No

**Ready for Production:** [ ] Yes [ ] No

**Notes:**
```
[Add any deployment notes here]
```

---

## Emergency Contacts

- **Technical Issues**: [Engineering Lead]
- **Admin Questions**: [Admin Lead]
- **Data Issues**: [Data Manager]
- **On-Call**: [On-Call Engineer]

Last Updated: [Current Date]
Next Review: [Review Date]
