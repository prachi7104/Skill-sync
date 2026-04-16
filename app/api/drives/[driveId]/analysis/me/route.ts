import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ResumeImpact = {
  topStrengths: string[];
  topGaps: string[];
  suggestedBullets: string[];
};

type InterviewPrep = {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  hrQuestions: string[];
};

function buildResumeImpact(row: {
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation: string;
}): ResumeImpact {
  const strengths = row.matchedSkills.slice(0, 5);
  const gaps = row.missingSkills.slice(0, 5);

  return {
    topStrengths: strengths,
    topGaps: gaps,
    suggestedBullets: [
      `Demonstrated ${strengths[0] ?? "core engineering"} capability across academic and practical projects.`,
      `Collaborated in delivery-focused work with measurable outcomes and structured execution.`,
      row.shortExplanation,
    ],
  };
}

function buildInterviewPrep(row: {
  matchedSkills: string[];
  missingSkills: string[];
  roleTitle: string;
}): InterviewPrep {
  const focus = row.matchedSkills.slice(0, 3);
  const weak = row.missingSkills.slice(0, 3);

  return {
    technicalQuestions: [
      `Explain a ${row.roleTitle} task where you used ${focus[0] ?? "your core stack"}.`,
      `How would you optimize a solution involving ${focus[1] ?? "data processing"}?`,
      `Describe trade-offs between accuracy and performance in your recent project work.`,
    ],
    behavioralQuestions: [
      "Tell us about a difficult deadline and how you handled pressure.",
      "Describe a disagreement in your team and how you resolved it.",
      "Share one failure and what changed in your approach afterward.",
    ],
    hrQuestions: [
      `Why are you interested in ${row.roleTitle}?`,
      "What are your 12-month learning goals?",
      `How are you closing gaps like ${weak.join(", ") || "advanced problem solving"}?`,
    ],
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    const user = await requireRole(["student"]);

    // Check drive exists and rankings are visible
    const [drive] = await db
      .select({ rankingsVisible: drives.rankingsVisible, collegeId: drives.collegeId })
      .from(drives)
      .where(eq(drives.id, params.driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ message: "Drive not found" }, { status: 404 });
    }

    if (!user.collegeId || drive.collegeId !== user.collegeId) {
      return NextResponse.json({ message: "Drive not found" }, { status: 404 });
    }

    if (!drive.rankingsVisible) {
      return NextResponse.json(
        { message: "Rankings for this drive have not been published yet" },
        { status: 403 }
      );
    }

    const [row] = await db
      .select({
        rankingId: rankings.id,
        resumeDiffJson: rankings.resumeDiffJson,
        interviewQuestionsJson: rankings.interviewQuestionsJson,
        analysisGeneratedAt: rankings.analysisGeneratedAt,
      })
      .from(rankings)
      .where(and(eq(rankings.driveId, params.driveId), eq(rankings.studentId, user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: "Ranking not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasAnalysis: Boolean(row.analysisGeneratedAt && row.resumeDiffJson && row.interviewQuestionsJson),
      resumeImpact: row.resumeDiffJson,
      interviewPrep: row.interviewQuestionsJson,
      analysisGeneratedAt: row.analysisGeneratedAt,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to fetch analysis" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    const user = await requireRole(["student"]);

    // Check drive exists and rankings are visible
    const [drive] = await db
      .select({ rankingsVisible: drives.rankingsVisible, collegeId: drives.collegeId })
      .from(drives)
      .where(eq(drives.id, params.driveId))
      .limit(1);

    if (!drive) {
      return NextResponse.json({ message: "Drive not found" }, { status: 404 });
    }

    if (!user.collegeId || drive.collegeId !== user.collegeId) {
      return NextResponse.json({ message: "Drive not found" }, { status: 404 });
    }

    if (!drive.rankingsVisible) {
      return NextResponse.json(
        { message: "Rankings for this drive have not been published yet" },
        { status: 403 }
      );
    }

    const [row] = await db
      .select({
        rankingId: rankings.id,
        matchedSkills: rankings.matchedSkills,
        missingSkills: rankings.missingSkills,
        shortExplanation: rankings.shortExplanation,
        roleTitle: drives.roleTitle,
      })
      .from(rankings)
      .innerJoin(drives, eq(drives.id, rankings.driveId))
      .where(and(eq(rankings.driveId, params.driveId), eq(rankings.studentId, user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: "Ranking not found" }, { status: 404 });
    }

    const matchedSkills = (row.matchedSkills ?? []) as string[];
    const missingSkills = (row.missingSkills ?? []) as string[];

    // Generate both analysis payloads in parallel for low latency.
    const [resumeImpact, interviewPrep] = await Promise.all([
      Promise.resolve(
        buildResumeImpact({
          matchedSkills,
          missingSkills,
          shortExplanation: row.shortExplanation,
        })
      ),
      Promise.resolve(
        buildInterviewPrep({
          matchedSkills,
          missingSkills,
          roleTitle: row.roleTitle,
        })
      ),
    ]);

    const now = new Date();
    await db
      .update(rankings)
      .set({
        resumeDiffJson: resumeImpact,
        interviewQuestionsJson: interviewPrep,
        analysisGeneratedAt: now,
        updatedAt: now,
      })
      .where(eq(rankings.id, row.rankingId));

    return NextResponse.json({
      hasAnalysis: true,
      resumeImpact,
      interviewPrep,
      analysisGeneratedAt: now.toISOString(),
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Failed to generate analysis" }, { status: 500 });
  }
}
