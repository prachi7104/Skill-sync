# SkillSync AMCAT Import Guide

## Overview

The AMCAT Import System allows colleges to upload AMCAT (Aspiring Minds Computer-Adaptive Test) results and automatically categorize students for placement drives.

**Key Features:**
- Upload AMCAT CSV/XLSX files with student scores
- Automatic score computation and category assignment
- Student-result linking via SAP ID
- Publishing to make categories visible to students
- Ranking filters based on AMCAT category

---

## Prerequisites

Before importing AMCAT data, verify system readiness:

```bash
npx tsx scripts/amcat-verify.ts
```

This checks:
- ✓ Colleges configured
- ✓ Database tables exist
- ✓ Required columns present
- ✓ Data counts

**If any checks fail**, follow the error messages to fix issues before proceeding.

---

## Step 1: Pre-Import Verification

Run the verification script:

```bash
npx tsx scripts/amcat-verify.ts
```

Expected output:
```
✓ 1 college(s) configured
✓ amcat_sessions table exists with 15 column(s)
✓ amcat_results table exists with 13 column(s)
✓ student_roster table exists with 12 column(s)
```

---

## Step 2: Prepare CSV File

### CSV Format

The AMCAT CSV must have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `email` | Student email | `alice@stu.upes.ac.in` |
| `sap_id` | SAP ID (matches student database) | `500123456` |
| `full_name` | Student full name | `Alice Kumar` |
| `course` | Degree program | `BTech` |
| `branch` | Branch/specialization | `Computer Science` |
| `programme_name` | Full program name | `BTech CSE IV` |
| `status` | Test status | `Present` or `Absent` |
| `attendance_pct` | Attendance percentage | `85` |
| `cs_score` | Computer Science score | `80` |
| `cp_score` | Computer Programming score | `75` |
| `automata_score` | Automata score | `90` |
| `automata_fix_score` | Automata (Fix) score | `85` |
| `quant_score` | Quantitative score | `70` |

### Download Template

1. Go to Admin Panel → AMCAT Upload
2. Click **Download CSV Template**
3. Fill in your college data
4. Save as `.csv` or `.xlsx`

---

## Step 3: Upload File

### Via Web Interface

1. **Navigate to Admin Panel**
   - URL: `/admin/amcat`
   - Requires: `amcat_management` permission

2. **Upload File**
   - Select file (CSV or XLSX, max 10MB)
   - Enter Session Name (e.g., "AMCAT Oct 2025 - Batch IV")
   - Optional: Test Date, Batch Year, Academic Year
   - Click **Upload AMCAT File**

3. **Review Results**
   - System automatically computes scores
   - Displays linked/unmatched student counts
   - Shows category distribution (Alpha/Beta/Gamma)

### CSV Requirements

- **Minimum**: 1 row of data (header + 1 student)
- **Maximum**: 10,000 rows (per file)
- **Format**: Properly quoted if commas appear in values
- **Encoding**: UTF-8

---

## Step 4: Verify & Adjust Scoring

The system uses default scoring weights:

| Component | Weight | Category Threshold |
|-----------|--------|-------------------|
| Automata | 50% | Alpha ≥ 60 |
| Automata Fix | 20% | Beta ≥ 40 |
| Computer Programming | 10% | Gamma < 40 |
| Computer Science | 10% | |
| Quantitative | 10% | |

### Customize Weights (Optional)

1. In Admin Panel, open the session
2. Adjust percentage sliders under "Configure Scoring Formula"
3. Ensure total = 100%
4. Click **Recalculate Scores**
5. Review updated category distribution

---

## Step 5: Review Linked Results

The system automatically links AMCAT results to students via SAP ID.

**Status Indicators:**
- ✓ **Linked**: `sap_id` matches student in database
- ✗ **Unmatched**: `sap_id` not found in database

**For Unmatched Records:**
- Check if `sap_id` exists in student database
- Verify spelling/format matches exactly
- Contact your IT admin if students need to be created first

---

## Step 6: Publish Session

Publishing makes AMCAT categories visible to students.

1. Open session in Admin Panel
2. Click **Publish to Students**
3. Confirm publication

**After Publishing:**
- Students see their category on dashboard
- Categories affect drive eligibility
- Faculty can filter rankings by category

---

## Category System

AMCAT results assign students to categories for placement eligibility:

### Alpha (Top Performers)
- Score: ≥ 60
- Eligible for: All placement drives
- Example: Student scores 75 on AMCAT

### Beta (Mid-Tier)
- Score: 40-59
- Eligible for: Drives marked "Beta, Gamma"
- Example: Student scores 48 on AMCAT

### Gamma (Entry-Level)
- Score: < 40
- Eligible for: Only Gamma drives
- Example: Student scores 25 on AMCAT

---

## Student Display

After publishing, students see:

### Dashboard
- AMCAT category badge
- Session name & test date
- Scores in each section
- Rank in session (e.g., 5 of 487)

### Leaderboard (`/student/leaderboard`)
- Ranked list of all students in session
- Filtered by category (if applicable)
- Shows top performers

---

## Ranking Integration

When faculty creates placement drives, they specify eligible categories:

### Example
**Google SWE Drive**
- Eligible Categories: `["alpha", "beta"]`
- Effect: Only Alpha and Beta students ranked
- Gamma students automatically excluded

**AI/Finance Internship**
- Eligible Categories: `["alpha"]`
- Effect: Only Alpha students ranked

---

## Troubleshooting

### Issue: "File too large"
- **Cause**: File exceeds 10MB
- **Solution**: Split into multiple files and upload separately

### Issue: "No valid rows found"
- **Cause**: CSV parsing failed
- **Solution**: 
  - Verify column headers match expected names
  - Check for special characters in data
  - Ensure UTF-8 encoding

### Issue: "0 students linked"
- **Cause**: `sap_id` doesn't match database
- **Solution**:
  - Verify SAP IDs are identical (case-sensitive)
  - Check student roster for discrepancies
  - Contact IT if students missing

### Issue: "Weights must sum to 100%"
- **Cause**: Total weight ≠ 100%
- **Solution**: Adjust sliders so total equals 100%

---

## Testing

Run the AMCAT import tests:

```bash
npm run test phase9-amcat-import
```

Tests verify:
- ✓ Session creation with weights
- ✓ CSV parsing and scoring
- ✓ Student-result linking
- ✓ Dashboard display
- ✓ Ranking category filters

---

## Data Security

AMCAT import respects security policies:

- **Linked via SAP ID**: No email matching; exact SAP ID required
- **Student Privacy**: Only linked results visible to that student
- **Admin Only**: Upload restricted to `amcat_management` permission
- **Audit Trail**: All uploads logged with timestamps

---

## Performance Notes

- **Upload Time**: 1-5 seconds for 10,000 students
- **Scoring Computation**: Automatic, < 1 second
- **Publishing**: < 1 second for 1000 students
- **Recalculation**: ~2 seconds to recompute category for all results

---

## Support

For issues with AMCAT import:

1. Check logs: `npm run logs` (Vercel)
2. Run: `npx tsx scripts/amcat-verify.ts`
3. Contact: your-admin@skillsync.local
