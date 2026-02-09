import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateEmbedding, composeStudentEmbeddingText } from "@/lib/embeddings";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_JOBS_PER_TICK = 10;

/**
 * GET /api/cron/process-embeddings
 *
 * Cron worker that polls for pending generate_embedding jobs and processes them.
 * Generates 384-dim embeddings for student profiles using all-MiniLM-L6-v2.
 * Authenticated via CRON_SECRET bearer token.
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
      console.warn("Unauthorized cron attempt at process-embeddings");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron:Embeddings] Checking for pending generate_embedding jobs...");

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
      // 1. Find one pending generate_embedding job
      const [pendingJob] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(
          and(
            eq(jobs.type, "generate_embedding"),
            eq(jobs.status, "pending"),
          ),
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
        const { targetType, targetId } = job.payload as {
          targetType: "student" | "drive";
          targetId: string;
        };

        console.log(
          `[Cron:Embeddings] Processing job ${job.id} for ${targetType} ${targetId}`,
        );

        if (targetType === "student") {
          // Fetch student profile
          const student = await db.query.students.findFirst({
            where: eq(students.id, targetId),
            columns: {
              id: true,
              skills: true,
              projects: true,
              workExperience: true,
              certifications: true,
            },
          });

          if (!student) {
            throw new Error(`Student not found: ${targetId}`);
          }

          const text = composeStudentEmbeddingText({
            skills: student.skills,
            projects: student.projects,
            workExperience: student.workExperience,
            certifications: student.certifications,
          });

          if (!text || text.trim().length === 0) {
            throw new Error("Empty profile text, cannot generate embedding");
          }

          const embedding = await generateEmbedding(text);

          await db
            .update(students)
            .set({ embedding, updatedAt: new Date() })
            .where(eq(students.id, targetId));
        } else {
          // Drive embeddings are handled by the ranking pipeline
          throw new Error(`Unsupported target type: ${targetType}`);
        }

        // Mark complete
        await db
          .update(jobs)
          .set({
            status: "completed",
            result: { targetType, targetId },
            latencyMs: Date.now() - startTime,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        console.log(`[Cron:Embeddings] Job ${job.id} completed successfully.`);
        processed++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cron:Embeddings] Job ${job.id} failed:`, message);

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
      { message: "Embeddings worker executed", processed, failed },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Cron:Embeddings] Worker failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
