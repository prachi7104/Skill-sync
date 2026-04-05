/**
 * POST /api/student/resume/preview
 *
 * Track A — Instant resume preview (no DB writes).
 *
 * Accepts client-extracted resumeText, runs parseResumeWithAI directly,
 * and returns the mapped profile JSON so the onboarding form can autofill
 * in ~3-5 seconds without waiting for the background job queue.
 *
 * Rate limit: 3 calls per student per hour (in-memory).
 * Timeout: 15 seconds on the AI call.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { parseResumeWithAI, mapParsedResumeToProfile } from "@/lib/resume/ai-parser";
import { redisRateLimit } from "@/lib/redis";
import { isRedirectError } from "next/dist/client/components/redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Timeout wrapper ─────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Preview timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// ── POST Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireStudentProfile();

    // Rate limit check
    const rl = await redisRateLimit(
      `resume_preview:${user.id}`,
      RATE_LIMIT_MAX,
      Math.floor(RATE_LIMIT_WINDOW_MS / 1000),
      { failClosed: true },
    );

    if (!rl.allowed) {
      if (rl.current === -1) {
        return NextResponse.json(
          { success: false, error: "Preview temporarily unavailable. Please try again shortly." },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Max 3 preview requests per hour." },
        { status: 429 },
      );
    }

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.resumeText !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid resumeText" },
        { status: 400 },
      );
    }

    const { resumeText } = body as { resumeText: string };

    // Validate length
    if (resumeText.length < 50) {
      return NextResponse.json(
        { success: false, error: "Resume text too short (minimum 50 characters)" },
        { status: 400 },
      );
    }
    if (resumeText.length > 15000) {
      return NextResponse.json(
        { success: false, error: "Resume text too long (maximum 15,000 characters)" },
        { status: 400 },
      );
    }

    // AI parse with 15s timeout — no DB writes
    const parsedData = await withTimeout(
      parseResumeWithAI(resumeText),
      15_000,
    );

    const mappedProfile = mapParsedResumeToProfile(parsedData);

    return NextResponse.json(
      { success: true, data: mappedProfile },
      { status: 200 },
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error("[Preview] Failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Preview failed" },
      { status: 500 },
    );
  }
}
