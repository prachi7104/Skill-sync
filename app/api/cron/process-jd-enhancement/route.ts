import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_JOBS_PER_TICK = 5;

/**
 * GET /api/cron/process-jd-enhancement
 *
 * Cron worker that polls for pending enhance_jd jobs and processes them.
 * Uses the AI SDK to enhance raw JD text into structured parsed JD.
 * Authenticated via CRON_SECRET bearer token.
 *
 * Note: The actual AI enhancement logic is intentionally lightweight here.
 * For the MVP, this worker marks jobs as processed and stores the raw JD
 * as-is. A full AI pipeline (Gemini/Groq) can be plugged in later.
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!CRON_SECRET) {
      console.error("CRON_SECRET not configured in environment");
      return NextResponse.json(
        { error: "Cron endpoint not configured" },
        { status: 503 },
      );
    }

    if (providedSecret !== CRON_SECRET) {
      console.warn("Unauthorized cron attempt at process-jd-enhancement");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron:JDEnhance] Checking for pending enhance_jd jobs...");

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
      // 1. Find one pending enhance_jd job
      const [pendingJob] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(
          and(eq(jobs.type, "enhance_jd"), eq(jobs.status, "pending")),
        )
        .limit(1);

      if (!pendingJob) break; // queue drained

      // 2. Atomically claim it
      const claimed = await db
        .update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(
          and(eq(jobs.id, pendingJob.id), eq(jobs.status, "pending")),
        )
        .returning();

      if (claimed.length === 0) continue; // another worker grabbed it

      const job = claimed[0];
      const startTime = Date.now();

      try {
        const { driveId } = job.payload as { driveId: string };

        console.log(
          `[Cron:JDEnhance] Processing job ${job.id} for drive ${driveId}`,
        );

        // Fetch drive
        const [drive] = await db
          .select({
            id: drives.id,
            rawJd: drives.rawJd,
            roleTitle: drives.roleTitle,
            company: drives.company,
          })
          .from(drives)
          .where(eq(drives.id, driveId))
          .limit(1);

        if (!drive) {
          throw new Error(`Drive not found: ${driveId}`);
        }

        // MVP enhancement: extract basic structure from raw JD
        // A full AI pipeline can be plugged in here later
        const enhancedJd = drive.rawJd; // pass-through for now
        const parsedJd = {
          title: drive.roleTitle,
          company: drive.company,
          responsibilities: [] as string[],
          requiredSkills: extractSkillsFromText(drive.rawJd),
          preferredSkills: [] as string[],
          qualifications: [] as string[],
          summary: drive.rawJd.slice(0, 200),
        };

        // Update drive with enhanced/parsed data
        await db
          .update(drives)
          .set({
            enhancedJd,
            parsedJd,
            updatedAt: new Date(),
          })
          .where(eq(drives.id, driveId));

        // Mark complete
        await db
          .update(jobs)
          .set({
            status: "completed",
            result: { driveId, skillsFound: parsedJd.requiredSkills.length },
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        console.log(
          `[Cron:JDEnhance] Job ${job.id} completed — ${parsedJd.requiredSkills.length} skills extracted`,
        );
        processed++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cron:JDEnhance] Job ${job.id} failed:`, message);

        const newRetryCount = (job.retryCount ?? 0) + 1;
        const maxRetries = job.maxRetries ?? 3;

        await db
          .update(jobs)
          .set({
            status: newRetryCount < maxRetries ? "pending" : "failed",
            error: message,
            retryCount: newRetryCount,
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        failed++;
      }
    }

    return NextResponse.json(
      { message: "JD enhancement worker executed", processed, failed },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Cron:JDEnhance] Worker failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Basic keyword extraction from JD text.
 * Looks for common tech skills mentioned in the text.
 * This is a simple heuristic — the full AI pipeline will replace this.
 */
function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r",
    "react", "angular", "vue", "next.js", "node.js", "express", "django",
    "flask", "spring", "rails", "laravel", "svelte",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "git", "ci/cd", "linux", "graphql", "rest", "microservices",
    "machine learning", "deep learning", "nlp", "computer vision",
    "data structures", "algorithms", "system design",
    "html", "css", "tailwind", "sass",
    "figma", "agile", "scrum",
  ];

  const lowerText = text.toLowerCase();
  return commonSkills.filter((skill) => {
    // Word-boundary match to avoid false positives
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;|/])${escaped}(?:$|[\\s,;|/])`, "i");
    return regex.test(lowerText);
  });
}
