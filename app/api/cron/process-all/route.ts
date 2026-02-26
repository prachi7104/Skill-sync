import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, drives } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";
import { processEmbeddingJobs } from "@/lib/workers/generate-embedding";
import { computeRanking } from "@/lib/matching";
import { enhanceJDWithAI } from "@/lib/jd/ai-enhancer";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // max for Hobby plan

const MAX_JD_JOBS = 5;
const MAX_RANKING_JOBS = 3;

/**
 * GET /api/cron/process-all
 *
 * Single unified cron worker (Vercel Hobby-tier compatible: once per day).
 * Sequentially runs all background job processors:
 *   1. Resume parsing
 *   2. Embedding generation
 *   3. JD enhancement
 *   4. Student rankings
 *
 * Authenticated via CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json(
            { error: "Server misconfiguration" },
            { status: 500 },
        );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Record<string, unknown> = {};

    // ── 1. Resume parsing ────────────────────────────────────────────────
    try {
        const processed = await processResumeParseJobs();
        results.resumes = { processed };
        logger.info("[Cron:All] Resumes done", { processed });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("[Cron:All] Resume worker failed", { error: msg });
        results.resumes = { error: msg };
    }

    // ── 2. Embeddings ────────────────────────────────────────────────────
    try {
        const embResult = await processEmbeddingJobs();
        results.embeddings = embResult;
        logger.info("[Cron:All] Embeddings done", embResult);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("[Cron:All] Embedding worker failed", { error: msg });
        results.embeddings = { error: msg };
    }

    // ── 3. JD Enhancement ────────────────────────────────────────────────
    try {
        let jdProcessed = 0;
        let jdFailed = 0;

        for (let i = 0; i < MAX_JD_JOBS; i++) {
            const [pendingJob] = await db
                .select({ id: jobs.id })
                .from(jobs)
                .where(and(eq(jobs.type, "enhance_jd"), eq(jobs.status, "pending")))
                .limit(1);

            if (!pendingJob) break;

            const claimed = await db
                .update(jobs)
                .set({ status: "processing", updatedAt: new Date() })
                .where(and(eq(jobs.id, pendingJob.id), eq(jobs.status, "pending")))
                .returning();

            if (claimed.length === 0) continue;

            const job = claimed[0];
            const startTime = Date.now();

            try {
                const { driveId } = job.payload as { driveId: string };

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

                if (!drive) throw new Error(`Drive not found: ${driveId}`);

                // Idempotency: skip if already enhanced
                if (
                    drive.parsedJd &&
                    typeof drive.parsedJd === "object" &&
                    Object.keys(drive.parsedJd).length > 0
                ) {
                    await db
                        .update(jobs)
                        .set({
                            status: "completed",
                            result: { driveId, skipped: true, reason: "already_enhanced" },
                            latencyMs: Date.now() - startTime,
                            updatedAt: new Date(),
                        })
                        .where(eq(jobs.id, job.id));
                    jdProcessed++;
                    continue;
                }

                const enhancedData = await enhanceJDWithAI(
                    drive.rawJd,
                    drive.roleTitle,
                    drive.company,
                );

                const parsedJd = {
                    title: enhancedData.title,
                    company: enhancedData.company,
                    responsibilities: enhancedData.responsibilities,
                    requiredSkills: enhancedData.requiredSkills,
                    preferredSkills: enhancedData.preferredSkills,
                    qualifications: enhancedData.qualifications,
                    summary: enhancedData.summary,
                };

                const enhancedJd = [
                    enhancedData.title,
                    enhancedData.company ? `Company: ${enhancedData.company}` : null,
                    enhancedData.summary,
                    enhancedData.responsibilities?.length > 0
                        ? `Key Responsibilities:\n${enhancedData.responsibilities.map((r: string) => `• ${r}`).join("\n")}`
                        : null,
                    enhancedData.requiredSkills?.length > 0
                        ? `Required Skills: ${enhancedData.requiredSkills.join(", ")}`
                        : null,
                    enhancedData.preferredSkills?.length > 0
                        ? `Preferred Skills: ${enhancedData.preferredSkills.join(", ")}`
                        : null,
                    enhancedData.qualifications?.length > 0
                        ? `Qualifications:\n${enhancedData.qualifications.map((q: string) => `• ${q}`).join("\n")}`
                        : null,
                ]
                    .filter(Boolean)
                    .join("\n\n");

                await db
                    .update(drives)
                    .set({ enhancedJd, parsedJd, updatedAt: new Date() })
                    .where(eq(drives.id, driveId));

                await db
                    .update(jobs)
                    .set({
                        status: "completed",
                        result: {
                            driveId,
                            skillsFound: parsedJd.requiredSkills.length,
                        },
                        latencyMs: Date.now() - startTime,
                        updatedAt: new Date(),
                    })
                    .where(eq(jobs.id, job.id));

                jdProcessed++;
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : "Unknown error";
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
                jdFailed++;
            }
        }

        results.jdEnhancement = { processed: jdProcessed, failed: jdFailed };
        logger.info("[Cron:All] JD enhancement done", {
            processed: jdProcessed,
            failed: jdFailed,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("[Cron:All] JD enhancement worker failed", { error: msg });
        results.jdEnhancement = { error: msg };
    }

    // ── 4. Rankings ──────────────────────────────────────────────────────
    try {
        let rankProcessed = 0;
        let rankFailed = 0;

        for (let i = 0; i < MAX_RANKING_JOBS; i++) {
            const [pendingJob] = await db
                .select({ id: jobs.id })
                .from(jobs)
                .where(
                    and(eq(jobs.type, "rank_students"), eq(jobs.status, "pending")),
                )
                .orderBy(jobs.priority, jobs.createdAt)
                .limit(1);

            if (!pendingJob) break;

            const claimed = await db
                .update(jobs)
                .set({ status: "processing", updatedAt: new Date() })
                .where(and(eq(jobs.id, pendingJob.id), eq(jobs.status, "pending")))
                .returning();

            if (claimed.length === 0) continue;

            const job = claimed[0];
            const startTime = Date.now();

            try {
                const { driveId } = job.payload as { driveId: string };
                const result = await computeRanking(driveId);

                await db
                    .update(jobs)
                    .set({
                        status: "completed",
                        result: result as any,
                        latencyMs: Date.now() - startTime,
                        updatedAt: new Date(),
                    })
                    .where(eq(jobs.id, job.id));

                rankProcessed++;
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : "Unknown error";
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
                rankFailed++;
            }
        }

        results.rankings = { processed: rankProcessed, failed: rankFailed };
        logger.info("[Cron:All] Rankings done", {
            processed: rankProcessed,
            failed: rankFailed,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("[Cron:All] Rankings worker failed", { error: msg });
        results.rankings = { error: msg };
    }

    return NextResponse.json(
        { message: "Unified cron worker executed", results },
        { status: 200 },
    );
}
