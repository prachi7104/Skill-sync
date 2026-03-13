
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { enforceDetailedAnalysisLimits, incrementDetailedAnalysisUsage } from "@/lib/guardrails/sandbox-limits";
import { GuardrailViolation } from "@/lib/guardrails/errors";
import { parseResumeWithAI } from "@/lib/resume/ai-parser";
import { performDetailedAnalysis } from "@/lib/ats/detailed-analysis";
import { generateEmbedding } from "@/lib/embeddings/generate";
import { parseJD } from "@/lib/jd/parser";
import { type StudentProfileInput } from "@/lib/validations/student-profile";

// Maximum execution time (Next.js default is often 10-60s, Vercel Pro is 60s)
// This process is heavy (3 AI calls + 2 Embeddings), might take 30s+.
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get student ID and profile data
        // Primary: look up by session user ID (DB UUID stored in JWT)
        let student;
        const directResult = await db
            .select()
            .from(students)
            .where(eq(students.id, session.user.id));
        student = directResult[0];

        // Fallback: if ID lookup fails (e.g. JWT has provider ID instead of DB ID),
        // look up user by email first, then fetch student by that user's ID
        if (!student && session.user.email) {
            const { users } = await import("@/lib/db/schema");
            const [dbUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, session.user.email.toLowerCase()));
            if (dbUser) {
                const [fallbackStudent] = await db
                    .select()
                    .from(students)
                    .where(eq(students.id, dbUser.id));
                student = fallbackStudent;
            }
        }

        if (!student) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        // 2. Limit Check
        try {
            await enforceDetailedAnalysisLimits(student.id);
        } catch (error: any) {
            // GuardrailViolation carries the correct status (429) and structured JSON
            if (error instanceof GuardrailViolation) {
                return NextResponse.json(error.toJSON(), { status: error.status });
            }
            return NextResponse.json({ error: error.message }, { status: 403 });
        }




//         // 2. Limit Check
// try {
//     // await enforceDetailedAnalysisLimits(student.id); // <--- COMMENT THIS OUT
//     console.log("Local testing: Bypassing detailed limits");
// } catch (error: any) {
//     if (error instanceof GuardrailViolation) {
//         return NextResponse.json(error.toJSON(), { status: error.status });
//     }
//     return NextResponse.json({ error: error.message }, { status: 403 });
// }



        // 3. Parse JSON body (text extracted client-side)
        const body = await req.json();
        const { resumeText, jdText } = body as { resumeText?: string; jdText?: string };

        if (!resumeText || !jdText) {
            return NextResponse.json({ error: "Missing resume text or JD text" }, { status: 400 });
        }

        if (resumeText.length < 50) {
            return NextResponse.json({ error: "Resume text is too sparse or empty." }, { status: 400 });
        }

        // 5. Parallel AI Processing
        // We need:
        // A. Parsed Resume (AI)
        // B. Structured JD (AI)
        // C. Resume Embedding (Model)
        // D. JD Embedding (Model)

        // Run AI parsing in parallel (these are independent of embeddings)
        const [parsedResume, structuredJD] = await Promise.all([
            parseResumeWithAI(resumeText),
            parseJD(jdText),
        ]);

        // Embeddings: fail gracefully — analysis continues without them
        let jdEmbedding: number[] | null = null;
        let studentProfileEmbedding: number[] | null = student.embedding ?? null;
        let embeddingWarning = false;

        try {
            jdEmbedding = await generateEmbedding(jdText, "jd");
        } catch (err) {
            console.warn("[sandbox/detailed] JD embedding failed, using keyword match:", err);
            embeddingWarning = true;
        }

        if (!studentProfileEmbedding) {
            try {
                const profileString = [
                    student.softSkills?.join(", "),
                    student.skills?.map((s: any) => s.name).join(" "),
                    student.projects?.map((p: any) => p.title + " " + p.description).join(" "),
                    student.workExperience?.map((e: any) => e.role + " " + e.description).join(" "),
                ].filter(Boolean).join(" ");
                studentProfileEmbedding = await generateEmbedding(profileString);
            } catch (err) {
                console.warn("[sandbox/detailed] Profile embedding failed, using keyword match:", err);
                embeddingWarning = true;
            }
        }

        // 7. Perform Analysis
        // performDetailedAnalysis accepts null embeddings and falls back to keyword scoring
        const typedProfile = student as unknown as StudentProfileInput;

        const analysisResult = await performDetailedAnalysis(
            structuredJD,
            jdEmbedding,
            resumeText,
            parsedResume,
            typedProfile,
            studentProfileEmbedding
        );

        // 8. Increment Usage
        await incrementDetailedAnalysisUsage(student.id);

        return NextResponse.json({
            success: true,
            data: analysisResult,
            ...(embeddingWarning && { warning: "Semantic matching unavailable — keyword analysis used instead" }),
        });

    } catch (error: any) {
        console.error("Detailed Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
    }
}
