# AMCAT Import Runbook - Quick Reference

## Pre-Import Checklist (5 minutes)

**Run this before importing any college data:**

```bash
# 1. Verify system readiness
npx tsx scripts/amcat-verify.ts

# 2. Run AMCAT tests
npm run test phase9-amcat-import

# 3. Check for any deployment warnings
npm run build
```

**Stop if any checks fail. Fix issues before proceeding.**

---

## Import Workflow (Per College)

### Phase 1: Prepare (Day Before Import)
- [ ] Download template: Admin Panel → AMCAT Upload → **Download CSV Template**
- [ ] Fill with college AMCAT data
- [ ] Validate SAP IDs match student database
- [ ] Save as `.csv` or `.xlsx`
- [ ] Spot-check 5-10 rows for data quality

### Phase 2: Upload (Import Day)
- [ ] Go to Admin Panel → **AMCAT Upload**
- [ ] Drag & drop CSV file (or select file)
- [ ] Enter Session Name (e.g., "College XYZ - Batch 2024")
- [ ] Optional: Set batch year, academic year, test date
- [ ] Click **Upload AMCAT File**
- [ ] Wait for processing (1-5 seconds)

### Phase 3: Review Results
- [ ] Check "Students Linked" count
- [ ] Verify category distribution (Alpha/Beta/Gamma %)
- [ ] Scroll through results table
- [ ] Look for any "Unmatched" records
- [ ] Investigate unmatched if count high (> 5%)

### Phase 4: Adjust Scoring (If Needed)
- [ ] Click session to open details
- [ ] Review scoring formula (bottom of page)
- [ ] If customize needed:
  - [ ] Adjust weight percentages
  - [ ] Ensure total = 100%
  - [ ] Click **Recalculate Scores**
  - [ ] Verify category distribution changed as expected

### Phase 5: Publish to Students
- [ ] Open session in Admin Panel
- [ ] Click **Publish to Students** button
- [ ] Confirm publication
- [ ] Verify students can see scores on dashboard
- [ ] Check leaderboard works

### Phase 6: Notify Faculty
- [ ] Email faculty about new AMCAT categories
- [ ] Provide category breakdown (Alpha/Beta/Gamma counts)
- [ ] Show how to use categories in drive filters

---

## Common Operations

### Download CSV Template
```
Admin Panel → AMCAT Upload → "Download CSV Template" button
```
**Result:** Downloads `amcat-template.csv` with column headers

### View All Sessions
```
Admin Panel → AMCAT Upload → Scroll down to "Sessions" table
```
**Shows:** Name, date created, attached students, publish status

### Publish a Session
```
Admin Panel → AMCAT Upload → Click on session name → "Publish to Students"
```
**Effect:** Makes results visible to students

### Recalculate Scores
```
Admin Panel → AMCAT Upload → Click session → Adjust weights → "Recalculate"
```
**Result:** Recomputes scores and categories for all students

### View Student Results by Category
```
Admin Panel → AMCAT Upload → Click session → Scroll to "Results by Category"
```
**Shows:** Alpha/Beta/Gamma breakdown with student counts

---

## Troubleshooting Quick Fixes

| Problem | Quick Fix | Full Fix |
|---------|-----------|----------|
| "File too large" | File > 10MB | Split into smaller batches |
| "0 students linked" | SAP IDs don't match | Verify SAP IDs in header & data |
| "Upload failed" | CSV parsing error | Check UTF-8 encoding, proper quotes |
| "Categories seem wrong" | Weights out of sync | Click "Recalculate Scores" |
| "Student doesn't see results" | Not published yet | Click "Publish to Students" |

---

## Data Format Reminder

**Required columns (EXACT spelling):**
```
email, sap_id, full_name, course, branch, programme_name, 
status, attendance_pct, cs_score, cp_score, automata_score, 
automata_fix_score, quant_score
```

**Example row:**
```
alice@stu.abc.edu, 500123456, Alice Kumar, BTech, CSE, BTech CSE IV, 
Present, 85, 80, 75, 90, 85, 70
```

---

## Performance Expectations

| Operation | Time |
|-----------|------|
| Upload 1000 rows | 2-3 sec |
| Upload 5000 rows | 4-5 sec |
| Recalculate scores | 2-3 sec |
| Publish to 1000 students | 1-2 sec |
| View leaderboard (100 students) | 1 sec |

**If slower, check system logs.**

---

## Scoring Formula (Default)

```
TOTAL_SCORE = (automata × 0.50) + (automata_fix × 0.20) + 
              (cp × 0.10) + (cs × 0.10) + (quant × 0.10)

CATEGORY = 
  "alpha" if TOTAL_SCORE >= 60
  "beta"  if TOTAL_SCORE >= 40
  "gamma" if TOTAL_SCORE < 40
```

---

## Verification Script Output

```bash
$ npx tsx scripts/amcat-verify.ts

╔══════════════════════════════════════════════════════════════════╗
║                    AMCAT System Status Check                    ║
╚══════════════════════════════════════════════════════════════════╝

✓ Colleges Configured
  └─ XYZ College (xyz.ac.in)

✓ Database Tables
  ├─ amcat_sessions (15 columns)
  ├─ amcat_results (13 columns)
  └─ student_roster (12 columns)

✓ Data Counts
  ├─ Sessions: 1
  ├─ Results: 487
  └─ Roster: 2500

══════════════════════════════════════════════════════════════════

✓ System Ready for Import
  Next: Download template, populate data, upload via admin panel
```

---

## Import Checklist Template

**For each college:**

```
College: _______________
Session Name: _______________
Batch Year: _______________

[ ] Downloaded CSV template
[ ] Validated SAP IDs match database
[ ] Spot-checked 10 data rows
[ ] Uploaded file successfully
[ ] Reviewed linked count (expected: 95%+)
[ ] Adjusted weights if needed
[ ] Recalculated scores
[ ] Category distribution looks correct
[ ] Published to students
[ ] Notified faculty
[ ] Students verified seeing results

Status: [ ] Complete [ ] On Hold [ ] Failed
```

---

## Contact & Support

- **System Issues**: Check `npx tsx scripts/amcat-verify.ts`
- **Test Coverage**: `npm run test phase9-amcat-import`
- **Deployment**: `npm run build && npm run deploy`
