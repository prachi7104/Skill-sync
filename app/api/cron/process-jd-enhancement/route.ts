import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { eq, and, lt, desc, asc } from "drizzle-orm";
import { parseJD } from "@/lib/jd/parser";
import { generateEmbedding, isValidEmbedding } from "@/lib/embeddings/generate";
import { CRON_SECRET } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";


const MAX_JOBS_PER_TICK = 5;

/**
 * GET /api/cron/process-jd-enhancement
 *
 * Cron worker that polls for pending enhance_jd jobs and processes them.
 * Uses parseJD() to produce StructuredJD output for the ranking pipeline.
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Recover stuck enhance_jd jobs (processing for >5 minutes and still have retries left)
    await db
      .update(jobs)
      .set({ status: "pending", updatedAt: new Date() })
      .where(
        and(
          eq(jobs.type, "enhance_jd"),
          eq(jobs.status, "processing"),
          lt(jobs.updatedAt, new Date(Date.now() - 5 * 60 * 1000)),
          lt(jobs.retryCount, jobs.maxRetries),
        ),
      );

    logger.info("[Cron:JDEnhance] Checking for pending enhance_jd jobs...");

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
        .orderBy(desc(jobs.priority), asc(jobs.createdAt))
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
        const { driveId, titleHint, companyHint } = job.payload as {
          driveId: string;
          titleHint?: string;
          companyHint?: string;
        };

        logger.info(`[Cron:JDEnhance] Processing job ${job.id} for drive ${driveId}`);

        // Fetch drive
        const [drive] = await db
          .select({
            id: drives.id,
            rawJd: drives.rawJd,
            roleTitle: drives.roleTitle,
            company: drives.company,
            parsedJd: drives.parsedJd,
          })
          .from(drives)
          .where(eq(drives.id, driveId))
          .limit(1);

        if (!drive) {
          throw new Error(`Drive not found: ${driveId}`);
        }

        // Idempotency: skip if already enhanced with StructuredJD shape
        if (drive.parsedJd && typeof drive.parsedJd === "object" &&
          (drive.parsedJd as any).role_metadata) {
          await db.update(jobs).set({
            status: "completed",
            result: { driveId, skipped: true, reason: "already_enhanced" },
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          }).where(eq(jobs.id, job.id));
          processed++;
          continue;
        }

        // Parse JD using the full StructuredJD parser
        const structuredJd = await parseJD(
          drive.rawJd,
          titleHint || drive.roleTitle,
          companyHint || drive.company,
        );

        // Build human-readable enhanced JD text from StructuredJD fields
        const enhancedJd = [
          structuredJd.role_metadata.job_title,
          structuredJd.role_metadata.company_info?.name
            ? `Company: ${structuredJd.role_metadata.company_info.name}`
            : null,
          structuredJd.responsibilities?.primary_tasks?.length > 0
            ? `Key Responsibilities:\n${structuredJd.responsibilities.primary_tasks.map((t: string) => `• ${t}`).join("\n")}`
            : null,
          structuredJd.requirements?.hard_requirements?.technical_skills?.length > 0
            ? `Required Skills: ${structuredJd.requirements.hard_requirements.technical_skills.map(s => s.skill).join(", ")}`
            : null,
          structuredJd.requirements?.soft_requirements?.technical_skills?.length > 0
            ? `Preferred Skills: ${structuredJd.requirements.soft_requirements.technical_skills.map(s => s.skill).join(", ")}`
            : null,
        ].filter(Boolean).join("\n\n");

        // Generate JD embedding
        let jdEmbedding: number[] | null = null;
        try {
          const embedding = await generateEmbedding(drive.rawJd, "jd");
          if (isValidEmbedding(embedding)) {
            jdEmbedding = embedding;
          } else {
            logger.warn(`[Cron:JDEnhance] JD embedding for drive ${driveId} is all-zeros — skipping write`);
          }
        } catch (embErr: unknown) {
          const embErrMsj = embErr instanceof Error ? embErr.message : String(embErr);
          logger.warn(`[Cron:JDEnhance] JD embedding generation failed for drive ${driveId}: ${embErrMsj}`);
          // Don't fail the job — still save parsedJd
        }

        // Update drive with parsed JD data (StructuredJD shape) and embedding
        const updatePayload: any = {
          enhancedJd,
          parsedJd: structuredJd as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        };
        if (jdEmbedding) {
          updatePayload.jdEmbedding = jdEmbedding;
        }

        await db
          .update(drives)
          .set(updatePayload)
          .where(eq(drives.id, driveId));

        const hardSkillCount = structuredJd.requirements?.hard_requirements?.technical_skills?.length ?? 0;

        // Mark complete
        await db
          .update(jobs)
          .set({
            status: "completed",
            result: { driveId, skillsFound: hardSkillCount },
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        logger.info(`[Cron:JDEnhance] Job ${job.id} completed — ${hardSkillCount} skills extracted`);
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Cron:JDEnhance] Worker failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
