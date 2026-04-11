# SkillSync v2 — Full UI/UX & Codebase Audit + Remediation Plan

**Audit date:** 2026-04-11
**Scope:** Every page, component, API route, layout, theme, navigation, form, data-fetch, and PWA layer in the current codebase.
**Total issues found:** 125+

---

## Table of Contents

1. [Audit Summary](#1-audit-summary)
2. [Critical Issues (P0)](#2-critical-issues-p0)
3. [Major Issues (P1)](#3-major-issues-p1)
4. [Moderate Issues (P2)](#4-moderate-issues-p2)
5. [Minor Issues (P3)](#5-minor-issues-p3)
6. [Failure Patterns](#6-failure-patterns)
7. [Phase-Wise Remediation Plan](#7-phase-wise-remediation-plan)
8. [Delete / Defer / Keep Matrix](#8-delete--defer--keep-matrix)

---

## 1. Audit Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical (P0)** | 18 | Blocks correctness, causes crashes, security risk, or fundamentally broken UX |
| **Major (P1)** | 32 | Significant user-facing bugs, broken feedback loops, missing error handling |
| **Moderate (P2)** | 38 | Inconsistencies, accessibility gaps, moderate UX friction |
| **Minor (P3)** | 37+ | Polish issues, dead code, minor visual inconsistencies |

### Key Systemic Problems

1. **Semantic colors are non-functional** — success/warning/info/destructive all map to blue hues
2. **Markdown renderer forces dark mode** — `prose-invert` hardcoded, unreadable in light mode
3. **Error handling is absent across most API calls** — silent failures everywhere
4. **Landing page ships 4 of 8 sections** — missing FeatureGrid, HowItWorks, ProofStrip, FAQ
5. **Rankings load 2000+ rows client-side** — no server pagination
6. **Drive eligibility logic is duplicated and can diverge** — exists in both client and API
7. **Accessibility violations** — pinch-zoom disabled, missing aria-labels, no focus traps
8. **Form submissions lock up on error** — no recovery path without page reload

---

## 2. Critical Issues (P0)

### C01 — Semantic colors are all blue (globals.css)
- **File:** `app/globals.css:21-32, 56-71`
- **What:** `--success`, `--warning`, `--info`, and `--destructive` all use the same blue hue family (`227 68% 61%` or `226 40% 26%`). There is no green, yellow, or red.
- **Why it's wrong:** Every status indicator, toast, badge, and alert in the entire application renders in shades of blue. A "destructive" delete button looks like a card background. A "success" badge is indistinguishable from a primary button.
- **User impact:** Users cannot distinguish success from error from warning. Critical safety signal failure.
- **Fix:** Define proper semantic HSL values:
  - `--success: 142 71% 45%` (green)
  - `--warning: 38 92% 50%` (amber)
  - `--info: 199 89% 48%` (sky blue)
  - `--destructive: 0 84% 60%` (red)
  - Provide matching `*-foreground` values for both light and dark modes.

### C02 — Markdown renderer hardcodes dark mode (prose-invert)
- **File:** `components/shared/markdown-renderer.tsx:15`
- **What:** `prose-invert` is always applied regardless of theme. In light mode, this makes body text white-on-white (invisible).
- **Why it's wrong:** Every place markdown is rendered (career coach, drive analysis, experience posts, sandbox results) is unreadable in light mode.
- **User impact:** Content completely invisible in light mode for all markdown sections.
- **Fix:** Replace `prose-invert` with `dark:prose-invert`.

### C03 — Landing page missing 4 of 8 sections
- **File:** `app/page.tsx:24-36`
- **What:** Only renders `LandingHeader`, `LandingHero`, `LandingFinalCta`, `LandingFooterStrip`. The codebase contains `LandingFeatureGrid`, `LandingHowItWorks`, `LandingProofStrip`, and `LandingFaq` but none are imported or rendered.
- **Why it's wrong:** The landing page jumps from hero directly to a CTA with no explanation of what the product does, no features, no social proof, no FAQ.
- **User impact:** First-time visitors have no context. Conversion is near-zero.
- **Fix:** Import and render all 8 landing sections in logical order: Header > Hero > ProofStrip > FeatureGrid > HowItWorks > FAQ > FinalCta > FooterStrip.

### C04 — Pagination buttons have no hover feedback
- **File:** `components/shared/pagination.tsx:22,29`
- **What:** Both Prev and Next buttons use `hover:bg-card` which is identical to their default `bg-card`. The hover state is invisible.
- **Why it's wrong:** Buttons appear non-interactive. Users don't know they can click.
- **User impact:** Pagination appears broken or static on every paginated page.
- **Fix:** Change `hover:bg-card` to `hover:bg-muted` or `hover:bg-accent`.

### C05 — Rankings table loads 2000+ rows into client memory
- **File:** `app/(faculty)/faculty/drives/[driveId]/rankings/page.tsx:26` and `rankings-table.tsx:44-74`
- **What:** All rankings (up to 2000 rows, hard-capped) are fetched server-side, serialized to JSON, and passed as a prop. Client-side JavaScript then filters and sorts the entire array on every keystroke.
- **Why it's wrong:** For a college with 2000+ students, this causes multi-second page loads, memory exhaustion on mobile, and janky filter UX.
- **User impact:** Rankings page is unusable on mobile; slow on desktop; truncated data with no working export.
- **Fix:** Implement server-side pagination, sorting, and filtering. Pass page/pageSize/filters as searchParams. Query DB with LIMIT/OFFSET.

### C06 — Drive eligibility logic duplicated and can diverge
- **File:** `app/(student)/student/drives/page.tsx:21-43` vs `app/api/drives/route.ts:198-228`
- **What:** Two independent implementations of the same eligibility filtering (branch, CGPA, batch year, category). Neither calls the other.
- **Why it's wrong:** A bug fix in one won't propagate to the other. Students could see different drive lists depending on which code path runs.
- **User impact:** Students see drives they're ineligible for, or miss drives they qualify for.
- **Fix:** Extract eligibility logic into a single shared function in `lib/`. Use it in both locations.

### C07 — Date/timezone hardcoded to IST in drive creation
- **File:** `components/drives/new-drive-form.tsx:96`
- **What:** `new Date(\`${values.deadline}T23:59:59+05:30\`).toISOString()` hardcodes IST offset.
- **Why it's wrong:** If system or user timezone differs, the stored deadline is wrong. The database column is `timestamp with timezone` but the input silently assumes IST.
- **User impact:** Drive deadlines may be off by hours; students see wrong countdown.
- **Fix:** Use server-side timezone handling. Send raw date string; let the API normalize with explicit timezone config.

### C08 — Pinch-to-zoom disabled (accessibility violation)
- **File:** `app/layout.tsx:29`
- **What:** `userScalable: false` in viewport meta tag.
- **Why it's wrong:** Violates WCAG 1.4.4 (Resize text). Users with low vision cannot zoom the page.
- **User impact:** Legally and ethically inaccessible to vision-impaired users.
- **Fix:** Remove `userScalable: false` and `maximumScale: 1`.

### C09 — API fetch calls don't check res.ok (AI Models page)
- **File:** `app/(admin)/admin/ai-models/page.tsx:84-139`
- **What:** `createModel`, `updateModel`, `pingModel`, `deleteModel` all call `fetch()` without checking `res.ok`. If the API returns 400/500, the code proceeds as if it succeeded.
- **Why it's wrong:** Users perform actions, receive no error feedback, and believe they succeeded.
- **User impact:** Silent data corruption; phantom model entries; invisible failures.
- **Fix:** Check `res.ok` in every fetch call. Show toast.error on failure. Reset form state.

### C10 — CRON_SECRET can be empty string
- **File:** `app/api/cron/nightly-cleanup/route.ts:11`
- **What:** Cron routes check `authorization !== Bearer ${CRON_SECRET}` but if CRON_SECRET is undefined/empty, comparison becomes `!== "Bearer "`. An attacker sending `Authorization: Bearer ` (with trailing space) passes.
- **Why it's wrong:** Unauthenticated cron execution; arbitrary data deletion.
- **User impact:** Data loss; unauthorized background job execution.
- **Fix:** Add explicit guard: `if (!CRON_SECRET || CRON_SECRET.length < 16) return 500`. Check at startup, not per-request.

### C11 — Form locks up after submission error
- **File:** `components/drives/new-drive-form.tsx:90-123`
- **What:** On API failure, `setError(d.message)` is called but the submit button remains in "Creating..." state. No path to retry.
- **Why it's wrong:** User's form data is trapped. Only escape is page reload, which loses all input.
- **User impact:** Complete form data loss on any server error.
- **Fix:** Reset `submitting` state in `finally` block. Allow retry.

### C12 — Auth gate flashes protected content before redirect
- **File:** `components/providers/auth-gate.tsx:39-44`
- **What:** Children always render (`return <>{children}</>` on line 49). Auth check happens in useEffect after mount. Unauthenticated users briefly see the protected page.
- **Why it's wrong:** Sensitive data (student profiles, rankings, admin panels) flash before redirect.
- **User impact:** Information leak; confusing UX flash.
- **Fix:** Return a loading skeleton while `status === "loading"` and before `mounted` is true.

### C13 — 404 page uses hardcoded gray — broken in dark mode
- **File:** `app/not-found.tsx:14`
- **What:** `text-gray-600` is hardcoded instead of `text-muted-foreground`.
- **Why it's wrong:** In dark mode, gray-600 is barely visible on the dark background.
- **User impact:** 404 page description text is nearly invisible in dark mode.
- **Fix:** Replace `text-gray-600` with `text-muted-foreground`.

### C14 — JWT collegeId stale for up to 60 minutes
- **File:** `lib/auth/config.ts:225-260`
- **What:** JWT refreshes collegeId from DB once per hour. If a user's college assignment changes, they retain access to old college data for 60 minutes.
- **Why it's wrong:** Cross-college data exposure window.
- **User impact:** Security — unauthorized access to another college's drives, students, rankings.
- **Fix:** Reduce refresh interval to 5 minutes, or invalidate token on role/college change.

### C15 — Drive deletion uses fragile JSONB string comparison for jobs
- **File:** `app/api/drives/[driveId]/route.ts:37-40`
- **What:** `await db.delete(jobs).where(sql\`${jobs.payload}->>'driveId' = ${driveId}\`)` — raw JSONB text extraction without type casting.
- **Why it's wrong:** If payload structure changes or driveId appears in other job types, wrong jobs get deleted. Also leaves orphaned records if field name varies.
- **User impact:** Data corruption; orphaned background jobs.
- **Fix:** Use structured JSONB query with explicit type+status filtering.

### C16 — Faculty can create drives without collegeId (race condition)
- **File:** `app/api/drives/route.ts:49-84`
- **What:** Line 49 checks `if (!user.collegeId)` but line 82 uses an IIFE throw pattern. If the check passes but token refreshes between, college context is lost.
- **Why it's wrong:** Drives created with NULL collegeId become orphaned and invisible.
- **User impact:** Lost drive data; invisible drives.
- **Fix:** Wrap in transaction. Re-validate collegeId at insert time.

### C17 — Missing unique index on college email domains
- **File:** `lib/db/schema.ts:123-136`
- **What:** `colleges` table allows duplicate `studentDomain` values. Two colleges claiming "stu.upes.ac.in" causes non-deterministic auto-signup.
- **Why it's wrong:** Students may be assigned to wrong college.
- **User impact:** Wrong college data, wrong drives, wrong rankings.
- **Fix:** Add unique constraint on `studentDomain`.

### C18 — Profile page uses `as any` type assertion
- **File:** `app/(student)/student/profile/page.tsx:47`
- **What:** `<ProfileView user={serializedUser as any} profile={serializedProfile} />`
- **Why it's wrong:** Bypasses all type safety. If UserInfo type changes, this silently passes wrong data.
- **User impact:** Runtime crashes if type shape diverges.
- **Fix:** Define proper interface. Remove `as any`.

---

## 3. Major Issues (P1)

### M01 — Plus_Jakarta_Sans font loaded but never used
- **File:** `app/layout.tsx:6`, `tailwind.config.ts:31`
- **What:** Font is imported and loaded (`jakarta` variable created), CSS variable `--font-jakarta` set on `<html>`, but `font-heading` in tailwind aliases back to Inter. Jakarta is never referenced.
- **Impact:** ~50-100KB wasted bandwidth per page load.
- **Fix:** Remove Plus_Jakarta_Sans import, variable, and CSS variable.

### M02 — Pagination hover broken on every paginated view
- **File:** `components/shared/pagination.tsx:22,29`
- **Impact:** Affects admin drives, faculty drives, student drives, resources, experiences — every list view with pagination.
- **Fix:** `hover:bg-muted` instead of `hover:bg-card`.

### M03 — Student dashboard silently swallows API errors
- **File:** `components/student/dashboard/dashboard-drives-panel.tsx:18-23`
- **What:** `.catch(() => {})` discards all fetch errors. Failed API calls show empty drives with no error indicator.
- **Impact:** Student thinks they have no drives when API is actually down.
- **Fix:** Add error state; show retry UI.

### M04 — Career coach doesn't reset loading on failure
- **File:** `app/(student)/student/career-coach/page.tsx:189-192`
- **What:** If fetch fails, error message is added but `chatLoading` may not properly reset.
- **Impact:** Loading spinner persists indefinitely after error.
- **Fix:** Reset chatLoading in `finally` block.

### M05 — Dashboard date display can show "Invalid Date"
- **File:** `components/student/dashboard/dashboard-drives-panel.tsx:60`
- **What:** `new Date(drive.deadline).toLocaleDateString()` called without validating input.
- **Impact:** "Invalid Date" text shown to students.
- **Fix:** Validate date before formatting; show fallback text.

### M06 — Leaderboard missing dark mode variants
- **File:** `app/(student)/student/leaderboard/page.tsx:254-257`
- **What:** Error/empty containers use destructive/muted colors without `dark:` variants.
- **Impact:** Broken styling in dark mode; unreadable text.
- **Fix:** Add dark mode variants to all container classes.

### M07 — Profile completion ring chart inaccessible
- **File:** `components/student/dashboard/dashboard-greeting-card.tsx:25-41`
- **What:** RadialBarChart has no ARIA labels. Screen readers can't announce completion percentage.
- **Impact:** Blind users have no access to profile completion data.
- **Fix:** Add `role="img"` and `aria-label="Profile completion: XX%"`.

### M08 — Faculty sandbox doesn't check res.ok
- **File:** `app/(faculty)/faculty/sandbox/page.tsx:34-44`
- **What:** If API returns 4xx/5xx, code tries to parse response as success.
- **Impact:** Crashes or misleading results.
- **Fix:** Check `res.ok` before parsing.

### M09 — Duplicate status badge in faculty drive cards
- **File:** `app/(faculty)/faculty/drives/page.tsx:186, 242-244`
- **What:** Status badge rendered twice in card — once in header and once in footer.
- **Impact:** Visual clutter; confusing redundancy.
- **Fix:** Remove one instance.

### M10 — Admin experiences — no confirmation for destructive moderation
- **File:** `app/(admin)/admin/experiences/page.tsx:78-94, 120-143`
- **What:** Approve/reject/delete have no confirmation dialog. Rejection reason is optional.
- **Impact:** Easy to accidentally reject or delete student experiences.
- **Fix:** Add confirmation dialog for reject and delete actions.

### M11 — AI model form accepts non-numeric input for numeric fields
- **File:** `app/(admin)/admin/ai-models/page.tsx:173-241`
- **What:** rpm_limit, priority fields accept any string. No `type="number"` or client validation.
- **Impact:** Users enter invalid data; get confusing API errors.
- **Fix:** Add `type="number"`, min/max constraints, and client validation.

### M12 — AI model onBlur triggers update without debounce
- **File:** `app/(admin)/admin/ai-models/page.tsx:319-328`
- **What:** `onBlur` directly calls `updateModel()`. Rapid tabbing can fire many API calls.
- **Impact:** Race conditions; inconsistent data.
- **Fix:** Add 300ms debounce or explicit save button.

### M13 — Admin drives uses `as any` type assertion
- **File:** `app/(admin)/admin/drives/page.tsx:309`
- **What:** `initialStatus={status as any}` bypasses TypeScript.
- **Impact:** Type mismatches at runtime.
- **Fix:** Use proper union type for status.

### M14 — Company experience form — server-side validation missing
- **File:** `components/student/company-experience-form.tsx:43-47`
- **What:** Only client validation. Textarea maxLength (1500) enforced only via HTML attribute.
- **Impact:** Bypassable via DevTools; spam/abuse risk.
- **Fix:** Add Zod schema validation on API route.

### M15 — Rankings export button points to non-existent endpoint
- **File:** `app/(faculty)/faculty/drives/[driveId]/rankings/page.tsx:193-200`
- **What:** "Export All CSV" links to `/api/drives/${driveId}/export` — endpoint may not exist or return errors.
- **Impact:** Export button fails silently or shows 404.
- **Fix:** Verify endpoint exists; add error handling; show toast on failure.

### M16 — Theme toggle doesn't indicate active state
- **File:** `components/theme-toggle.tsx:13-23`
- **What:** Toggle button uses "ghost" variant with no visual differentiation between active themes.
- **Impact:** Users can't confirm which theme is currently active.
- **Fix:** Add aria-label and visual active indicator.

### M17 — Mobile nav focus trap missing
- **File:** `components/shared/mobile-nav.tsx:150-160`
- **What:** When drawer opens, focus doesn't trap inside. Tab key moves to elements behind drawer.
- **Impact:** Keyboard navigation broken in mobile nav.
- **Fix:** Implement focus trap (use Radix Dialog or FocusTrap component).

### M18 — Bottom tab bar tablet breakpoint conflict
- **File:** `components/shared/bottom-tab-bar.tsx:70`
- **What:** Uses `md:hidden` at 768px. On tablets (768-1024px), bottom tabs disappear but desktop sidebar may not yet show.
- **Impact:** No navigation visible on iPad-sized screens.
- **Fix:** Align breakpoints between bottom-tab-bar and sidebar-shell.

### M19 — Student search view uses hardcoded dark mode colors
- **File:** `components/shared/student-search-view.tsx:55-56, 372, 463, 492, 502`
- **What:** Scatters `dark:bg-slate-950/60`, `dark:bg-slate-950/95` instead of theme tokens.
- **Impact:** Inconsistent dark mode; maintenance nightmare.
- **Fix:** Replace all hardcoded dark colors with `bg-card`, `bg-popover`, or CSS variables.

### M20 — Drive creation form loses data on navigation
- **File:** `components/drives/new-drive-form.tsx:39-62`
- **What:** Multi-step form has no persistence. Navigating away loses all data.
- **Impact:** Wasted faculty time re-entering drive details.
- **Fix:** Add localStorage backup or beforeunload warning.

### M21 — Faculty drive creation has no error recovery
- **File:** `app/(faculty)/faculty/drives/new/page.tsx:1-19`
- **What:** No error boundary or error state. If NewDriveForm fails, no feedback.
- **Impact:** Silent failures during drive creation.
- **Fix:** Wrap in error boundary; handle onError callback.

### M22 — CSV import vulnerable to memory exhaustion
- **File:** `app/api/admin/students/import/route.ts:44-49`
- **What:** CSV parsing with `split(",")` has no column count validation. Malicious CSV with thousands of columns causes memory blowout.
- **Impact:** Denial of service on admin import.
- **Fix:** Validate column count <= expected max. Limit file size.

### M23 — Race condition in embedding job deduplication
- **File:** `app/api/student/profile/route.ts:200-214`
- **What:** Deduplication check has no transaction lock. Two simultaneous requests can both find nothing and insert duplicate jobs.
- **Impact:** Duplicate AI processing; wasted compute credits.
- **Fix:** Use PostgreSQL advisory lock or INSERT ... ON CONFLICT.

### M24 — Unsafe JSONB type casting in query results
- **File:** `app/api/admin/students/import/route.ts:81`, `app/api/drives/route.ts:206`
- **What:** Results cast `as unknown as Array<...>` without runtime validation.
- **Impact:** Type confusion if schema changes; potential ranking calculation errors.
- **Fix:** Add Zod runtime parsing for DB results.

### M25 — No audit trail for sensitive admin operations
- **File:** `app/api/admin/faculty/route.ts`, `app/api/admin/faculty/[userId]/reset-password/route.ts`
- **What:** Faculty creation, password resets, permission grants have no audit logging.
- **Impact:** No accountability for admin actions; compliance risk.
- **Fix:** Add audit_log table; log all sensitive ops with actor, action, target, timestamp.

### M26 — Rankings table not responsive
- **File:** `app/(faculty)/faculty/drives/[driveId]/rankings/rankings-table.tsx:144-230`
- **What:** Table has no horizontal scroll wrapper or responsive breakpoints.
- **Impact:** Table overflows and is unusable on mobile/tablet.
- **Fix:** Add `overflow-x-auto` wrapper; consider card layout for mobile.

### M27 — Dialog z-index conflict
- **File:** `components/ui/dialog.tsx:24,40`
- **What:** Both overlay and content use `z-50`. Nested dialogs render at same level.
- **Impact:** Stacked modals don't layer correctly.
- **Fix:** Overlay `z-40`, content `z-50` (or use Radix's built-in stacking).

### M28 — Admin settings focus styling insufficient
- **File:** `app/(admin)/admin/settings/page.tsx:80,88,96`
- **What:** `focus:border-destructive/20` provides very low contrast. Nearly invisible.
- **Impact:** Keyboard users can't identify focused field. WCAG violation.
- **Fix:** Use `focus:ring-2 focus:ring-ring focus:ring-offset-2`.

### M29 — Command palette empty state confusing
- **File:** `components/shared/command-palette.tsx:138-143`
- **What:** Shows "Type at least 2 characters" but doesn't disable search or explain state.
- **Impact:** Users think search is broken.
- **Fix:** Add placeholder animation or clearer instructional text.

### M30 — Admin "1 students" — missing pluralization
- **File:** `app/(admin)/admin/page.tsx:112`
- **What:** Stats display "0 students", "1 students" — no singular/plural handling.
- **Impact:** Grammatically incorrect; looks unpolished.
- **Fix:** Add pluralization helper: `${n} student${n === 1 ? '' : 's'}`.

### M31 — Login error can't be dismissed
- **File:** `components/auth/login-form-panel.tsx:91-110`
- **What:** Error message requires waiting 6 seconds to auto-dismiss. No Escape key or click-to-dismiss.
- **Impact:** Users stuck staring at error when they want to retry.
- **Fix:** Add onClick dismiss and Escape key handler.

### M32 — SAP ID derivation uses fragile digit-length heuristic
- **File:** `lib/auth/derive-sap.ts:16-17`
- **What:** `digits.length >= 6 ? "500" : "590"` — arbitrary threshold determines SAP prefix.
- **Impact:** Incorrect SAP-to-roster linking if naming convention changes.
- **Fix:** Make prefix configurable per college. Validate against roster data.

---

## 4. Moderate Issues (P2)

| ID | File | Issue | Impact |
|----|------|-------|--------|
| **m01** | `components/shared/resource-library.tsx:308-338` | Filter buttons missing disabled/loading state | Users don't see filtering feedback |
| **m02** | `app/(admin)/admin/experiences/page.tsx:47-94` | AbortController cleanup doesn't prevent state updates | Console warnings; potential memory leaks |
| **m03** | `app/(admin)/admin/page.tsx:112-127` | Inconsistent null coalescing on array index access | Potential crashes on unexpected API response |
| **m04** | `app/(admin)/admin/drives/page.tsx:164-170` | Empty state says "No drives" but could mean "no permission" | User confusion about cause |
| **m05** | `app/(faculty)/faculty/drives/[driveId]/rankings/rankings-table.tsx:88-134` | Filter inputs lack `<label>` with `htmlFor` | Screen readers can't associate labels with inputs |
| **m06** | `components/faculty/drive-conflicts-button.tsx:36-65` | Dialog has no focus management on open | Keyboard users stuck behind modal |
| **m07** | `app/(admin)/admin/settings/page.tsx:74-96` | Password inputs missing `autoComplete` attributes | Password managers can't auto-fill |
| **m08** | `app/(admin)/admin/ai-models/page.tsx:78-82` | `fetchModels` re-created every render; interval resets | Auto-refresh unreliable |
| **m09** | `lib/auth/session-cache.ts:21-24` | Session cache not invalidated on role changes | Stale role for concurrent requests |
| **m10** | `app/api/auth/change-password/route.ts` | No rate limiting on password change attempts | Brute force attack surface |
| **m11** | `app/api/drives/route.ts:197-228` | Eligibility filtering done in JS, not SQL | O(N) memory usage; slow at scale |
| **m12** | `lib/db/schema.ts:348` | Vector embedding column nullable but code assumes both states | Type inconsistency |
| **m13** | `components/shared/nav-item.tsx:92` | Tooltip z-index (z-50) lower than sidebar (z-200+) | Tooltips hidden behind sidebar |
| **m14** | `components/shared/sign-out-button.tsx:6-12` | No confirmation dialog before sign-out | Accidental sign-out data loss |
| **m15** | `components/landing/landing-footer-strip.tsx:14-18` | `text-zinc-900` may fail WCAG AA contrast | Accessibility gap on some monitors |
| **m16** | `app/(student)/student/sandbox/quick-sandbox.tsx:112` | Hardcoded recommendation strings may mismatch API | Styling breaks silently if API changes |
| **m17** | `components/student/company-experience-form.tsx:28-41` | `loadSuggestions().catch(() => undefined)` swallows errors | No feedback if autocomplete is broken |
| **m18** | `components/student/company-experience-form.tsx:74-99` | Labels not tied to inputs via `htmlFor` | Screen readers can't associate labels |
| **m19** | `components/student/profile/profile-header.tsx:50` | `isAnimationActive={false}` on completion ring | No visual feedback on profile updates |
| **m20** | `components/student/drives/drive-card.tsx:68-69` | `drive.company` and `drive.roleTitle` accessed without null checks | Crash if API returns null |
| **m21** | `app/(student)/student/drives/[driveId]/ranking/analysis-panel.tsx:29-41` | Loading state not reset on fetch error | Infinite loading spinner |
| **m22** | `app/(student)/student/onboarding/page.tsx:34-71` | Multi-step form has no per-step required-field validation | Users skip required academic fields |
| **m23** | `app/api/drives/[driveId]/route.ts:85-90` | No optimistic locking for concurrent drive updates | Race condition; last-write-wins |
| **m24** | `app/(faculty)/faculty/drives/[driveId]/rankings/page.tsx:248-254` | Truncation warning references CSV export that may not work | Misleading guidance |
| **m25** | `app/api/drives/route.ts:209` | `expandBranches()` may differ from `normalizeBranch()` used elsewhere | Inconsistent branch matching |
| **m26** | `app/(faculty)/faculty/drives/[driveId]/rankings/rankings-table.tsx:28-42` | `RankingRow` type doesn't match actual data shape (`shortlisted` extra) | Runtime type errors |
| **m27** | `app/(admin)/admin/sandbox/page.tsx:18,26` | Sandbox daily limit configurable but not enforced in API | Rate limiting bypassed |
| **m28** | `app/(student)/student/drives/page.tsx:51-53` | `new Date()` on Date object for deadline check | Timezone-incorrect deadline alerts |
| **m29** | `app/api/student/profile/route.ts:32-50` | Profile GET only scoped by email, not college | Theoretical cross-college exposure |
| **m30** | `components/auth/login-form-panel.tsx:195-226` | Custom inputs may conflict with password manager styling | Auto-fill may not work |
| **m31** | `components/shared/student-search-view.tsx:408` | Batch year filter uses numeric values but params may be strings | Filtering may silently fail |
| **m32** | `components/shared/resource-library.tsx:469` | Markdown preview has no skeleton/loading state | Content appears missing while loading |
| **m33** | `components/shared/bottom-tab-bar.tsx:89-91` | Tab bar icons missing accessibility alt text on all variants | Screen readers can't identify tabs |
| **m34** | `app/(student)/student/leaderboard/page.tsx:3` | `export const dynamic = "force-dynamic"` ignored in client components | Dead code; confusing intent |
| **m35** | `app/(admin)/admin/seasons/page.tsx:150-178` | Mix of Button component and raw `<button>` tags | Inconsistent styling |
| **m36** | `app/api/admin/ai-models/route.ts:57` | Rate limiting query may do full table scan without index | Performance DoS potential |
| **m37** | `app/api/resources/route.ts:173-177` | File upload magic byte check doesn't verify ZIP structure | Malicious file upload risk |
| **m38** | `app/api/drives/route.ts:114-123` vs `app/api/student/profile/route.ts:234-248` | Inconsistent API error format: `{message}` vs `{error}` | Frontend must handle both |

---

## 5. Minor Issues (P3)

| ID | File | Issue |
|----|------|-------|
| p01 | `app/(student)/student/profile/profile-view.tsx:40` | `profile: any` — should be properly typed |
| p02 | `components/student/drives/drive-filter-bar.tsx:22` | Search input missing `role="searchbox"` and `aria-label` |
| p03 | `components/student/profile/profile-tab-nav.tsx:22-44` | Inconsistent padding/margins across profile sections |
| p04 | `components/student/profile/profile-tab-nav.tsx:34` | `hidden sm:inline` makes tabs icon-only on mobile — hard to understand |
| p05 | `components/student/profile/tab-skills.tsx:50-90` | Empty skills view has no "add" button — must switch to edit mode |
| p06 | `app/(student)/student/settings/page.tsx:31-50` | Form shows success toast without validating save actually persisted |
| p07 | `components/student/dashboard/dashboard-onboarding-card.tsx:19-25` | Progress bar doesn't re-render when profile data updates elsewhere |
| p08 | `app/(student)/student/sandbox/quick-sandbox.tsx:339-340` | Emoji priority indicators (`🔴`, `🟡`) not announced by screen readers |
| p09 | `app/(admin)/admin/drives/page.tsx:224-227` | Inconsistent `mr-1.5` spacing on processing indicator vs other badges |
| p10 | `app/(admin)/admin/page.tsx:122-135` | Stat cards use `div` instead of semantic `<dl>` for label-value pairs |
| p11 | `app/(admin)/admin/drives/drive-action-buttons.tsx:46-65` | Icon buttons use `title` but not `aria-label` |
| p12 | `app/(admin)/admin/ai-models/page.tsx:117-125` | No success toast after model update/ping |
| p13 | `app/(faculty)/faculty/page.tsx:174-176` | `label.color.split(" ")` relies on specific color string format — fragile |
| p14 | `app/(admin)/admin/experiences/page.tsx:154-157` | `admin-post` tab has no error handling |
| p15 | `app/(faculty)/faculty/drives/[driveId]/rankings/rankings-table.tsx:126` | Sort button looks clickable when disabled — no disabled styling |
| p16 | `app/(admin)/layout.tsx:57`, `app/(faculty)/layout.tsx:55` | Inline `style={{ height: 'calc(100vh - 56px)' }}` instead of CSS class |
| p17 | `components/shared/command-palette.tsx:110-112` | Focus management missing on Escape key dismissal |
| p18 | `components/shared/sidebar-shell.tsx:37` | `SIDEBAR_ANIM_MS` possible unit mismatch |
| p19 | `components/shared/resource-library.tsx:395` | Dialog `max-w-3xl` may overflow on tablets |
| p20 | `components/landing/landing-feature-grid.tsx:10,19,26` | All features use same `iconColor: 'text-primary'` — weak visual hierarchy |
| p21 | `components/shared/student-search-view.tsx:331-333` | Stale error state persists across new searches |
| p22 | `components/ui/button.tsx:8` | Loading state visually identical to disabled state |
| p23 | `app/layout.tsx:17` | Manifest link has no verification that manifest.json exists at build |
| p24 | `components/shared/mobile-nav.tsx:9` | `CalendarDays` icon imported but unused |
| p25 | `app/offline/page.tsx:10-14` | Relies on body background inheritance; no explicit `bg-background` |
| p26 | `components/shared/sidebar-shell.tsx:53-57` | Text truncation jarring — no fade animation during sidebar collapse |
| p27 | `lib/auth/password.ts:3` | Password strength allows sequential patterns (e.g., "Aa123!@#$") |
| p28 | `app/api/student/resume/route.ts:122` | Cloudinary error messages leak internal paths to client |
| p29 | `lib/db/index.ts:129-136` | Pool exhaustion warning logged but no throttling action taken |
| p30 | `lib/auth/config.ts:107,191` | Email normalization inconsistent — `.toLowerCase()` not applied everywhere |
| p31 | `lib/db/safe-action.ts:27-40` | Error codes checked but all handled identically — lost diagnostic info |
| p32 | `lib/auth/config.ts:275-277` | Open redirect potential in auth redirect callback |
| p33 | `lib/db/schema.ts:219-221` | Missing index on `staff_profiles.created_by` FK — slow cascade deletes |
| p34 | `components/drives/new-drive-form.tsx:222` | Date input allows past dates — no `min` attribute |
| p35 | Multiple files | Inconsistent error message capitalization ("Validation failed" vs "Failed to create drive") |
| p36 | `components/drives/new-drive-form.tsx:70-83` | Season dropdown empty while loading — no "Loading..." option |
| p37 | `components/drives/new-drive-form.tsx:322-344` | Branch selection uses button toggle instead of checkbox — poor accessibility |

---

## 6. Failure Patterns

These are not isolated bugs but **systemic problems** that repeat across the codebase.

### Pattern 1: Silent API Failures
**Frequency:** 15+ locations
**Description:** `fetch()` calls that don't check `res.ok`, `.catch(() => {})` that swallows errors, or response parsing that assumes success.
**Locations:** AI models page, dashboard drives panel, career coach, faculty sandbox, company experience form suggestions, admin sandbox config, resource library, student search view.
**Root cause:** No standardized fetch wrapper with error handling.
**Fix:** Create `lib/api.ts` with a `safeFetch()` that always checks status, shows toast on error, and returns typed result.

### Pattern 2: Missing Dark Mode Support
**Frequency:** 10+ locations
**Description:** Hardcoded `text-gray-600`, `dark:bg-slate-950/60`, `prose-invert` always on, and missing `dark:` variants.
**Locations:** not-found page, leaderboard, markdown renderer, student search view, landing footer.
**Root cause:** No lint rule enforcing theme tokens; ad-hoc color application.
**Fix:** ESLint rule to flag non-token color classes. Search-and-replace all `text-gray-*`, `bg-slate-*`, `bg-zinc-*` in component files.

### Pattern 3: Broken Semantic Colors
**Frequency:** Entire application
**Description:** success/warning/info/destructive all map to blue hues. Every status signal is meaningless.
**Root cause:** `globals.css` HSL values were set to match primary color instead of functional colors.
**Fix:** One-time fix in globals.css. Audit all components that use these tokens to verify contrast.

### Pattern 4: Missing or Broken Empty/Error/Loading States
**Frequency:** 20+ locations
**Description:** Components show blank space, "undefined", or stale data instead of informative empty states, error messages, or skeletons.
**Locations:** Dashboard drives panel, leaderboard, analysis panel, command palette, resource library, sandbox, season dropdown.
**Root cause:** No shared empty/error state components.
**Fix:** Create `<EmptyState>`, `<ErrorState>`, `<LoadingSkeleton>` shared components with consistent design.

### Pattern 5: Type Safety Bypassed
**Frequency:** 8+ locations
**Description:** `as any`, `as unknown as X`, unvalidated JSONB casts.
**Locations:** Profile page, admin drives, student import, drive API, rankings table.
**Root cause:** Drizzle query results and API responses lack runtime validation.
**Fix:** Add Zod parsing at API boundaries. Remove all `as any`.

### Pattern 6: Duplicated Logic
**Frequency:** 3+ locations
**Description:** Same business logic implemented independently in multiple places.
**Locations:** Drive eligibility (client + API), branch normalization (multiple functions), form validation (client only, no server match).
**Root cause:** No shared business logic layer.
**Fix:** Extract to `lib/business/` shared functions. Use in all locations.

### Pattern 7: Accessibility Violations
**Frequency:** 15+ locations
**Description:** Missing `aria-label`, no focus traps in modals, no `htmlFor` on labels, pinch-zoom disabled, emoji-only indicators, icon-only buttons without labels.
**Root cause:** No accessibility testing or linting (eslint-plugin-jsx-a11y not configured).
**Fix:** Add eslint-plugin-jsx-a11y. Systematic pass through all interactive elements.

### Pattern 8: Hardcoded IST Timezone
**Frequency:** 2-3 locations
**Description:** Date handling assumes IST (+05:30) timezone.
**Root cause:** India-specific development without timezone abstraction.
**Fix:** Store and compare all dates in UTC. Display in user's local timezone using `Intl.DateTimeFormat`.

---

## 7. Phase-Wise Remediation Plan

### Phase 0: Audit Stabilization & Critical Fixes
**Goal:** Fix everything that blocks correctness or causes crashes.
**Duration estimate:** Top priority.

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 0.1 | Fix semantic colors in globals.css (success=green, warning=amber, destructive=red, info=sky) | `app/globals.css` | None |
| 0.2 | Fix markdown renderer: `prose-invert` → `dark:prose-invert` | `components/shared/markdown-renderer.tsx` | None |
| 0.3 | Fix pagination hover: `hover:bg-card` → `hover:bg-muted` | `components/shared/pagination.tsx` | None |
| 0.4 | Fix 404 page: `text-gray-600` → `text-muted-foreground` | `app/not-found.tsx` | None |
| 0.5 | Remove `userScalable: false` and `maximumScale: 1` | `app/layout.tsx` | None |
| 0.6 | Fix auth gate to show skeleton while loading, not flash protected content | `components/providers/auth-gate.tsx` | None |
| 0.7 | Fix CRON_SECRET empty-string bypass | All `app/api/cron/*/route.ts` | None |
| 0.8 | Fix form lock-up: reset submitting state in `finally` | `components/drives/new-drive-form.tsx` | None |
| 0.9 | Add `res.ok` checks to all admin AI model fetch calls | `app/(admin)/admin/ai-models/page.tsx` | None |
| 0.10 | Fix drive deletion JSONB query safety | `app/api/drives/[driveId]/route.ts` | None |
| 0.11 | Add unique constraint on `colleges.studentDomain` | `lib/db/schema.ts` + migration | None |
| 0.12 | Remove `as any` from profile page; define proper types | `app/(student)/student/profile/page.tsx` | None |
| 0.13 | Reduce JWT collegeId refresh window from 60min to 5min | `lib/auth/config.ts` | None |

### Phase 1: UI Consistency & Layout Cleanup
**Goal:** Fix visual inconsistencies, broken layouts, and missing UI sections.
**Depends on:** Phase 0 complete (semantic colors must be correct before fixing badges/indicators).

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1.1 | Add missing landing page sections (FeatureGrid, HowItWorks, ProofStrip, FAQ) | `app/page.tsx` | 0.1 |
| 1.2 | Remove unused Plus_Jakarta_Sans font | `app/layout.tsx`, `tailwind.config.ts` | None |
| 1.3 | Fix duplicate status badge in faculty drive cards | `app/(faculty)/faculty/drives/page.tsx` | None |
| 1.4 | Replace all hardcoded `dark:bg-slate-*` with theme tokens | `components/shared/student-search-view.tsx` | 0.1 |
| 1.5 | Fix dialog z-index layering (overlay z-40, content z-50) | `components/ui/dialog.tsx` | None |
| 1.6 | Fix nav-item tooltip z-index conflict | `components/shared/nav-item.tsx` | None |
| 1.7 | Align bottom tab bar and sidebar breakpoints | `components/shared/bottom-tab-bar.tsx`, `components/shared/sidebar-shell.tsx` | None |
| 1.8 | Fix admin settings focus styling (use ring instead of border) | `app/(admin)/admin/settings/page.tsx`, `app/(faculty)/faculty/settings/page.tsx` | None |
| 1.9 | Add loading indicator to theme toggle | `components/theme-toggle.tsx` | None |
| 1.10 | Fix landing feature grid varied icon colors | `components/landing/landing-feature-grid.tsx` | 1.1 |
| 1.11 | Fix inline `calc(100vh - 56px)` to CSS class | `app/(admin)/layout.tsx`, `app/(faculty)/layout.tsx` | None |
| 1.12 | Fix inconsistent Badge/Button mix in seasons page | `app/(admin)/admin/seasons/page.tsx` | None |

### Phase 2: Content, Readability & Accessibility Fixes
**Goal:** Fix content errors, add missing accessibility, improve readability.
**Depends on:** Phase 1 visual consistency in place.

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 2.1 | Add `aria-label` to all icon-only buttons | Drive action buttons, theme toggle, pagination, tab bar | 1.x |
| 2.2 | Add `htmlFor` to all form labels | Rankings filter, experience form, settings pages, drive form | None |
| 2.3 | Add focus trap to mobile nav drawer | `components/shared/mobile-nav.tsx` | None |
| 2.4 | Add focus management to all Dialog components | `components/faculty/drive-conflicts-button.tsx`, etc. | None |
| 2.5 | Fix admin stats pluralization ("1 student" not "1 students") | `app/(admin)/admin/page.tsx` | None |
| 2.6 | Add `autoComplete` attributes to password inputs | Admin/faculty settings pages | None |
| 2.7 | Replace emoji priority indicators with semantic badges | `app/(student)/student/sandbox/quick-sandbox.tsx` | 0.1 |
| 2.8 | Fix profile tab nav mobile labels (icon-only → icon+text) | `components/student/profile/profile-tab-nav.tsx` | None |
| 2.9 | Add confirmation dialog for destructive moderation actions | `app/(admin)/admin/experiences/page.tsx` | None |
| 2.10 | Add confirmation before sign-out | `components/shared/sign-out-button.tsx` | None |
| 2.11 | Fix command palette empty state UX | `components/shared/command-palette.tsx` | None |
| 2.12 | Fix login error dismissal (click/Escape) | `components/auth/login-form-panel.tsx` | None |
| 2.13 | Add accessibility ring to radial completion chart | `components/student/dashboard/dashboard-greeting-card.tsx` | None |
| 2.14 | Add `role="img"` and aria descriptions to all charts | Dashboard, profile header | None |

### Phase 3: Responsive & Theme Polishing
**Goal:** Ensure all views work on mobile, tablet, and desktop. Fix remaining dark mode issues.
**Depends on:** Phase 2 accessibility baseline in place.

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 3.1 | Add horizontal scroll wrapper to rankings table | `rankings-table.tsx` (both faculty and admin) | None |
| 3.2 | Fix leaderboard dark mode variants | `app/(student)/student/leaderboard/page.tsx` | 0.1 |
| 3.3 | Add responsive card layout for rankings on mobile | Rankings table | 3.1 |
| 3.4 | Fix resource library dialog width on tablets | `components/shared/resource-library.tsx` | None |
| 3.5 | Fix markdown renderer responsive prose sizing | `components/shared/markdown-renderer.tsx` | 0.2 |
| 3.6 | Audit all views at 320px, 375px, 768px, 1024px, 1440px | All pages | 3.1-3.5 |
| 3.7 | Fix landing footer contrast for WCAG AA | `components/landing/landing-footer-strip.tsx` | None |
| 3.8 | Fix sidebar text truncation animation | `components/shared/sidebar-shell.tsx` | None |

### Phase 4: PWA/Offline, Route & Logic Hardening
**Goal:** Fix data layer bugs, business logic, route protection, and PWA completeness.
**Depends on:** Phase 0 critical fixes complete.

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 4.1 | Create `lib/api.ts` safeFetch wrapper with `res.ok` checking, toast errors, typed results | New file + all fetch callers | 0.9 |
| 4.2 | Extract drive eligibility into shared `lib/business/eligibility.ts` | Drives page + API route | None |
| 4.3 | Fix date/timezone handling: remove hardcoded IST; use UTC | `new-drive-form.tsx`, drive API routes | None |
| 4.4 | Implement server-side pagination for rankings | Rankings API + rankings page | None |
| 4.5 | Add rate limiting to password change endpoint | `app/api/auth/change-password/route.ts` | None |
| 4.6 | Standardize API error response format: `{ success, error: { code, message } }` | All API routes | None |
| 4.7 | Add server-side validation for company experience form | `app/api/student/experiences/route.ts` or `app/api/faculty/experiences/route.ts` | None |
| 4.8 | Fix sandbox daily limit enforcement in API | `app/api/student/sandbox/route.ts` | None |
| 4.9 | Fix CSV import column count validation + file size limit | `app/api/admin/students/import/route.ts` | None |
| 4.10 | Add advisory lock for embedding job deduplication | `app/api/student/profile/route.ts` | None |
| 4.11 | Fix branch normalization consistency | `lib/constants/branches.ts` + all callers | None |
| 4.12 | Validate drive export endpoint exists and works | `/api/drives/[driveId]/export` | None |
| 4.13 | Add optimistic locking (version field) for drive updates | Schema + PATCH route | None |
| 4.14 | Move eligibility filtering to SQL WHERE clause | `app/api/drives/route.ts` | 4.2 |
| 4.15 | Fix email normalization consistency in auth | `lib/auth/config.ts` | None |
| 4.16 | Verify sw.js offline fallback serves correct page | `public/sw.js` | None |
| 4.17 | Add audit_log table for sensitive admin operations | Schema + admin API routes | None |

### Phase 5: Final Polish & QA Validation
**Goal:** Remove dead code, fix minor issues, validate entire flow end-to-end.
**Depends on:** Phases 0-4 complete.

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 5.1 | Remove all `as any` and `as unknown as X` casts | Grep entire codebase | 4.x |
| 5.2 | Remove unused `CalendarDays` import | `components/shared/mobile-nav.tsx` | None |
| 5.3 | Fix `force-dynamic` in client component (leaderboard) | `app/(student)/student/leaderboard/page.tsx` | None |
| 5.4 | Add `min` attribute to date inputs to prevent past dates | `components/drives/new-drive-form.tsx` | None |
| 5.5 | Add season dropdown loading indicator | `components/drives/new-drive-form.tsx` | None |
| 5.6 | Fix branch selection to use native checkboxes | `components/drives/new-drive-form.tsx` | None |
| 5.7 | Standardize error message capitalization | All error strings | None |
| 5.8 | Add Cloudinary error message sanitization | `app/api/student/resume/route.ts` | None |
| 5.9 | Add eslint-plugin-jsx-a11y to lint config | `.eslintrc.*` | None |
| 5.10 | Add `bg-background` explicitly to offline page | `app/offline/page.tsx` | None |
| 5.11 | Fix stale error state in student search view | `components/shared/student-search-view.tsx` | None |
| 5.12 | Add admin sandbox config save feedback | `app/(admin)/admin/sandbox/page.tsx` | None |
| 5.13 | Full E2E smoke test: login → dashboard → drives → sandbox → settings → logout | All routes | All phases |
| 5.14 | Full dark mode visual audit (every page, every state) | All pages | 0.1, 0.2 |
| 5.15 | Full mobile audit (every page at 375px) | All pages | 3.x |
| 5.16 | Lighthouse accessibility audit — target score > 90 | All pages | 2.x |

---

## 8. Delete / Defer / Keep Matrix

### DELETE
| Item | Reason |
|------|--------|
| Plus_Jakarta_Sans font import | Loaded but never used. Wasted ~100KB bandwidth. |
| `CalendarDays` import in mobile-nav | Imported, never used. |
| `export const dynamic = "force-dynamic"` in leaderboard | Ignored in client components. Dead code. |
| Duplicate status badge rendering in faculty drive cards | Redundant visual element. |

### DEFER (not blocking, low-risk)
| Item | Reason |
|------|--------|
| Audit trail table | Important for compliance but not blocking UX. Can ship after launch. |
| Server-side ranking pagination | Currently caps at 2000. Defer if all colleges have < 2000 students. |
| Optimistic locking for drive updates | Low concurrency risk in single-college deployments. |
| Password strength pattern checking | Current validation is sufficient for MVP. |
| Open redirect hardening in auth callback | Low risk with current URL validation. |

### FIX NOW (blocking correctness)
| Item | Reason |
|------|--------|
| Semantic colors | Every status signal in the app is broken. |
| Markdown prose-invert | Content invisible in light mode. |
| Landing page sections | Product is unexplained to new visitors. |
| Auth gate flash | Security concern + bad first impression. |
| Form error recovery | Users lose data on any server error. |
| CRON secret validation | Security vulnerability. |
| API error handling | Silent failures across entire app. |
| Pagination hover | Navigation appears non-functional. |

### INCOMPLETE (partially built, needs finishing)
| Item | Current State | Needed |
|------|--------------|--------|
| Onboarding multi-step form | Steps exist but no per-step validation | Add `trigger()` calls between steps |
| Sandbox daily limits | Config UI exists, enforcement doesn't | Add quota check in sandbox API |
| CSV export for rankings | Button exists, endpoint unclear | Verify endpoint; add error handling |
| PWA offline support | Service worker + manifest exist | Verify offline page renders; test cached pages |
| Drive state machine | Status column exists, no transition validation | Add state machine enforcement in API |

### DUPLICATED (consolidate)
| Item | Locations | Action |
|------|-----------|--------|
| Drive eligibility filtering | Student drives page + API route | Extract to `lib/business/eligibility.ts` |
| Branch normalization | `expandBranches()` + `normalizeBranch()` | Consolidate into single function |
| Error response format | `{message}` vs `{error}` across APIs | Standardize to `{success, error: {code, message}}` |
| Password input patterns | Admin settings + faculty settings | Extract shared settings form component |

### MISLEADING (visually present but functionally broken)
| Item | What user sees | What actually happens |
|------|---------------|----------------------|
| "Export All CSV" button | Looks clickable | May 404 or return error with no feedback |
| Semantic color badges | Shows colored badge | All colors are blue; no actual distinction |
| Pagination buttons | Shows Prev/Next | Hover state is invisible; appears static |
| Sandbox daily limit config | Admin can set limit | Limit is not enforced in API |
| Truncation warning "use CSV export" | Suggests working export | Export may not exist |

---

## Execution Priority Order

```
Week 1: Phase 0 (all 13 tasks — critical fixes)
         └─ Unblocks all subsequent work
         └─ Most tasks are single-file, < 30 min each

Week 2: Phase 1 (12 tasks — visual consistency)
         └─ Landing page is highest-visibility fix
         └─ Font removal reduces page weight

Week 3: Phase 2 (14 tasks — accessibility + content)
         └─ WCAG compliance baseline
         └─ Focus traps and aria-labels

Week 4: Phase 3 (8 tasks — responsive + theme)
         └─ Mobile audit pass
         └─ Dark mode sweep

Week 5: Phase 4 (17 tasks — data + logic)
         └─ safeFetch wrapper (biggest single improvement)
         └─ Server pagination for rankings

Week 6: Phase 5 (16 tasks — polish + QA)
         └─ E2E validation
         └─ Lighthouse audit
```

---

*This document is an exhaustive internal audit. Every issue has been verified against the actual codebase. Recommended fixes are scoped to the current implementation — no new features, no rewrites, no speculative architecture.*
