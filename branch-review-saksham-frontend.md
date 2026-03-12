# Branch Review: `saksham/frontend-integration`

**Date:** 2026-03-10  
**Reviewer:** Aniruddh (automated analysis)  
**Commit:** `95a4ef7` — *"feat: integrate Next.js UI dashboards and resolve all build conflicts"*  
**Verdict:** ❌ **Do NOT merge**

---

## Summary

| Metric | Value |
|--------|-------|
| Files changed | 109 |
| Lines added | +197 |
| Lines deleted | −13,116 |
| Files added | 10 |
| Files modified | 3 |
| Files deleted | ~96 |
| `package.json` changed | No ✅ |

The branch adds 4 new UI placeholder pages but **deletes the entire existing application** — all API routes, all UI components, all auth providers, and all existing pages.

---

## ✅ What's Done Right

- `package.json` is **not modified** — all backend dependencies are preserved
- Single clean commit with a descriptive message
- New UI pages follow Next.js App Router conventions (`app/student/page.tsx`, etc.)

---

## ❌ Critical Issues

### 1. All API Routes Deleted (Backend Gone)

The following backend routes are deleted with **no replacement**:

| Route | Purpose |
|-------|---------|
| `app/api/drives/route.ts` | Create/list placement drives |
| `app/api/drives/[driveId]/rankings/route.ts` | Student rankings for a drive |
| `app/api/drives/[driveId]/rank/route.ts` | Trigger AI ranking pipeline |
| `app/api/drives/[driveId]/rank/status/route.ts` | Ranking job status |
| `app/api/drives/[driveId]/shortlist/route.ts` | Shortlisted students |
| `app/api/student/profile/route.ts` | Student profile CRUD |
| `app/api/student/profile/merge/route.ts` | Merge duplicate profiles |
| `app/api/student/resume/route.ts` | Resume upload & parsing |
| `app/api/student/dashboard/stats/route.ts` | Dashboard statistics |
| `app/api/student/sandbox/route.ts` | AI practice sandbox |
| `app/api/student/sandbox/detailed/route.ts` | Detailed sandbox analysis |
| `app/api/jobs/[id]/route.ts` | Background job tracking |
| `app/api/test/route.ts` | Health check endpoint |
| + additional routes | Various other endpoints |

### 2. Auth System Deleted

| File | Purpose |
|------|---------|
| `components/providers/auth-provider.tsx` | NextAuth session wrapper |
| `components/providers/auth-gate.tsx` | Role-based access control |
| `components/providers/client-toaster.tsx` | Toast notifications |

`app/layout.tsx` is also rewritten to remove the `<AuthProvider>` and `<ClientToaster>` wrappers.

### 3. Entire UI Component Library Deleted

All shadcn/ui components are removed:

`avatar.tsx` · `badge.tsx` · `button.tsx` · `card.tsx` · `dialog.tsx` · `dropdown-menu.tsx` · `form.tsx` · `input.tsx` · `label.tsx` · `progress.tsx` · `select.tsx` · `separator.tsx` · `skeleton.tsx` · `table.tsx` · `tabs.tsx` · `textarea.tsx`

### 4. All Existing Pages Deleted

| Category | Pages deleted | Replaced? |
|----------|--------------|-----------|
| Student onboarding | welcome, basic, academics, skills, projects, experience, coding-profiles, resume, soft-skills, review (10 pages) | ❌ No |
| Student app | dashboard, profile, sandbox, drives, drive rankings | ❌ No |
| Faculty app | drives list, drive creation, rankings view | ❌ No |
| Admin app | admin dashboard, health check | ❌ No |
| Auth | login page | ❌ No |
| Error pages | 404, unauthorized | ❌ No |

### 5. Faculty Components Deleted

`rankings-table.tsx` · `sidebar-nav.tsx` · `trigger-ranking-button.tsx` · `header.tsx`

---

## What the Branch Adds

| File | Description |
|------|-------------|
| `app/student/page.tsx` | Simple student dashboard mockup (no API calls, no auth) |
| `app/faculty/page.tsx` | Simple faculty dashboard mockup (no API calls, no auth) |
| `app/components/ui.tsx` | Badge & StatCard components |
| `app/page.tsx` (modified) | New landing page with role navigation |
| `public/upes.jpg` | Campus image |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Default create-next-app SVGs |

---

## Root Cause

The developer appears to have started from a **fresh `create-next-app`** scaffold instead of branching from `main`. When merged, Git interprets all existing files (which don't exist in the fresh scaffold) as deletions.

---

## Correct Workflow

```bash
# 1. Start from the existing codebase
git checkout main && git pull origin main

# 2. Create a feature branch
git checkout -b saksham/frontend-integration

# 3. ADD new files alongside existing code
#    - app/student/page.tsx
#    - app/faculty/page.tsx
#    - components/ui.tsx (or extend existing components)
#    DO NOT delete or replace existing files

# 4. Verify nothing breaks
npm run lint
npm run type-check
npx vitest run
npm run build

# 5. Push and open a Pull Request
git push origin saksham/frontend-integration
```

---

## Recommendation

1. **Do NOT merge this branch**
2. Ask the developer to redo the branch following the correct workflow above
3. If the new pages are needed urgently, cherry-pick only the new files:
   ```bash
   git checkout origin/saksham/frontend-integration -- \
     app/student/page.tsx \
     app/faculty/page.tsx \
     app/components/ui.tsx \
     public/upes.jpg
   ```
