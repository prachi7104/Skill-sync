
import { StructuredJD } from "@/lib/jd/parser";
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { EnhancedResume } from "./types";
import { matchSkills } from "./matching";
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings/generate";
import { studentProfileSchema } from "@/lib/validations/student-profile";
import { z } from "zod";

export interface DetailedAnalysisResult {
    resumeMatchScore: number;
    profileMatchScore: number;
    resumeSemanticScore: number;
    profileSemanticScore: number;
    parsedResume: ParsedResumeData;
    resumeAnalysis: ReturnType<typeof matchSkills>;
    profileAnalysis: ReturnType<typeof matchSkills>;
    missedOpportunities: Array<{
        skill: string;
        impact: "High" | "Medium" | "Low";
        reason: string;
    }>;
}

/**
 * Performs a detailed 3-way analysis:
 * 1. JD vs Uploaded Resume
 * 2. JD vs Student Profile
 * 3. Gap Analysis (Missed Opportunities)
 */
export async function performDetailedAnalysis(
    jd: StructuredJD,
    jdEmbedding: number[], // Pre-computed embedding for JD
    _resumeText: string,
    parsedResume: ParsedResumeData,
    studentProfile: z.infer<typeof studentProfileSchema>,
    studentProfileEmbedding: number[]
): Promise<DetailedAnalysisResult> {

    // 1. Generate Embedding for Uploaded Resume
    // We treat the "Enhanced Resume" string representation as the source for embedding
    const resumeString = `${parsedResume.full_name} ${parsedResume.professional_summary} ${parsedResume.skills.map(s => s.name).join(" ")} ${parsedResume.experience.map(e => e.role + " " + e.company + " " + e.description).join(" ")}`;
    const resumeEmbedding = await generateEmbedding(resumeString);

    // 2. Compute Semantic Scores
    const resumeSemanticScore = cosineSimilarity(resumeEmbedding, jdEmbedding);
    const profileSemanticScore = cosineSimilarity(studentProfileEmbedding, jdEmbedding);

    // 3. Convert Parsed Resume to EnhancedResume format for matching logic
    // We use a helper to map simple ParsedResumeData to the EnhancedResume structure required by matchSkills
    const enhancedResume: EnhancedResume = {
        ...parsedResume,
        skills: parsedResume.skills.map(s => ({ name: s.name, category: s.category || "General" })),

        projects: parsedResume.projects.map(p => ({
            title: p.title,
            description: p.description,
            tech_stack: p.tech_stack
        })),
        experience: parsedResume.experience.map(e => ({
            role: e.role,
            company: e.company,
            description: e.description,
            skills_used: e.skills_used
        })),
        implicit_skills: [],
        research_papers: parsedResume.research_papers.map(r => ({
            title: r.title,
            field: r.field,
            skills_demonstrated: r.skills_demonstrated
        })),
        computed_stack: { primary: { cluster: "General", confidence: 0, evidence: [] } },
        computed_seniority: { level: "Unknown", years: 0, rationale: "N/A", is_student: true },
        research_score: 0
    };

    // 4. Convert Student Profile to EnhancedResume format
    // Detailed Profile -> EnhancedResume
    const enhancedProfile: EnhancedResume = {
        full_name: "Student Profile",
        email: null,
        phone: null,
        linkedin_url: null,
        professional_summary: null,
        coding_profiles: [],
        education_history: [],
        certifications: [],
        achievements: [],
        soft_skills: [],

        skills: (studentProfile.skills || []).map(s => ({ name: s.name, category: "General" })),
        projects: (studentProfile.projects || []).map(p => ({
            title: p.title,
            description: p.description || "",
            tech_stack: p.techStack
        })),
        experience: (studentProfile.workExperience || []).map(e => ({
            role: e.role,
            company: e.company,
            description: e.description,
            skills_used: []
        })),
        implicit_skills: [],
        research_papers: [],
        computed_stack: { primary: { cluster: "General", confidence: 0, evidence: [] } },
        computed_seniority: { level: "Unknown", years: 0, rationale: "N/A", is_student: true },
        research_score: 0
    };

    // 5. Run ATS Matching Logic
    const resumeAnalysis = matchSkills(jd, enhancedResume);
    const profileAnalysis = matchSkills(jd, enhancedProfile);

    // 6. Calculate Match Scores (Simple weighted average for now)
    // 60% Semantic, 40% Keyword Match (Ratio of matched / total required)
    const requiredSkillsCount = jd.requirements.hard_requirements.technical_skills.length || 1;

    const resumeKeywordScore = (resumeAnalysis.matched.filter(m => m.matched_category === "Hard Requirement").length / requiredSkillsCount);
    const resumeMatchScore = (resumeSemanticScore * 0.6) + (resumeKeywordScore * 0.4);

    const profileKeywordScore = (profileAnalysis.matched.filter(m => m.matched_category === "Hard Requirement").length / requiredSkillsCount);
    const profileMatchScore = (profileSemanticScore * 0.6) + (profileKeywordScore * 0.4);

    // 7. Identify Missed Opportunities
    // Logic: Essential Skill IS in Profile BUT NOT in Uploaded Resume
    const missedOpportunities: DetailedAnalysisResult["missedOpportunities"] = [];

    const resumeMatchedSkills = new Set(resumeAnalysis.matched.map(m => m.skill.toLowerCase()));


    // Iterate through everything matched in profile
    for (const match of profileAnalysis.matched) {
        const skillName = match.skill.toLowerCase();

        // If it was matched in profile, but NOT in resume (missing or partial in resume)
        if (!resumeMatchedSkills.has(skillName)) {
            missedOpportunities.push({
                skill: match.skill,
                impact: match.matched_category === "Hard Requirement" ? "High" : "Medium",
                reason: `You have "${match.skill}" in your profile, but it wasn't detected in this resume. Add it to boost your match score.`
            });
        }
    }

    return {
        resumeMatchScore: Math.round(resumeMatchScore * 100),
        profileMatchScore: Math.round(profileMatchScore * 100),
        resumeSemanticScore,
        profileSemanticScore,
        parsedResume,
        resumeAnalysis,
        profileAnalysis,
        missedOpportunities
    };
}
