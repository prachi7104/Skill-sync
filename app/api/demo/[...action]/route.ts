import { and, inArray, like, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AiError } from "@/lib/ai/generate";
import { db } from "@/lib/db";
import { aiRateLimits, colleges, demoWorkspaces } from "@/lib/db/schema";
import { guestAccessEnabled } from "@/lib/demo/config";
import { atsAnalysis, careerChat, recruiterExplanation, studentRecommendations } from "@/lib/demo/insights";
import { getStudentOverview } from "@/lib/demo/overview";
import { consumeDemoQuota, DemoQuotaExceeded } from "@/lib/demo/quota";
import { getCandidate, getRecruiterDrive, listRecruiterDrives, setShortlist, updateRecruiterDrive } from "@/lib/demo/ranking";
import {
  DEMO_MAX_RESUME_BYTES, detectResumeType, getDemoResumeFile, getDemoResumeJob, processDemoResume, ResumeRejected,
} from "@/lib/demo/resume";
import { demoUuid, requireDemoGuest, type DemoGuest } from "@/lib/demo/session";
import { endDemoWorkspace } from "@/lib/demo/workspace";
import { validateCronAuth } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const failure = (message: string, status: number, code?: string) => json({ error: message, ...(code ? { code } : {}) }, status);

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expected = new URL(process.env.NEXTAUTH_URL ?? req.nextUrl.origin).origin;
  return origin === expected || origin === req.nextUrl.origin;
}

async function readJson(req: NextRequest, maxBytes = 24_000): Promise<unknown> {
  if (!req.headers.get("content-type")?.startsWith("application/json")) return null;
  const text = await req.text().catch(() => "");
  if (!text || text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const skillList = z.array(z.string().trim().min(1).max(60)).max(20);
const driveEdit = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().max(1000).default(""),
  requiredSkills: skillList.min(1),
  preferredSkills: skillList.default([]),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  minCgpa: z.number().min(0).max(10).nullable().default(null),
});
const chatInput = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2500) })).max(8).default([]),
});

function aiFailure(error: AiError) {
  if (error.kind === "rate_limited" || error.kind === "quota_exhausted") {
    return failure("The AI provider is rate-limiting requests right now. Wait a minute and try again.", 429, "ai_busy");
  }
  if (error.kind === "timeout") return failure("The AI provider took too long to respond. Try again.", 504, "ai_timeout");
  return failure("The AI provider is unavailable right now, so no AI result was produced. Try again shortly.", 503, "ai_unavailable");
}

async function cleanup() {
  return db.transaction(async (tx) => {
    const expired = tx.select({ id: demoWorkspaces.collegeId }).from(demoWorkspaces).where(lt(demoWorkspaces.expiresAt, new Date()));
    const rows = await tx.delete(colleges)
      .where(and(inArray(colleges.id, expired), like(colleges.studentDomain, "%.demo.invalid")))
      .returning({ id: colleges.id });
    await tx.delete(aiRateLimits).where(and(like(aiRateLimits.modelKey, "demo:%"),
      lt(aiRateLimits.windowStart, sql`now() - interval '2 days'`)));
    return rows.length;
  });
}

async function studentRoutes(req: NextRequest, guest: DemoGuest, parts: string[]) {
  const [action, id, extra] = parts;
  const method = req.method;

  if (action === "overview" && !id && method === "GET") return json(await getStudentOverview(guest));

  if (action === "resume" && !id && method === "GET") {
    const file = await getDemoResumeFile(guest);
    if (!file) return failure("You have not uploaded a resume in this session.", 404);
    const safeName = file.filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "resume";
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mime, "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (action === "resume" && method === "POST" && (!id || id === "sample") && !extra) {
    if (id === "sample") {
      const body = z.object({ jobId: z.string().regex(demoUuid) }).safeParse(await readJson(req));
      if (!body.success) return failure("Invalid request.", 400);
      return json(await processDemoResume(guest, body.data.jobId, { source: "sample" }, req.signal));
    }
    // A declared size is required so oversized or chunked bodies are refused
    // before formData() buffers them.
    const length = Number(req.headers.get("content-length") ?? NaN);
    if (!Number.isFinite(length) || length <= 0 || length > DEMO_MAX_RESUME_BYTES + 16_384) return failure("Resumes must be 2 MB or smaller.", 413);
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const jobId = form?.get("jobId");
    if (typeof jobId !== "string" || !demoUuid.test(jobId)) return failure("Invalid request.", 400);
    if (form?.get("consent") !== "true") return failure("Please confirm you are happy for the resume text to be sent to the AI provider.", 400);
    if (!(file instanceof File) || file.size === 0) return failure("Choose a PDF or DOCX file.", 400);
    if (file.size > DEMO_MAX_RESUME_BYTES) return failure("Resumes must be 2 MB or smaller.", 413);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = detectResumeType(file.name, file.type, buffer);
    return json(await processDemoResume(guest, jobId, { source: "upload", buffer, filename: file.name, mime }, req.signal));
  }

  if (action === "jobs" && id && demoUuid.test(id) && !extra && method === "GET") {
    const job = await getDemoResumeJob(guest, id);
    return job ? json(job) : failure("Job not found.", 404);
  }

  if (action === "ats" && !id && method === "POST") {
    const body = z.union([
      z.object({ driveId: z.string().regex(demoUuid) }),
      z.object({ jd: z.string().trim().min(80).max(8000) }),
    ]).safeParse(await readJson(req));
    if (!body.success) return failure("Pick an opening or paste a job description of 80 to 8,000 characters.", 400);
    const result = await atsAnalysis(guest, body.data, req.signal);
    if ("error" in result) return result.error === "no_resume" ? failure("Analyse a resume first.", 409) : failure("Opening not found.", 404);
    return json(result);
  }

  if (action === "recommendations" && !id && method === "POST") {
    const result = await studentRecommendations(guest, req.signal);
    return result ? json(result) : failure("Profile not found.", 404);
  }

  if (action === "chat" && !id && method === "POST") {
    const body = chatInput.safeParse(await readJson(req));
    if (!body.success) return failure("Enter a question of up to 1,000 characters.", 400);
    const result = await careerChat(guest, body.data.message, body.data.history, req.signal);
    return result ? json(result) : failure("Profile not found.", 404);
  }

  return null;
}

async function recruiterRoutes(req: NextRequest, guest: DemoGuest, parts: string[]) {
  const [action, id, operation, extra] = parts;
  const method = req.method;
  if (extra) return null;

  if (action === "drives" && !id && method === "GET") return json({ drives: await listRecruiterDrives(guest) });

  if (action === "drives" && id) {
    if (!demoUuid.test(id)) return failure("Opening not found.", 404);
    if (!operation && method === "GET") {
      const drive = await getRecruiterDrive(guest, id);
      return drive ? json(drive) : failure("Opening not found.", 404);
    }
    if (!operation && method === "PATCH") {
      const body = driveEdit.safeParse(await readJson(req));
      if (!body.success) return failure("Check the opening details: a title and at least one required skill are needed.", 400);
      await consumeDemoQuota("jd_edit", guest.collegeId);
      const updated = await updateRecruiterDrive(guest, id, body.data, req.signal);
      return updated ? json(updated) : failure("Opening not found.", 404);
    }
    if (operation === "shortlist" && method === "PATCH") {
      const body = z.object({ studentId: z.string().regex(demoUuid), shortlisted: z.boolean() }).safeParse(await readJson(req));
      if (!body.success) return failure("Invalid shortlist request.", 400);
      return await setShortlist(guest, id, body.data.studentId, body.data.shortlisted)
        ? json({ shortlisted: body.data.shortlisted })
        : failure("Candidate not found.", 404);
    }
    if (operation === "explain" && method === "POST") {
      const body = z.object({ studentId: z.string().regex(demoUuid) }).safeParse(await readJson(req));
      if (!body.success) return failure("Invalid request.", 400);
      const result = await recruiterExplanation(guest, id, body.data.studentId, req.signal);
      return result ? json(result) : failure("Candidate not found.", 404);
    }
  }

  if (action === "candidates" && id && !operation && method === "GET") {
    if (!demoUuid.test(id)) return failure("Candidate not found.", 404);
    const candidate = await getCandidate(guest, id);
    return candidate ? json(candidate) : failure("Candidate not found.", 404);
  }

  return null;
}

const STUDENT_ACTIONS = new Set(["overview", "resume", "jobs", "ats", "recommendations", "chat"]);
const RECRUITER_ACTIONS = new Set(["drives", "candidates"]);

async function handle(req: NextRequest, { params }: { params: { action: string[] } }) {
  const parts = params.action;
  const [action] = parts;
  const method = req.method;
  try {
    if (!guestAccessEnabled()) return failure("Not found.", 404);

    if (action === "cleanup" && parts.length === 1 && method === "GET") {
      if (!validateCronAuth(req.headers.get("authorization"))) return failure("Unauthorized.", 401);
      return json({ deletedWorkspaces: await cleanup() });
    }

    if (method !== "GET" && !sameOrigin(req)) return failure("Forbidden.", 403);
    const guest = await requireDemoGuest();
    if (!guest) return failure("Your guest session has ended. Start a new demo from the guest page.", 401, "session_expired");

    if (action === "exit" && parts.length === 1 && method === "POST") {
      return json({ ended: await endDemoWorkspace(guest.collegeId) });
    }

    if (guest.kind === "student") {
      if (RECRUITER_ACTIONS.has(action)) return failure("Recruiter access is required for this action.", 403);
      return (await studentRoutes(req, guest, parts)) ?? failure("Not found.", 404);
    }
    if (STUDENT_ACTIONS.has(action)) return failure("Student access is required for this action.", 403);
    return (await recruiterRoutes(req, guest, parts)) ?? failure("Not found.", 404);
  } catch (error) {
    if (error instanceof DemoQuotaExceeded) return failure(error.message, 429, "quota");
    if (error instanceof ResumeRejected) return failure(error.message, error.status);
    if (error instanceof AiError) return aiFailure(error);
    if (error instanceof Error && error.message === "Embedding provider unavailable") {
      return failure("The embedding provider is unavailable right now. Try again shortly.", 503, "ai_unavailable");
    }
    console.error("[guest] request failed", { action, method, error: error instanceof Error ? error.message : String(error) });
    return failure("Something went wrong on our side. Try again shortly.", 500);
  }
}

export { handle as GET, handle as POST, handle as PATCH };
