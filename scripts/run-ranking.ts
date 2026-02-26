/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Manual Ranking Computation Script
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Temporary script for manually triggering ranking computation for a drive.
 *
 * Usage:
 *   npx tsx scripts/run-ranking.ts <drive_id>
 *
 * Example:
 *   npx tsx scripts/run-ranking.ts 550e8400-e29b-41d4-a716-446655440000
 *
 * Behavior:
 * - Accepts drive_id as argument
 * - Runs ranking computation
 * - Logs summary: total students, top 5 scores
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import { drives, students, rankings } from "../lib/db/schema";
import type { Skill, ParsedJD } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import { generateEmbedding } from "../lib/embeddings/generate";

dotenv.config({ path: ".env.local" });

// ─────────────────────────────────────────────────────────────────────────────
// Database Setup
// ─────────────────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// ─────────────────────────────────────────────────────────────────────────────
// Embedding Generation (inline to avoid server-only issues in scripts)
// ─────────────────────────────────────────────────────────────────────────────

const EMBEDDING_DIMENSION = 768; // gemini-embedding-001 dimension

async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const embedding = await generateEmbedding(text);

  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSION}-dimensional embedding, got ${embedding.length}`
    );
  }

  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return Math.max(0, Math.min(1, dotProduct));
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Composition
// ─────────────────────────────────────────────────────────────────────────────

function composeStudentEmbeddingText(profile: {
  skills?: Skill[] | null;
  projects?: any[] | null;
  workExperience?: any[] | null;
  certifications?: any[] | null;
}): string {
  const parts: string[] = [];

  if (profile.skills && profile.skills.length > 0) {
    const skillNames = profile.skills.map((s) => s.name).join(", ");
    parts.push(`Skills: ${skillNames}`);
  }

  if (profile.projects && profile.projects.length > 0) {
    const projectTexts = profile.projects.map((p: any) => {
      const techStack = p.techStack?.length > 0 ? ` (${p.techStack.join(", ")})` : "";
      return `${p.title}: ${p.description}${techStack}`;
    });
    parts.push(`Projects: ${projectTexts.join("; ")}`);
  }

  if (profile.workExperience && profile.workExperience.length > 0) {
    const workTexts = profile.workExperience.map(
      (w: any) => `${w.role} at ${w.company}: ${w.description}`
    );
    parts.push(`Experience: ${workTexts.join("; ")}`);
  }

  if (profile.certifications && profile.certifications.length > 0) {
    const certNames = profile.certifications.map((c: any) => c.title).join(", ");
    parts.push(`Certifications: ${certNames}`);
  }

  return parts.join(". ");
}

function composeJDEmbeddingText(jd: {
  parsedJd?: ParsedJD | null;
  rawJd: string;
  roleTitle: string;
  company: string;
}): string {
  if (jd.parsedJd) {
    const parts: string[] = [];
    parts.push(`${jd.parsedJd.title} at ${jd.parsedJd.company}`);

    if (jd.parsedJd.responsibilities && jd.parsedJd.responsibilities.length > 0) {
      parts.push(`Responsibilities: ${jd.parsedJd.responsibilities.join("; ")}`);
    }

    if (jd.parsedJd.requiredSkills && jd.parsedJd.requiredSkills.length > 0) {
      parts.push(`Required Skills: ${jd.parsedJd.requiredSkills.join(", ")}`);
    }

    if (jd.parsedJd.preferredSkills && jd.parsedJd.preferredSkills.length > 0) {
      parts.push(`Preferred Skills: ${jd.parsedJd.preferredSkills.join(", ")}`);
    }

    if (jd.parsedJd.qualifications && jd.parsedJd.qualifications.length > 0) {
      parts.push(`Qualifications: ${jd.parsedJd.qualifications.join("; ")}`);
    }

    if (jd.parsedJd.summary) {
      parts.push(jd.parsedJd.summary);
    }

    return parts.join(". ");
  }

  return `${jd.roleTitle} at ${jd.company}. ${jd.rawJd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_WEIGHT = 0.7;
const STRUCTURED_WEIGHT = 0.3;

interface EligibilityCriteria {
  minCgpa: number | null;
  eligibleBranches: string[] | null;
  eligibleBatchYears: number[] | null;
  eligibleCategories: ("alpha" | "beta" | "gamma")[] | null;
}

interface StudentProfile {
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;
  skillNames: string[];
}

interface ScoringResult {
  matchScore: number;
  semanticScore: number;
  structuredScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation: string;
  isEligible: boolean;
  ineligibilityReason?: string;
}

function checkEligibility(
  student: StudentProfile,
  criteria: EligibilityCriteria
): { isEligible: boolean; reason?: string } {
  if (criteria.minCgpa !== null && criteria.minCgpa !== undefined) {
    if (student.cgpa === null || student.cgpa === undefined) {
      return { isEligible: false, reason: "CGPA not available" };
    }
    if (student.cgpa < criteria.minCgpa) {
      return {
        isEligible: false,
        reason: `CGPA ${student.cgpa.toFixed(2)} below minimum ${criteria.minCgpa}`,
      };
    }
  }

  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    if (!student.branch) {
      return { isEligible: false, reason: "Branch not available" };
    }
    const normalizedBranches = criteria.eligibleBranches.map((b) =>
      b.toLowerCase().trim()
    );
    if (!normalizedBranches.includes(student.branch.toLowerCase().trim())) {
      return {
        isEligible: false,
        reason: `Branch "${student.branch}" not in eligible list`,
      };
    }
  }

  if (criteria.eligibleBatchYears && criteria.eligibleBatchYears.length > 0) {
    if (student.batchYear === null || student.batchYear === undefined) {
      return { isEligible: false, reason: "Batch year not available" };
    }
    if (!criteria.eligibleBatchYears.includes(student.batchYear)) {
      return {
        isEligible: false,
        reason: `Batch year ${student.batchYear} not in eligible list`,
      };
    }
  }

  if (criteria.eligibleCategories && criteria.eligibleCategories.length > 0) {
    if (!student.category) {
      return { isEligible: false, reason: "Performance category not available" };
    }
    if (!criteria.eligibleCategories.includes(student.category)) {
      return {
        isEligible: false,
        reason: `Category "${student.category}" not in eligible list`,
      };
    }
  }

  return { isEligible: true };
}

function computeSkillOverlap(
  studentSkills: string[],
  requiredSkills: string[]
): { matchedSkills: string[]; missingSkills: string[]; overlapRatio: number } {
  if (requiredSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], overlapRatio: 1 };
  }

  const normalizedStudentSkills = new Set(
    studentSkills.map((s) => s.toLowerCase().trim())
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const required of requiredSkills) {
    const normalizedRequired = required.toLowerCase().trim();
    const isMatched = Array.from(normalizedStudentSkills).some(
      (studentSkill) =>
        studentSkill === normalizedRequired ||
        studentSkill.includes(normalizedRequired) ||
        normalizedRequired.includes(studentSkill)
    );

    if (isMatched) {
      matchedSkills.push(required);
    } else {
      missingSkills.push(required);
    }
  }

  return { matchedSkills, missingSkills, overlapRatio: matchedSkills.length / requiredSkills.length };
}

function computeAllScores(
  studentEmbedding: number[],
  jdEmbedding: number[],
  studentProfile: StudentProfile,
  requiredSkills: string[],
  eligibility: EligibilityCriteria
): ScoringResult {
  const { isEligible, reason } = checkEligibility(studentProfile, eligibility);

  const { matchedSkills, missingSkills, overlapRatio } = computeSkillOverlap(
    studentProfile.skillNames,
    requiredSkills
  );

  const similarity = cosineSimilarity(studentEmbedding, jdEmbedding);
  const semanticScore = Math.round(similarity * 100);
  const structuredScore = isEligible ? Math.round(overlapRatio * 100) : 0;
  const matchScore = Math.round(
    SEMANTIC_WEIGHT * semanticScore + STRUCTURED_WEIGHT * structuredScore
  );

  const totalRequired = matchedSkills.length + missingSkills.length;
  let shortExplanation: string;

  if (!isEligible) {
    shortExplanation = `Not eligible: ${reason}`;
  } else if (totalRequired === 0) {
    shortExplanation =
      matchScore >= 80
        ? `Strong semantic match (${matchScore}%)`
        : matchScore >= 60
          ? `Moderate semantic match (${matchScore}%)`
          : `Low semantic match (${matchScore}%)`;
  } else {
    const skillSummary = `${matchedSkills.length}/${totalRequired} skills matched`;
    shortExplanation =
      matchScore >= 80
        ? `Strong match: ${skillSummary}`
        : matchScore >= 60
          ? `Good match: ${skillSummary}`
          : matchScore >= 40
            ? `Partial match: ${skillSummary}`
            : `Weak match: ${skillSummary}`;
  }

  return {
    matchScore,
    semanticScore,
    structuredScore,
    matchedSkills,
    missingSkills,
    shortExplanation,
    isEligible,
    ineligibilityReason: reason,
  };
}

function generateDetailedExplanation(scoring: ScoringResult): string {
  const lines: string[] = [];

  if (!scoring.isEligible) {
    lines.push(`Eligibility: Not eligible - ${scoring.ineligibilityReason}`);
  } else {
    lines.push("Eligibility: Meets all requirements");
  }

  lines.push("");
  lines.push("Score Breakdown:");
  lines.push(`- Semantic Score: ${scoring.semanticScore}/100 (70% weight)`);
  lines.push(`- Structured Score: ${scoring.structuredScore}/100 (30% weight)`);
  lines.push(`- Final Match Score: ${scoring.matchScore}/100`);

  lines.push("");
  lines.push("Skill Analysis:");
  lines.push(
    scoring.matchedSkills.length > 0
      ? `- Matched Skills: ${scoring.matchedSkills.join(", ")}`
      : "- Matched Skills: None"
  );
  lines.push(
    scoring.missingSkills.length > 0
      ? `- Missing Skills: ${scoring.missingSkills.join(", ")}`
      : "- Missing Skills: None"
  );

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Ranking Logic
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const driveId = process.argv[2];

  if (!driveId) {
    console.error("❌ Usage: npx tsx scripts/run-ranking.ts <drive_id>");
    console.error("   Example: npx tsx scripts/run-ranking.ts 550e8400-e29b-41d4-a716-446655440000");
    process.exit(1);
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(driveId)) {
    console.error(`❌ Invalid UUID format: ${driveId}`);
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SkillSync — Ranking Computation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Drive ID: ${driveId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // 1. Fetch drive
    console.log("📋 Fetching drive...");
    const [drive] = await db.select().from(drives).where(eq(drives.id, driveId)).limit(1);

    if (!drive) {
      console.error(`❌ Drive not found: ${driveId}`);
      process.exit(1);
    }

    console.log(`   Company: ${drive.company}`);
    console.log(`   Role: ${drive.roleTitle}`);
    console.log(`   Min CGPA: ${drive.minCgpa ?? "None"}`);
    console.log(`   Eligible Branches: ${drive.eligibleBranches?.join(", ") ?? "All"}`);
    console.log(`   Eligible Batch Years: ${drive.eligibleBatchYears?.join(", ") ?? "All"}`);
    console.log("");

    // 2. Build eligibility criteria
    const eligibility: EligibilityCriteria = {
      minCgpa: drive.minCgpa,
      eligibleBranches: drive.eligibleBranches,
      eligibleBatchYears: drive.eligibleBatchYears,
      eligibleCategories: drive.eligibleCategories,
    };

    // 3. Fetch all students
    console.log("👥 Fetching students...");
    const allStudents = await db.select().from(students);
    console.log(`   Found ${allStudents.length} students`);
    console.log("");

    // 4. Generate JD embedding
    console.log("🧠 Generating JD embedding...");
    let jdEmbedding: number[];
    if (drive.jdEmbedding && drive.jdEmbedding.length === EMBEDDING_DIMENSION) {
      jdEmbedding = drive.jdEmbedding;
      console.log("   Using existing embedding");
    } else {
      const jdText = composeJDEmbeddingText({
        parsedJd: drive.parsedJd,
        rawJd: drive.rawJd,
        roleTitle: drive.roleTitle,
        company: drive.company,
      });
      jdEmbedding = await generateTextEmbedding(jdText);
      console.log("   Generated new embedding");

      // Update drive
      await db
        .update(drives)
        .set({ jdEmbedding, updatedAt: new Date() })
        .where(eq(drives.id, drive.id));
    }
    console.log("");

    // 5. Extract required skills
    const requiredSkills = drive.parsedJd?.requiredSkills?.map((s) => s.toLowerCase().trim()) ?? [];
    console.log(`📝 Required skills: ${requiredSkills.length > 0 ? requiredSkills.join(", ") : "None specified"}`);
    console.log("");

    // 6. Compute scores for each student
    console.log("⚙️  Computing scores...");
    const rankedStudents: Array<{
      studentId: string;
      scoring: ScoringResult;
    }> = [];

    for (const student of allStudents) {
      try {
        // Generate student embedding
        let studentEmbedding: number[];
        if (student.embedding && student.embedding.length === EMBEDDING_DIMENSION) {
          studentEmbedding = student.embedding;
        } else {
          const profileText = composeStudentEmbeddingText({
            skills: student.skills,
            projects: student.projects,
            workExperience: student.workExperience,
            certifications: student.certifications,
          });

          if (!profileText || profileText.trim().length === 0) {
            errors.push(`Student ${student.id}: Empty profile`);
            continue;
          }

          studentEmbedding = await generateTextEmbedding(profileText);

          // Update student
          await db
            .update(students)
            .set({ embedding: studentEmbedding, updatedAt: new Date() })
            .where(eq(students.id, student.id));
        }

        // Build student profile
        const skillNames = (student.skills ?? []).map((s) => s.name.toLowerCase().trim());
        const studentProfile: StudentProfile = {
          cgpa: student.cgpa,
          branch: student.branch,
          batchYear: student.batchYear,
          category: student.category,
          skillNames,
        };

        // Compute scores
        const scoring = computeAllScores(
          studentEmbedding,
          jdEmbedding,
          studentProfile,
          requiredSkills,
          eligibility
        );

        rankedStudents.push({ studentId: student.id, scoring });
        process.stdout.write(".");
      } catch (err) {
        errors.push(`Student ${student.id}: ${err}`);
      }
    }
    console.log("");
    console.log(`   Processed ${rankedStudents.length} students`);
    console.log("");

    // 7. Sort by match score
    rankedStudents.sort((a, b) => b.scoring.matchScore - a.scoring.matchScore);

    // 8. Assign rank positions
    const rankedWithPositions = rankedStudents.map((r, index) => ({
      ...r,
      rankPosition: index + 1,
    }));

    // 9. Persist rankings
    console.log("💾 Persisting rankings...");
    await db.transaction(async (tx) => {
      // Clear existing
      await tx.delete(rankings).where(eq(rankings.driveId, driveId));

      // Insert new
      if (rankedWithPositions.length > 0) {
        const rows = rankedWithPositions.map((r) => ({
          driveId,
          studentId: r.studentId,
          matchScore: r.scoring.matchScore,
          semanticScore: r.scoring.semanticScore,
          structuredScore: r.scoring.structuredScore,
          matchedSkills: r.scoring.matchedSkills,
          missingSkills: r.scoring.missingSkills,
          shortExplanation: r.scoring.shortExplanation,
          detailedExplanation: generateDetailedExplanation(r.scoring),
          rankPosition: r.rankPosition,
        }));
        await tx.insert(rankings).values(rows);
      }
    });
    console.log(`   Saved ${rankedWithPositions.length} rankings`);
    console.log("");

    // 10. Summary
    const duration = Date.now() - startTime;
    const eligibleCount = rankedStudents.filter((r) => r.scoring.isEligible).length;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Total Students:    ${allStudents.length}`);
    console.log(`  Ranked Students:   ${rankedStudents.length}`);
    console.log(`  Eligible Students: ${eligibleCount}`);
    console.log(`  Duration:          ${duration}ms`);
    console.log("");

    if (rankedWithPositions.length > 0) {
      console.log("  Top 5 Scores:");
      console.log("  ┌──────┬───────────────────────────────────────┬───────┐");
      console.log("  │ Rank │ Student ID                            │ Score │");
      console.log("  ├──────┼───────────────────────────────────────┼───────┤");
      rankedWithPositions.slice(0, 5).forEach((r) => {
        console.log(
          `  │ ${String(r.rankPosition).padStart(4)} │ ${r.studentId} │ ${String(r.scoring.matchScore).padStart(5)} │`
        );
      });
      console.log("  └──────┴───────────────────────────────────────┴───────┘");
    }

    if (errors.length > 0) {
      console.log("");
      console.log("  Errors:");
      errors.slice(0, 5).forEach((e) => console.log(`  ⚠️  ${e}`));
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more`);
      }
    }

    console.log("");
    console.log("✅ Ranking computation complete!");

  } catch (err) {
    console.error("");
    console.error("❌ Fatal error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
