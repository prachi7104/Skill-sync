# SkillSync Project Research Report

This report summarizes the findings for the 10 research items requested.

## 1. Test Framework
The project uses **Vitest** for testing.

**Output from package.json:**
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test-rls": "npx tsx scripts/test-rls.ts",
```

**Config files found:**
- `vitest.config.ts`

---

## 2. requireStudentProfile() return shape
The function returns an object containing both the `user` and the `profile`.

**Function body (lib/auth/helpers.ts):**
```typescript
/**
 * Enforces that the current user is a 'student' AND has a student profile.
 * Redirects if authentication fails, role mismatch, or profile missing.
 * Returns both user and profile.
 */
export async function requireStudentProfile() {
    const user = await requireRole(["student"]);

    const profile = await getStudentProfile(user.id);

    if (!profile) {
        redirect("/student/onboarding/welcome");
    }

    return { user, profile };
}
```

---

## 3. GuardrailViolation constructor signature
The constructor takes a single `err` argument of type `GuardrailError`.

**Class definition (lib/guardrails/errors.ts):**
```typescript
export interface GuardrailError {
  code: string;
  reason: string;
  nextStep: string;
  status: number;
}

export class GuardrailViolation extends Error {
  public readonly code: string;
  public readonly reason: string;
  public readonly nextStep: string;
  public readonly status: number;

  constructor(err: GuardrailError) {
    super(err.reason);
    this.name = "GuardrailViolation";
    this.code = err.code;
    this.reason = err.reason;
    this.nextStep = err.nextStep;
    this.status = err.status;
  }
  // ...
}
```

---

## 5. computeRanking.ts function signature
The function receives a `driveId: string` and fetches student data (including embeddings) from the database internally. It does **not** receive the student's embedding directly.

**Function signature (lib/matching/computeRanking.ts):**
```typescript
/**
 * Main ranking computation function.
 *
 * 1. Fetches drive + eligible students
 * 2. Hard-gates on embedding + resume
 * 3. Computes scores via the scoring module
 * 4. Filters ineligible students out of rankings
 * 5. Sorts with tie-breaking
 * 6. Persists in a single transaction
 */
export async function computeRanking(
  driveId: string,
): Promise<RankingComputationResult> {
  // ...
  // 3. Fetch candidate students (DB pre-filtered)
  let allStudents = await fetchEligibleStudents(eligibility);
  // ...
}
```

---

## 6. Vercel cron config
A `vercel.json` file **exists** in the project root.

---

## 7. Cron auth mechanism
The cron route is protected by a **Bearer token** using the `CRON_SECRET` environment variable.

**Auth check (app/api/cron/process-rankings/route.ts):**
```typescript
/**
 * GET /api/cron/process-rankings
 *
 * Cron worker that polls for pending rank_students jobs and processes them.
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    // ...
```

---

## 8. generateEmbedding function signature
The function takes a string and an optional type, returning a `Promise<number[]>`. On failure, it returns a 768-dimensional **zero vector**.

**Full file (lib/embeddings/generate.ts):**
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

export const EMBEDDING_DIMENSION = 768;

/**
 * Generate a 768-dim embedding vector.
 * Fallback chain:
 *   1. Gemini text-embedding-004 (primary, 768-dim native)
 *   2. Zero vector — app doesn't crash, logs error, semantic scoring skipped
 *
 * NOTE: To add a local fallback, install @xenova/transformers and add
 * all-mpnet-base-v2 (768-dim) as tier 2 before the zero vector.
 */
export async function generateEmbedding(
  text: string,
  _type: "profile" | "jd" = "profile"
): Promise<number[]> {
  if (!text || text.trim().length === 0) return [];
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  // ── 1. Gemini text-embedding-004 ────────────────────────────────────────
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (googleKey) {
    try {
      const genAI = new GoogleGenerativeAI(googleKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(cleaned);
      const vec = result.embedding.values;
      if (vec.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Unexpected dimension: ${vec.length}`);
      }
      return vec;
    } catch (err) {
      console.warn("[embeddings] Gemini failed:", err);
    }
  }

  // ── 2. Zero vector fallback — never crashes the app ─────────────────────
  console.error("[embeddings] All providers failed. Returning zero vector. Semantic scoring will be skipped.");
  return new Array(EMBEDDING_DIMENSION).fill(0);
}

/**
 * Cosine similarity between two vectors. Returns 0 on mismatch or zero vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

---

## 9. processRankingJob existence
The ranking logic is extracted into the `computeRanking(driveId)` function (in `lib/matching`), but the polling and job lifecycle management (marking as processing, completed, or failed) is done **inline** within the route handler loop in `app/api/cron/process-rankings/route.ts`.

---

## 10. lib/env.ts and VERCEL_URL
The file `lib/env.ts` **exists** and handles `VERCEL_URL` to set `NEXTAUTH_URL`.

**Relevant logic (lib/env.ts):**
```typescript
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL
  || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000');
```
