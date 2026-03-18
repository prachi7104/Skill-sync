# AMCAT Quick Start Guide (5-Minute Setup)

## TL;DR - Get Running in 5 Minutes

### Prerequisites
- ✓ Database configured (run: `npx tsx scripts/amcat-verify.ts`)
- ✓ System deployed to production
- ✓ Admin access to `/admin/amcat` page

---

## Step 1: Verify System Works (1 min)

```bash
npx tsx scripts/amcat-verify.ts
```

**Expected output:**
```
✓ Colleges Configured
✓ Database Tables
✓ Data Counts
✓ System Ready for Import
```

**If it fails:** Stop. Fix issues before proceeding.

---

## Step 2: Run Tests (1 min)

```bash
npm run test phase9-amcat-import
```

**Expected:** All tests pass (7 suites, 20+ tests)

**If it fails:** Check error messages. Verify database connection.

---

## Step 3: Download Template (30 sec)

1. Go to: `https://yourapp.com/admin/amcat`
2. Look for: **"Download CSV Template"** button (top of upload box)
3. Click to download: `amcat-template.csv`

---

## Step 4: Prepare Your Data (2-3 min)

Open the template in Excel/Sheets:

```
email,sap_id,full_name,course,branch,programme_name,status,attendance_pct,cs_score,cp_score,automata_score,automata_fix_score,quant_score
```

Fill with your AMCAT data:
```
alice@stu.edu,500001,Alice Kumar,BTech,CSE,BTech CSE IV,Present,85,80,75,90,85,70
bob@stu.edu,500002,Bob Singh,BTech,CSE,BTech CSE IV,Present,80,85,90,92,88,75
charlie@stu.edu,500003,Charlie Patel,BTech,IT,BTech IT IV,Present,90,88,85,87,86,92
```

**Key validation:**
- ✓ SAP IDs match your student database exactly
- ✓ All score columns have numeric values
- ✓ No blank rows at end
- ✓ Save as `.csv` (or `.xlsx`)

---

## Step 5: Upload File (30 sec)

1. Go to: `https://yourapp.com/admin/amcat`
2. Click: **"Select File or Drag & Drop"**
3. Choose your CSV file
4. **Session Name:** Enter name like "College-Name-Batch-2024"
5. Click: **"Upload AMCAT File"**
6. **Wait:** System processes (2-5 seconds)
7. **Verify:** Check "Students Linked" count (should be ~95%+)

---

## Step 6: Review & Publish (30 sec)

**In Admin Panel:**
1. Scroll to see **Results by Category**:
   - Alpha (score ≥ 60): ___ students
   - Beta (score ≥ 40, < 60): ___ students
   - Gamma (score < 40): ___ students

2. If categories look right:
   - Click: **"Publish to Students"**
   - Confirmation appears
   - Students immediately see scores

**Done!** 🎉

---

## What Students See

After publication:
- **Dashboard:** Category badge (Alpha/Beta/Gamma) with score
- **Leaderboard:** Ranking within session
- **Drives:** Only eligible categories can apply

---

## If Something Goes Wrong

### "0 students linked"
❌ SAP IDs don't match  
✅ **Fix:** 
- Download template again
- Check sample SAP IDs against user database
- Re-upload with correct IDs

### "Upload failed - empty file"
❌ CSV parsing failed  
✅ **Fix:**
- Ensure UTF-8 encoding
- Check column headers match exactly
- Verify no special characters

### "Can't see /admin/amcat"
❌ Not assigned admin role  
✅ **Fix:**
- Ask admin to grant `amcat_management` role
- Request admin access

### "Students don't see scores after publish"
❌ Cache or timing issue  
✅ **Fix:**
- Wait 30 seconds
- Clear browser cache
- Refresh page
- Check network tab for errors

---

## Common Questions

**Q: Can I upload the same data twice?**  
A: No, it's rejected as duplicate. Delete the session first.

**Q: Can I change weights after upload?**  
A: Yes! Click session → adjust sliders → "Recalculate Scores"

**Q: What if some students aren't in the system yet?**  
A: They'll show as "Unmatched" but won't be excluded. You can add them later and re-upload.

**Q: How long does publishing take?**  
A: < 1 second. Students see scores immediately.

**Q: Can I un-publish a session?**  
A: Yes, click session → "Unpublish" button. Students lose access.

---

## Quick Reference

| Action | Time | URL |
|--------|------|-----|
| Download template | 30 sec | `/admin/amcat` |
| Upload CSV (small file) | 2-3 sec | `/admin/amcat` |
| Recalculate scores | 2-3 sec | `/admin/amcat` > session |
| Publish session | 1 sec | `/admin/amcat` > session |
| View leaderboard | 1 sec | `/student/leaderboard` |

---

## Scoring Formula (Reference)

```
Total Score = (automata × 50%) 
            + (automata_fix × 20%)
            + (cp × 10%)
            + (cs × 10%)
            + (quant × 10%)

Category Assignment:
  if score ≥ 60  → "Alpha"   (top tier)
  if score ≥ 40  → "Beta"    (mid tier)
  if score < 40  → "Gamma"   (entry tier)
```

---

## Next Steps

1. **Faculty:** Show them how to create drives with category filters
2. **Students:** Share announcement that AMCAT categories are live
3. **Monitor:** Watch leaderboard for any issues
4. **Repeat:** Upload more colleges' data following same process

---

## Support

**Need help?** Check docs:
- 📖 Full guide: `AMCAT_IMPORT_GUIDE.md`
- ⚙️ Admin manual: `AMCAT_IMPORT_RUNBOOK.md`
- 🔧 Technical: `AMCAT_IMPLEMENTATION_SUMMARY.md`

**System not working?**
```bash
npx tsx scripts/amcat-verify.ts
npm run test phase9-amcat-import
```

**Ready to begin!** 🚀
