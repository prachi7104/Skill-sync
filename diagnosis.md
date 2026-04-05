# SkillSync Codebase Diagnosis

Date: 2026-04-05
Scope: Full repository static analysis (security, auth, tenancy, API design, reliability, maintainability, dependency risk)

## Executive Summary

The codebase is generally organized and type-safe (TypeScript strict mode, lint clean), but there are several high-impact security and architecture issues:

1. Sensitive unauthenticated endpoints are exposed in production paths.
2. Some API authorization logic relies on redirect-based helpers, causing non-API behavior (302/307) on API routes.
3. Data tenancy/scoping checks are inconsistent across ranking endpoints.
4. Dependency vulnerability posture is currently high-risk (multiple high-severity advisories).

## Critical Findings

### 1) Unauthenticated background job introspection leaks sensitive data
- Severity: Critical
- Evidence:
  - app/api/jobs/[id]/route.ts
  - lib/workers/parse-resume.ts
- Problem:
  - GET /api/jobs/[id] has no auth check and returns job `result` / `error` fields.
  - Resume parsing jobs store parsed resume output in `jobs.result`, which can include PII and profile details.
- Impact:
  - Anyone with/guessing a job UUID can retrieve sensitive processing outputs.
- Recommendation:
  - Require session auth and ownership/college checks.
  - Never return raw `result` for PII-heavy job types; return redacted status only.

### 2) Public DB diagnostic endpoint exposes internals and performs write/delete operations
- Severity: Critical
- Evidence:
  - app/api/db-test/route.ts
- Problem:
  - Route is publicly reachable and does all of: schema discovery, test insert, read, and delete.
  - On failure, response includes `error.message` and `error.stack`.
- Impact:
  - Information disclosure + abuse potential + noisy writes in production DB.
- Recommendation:
  - Remove route from production build, or admin-gate with strict auth + explicit feature flag.
  - Never return stack traces to clients.

## High Findings

### 3) Public DB stats endpoint leaks operational metrics
- Severity: High
- Evidence:
  - app/api/db-status/route.ts
  - lib/db/index.ts (getDbStats)
- Problem:
  - GET /api/db-status has no auth and returns connection-level telemetry.
- Impact:
  - Attackers gain operational insight (load behavior, pool pressure), useful for targeted disruption.
- Recommendation:
  - Restrict to admin role or remove in production.

### 4) Cross-tenant data leak in student ranking endpoint
- Severity: High
- Evidence:
  - app/api/drives/[driveId]/rankings/me/route.ts
- Problem:
  - Endpoint fetches drive by ID and returns drive metadata (company, roleTitle) without checking student college scope.
- Impact:
  - Student can probe drive IDs and infer other-college drive metadata.
- Recommendation:
  - Enforce drive.collegeId == student.collegeId before returning any drive fields.

### 5) Spreadsheet formula injection risk in CSV exports
- Severity: High
- Evidence:
  - app/api/drives/[driveId]/export/route.ts
- Problem:
  - Export escapes quotes but does not neutralize leading `=`, `+`, `-`, `@` in user-controlled fields.
- Impact:
  - Opening exported CSV in spreadsheet tools can execute malicious formulas.
- Recommendation:
  - Prefix dangerous-cell values with `'` (apostrophe) or enforce safe-cell sanitizer before CSV serialization.

### 6) Dependency security posture contains multiple high-severity vulnerabilities
- Severity: High
- Evidence:
  - package.json
  - npm audit output
- Confirmed from audit:
  - High vulnerabilities include `next`, `xlsx`, `glob`, `lodash`, `picomatch`, and others.
  - Total reported: 15 vulnerabilities (9 high, 6 moderate).
- Impact:
  - Elevated exploitability and supply-chain risk.
- Recommendation:
  - Prioritize framework/library upgrades in a controlled branch.
  - Replace/patch `xlsx` usage path urgently due direct high advisories.

## Medium Findings

### 7) API auth helper uses redirects, causing non-API behavior for route handlers
- Severity: Medium
- Evidence:
  - lib/auth/helpers.ts
- Problem:
  - `requireRole` / `requireAuth` use `redirect(...)` semantics designed for pages, not API JSON contracts.
- Impact:
  - API callers may receive redirect HTML/302/307 instead of 401/403 JSON, breaking clients and security expectations.
- Recommendation:
  - Create API-safe auth helpers that throw typed auth errors or return structured failures.

### 8) Middleware policy mismatch for /api/drives
- Severity: Medium
- Evidence:
  - middleware.ts
- Problem:
  - `/api/drives/:path*` is matched but not role-gated in middleware logic (falls through to allow).
  - Enforcement is deferred to per-route `requireRole`, which currently uses redirect-based behavior.
- Impact:
  - Inconsistent access behavior and increased chance of missed per-route checks.
- Recommendation:
  - Add explicit role gate for `/api/drives` in middleware or migrate all API auth to standardized route-level guard that returns 401/403.

### 9) Admin student search count logic is O(n) and not true aggregate count
- Severity: Medium
- Evidence:
  - app/api/admin/students/search/route.ts
- Problem:
  - Count is derived by selecting all matching IDs and using `length`.
- Impact:
  - Slow and memory-heavy on large datasets.
- Recommendation:
  - Replace with SQL `count(*)` aggregate as done in faculty search route.

### 10) CSV roster import parser is naive and can corrupt quoted fields
- Severity: Medium
- Evidence:
  - app/api/admin/students/import/route.ts
- Problem:
  - Rows are parsed using `split(",")`, which breaks quoted commas and escaped fields.
- Impact:
  - Data corruption, bad mapping, silent row quality degradation.
- Recommendation:
  - Use a robust CSV parser library (RFC-compliant) for uploads.

### 11) In-memory rate limiter is not reliable in distributed/serverless runtime
- Severity: Medium
- Evidence:
  - app/api/student/resume/preview/route.ts
- Problem:
  - Rate limiting uses process-local `Map`, not shared store.
- Impact:
  - Limits can be bypassed across instances/restarts.
- Recommendation:
  - Move to Redis/DB-backed atomic rate limiting with TTL.

### 12) Rate-limit utility is fail-open when Redis is unavailable
- Severity: Medium
- Evidence:
  - lib/redis.ts
- Problem:
  - If Redis is missing/errors, function returns `allowed: true`.
- Impact:
  - Protection silently disabled under outage/misconfig.
- Recommendation:
  - For sensitive routes, fail-closed or apply conservative in-process fallback and alerting.

### 13) Sandbox limit config falls back to hardcoded dummy college ID
- Severity: Medium
- Evidence:
  - lib/guardrails/sandbox-limits.ts
- Problem:
  - Missing session collegeId defaults to `00000000-0000-0000-0000-000000000001`.
- Impact:
  - Wrong tenant config can be applied; policy behavior becomes unpredictable.
- Recommendation:
  - Treat missing collegeId as auth/context error and block request.

### 14) Admin health cloudinary route has auth call outside error handling block
- Severity: Medium
- Evidence:
  - app/api/admin/health/cloudinary/route.ts
- Problem:
  - `await requireRole(["admin"])` runs before try/catch.
- Impact:
  - Redirect/auth exceptions can bypass route’s JSON error handling contract.
- Recommendation:
  - Move auth check inside try and convert auth failures to API-style responses.

## Low Findings

### 15) Student namespace endpoint allows non-student execution path
- Severity: Low
- Evidence:
  - app/api/student/sandbox/route.ts
- Problem:
  - Route allows faculty/admin behavior despite being under `/api/student/*` path.
- Impact:
  - Policy confusion and harder reasoning for audits.
- Recommendation:
  - Move non-student mode to faculty/admin namespace or explicitly document and guard intent.

### 16) Public test endpoint should be removed from production surface
- Severity: Low
- Evidence:
  - app/api/test/route.ts
- Problem:
  - Static “API is working” endpoint provides unnecessary attack-surface signal.
- Impact:
  - Low direct risk, but avoidable fingerprinting surface.
- Recommendation:
  - Remove or guard behind environment check/admin auth.

## Additional Architectural Risks

### 17) Authorization model duplicated across middleware + route handlers
- Severity: Medium
- Evidence:
  - middleware.ts
  - multiple files under app/api/
- Problem:
  - Mixed enforcement patterns (middleware role checks + route-level checks + session checks).
- Impact:
  - Drift risk: one route can miss a critical check.
- Recommendation:
  - Consolidate into one explicit policy layer and test it with route-level authorization tests.

### 18) Error handling consistency is uneven
- Severity: Medium
- Evidence:
  - multiple routes using empty catches / generic catches
- Problem:
  - Some handlers swallow errors silently, some return detailed internals, others redirect.
- Impact:
  - Operational blind spots and inconsistent API behavior.
- Recommendation:
  - Standardize API error envelope, log levels, and redaction rules.

## Suggested Prioritized Remediation Plan

1. Immediately disable or admin-gate `db-test`, `db-status`, and `jobs/[id]` routes.
2. Patch cross-tenant check in `rankings/me` and add regression tests.
3. Add CSV formula sanitization in export endpoints.
4. Introduce API-specific auth guard (401/403 JSON), stop using redirect for APIs.
5. Replace naive CSV parsing and add fixture tests for quoted CSV edge cases.
6. Migrate rate limits to Redis/DB atomic counters and remove fail-open behavior on sensitive paths.
7. Execute dependency upgrade plan for high advisories (`next`, `xlsx`, etc.).

## Validation Performed

- Type-check: clean (`tsc --noEmit`)
- Lint: clean (`next lint`)
- Tests: intentionally not analyzed per request (user-confirmed passing)
