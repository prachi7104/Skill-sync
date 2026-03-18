# AMCAT System Architecture & Data Flow

## System Overview

The AMCAT system allows colleges to upload student test results, automatically compute scores and categories, link to student profiles, and make results visible for placement ranking.

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN INTERFACE                          │
│                   app/(admin)/admin/amcat/page.tsx              │
├─────────────────────────────────────────────────────────────────┤
│  Features:                                                      │
│  • File upload (CSV/XLSX, max 10MB)                            │
│  • Session management                                           │
│  • Weight configuration (sliders)                               │
│  • Results display with filtering                               │
│  • Category distribution charts                                 │
│  • Publish/unpublish toggles                                    │
│  • Download CSV template                                        │
└────────────────┬──────────────────────────────────────────┬────┘
                 │                                          │
        ┌────────▼──────────┐                   ┌──────────▼────────┐
        │   CSV Template    │                   │   Upload Handler  │
        │ public/amcat-     │                   │  app/api/admin/   │
        │ template.csv      │                   │  amcat/route.ts   │
        └───────────────────┘                   └────────┬──────────┘
                                                         │
        ┌────────────────────────────────────────────────▼────────────┐
        │                    PROCESSING PIPELINE                       │
        ├──────────────────────────────────────────────────────────────┤
        │                                                              │
        │  1. CSV Parse        2. Score Compute    3. Categorize      │
        │     ┌──────────┐        ┌──────────┐      ┌──────────┐    │
        │     │Parse CSV │───────▶│Weighted  │─────▶│Assign    │    │
        │     │Headers   │        │Sum       │      │Category  │    │
        │     └──────────┘        └──────────┘      └──────────┘    │
        │                                                              │
        │  Lib: lib/amcat/parser.ts                                   │
        │  Functions:                                                  │
        │  • parseAmcatRows()       - CSV row parsing                │
        │  • validateWeights()      - Ensure = 100%                 │
        │  • computeAmcatTotal()    - Weighted score                │
        │  • computeAmcatCategory() - Alpha/Beta/Gamma              │
        │  • processAmcatData()     - End-to-end                    │
        │                                                              │
        └────────────────┬─────────────────────────────────────────┬─┘
                         │                                         │
        ┌────────────────▼─────────────┐       ┌──────────────────▼──┐
        │    STUDENT LINKING           │       │   DATABASE INSERT  │
        │                              │       │                    │
        │  Match SAP_ID to:            │       │  Tables:           │
        │  • Existing students         │       │  • amcat_sessions  │
        │  • Mark as linked/unmatched  │       │  • amcat_results   │
        │  • Compute ranking           │       │  • student_roster  │
        │                              │       │                    │
        └──────────────────────────────┘       └────────────────────┘
                                                         │
                        ┌────────────────────────────────┘
                        │
        (Stored in DB with computed scores, categories, rankings)
                        │
                        │
        ┌───────────────▼──────────────────────────────────┐
        │           PUBLISHING LAYER                        │
        ├────────────────────────────────────────────────────┤
        │  is_published = false (default)                   │
        │           ▼                                       │
        │  is_published = true (after "Publish")            │
        │           ▼                                       │
        │  Visible to:                                      │
        │  • Students (via API)                             │
        │  • Faculty (via API with filters)                 │
        │  • Student UI (dashboard)                         │
        └────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────▼──────────────────────────┐
        │        STUDENT VIEW & USAGE                │
        ├───────────────────────────────────────────┤
        │  API: app/api/student/amcat/route.ts      │
        │  • GET /api/student/amcat                 │
        │    Returns: { category, scores, rank }    │
        │                                           │
        │  UI: Dashboard                            │
        │  • Shows: Category badge                  │
        │  • Shows: Total score                     │
        │  • Shows: Component scores                │
        │  • Shows: Rank in session                 │
        │                                           │
        │  Leaderboard: /api/student/amcat/leaderboard│
        │  • Shows: Ranked list of peers            │
        │  • Filterable by category                 │
        └───────────────────────────────────────────┘
                         │
        ┌────────────────▼──────────────────────────┐
        │      PLACEMENT DRIVE INTEGRATION           │
        ├───────────────────────────────────────────┤
        │  Drives specify eligible categories:       │
        │  • "alpha" - top performers                │
        │  • "beta" - mid-tier                       │
        │  • "gamma" - entry-level                   │
        │                                           │
        │  System filters rankings by category:      │
        │  • Only eligible students ranked           │
        │  • Category determines eligibility         │
        │  • Transparent to students                 │
        └───────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Upload & Processing Flow

```
Admin Interface
      │
      │ [1] Select file
      │ [2] Enter session name
      │ [3] Drag & drop CSV
      └─────────────▼──────────────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼─────────┐
            │  File Upload   │  │  File Validation
            │   (multipart)  │  │  • Size < 10MB
            └───────┬────────┘  │  • Format CSV/XLSX
                    │           │  • Encoding UTF-8
                    │           └──────┬──────────┘
                    │                  │
            ┌───────▼──────────────────▼────┐
            │  app/api/admin/amcat/route.ts │
            │  [POST] Upload handler        │
            └───────┬──────────────────┬────┘
                    │                  │
        ┌───────────▼─┐      ┌────────▼───────┐
        │ Parse CSV   │      │ Create Session │
        │ lib/amcat/  │      │ (amcat_session)│
        │ parser.ts   │      └────────┬───────┘
        │             │               │
        │ • Split rows│      ┌────────▼──────┐
        │ • Map cols  │      │Store Weights  │
        │ • Validate  │      │Store Thresholds
        └───────┬─────┘      └────────────────┘
                │
        ┌───────▼──────────────┐
        │ Compute Scores       │
        │ For each student:    │
        │                      │
        │ score = (            │
        │   auto × 0.50 +      │
        │   autofix × 0.20 +   │
        │   cp × 0.10 +        │
        │   cs × 0.10 +        │
        │   quant × 0.10       │
        │ )                    │
        └───────┬──────────────┘
                │
        ┌───────▼──────────────┐
        │ Assign Category      │
        │                      │
        │ if score >= 60       │
        │   → "alpha"          │
        │ elif score >= 40     │
        │   → "beta"           │
        │ else                 │
        │   → "gamma"          │
        └───────┬──────────────┘
                │
        ┌───────▼──────────────────┐
        │ Link to Students         │
        │ Match sap_id to          │
        │ existing students        │
        │ • Found → linked         │
        │ • Not found → unmatched  │
        └───────┬──────────────────┘
                │
        ┌───────▼──────────────────┐
        │ Insert amcat_results     │
        │ Row per student with:    │
        │ • Scores                 │
        │ • Category               │
        │ • Student ID or NULL     │
        │ • Rank in session        │
        └───────┬──────────────────┘
                │
        ┌───────▼──────────────────────┐
        │ Admin Review Results          │
        │ Display:                      │
        │ • Total linked                │
        │ • Unmatched count             │
        │ • Category distribution       │
        │ • Results table               │
        │                               │
        │ Admin can:                    │
        │ • Adjust weights              │
        │ • Recalculate (go back to     │
        │   compute scores step)        │
        │ • Publish                     │
        └───────┬──────────────────────┘
                │
        ┌───────▼──────────────────┐
        │ Publish to Students      │
        │ Update: is_published=true│
        │ Set: published_at        │
        │                          │
        │ Now visible to:          │
        │ • Students               │
        │ • Faculty                │
        └──────────────────────────┘
```

---

## Database Schema Relationships

```
colleges (1)
    │
    ├─── amcat_sessions (many)
    │        │
    │        ├─ id (PK)
    │        ├─ college_id (FK)
    │        ├─ weights (JSONB)
    │        ├─ thresholds (JSONB)
    │        ├─ is_published (BOOLEAN)
    │        └─ created_by (FK → users)
    │
    ├─── amcat_results (many)
    │        │
    │        ├─ id (PK)
    │        ├─ session_id (FK → amcat_sessions)
    │        ├─ college_id (FK)
    │        ├─ student_id (FK → users, nullable)
    │        ├─ sap_id (VARCHAR)
    │        ├─ scores (cs, cp, automata, automata_fix, quant)
    │        ├─ total_score (COMPUTED)
    │        ├─ category (alpha|beta|gamma, COMPUTED)
    │        └─ rank_in_session (INT)
    │
    └─── student_roster (many)
             │
             ├─ id (PK)
             ├─ college_id (FK)
             ├─ sap_id (VARCHAR)
             ├─ student_id (FK → users, nullable)
             ├─ email
             ├─ full_name
             └─ linked_at (TIMESTAMP, nullable)

Linking Logic:
  amcat_results.student_id ← student_roster.student_id
  (matched via sap_id)
```

---

## API Endpoints

### Admin APIs

**POST /api/admin/amcat**
- Upload AMCAT CSV file
- Create session with weights/thresholds
- Parse & process results
- Returns: Session object with linked count

**GET /api/admin/amcat**
- List all sessions for college
- Returns: Array of sessions

**PUT /api/admin/amcat/[sessionId]**
- Update session metadata
- Returns: Updated session

**PUT /api/admin/amcat/[sessionId]/weights**
- Update scoring weights
- Trigger recalculation
- Returns: Updated results with new categories

**POST /api/admin/amcat/[sessionId]/publish**
- Publish session to students
- Set is_published = true
- Returns: Updated session

### Student APIs

**GET /api/student/amcat**
- Get student's AMCAT results (if published)
- Requires: Auth as student
- Returns: { category, scores, rank, sessionName }

**GET /api/student/amcat/leaderboard**
- Get leaderboard for session
- Optional filter by category
- Returns: Rankings with scores

---

## Scoring Details

### Default Weights
```json
{
  "automata": 50,
  "automata_fix": 20,
  "cp": 10,
  "cs": 10,
  "quant": 10
}
```

### Default Thresholds
```json
{
  "alpha": 60,
  "beta": 40
}
```

### Score Computation
```typescript
function computeAmcatTotal(student, weights) {
  return (
    (student.automata_score * weights.automata / 100) +
    (student.automata_fix_score * weights.automata_fix / 100) +
    (student.cp_score * weights.cp / 100) +
    (student.cs_score * weights.cs / 100) +
    (student.quant_score * weights.quant / 100)
  );
}

function computeAmcatCategory(score, thresholds) {
  if (score >= thresholds.alpha) return "alpha";
  if (score >= thresholds.beta) return "beta";
  return "gamma";
}
```

---

## File Organization

```
SkillSync/
├── app/
│   ├── (admin)/
│   │   └── admin/amcat/
│   │       └── page.tsx                    ← Admin UI
│   │
│   ├── api/
│   │   ├── admin/amcat/
│   │   │   ├── route.ts                    ← Upload handler
│   │   │   └── [sessionId]/
│   │   │       ├── weights/                ← Update weights
│   │   │       ├── publish/                ← Publish session
│   │   │       └── index.ts                ← Get/update session
│   │   │
│   │   └── student/amcat/
│   │       ├── route.ts                    ← Get student results
│   │       └── leaderboard/                ← Get rankings
│   │
│   └── ...
│
├── lib/
│   ├── amcat/
│   │   └── parser.ts                       ← Core logic
│   │
│   ├── db/
│   │   └── schema.ts                       ← Database schema
│   │
│   └── ...
│
├── public/
│   └── amcat-template.csv                  ← Download template
│
├── tests/
│   └── phase9-amcat-import.test.ts         ← Test suite
│
├── scripts/
│   └── amcat-verify.ts                     ← System check
│
├── AMCAT_QUICKSTART.md                     ← 5-min guide
├── AMCAT_IMPORT_GUIDE.md                   ← Admin guide
├── AMCAT_IMPORT_RUNBOOK.md                 ← Checklists
├── AMCAT_DEPLOYMENT_CHECKLIST.md           ← Deploy guide
├── AMCAT_DATABASE_SETUP.md                 ← DB setup
├── AMCAT_IMPLEMENTATION_SUMMARY.md         ← Overview
└── AMCAT_SYSTEM_ARCHITECTURE.md            ← This file
```

---

## Security Architecture

### Row-Level Security (RLS)
```sql
-- All AMCAT tables have RLS enabled
-- College isolation: Users see only their college's data
-- Admin bypass: amcat_management role can see all
```

### Access Control
- **Admin Upload**: Requires `amcat_management` role
- **Student View**: Visible only if session is published
- **Faculty Filters**: See only published results

### Data Privacy
- SAP ID linking is server-side (not exposed to frontend)
- Student results visible only to that student
- Admin can see college data only

---

## Performance Considerations

### Indexes
```sql
-- Key indexes for performance
idx_amcat_sessions_college_published   -- Session queries
idx_amcat_results_session_category     -- Results filtering
idx_amcat_results_student_rank         -- Ranking queries
idx_student_roster_college_linked      -- Linking queries
```

### Query Performance
- Upload 1000 rows: 2-3 seconds
- Recompute scores: 2-3 seconds
- Publish 1000 students: 1-2 seconds
- Leaderboard query: 1 second (100 students)

### Scalability
- Can handle 10,000 students per upload
- Can handle 500+ AMCAT sessions
- Suitable for ~100 colleges

---

## Error Handling

### Upload Validation
```
CSV Format   → Parsed, mapped, validated
Score Values → Must be numeric, >= 0
SAP IDs      → Checked against student_roster
Duplicates   → (session_id, sap_id) must be unique
```

### Linking Errors
```
Unmatched SAP IDs    → Recorded, not excluded
Missing SAP ID       → Validation error
Student not in DB    → Recorded as unmatched
```

### Scoring Errors
```
Weights sum ≠ 100%   → Validation rejected
Invalid thresholds   → Uses defaults
Score < 0            → Treated as 0
Score > 100          → Treated as entered
```

---

## Future Enhancements

### Potential Features
- Bulk import from multiple colleges (atomic)
- Custom category names per session
- Score distribution analytics
- AMCAT session analytics dashboard
- Historical trend analysis
- Batch CSV uploads via scheduler
- Email notifications for publication
- API webhook on category assignment
- Student performance recommendations

### Scalability Improvements
- Add caching for leaderboard queries
- Batch processing for large uploads
- Archive old sessions to separate storage
- Partitioning by college_id

---

## Monitoring & Observability

### Key Metrics
- Upload success rate
- Linking success rate (should be ~95%+)
- Category distribution
- API response times
- System verification status

### Logs to Monitor
```
grep "amcat" app.logs
grep "upload" app.logs
grep "link.*failed" app.logs
```

### Health Checks
```bash
npx tsx scripts/amcat-verify.ts
```

---

## Deployment Pipeline

```
Code Push
    ↓
Run Tests (phase9-amcat-import.test.ts)
    ↓
Build (npm run build)
    ↓
Deploy to Staging
    ↓
Run amcat-verify.ts in staging
    ↓
Manual Testing
    ↓
Deploy to Production
    ↓
Run amcat-verify.ts
    ↓
Monitor Logs
    ↓
Ready for Admin Use
```

---

Last Updated: January 2025  
Maintained by: Data Engineering Team
