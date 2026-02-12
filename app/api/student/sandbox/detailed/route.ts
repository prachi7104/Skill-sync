
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { enforceDetailedAnalysisLimits, incrementDetailedAnalysisUsage } from "@/lib/guardrails/sandbox-limits";
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
        const [student] = await db
            .select()
            .from(students)
            .where(eq(students.id, session.user.id));

        if (!student) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        // 2. Limit Check
        try {
            await enforceDetailedAnalysisLimits(student.id);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

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

        // Let's run independent tasks in parallel to speed up.

        const [parsedResume, structuredJD, jdEmbedding] = await Promise.all([
            parseResumeWithAI(resumeText),
            parseJD(jdText), // This internally calls AI
            generateEmbedding(jdText, "jd")
        ]);

        // 6. Profile Embedding (Fetch or Generate)
        let studentProfileEmbedding = student.embedding;
        if (!studentProfileEmbedding) {
            // Generate on the fly if missing
            const profileString = `
                ${student.softSkills?.join(", ")}
                ${student.skills?.map(s => s.name).join(" ")}
                ${student.projects?.map(p => p.title + " " + p.description).join(" ")}
                ${student.workExperience?.map(e => e.role + " " + e.description).join(" ")}
            `;
            studentProfileEmbedding = await generateEmbedding(profileString);
        }

        // 7. Perform Analysis
        // We need to validate/type the student profile from DB to match Zod schema expectation
        // The DB schema is close to Zod but might have nulls where Zod expects optionals.
        // We'll cast it for now, assuming DB consistency.
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
            data: analysisResult
        });

    } catch (error: any) {
        console.error("Detailed Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
    }
}
