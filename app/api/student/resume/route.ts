
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { students, jobs } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { eq, and, sql } from "drizzle-orm";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";
import { logger } from "@/lib/logger";
import { isRedirectError } from "next/dist/client/components/redirect";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractCloudinaryPublicId(fileUrl: string): string | null {
    if (!fileUrl || !fileUrl.includes("/upload/")) return null;

    const [withoutQuery] = fileUrl.split("?");
    const [, uploadPath = ""] = withoutQuery.split("/upload/");
    if (!uploadPath) return null;

    let normalized = uploadPath;
    if (normalized.startsWith("fl_attachment/")) {
        normalized = normalized.slice("fl_attachment/".length);
    }
    normalized = normalized.replace(/^v\d+\//, "");
    if (!normalized) return null;

    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const fileName = segments[segments.length - 1];
    segments[segments.length - 1] = fileName.replace(/\.[^/.]+$/, "");

    return segments.join("/");
}

async function deleteCloudinaryRawByUrl(fileUrl: string): Promise<void> {
    const publicId = extractCloudinaryPublicId(fileUrl);
    if (!publicId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true }) as any;
    if (result?.result !== "ok" && result?.result !== "not found") {
        throw new Error(`Cloudinary delete failed: ${result?.result ?? "unknown"}`);
    }
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const { user, profile } = await requireStudentProfile();
        const previousResumeUrl = profile.resumeUrl;

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cloudinary is not configured on the server. Please contact support.",
                },
                { status: 500 },
            );
        }

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // 3. Validation
        // Max size: 5MB
        const MAX_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        ];

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Invalid file type. Only PDF and DOCX are allowed." },
                { status: 400 }
            );
        }

        // Extra MIME validation: verify magic bytes match declared type
        const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        const isPdfMagic =
            headerBytes[0] === 0x25 &&
            headerBytes[1] === 0x50 &&
            headerBytes[2] === 0x44 &&
            headerBytes[3] === 0x46; // %PDF
        const isZipMagic =
            headerBytes[0] === 0x50 &&
            headerBytes[1] === 0x4b &&
            headerBytes[2] === 0x03 &&
            headerBytes[3] === 0x04; // PK.. (DOCX is a ZIP)

        if (file.type === "application/pdf" && !isPdfMagic) {
            return NextResponse.json(
                { success: false, error: "File content does not match PDF type." },
                { status: 400 }
            );
        }
        if (
            file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
            !isZipMagic
        ) {
            return NextResponse.json(
                { success: false, error: "File content does not match DOCX type." },
                { status: 400 }
            );
        }

        // 4. Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine format explicitly
        const timestamp = Date.now();
        const isPdf = file.type === "application/pdf";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "skillsync-resumes",
                    resource_type: "raw",
                    // Remove the format from public_id — let Cloudinary handle the extension
                    public_id: `${user.id}_${timestamp}`,
                    access_mode: "public",
                    overwrite: true,
                    // Add format explicitly based on file type
                    format: isPdf ? "pdf" : "docx",
                },
                (error, result) => {
                    if (error) {
                        console.error("[Cloudinary] Upload error:", error);
                        reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        // Verify we got a URL back
        if (!uploadResult?.secure_url) {
            throw new Error("Cloudinary upload succeeded but returned no URL");
        }

        const resumeUrl = uploadResult.secure_url;

        // 5. Get client-extracted text
        const resumeText = formData.get("resumeText") as string | null;
        const source = (formData.get("source") as string | null)?.toString() || "";

        // 6. Update DB — store URL and raw text immediately (fast response)
        await db
            .update(students)
            .set({
                resumeUrl: resumeUrl,
                resumeFilename: file.name,
                resumeMime: file.type,
                resumeUploadedAt: new Date(),
                resumeText: resumeText || null,
                updatedAt: new Date(),
            })
            .where(eq(students.id, user.id));

        // Keep only the latest master resume in Cloudinary.
        if (previousResumeUrl && previousResumeUrl !== resumeUrl) {
            try {
                await deleteCloudinaryRawByUrl(previousResumeUrl);
                logger.info("[Resume API] Deleted previous master resume", {
                    userId: user.id,
                    previousResumeUrl,
                });
            } catch (deleteError) {
                logger.warn("[Resume API] Could not delete previous master resume", {
                    userId: user.id,
                    previousResumeUrl,
                    error: deleteError instanceof Error ? deleteError.message : String(deleteError),
                });
            }
        }

        // 7. Enqueue AI parsing job for onboarding and low-completeness profiles.
        let jobId: string | null = null;
        const shouldQueue =
            source === "onboarding" ||
            source === "profile_update" ||
            (profile.profileCompleteness ?? 0) < 80;

        // If onboarding flow or not yet complete, enqueue a parse job so the server
        // can attempt server-side extraction when client-side text is missing.
        // We include resumeText if present, otherwise null and the worker will fetch the file.
        if (shouldQueue) {
            // Check for existing pending parse job for this student (dedup)
            const existingJob = await db.query.jobs.findFirst({
                where: and(
                    eq(jobs.type, "parse_resume"),
                    eq(jobs.status, "pending"),
                    sql`${jobs.payload}->>'studentId' = ${user.id}`,
                ),
            });

            if (existingJob) {
                // Update existing pending job with new text
                await db
                    .update(jobs)
                    .set({
                        payload: {
                            studentId: user.id,
                            resumeText: resumeText && resumeText.length >= 50 ? resumeText : null,
                            resumeUrl,
                            mimeType: file.type,
                        },
                        updatedAt: new Date(),
                    })
                    .where(eq(jobs.id, existingJob.id));
                jobId = existingJob.id;
                logger.info(`[Resume API] Updated existing job ${jobId} for student ${user.id}`);
            } else {
                // Insert new job (payload.resumeText may be null)
                const [newJob] = await db
                    .insert(jobs)
                    .values({
                        type: "parse_resume",
                        status: "pending",
                        priority: 7, // Resume parsing is high priority
                        payload: {
                            studentId: user.id,
                            resumeText: resumeText && resumeText.length >= 50 ? resumeText : null,
                            resumeUrl,
                            mimeType: file.type,
                        },
                    })
                    .returning({ id: jobs.id });
                jobId = newJob.id;
                logger.info(`[Resume API] Enqueued new job ${jobId} for student ${user.id}`);
            }
            // Fire-and-forget: trigger worker immediately so the job is processed
            // without waiting for the external cron. Errors are caught silently.
            processResumeParseJobs().catch((err) =>
                console.error("[Resume API] Background parse failed:", err)
            );
        }

        // Warn early if AI keys are not present — parsing will likely fail.
        const warnings: string[] = [];
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GROQ_API_KEY) {
            warnings.push("AI provider not configured — resume parsing may fail until API keys are set on the server.");
            console.warn("[Resume API] No AI keys configured; parsing jobs will likely fail.");
        }

        return NextResponse.json(
            {
                success: true,
                message: "Resume uploaded.",
                data: {
                    url: resumeUrl,
                    jobId,
                    status: jobId ? "queued" : "uploaded",
                    warnings,
                }
            },
            { status: 202 }
        );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("Resume upload failed:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error during upload" },
            { status: 500 }
        );
    }
}
