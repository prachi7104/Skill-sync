
import { StructuredJD } from "@/lib/jd/parser";
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { EnhancedResume } from "./types";
import { matchSkills } from "./matching";
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings/generate";
import { studentProfileSchema } from "@/lib/validations/student-profile";
import { z } from "zod";

// ============================================================================
// RESULT INTERFACE
// ============================================================================

export interface ScoreBreakdown {
    semantic: number;        // 0-100: How semantically similar is the candidate to the JD?
    hardSkills: number;      // 0-100: % of required technical skills matched
    softSkills: number;      // 0-100: % of preferred skills matched
    experience: number;      // 0-100: How well does experience level match?
    evidenceQuality: number; // 0-100: How well are matched skills backed by proof?
}

export interface CategorizedSkill {
    skill: string;
    status: "matched" | "missing" | "partial";
    impact: "Critical" | "High" | "Medium" | "Low";
    evidenceLevel: number;   // 0-4 (from EvidenceLevel type)
    evidenceDetail: string;
    category: "Hard Requirement" | "Soft Requirement";
}

export interface ActionableFeedback {
    type: "add_skill" | "strengthen_evidence" | "highlight_project" | "tailor_resume";
    priority: "High" | "Medium" | "Low";
    message: string;
    skill?: string;
}

export interface DetailedAnalysisResult {
    // Overall scores (0-100)
    resumeMatchScore: number;
    profileMatchScore: number;
    resumeSemanticScore: number;
    profileSemanticScore: number;

    // NEW: Granular breakdown
    resumeScoreBreakdown: ScoreBreakdown;
    profileScoreBreakdown: ScoreBreakdown;

    // NEW: Categorized skills
    categorizedSkills: CategorizedSkill[];

    // NEW: Actionable feedback
    actionableFeedback: ActionableFeedback[];

    // Existing (kept for backward compat)
    parsedResume: ParsedResumeData;
    resumeAnalysis: ReturnType<typeof matchSkills>;
    profileAnalysis: ReturnType<typeof matchSkills>;
    missedOpportunities: Array<{
        skill: string;
        impact: "High" | "Medium" | "Low";
        reason: string;
    }>;
}

// ============================================================================
// EVIDENCE WEIGHT MAP — Skills backed by proof score higher
// ============================================================================

/**
 * Evidence Level → Weight multiplier:
 *   0 = Not found           → 0.0x
 *   1 = Listed in skills    → 0.5x  (claim without proof)
 *   2 = Used in project     → 0.8x  (demonstrated in project)
 *   3 = Used professionally → 1.0x  (work experience proof)
 *   4 = Research paper      → 1.0x  (academic proof)
 */
const EVIDENCE_WEIGHTS: Record<number, number> = {
    0: 0.0,
    1: 0.5,
    2: 0.8,
    3: 1.0,
    4: 1.0,
};

// ============================================================================
// CORE ANALYSIS
// ============================================================================

export async function performDetailedAnalysis(
    jd: StructuredJD,
    jdEmbedding: number[],
    _resumeText: string,
    parsedResume: ParsedResumeData,
    studentProfile: z.infer<typeof studentProfileSchema>,
    studentProfileEmbedding: number[]
): Promise<DetailedAnalysisResult> {

    // 1. Generate Resume Embedding
    const resumeString = [
        parsedResume.professional_summary,
        parsedResume.skills.map(s => s.name).join(" "),
        parsedResume.experience.map(e => `${e.role} ${e.description}`).join(" "),
        parsedResume.projects.map(p => `${p.title} ${p.tech_stack?.join(" ")}`).join(" "),
    ].filter(Boolean).join(". ");
    const resumeEmbedding = await generateEmbedding(resumeString);

    // 2. Semantic Scores
    const resumeSemanticScore = cosineSimilarity(resumeEmbedding, jdEmbedding);
    const profileSemanticScore = cosineSimilarity(studentProfileEmbedding, jdEmbedding);

    // 3. Build EnhancedResume for matching
    const enhancedResume: EnhancedResume = {
        ...parsedResume,
        skills: parsedResume.skills.map(s => ({ name: s.name, category: s.category || "General" })),
        projects: parsedResume.projects.map(p => ({ title: p.title, description: p.description, tech_stack: p.tech_stack })),
        experience: parsedResume.experience.map(e => ({ role: e.role, company: e.company, description: e.description, skills_used: e.skills_used })),
        implicit_skills: [],
        research_papers: parsedResume.research_papers.map(r => ({ title: r.title, field: r.field, skills_demonstrated: r.skills_demonstrated })),
        computed_stack: { primary: { cluster: "General", confidence: 0, evidence: [] } },
        computed_seniority: { level: "Unknown", years: 0, rationale: "N/A", is_student: true },
        research_score: 0
    };

    const enhancedProfile: EnhancedResume = {
        full_name: "Student Profile",
        email: null, phone: null, linkedin_url: null, professional_summary: null,
        coding_profiles: [], education_history: [], certifications: [], achievements: [], soft_skills: [],
        skills: (studentProfile.skills || []).map(s => ({ name: s.name, category: "General" })),
        projects: (studentProfile.projects || []).map(p => ({ title: p.title, description: p.description || "", tech_stack: p.techStack })),
        experience: (studentProfile.workExperience || []).map(e => ({ role: e.role, company: e.company, description: e.description, skills_used: [] })),
        implicit_skills: [],
        research_papers: [],
        computed_stack: { primary: { cluster: "General", confidence: 0, evidence: [] } },
        computed_seniority: { level: "Unknown", years: 0, rationale: "N/A", is_student: true },
        research_score: 0
    };

    // 4. Run ATS Matching
    const resumeAnalysis = matchSkills(jd, enhancedResume);
    const profileAnalysis = matchSkills(jd, enhancedProfile);

    // 5. Compute Evidence-Weighted Scores
    const requiredSkillsCount = Math.max(jd.requirements.hard_requirements.technical_skills.length, 1);
    const preferredSkillsCount = Math.max(jd.requirements.soft_requirements.technical_skills.length, 1);

    // --- Resume scores ---
    const resumeHardMatched = resumeAnalysis.matched.filter(m => m.matched_category === "Hard Requirement");
    const resumeSoftMatched = resumeAnalysis.matched.filter(m => m.matched_category === "Soft Requirement");

    // Evidence-weighted hard skill score
    const resumeHardWeightedSum = resumeHardMatched.reduce((sum, m) => sum + (EVIDENCE_WEIGHTS[m.evidence_level] ?? 0.5), 0);
    const resumeHardSkillScore = Math.round((resumeHardWeightedSum / requiredSkillsCount) * 100);

    const resumeSoftSkillScore = Math.round((resumeSoftMatched.length / preferredSkillsCount) * 100);

    // Evidence quality: average evidence level of matched skills (0-4 → 0-100)
    const allResumeMatched = resumeAnalysis.matched;
    const resumeEvidenceQuality = allResumeMatched.length > 0
        ? Math.round((allResumeMatched.reduce((s, m) => s + m.evidence_level, 0) / allResumeMatched.length) * 25)
        : 0;

    // Experience score (simple heuristic — has work experience?)
    const resumeExperienceScore = parsedResume.experience.length > 0 ? 70 : 20;

    const resumeScoreBreakdown: ScoreBreakdown = {
        semantic: Math.round(resumeSemanticScore * 100),
        hardSkills: Math.min(100, resumeHardSkillScore),
        softSkills: Math.min(100, resumeSoftSkillScore),
        experience: resumeExperienceScore,
        evidenceQuality: Math.min(100, resumeEvidenceQuality),
    };

    // --- Profile scores ---
    const profileHardMatched = profileAnalysis.matched.filter(m => m.matched_category === "Hard Requirement");
    const profileSoftMatched = profileAnalysis.matched.filter(m => m.matched_category === "Soft Requirement");

    const profileHardWeightedSum = profileHardMatched.reduce((sum, m) => sum + (EVIDENCE_WEIGHTS[m.evidence_level] ?? 0.5), 0);
    const profileHardSkillScore = Math.round((profileHardWeightedSum / requiredSkillsCount) * 100);
    const profileSoftSkillScore = Math.round((profileSoftMatched.length / preferredSkillsCount) * 100);

    const allProfileMatched = profileAnalysis.matched;
    const profileEvidenceQuality = allProfileMatched.length > 0
        ? Math.round((allProfileMatched.reduce((s, m) => s + m.evidence_level, 0) / allProfileMatched.length) * 25)
        : 0;

    const profileExperienceScore = (studentProfile.workExperience?.length ?? 0) > 0 ? 70 : 20;

    const profileScoreBreakdown: ScoreBreakdown = {
        semantic: Math.round(profileSemanticScore * 100),
        hardSkills: Math.min(100, profileHardSkillScore),
        softSkills: Math.min(100, profileSoftSkillScore),
        experience: profileExperienceScore,
        evidenceQuality: Math.min(100, profileEvidenceQuality),
    };

    // 6. Overall Match Scores (weighted composite)
    // 40% Hard Skills + 25% Semantic + 15% Soft Skills + 10% Evidence + 10% Experience
    const computeOverall = (b: ScoreBreakdown) =>
        Math.round(b.hardSkills * 0.40 + b.semantic * 0.25 + b.softSkills * 0.15 + b.evidenceQuality * 0.10 + b.experience * 0.10);

    const resumeMatchScore = computeOverall(resumeScoreBreakdown);
    const profileMatchScore = computeOverall(profileScoreBreakdown);

    // 7. Categorized Skills
    const categorizedSkills: CategorizedSkill[] = [];

    for (const m of resumeAnalysis.matched) {
        categorizedSkills.push({
            skill: m.skill,
            status: "matched",
            impact: m.matched_category === "Hard Requirement" ? "Critical" : "Medium",
            evidenceLevel: m.evidence_level,
            evidenceDetail: m.evidence_description,
            category: (m.matched_category as "Hard Requirement" | "Soft Requirement") || "Hard Requirement",
        });
    }

    for (const m of resumeAnalysis.missing_critical) {
        categorizedSkills.push({
            skill: m.skill,
            status: "missing",
            impact: m.importance === "Required" ? "Critical" : "Medium",
            evidenceLevel: 0,
            evidenceDetail: m.verdict,
            category: "Hard Requirement",
        });
    }

    // 8. Actionable Feedback
    const actionableFeedback: ActionableFeedback[] = [];

    // 8a. Missing critical skills → "Add this skill"
    for (const m of resumeAnalysis.missing_critical) {
        actionableFeedback.push({
            type: "add_skill",
            priority: "High",
            message: `Add "${m.skill}" to your resume — it's a required skill for this role.`,
            skill: m.skill,
        });
    }

    // 8b. Skills with low evidence → "Strengthen with project/cert"
    for (const m of resumeAnalysis.matched) {
        if (m.evidence_level <= 1) {
            actionableFeedback.push({
                type: "strengthen_evidence",
                priority: "Medium",
                message: `"${m.skill}" is listed but lacks proof. Add a project, certification, or work example demonstrating this skill.`,
                skill: m.skill,
            });
        }
    }

    // 8c. Missed Opportunities (in profile but not in resume)
    const missedOpportunities: DetailedAnalysisResult["missedOpportunities"] = [];
    const resumeMatchedSkills = new Set(resumeAnalysis.matched.map(m => m.skill.toLowerCase()));

    for (const match of profileAnalysis.matched) {
        const skillName = match.skill.toLowerCase();
        if (!resumeMatchedSkills.has(skillName)) {
            missedOpportunities.push({
                skill: match.skill,
                impact: match.matched_category === "Hard Requirement" ? "High" : "Medium",
                reason: `You have "${match.skill}" in your profile, but it's missing from this resume. Add it to increase your match score.`,
            });

            actionableFeedback.push({
                type: "tailor_resume",
                priority: match.matched_category === "Hard Requirement" ? "High" : "Medium",
                message: `Tailor your resume: add "${match.skill}" which exists in your profile but is missing from this resume.`,
                skill: match.skill,
            });
        }
    }

    // 8d. Highlight projects that demonstrate skills
    const projectsWithSkills = parsedResume.projects.filter(p => p.tech_stack && p.tech_stack.length > 0);
    if (projectsWithSkills.length > 0 && resumeAnalysis.matched.length < requiredSkillsCount) {
        actionableFeedback.push({
            type: "highlight_project",
            priority: "Medium",
            message: `Highlight your projects more prominently — ${projectsWithSkills.length} project(s) already demonstrate relevant skills.`,
        });
    }

    // Sort feedback by priority
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    actionableFeedback.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
        resumeMatchScore,
        profileMatchScore,
        resumeSemanticScore,
        profileSemanticScore,
        resumeScoreBreakdown,
        profileScoreBreakdown,
        categorizedSkills,
        actionableFeedback,
        parsedResume,
        resumeAnalysis,
        profileAnalysis,
        missedOpportunities,
    };
}
