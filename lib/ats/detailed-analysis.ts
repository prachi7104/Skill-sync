
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
    hardSkills: number;      // 0-100:  20% weight — evidence-weighted required skill coverage
    softSkills: number;      // 0-100:  10% weight — evidence-based (self-learn, comms, problem-solve, collab)
    experience: number;      // 0-100:  10% weight — fresher heuristics (internships, projects, papers)
    domainMatch: number;     // 0-100:  60% weight — education(30%) + projects(40%) + artifacts(30%)
}

export type Recommendation = "STRONG_MATCH" | "INTERVIEW" | "CONSIDER" | "WEAK_MATCH";

export interface RedFlag {
    flag: string;
    severity: "Critical" | "Minor";
    impact: number; // negative points
}

export interface CategorizedSkill {
    skill: string;
    status: "matched" | "missing" | "partial";
    impact: "Critical" | "High" | "Medium" | "Low";
    evidenceLevel: number;   // 0-4 (from EvidenceLevel type)
    evidenceDetail: string;
    category: "Hard Requirement" | "Soft Requirement";
    validationMultiplier?: number; // cert tier weight if applicable
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

    // Recommendation label
    recommendation: Recommendation;

    // Granular breakdown
    resumeScoreBreakdown: ScoreBreakdown;
    profileScoreBreakdown: ScoreBreakdown;

    // Categorized skills
    categorizedSkills: CategorizedSkill[];

    // Actionable feedback
    actionableFeedback: ActionableFeedback[];

    // Red flags
    redFlags: RedFlag[];

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
// EVIDENCE WEIGHT MAP — Skill Validation Hierarchy
// ============================================================================

/**
 * Evidence Level → Weight multiplier (per user spec):
 *   0 = Not found              → 0.0x
 *   1 = Claimed only           → 0.3x  (listed in skills without proof)
 *   2 = Personal project       → 0.7x  (GitHub, hackathon, documented)
 *   3 = Production/internship  → 0.9x  (live projects, deployed, internship)
 *   4 = Industry certification → 1.0x  (verified cert, research paper)
 */
const EVIDENCE_WEIGHTS: Record<number, number> = {
    0: 0.0,
    1: 0.3,
    2: 0.7,
    3: 0.9,
    4: 1.0,
};

// ============================================================================
// CERTIFICATION TIER WEIGHTS
// ============================================================================

const CERT_TIER_1 = ["oracle", "aws", "google cloud", "microsoft", "red hat", "cisco", "comptia", "meta", "ibm"];
const CERT_TIER_2 = ["hackerrank", "coursera", "edx", "freecodecamp", "leetcode"];
// Tier 3: everything else (Udemy, unverified MOOCs, participation certs) → 0.5x

function getCertTierWeight(issuer: string): number {
    const norm = issuer.toLowerCase().trim();
    if (CERT_TIER_1.some(t => norm.includes(t))) return 1.0;
    if (CERT_TIER_2.some(t => norm.includes(t))) return 0.8;
    return 0.5; // Tier 3
}

// ============================================================================
// RECOMMENDATION LABEL
// ============================================================================

function getRecommendation(score: number): Recommendation {
    if (score >= 85) return "STRONG_MATCH";
    if (score >= 65) return "INTERVIEW";
    if (score >= 50) return "CONSIDER";
    return "WEAK_MATCH";
}

// ============================================================================
// DOMAIN MATCH HELPERS
// ============================================================================

/** Education alignment: compare resume education against JD education field */
function computeKeywordProjectOverlap(resume: ParsedResumeData, jd: StructuredJD): number {
    const jdKeywordsSet = new Set<string>();
    
    // Collect strings from critical, important, and hard requirements
    (jd.matching_keywords?.critical || []).forEach(k => jdKeywordsSet.add(k.toLowerCase()));
    (jd.matching_keywords?.important || []).forEach(k => jdKeywordsSet.add(k.toLowerCase()));
    jd.requirements.hard_requirements.technical_skills.forEach(s => jdKeywordsSet.add(s.skill.toLowerCase()));
    
    const jdKeywords = Array.from(jdKeywordsSet);
    
    if (jdKeywords.length === 0) return 100;

    const projectText = (resume.projects || [])
        .map(p => `${p.title || ""} ${p.description || ""} ${(p.tech_stack || []).join(" ")}`)
        .join(" ")
        .toLowerCase();

    let matchedCount = 0;
    for (const keyword of jdKeywords) {
        // Exact word boundary match
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(projectText)) {
            matchedCount++;
        }
    }

    // Multiply by 2: 50% match counts as 100 points
    return Math.min(100, Math.round((matchedCount / Math.max(jdKeywords.length, 1)) * 100 * 2));
}

function computeEducationAlignment(resume: ParsedResumeData, jd: StructuredJD): number {
    const jdEdu = jd.requirements.hard_requirements.education;
    if (!jdEdu || !jdEdu.field || jdEdu.field === "Unknown") return 80; // no education requirement → default good

    const jdField = jdEdu.field.toLowerCase();
    const jdDomain = jd.role_metadata?.role_type?.toLowerCase() || "";

    // Check resume education
    const educations = resume.education_history || [];
    if (educations.length === 0) return 30;

    let best = 30; // baseline for unrelated
    for (const edu of educations) {
        const degree = (edu.degree || "").toLowerCase();
        const field = (edu.branch || "").toLowerCase();
        const combined = `${degree} ${field}`;

        // Exact match: e.g. "AI/ML" for "AI" role, or "Computer Science" for "software" role
        if (combined.includes(jdField) || jdField.includes(field)) {
            best = Math.max(best, 100);
        }
        // Related: CSE/IT for software role
        else if (
            (combined.includes("computer") || combined.includes("software") || combined.includes("information technology") || combined.includes("electrical")) &&
            (jdDomain.includes("software") || jdDomain.includes("engineer") || jdDomain.includes("developer") || jdDomain.includes("data") || jdDomain.includes("ml") || jdDomain.includes("ai"))
        ) {
            best = Math.max(best, 90);
        }
        // Relevant coursework signal
        else if (combined.includes("science") || combined.includes("engineering") || combined.includes("mathematics")) {
            best = Math.max(best, 70);
        }
    }

    return best;
}

/** Artifacts score: certifications + research papers + achievements in JD domain */
function computeArtifactScore(resume: ParsedResumeData, jd: StructuredJD): number {
    const jdDomains = [
        jd.role_metadata?.role_type || "",
        ...(jd.normalized_skills?.domains || []),
        ...(jd.matching_keywords?.critical || []),
    ].map(d => d.toLowerCase()).filter(Boolean);

    let score = 0;
    let maxPossible = 0;

    // Certifications (weighted by tier)
    const certs = resume.certifications || [];
    if (certs.length > 0) {
        maxPossible += 40;
        let certScore = 0;
        for (const cert of certs) {
            const certText = `${cert.certification_name || ""} ${cert.issuer || ""}`.toLowerCase();
            const isRelevant = jdDomains.some(d => certText.includes(d)) || jdDomains.length === 0;
            const tierWeight = getCertTierWeight(cert.issuer || "");
            if (isRelevant) {
                certScore += tierWeight * 40;
            } else {
                certScore += tierWeight * 10; // partial credit for any cert
            }
        }
        score += Math.min(40, certScore);
    }

    // Research papers
    const papers = resume.research_papers || [];
    if (papers.length > 0) {
        maxPossible += 30;
        let paperScore = 0;
        for (const paper of papers) {
            const paperText = `${paper.title || ""} ${paper.field || ""}`.toLowerCase();
            const isRelevant = jdDomains.some(d => paperText.includes(d));
            paperScore += isRelevant ? 30 : 10;
        }
        score += Math.min(30, paperScore);
    }

    // Achievements (hackathons, competitions, coding profiles)
    const achievements = resume.achievements || [];
    const codingProfiles = resume.coding_profiles || [];
    if (achievements.length > 0 || codingProfiles.length > 0) {
        maxPossible += 30;
        let achScore = 0;
        achScore += Math.min(20, achievements.length * 10);
        achScore += Math.min(10, codingProfiles.length * 5);
        score += Math.min(30, achScore);
    }

    // If no artifacts exist at all, return a neutral baseline
    if (maxPossible === 0) return 20;

    return Math.min(100, Math.round((score / maxPossible) * 100));
}

// ============================================================================
// SOFT SKILLS — Evidence-based extraction
// ============================================================================

function computeSoftSkillsScore(resume: ParsedResumeData): number {
    let evidenceCount = 0;

    // 1. Self-learning: certifications, coding profiles, independent projects
    if ((resume.certifications?.length || 0) > 0) evidenceCount++;
    if ((resume.coding_profiles?.length || 0) > 0) evidenceCount++;

    // 2. Communication: teaching, documentation, presentations (check achievements)
    const commKeywords = ["teach", "mentor", "present", "documentation", "blog", "workshop", "speaker"];
    const achText = (resume.achievements || []).map(a => `${a.title} ${a.description || ""}`).join(" ").toLowerCase();
    const summaryText = (resume.professional_summary || "").toLowerCase();
    if (commKeywords.some(k => achText.includes(k) || summaryText.includes(k))) evidenceCount++;

    // 3. Problem-solving: quantified achievements, algorithmic ratings
    const quantifiedPattern = /\d+%|\d+x|improved|optimized|reduced|increased/i;
    const allProjectText = resume.projects.map(p => `${p.description || ""}`).join(" ");
    const allExpText = resume.experience.map(e => `${e.description || ""}`).join(" ");
    if (quantifiedPattern.test(allProjectText) || quantifiedPattern.test(allExpText) || quantifiedPattern.test(achText)) evidenceCount++;

    // 4. Collaboration: team projects, open-source, hackathons, club activities
    const collabKeywords = ["team", "open-source", "hackathon", "club", "collaborative", "group", "contributed"];
    const fullText = `${allProjectText} ${allExpText} ${achText}`.toLowerCase();
    if (collabKeywords.some(k => fullText.includes(k))) evidenceCount++;

    // Score = (evidence_count / 4) × 100, min 10% if ANY evidence
    const raw = Math.round((Math.min(evidenceCount, 4) / 4) * 100);
    return evidenceCount > 0 ? Math.max(10, raw) : 0;
}

// ============================================================================
// EXPERIENCE LEVEL — Fresher heuristics
// ============================================================================

function computeExperienceScore(resume: ParsedResumeData, jd: StructuredJD): number {
    const internships = resume.experience || [];
    const projects = resume.projects || [];
    const papers = resume.research_papers || [];

    // Relevance check: does internship domain overlap with JD?
    const jdDomains = [
        jd.role_metadata?.role_type || "",
        ...(jd.normalized_skills?.domains || []),
    ].map(d => d.toLowerCase()).filter(Boolean);

    const relevantInternships = internships.filter(e => {
        const text = `${e.role || ""} ${e.company || ""} ${e.description || ""}`.toLowerCase();
        return jdDomains.some(d => text.includes(d)) || jdDomains.length === 0;
    });

    let score: number;

    if (internships.length === 0 && projects.length > 2) {
        // 0 internships, strong projects
        score = 70;
    } else if (relevantInternships.length >= 1) {
        // 1+ relevant internship
        score = internships.length >= 2 || relevantInternships.length >= 2 ? 100 : 85;
    } else if (internships.length >= 2) {
        // 2+ any internships
        score = 100;
    } else if (internships.length === 1) {
        // 1 non-relevant internship
        score = 60;
    } else if (projects.length > 0) {
        // Only projects, no internship
        score = 50;
    } else {
        score = 20;
    }

    // Research publications bonus: +15%
    if (papers.length > 0) {
        score = Math.min(100, score + 15);
    }

    return score;
}

// ============================================================================
// RED FLAGS
// ============================================================================

function computeRedFlags(
    hardMissedPct: number,
    domainScore: number,
    _jd: StructuredJD,
): RedFlag[] {
    const flags: RedFlag[] = [];

    // Critical: missing >70% must-have hard skills
    if (hardMissedPct > 70) {
        flags.push({ flag: "Missing >70% of must-have hard skills", severity: "Critical", impact: -20 });
    }

    // Critical: complete domain mismatch
    if (domainScore < 25) {
        flags.push({ flag: "Domain complete mismatch — no relevant education, projects or certifications", severity: "Critical", impact: -20 });
    }

    // Minor: missing 50-70% of must-haves
    if (hardMissedPct >= 50 && hardMissedPct <= 70) {
        flags.push({ flag: "Missing 50-70% of must-have skills", severity: "Minor", impact: -5 });
    }

    return flags;
}

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

function applyConsistencyChecks(overall: number, breakdown: ScoreBreakdown): number {
    let adjusted = overall;

    // If Hard Skills >80% AND Domain >80%, overall must be ≥75%
    if (breakdown.hardSkills > 80 && breakdown.domainMatch > 80) {
        adjusted = Math.max(adjusted, 75);
    }

    // If Domain >90%, overall must be ≥80%
    if (breakdown.domainMatch > 90) {
        adjusted = Math.max(adjusted, 80);
    }

    return Math.min(100, adjusted);
}

// ============================================================================
// CORE ANALYSIS
// ============================================================================

export async function performDetailedAnalysis(
    jd: StructuredJD,
    jdEmbedding: number[] | null,
    _resumeText: string,
    parsedResume: ParsedResumeData,
    studentProfile: z.infer<typeof studentProfileSchema>,
    studentProfileEmbedding: number[] | null
): Promise<DetailedAnalysisResult> {

    // 1. Generate Resume Embedding (fail gracefully if embedding service is down)
    let resumeEmbedding: number[] | null = null;
    if (jdEmbedding) {
        try {
            const resumeString = [
                parsedResume.professional_summary,
                parsedResume.skills.map(s => s.name).join(" "),
                parsedResume.experience.map(e => `${e.role} ${e.description}`).join(" "),
                parsedResume.projects.map(p => `${p.title} ${p.tech_stack?.join(" ")}`).join(" "),
            ].filter(Boolean).join(". ");
            resumeEmbedding = await generateEmbedding(resumeString);
        } catch (err) {
            console.warn("[detailed-analysis] Resume embedding failed, falling back to keyword scoring:", err);
        }
    }

    // 2. Semantic Scores (used as project overlap component of domain match)
    //    Falls back to 0 when embeddings are unavailable — keyword scoring compensates.
    const resumeSemanticScore = (resumeEmbedding && jdEmbedding) ? cosineSimilarity(resumeEmbedding, jdEmbedding) : 0;
    const profileSemanticScore = (studentProfileEmbedding && jdEmbedding) ? cosineSimilarity(studentProfileEmbedding, jdEmbedding) : 0;

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

    // ═══════════════════════════════════════════════════════════════════════
    // 5. COMPUTE SCORES — New 20/10/10/60 weighted system
    // ═══════════════════════════════════════════════════════════════════════

    const requiredSkillsCount = Math.max(jd.requirements.hard_requirements.technical_skills.length, 1);
    const totalRequiredWeight = requiredSkillsCount; // each skill has weight 1

    // ─── RESUME SCORES ───

    const resumeHardMatched = resumeAnalysis.matched.filter(m => m.matched_category === "Hard Requirement");
    const resumeMissing = resumeAnalysis.missing_critical;

    // Hard Skills (20%) — evidence-weighted with cert tier multiplier
    let resumeHardWeightedSum = 0;
    for (const m of resumeHardMatched) {
        let weight = EVIDENCE_WEIGHTS[m.evidence_level] ?? 0.3;

        // Boost if skill is backed by a certification
        const certMatch = (parsedResume.certifications || []).find(c => {
            const certText = `${c.certification_name || ""} ${c.issuer || ""}`.toLowerCase();
            return certText.includes(m.skill.toLowerCase());
        });
        if (certMatch) {
            weight = Math.max(weight, getCertTierWeight(certMatch.issuer || ""));
        }
        resumeHardWeightedSum += weight;
    }

    // Missing must-have penalty: -15 points each (from 100 base)
    // Missing nice-to-have penalty: -3 points each
    const missingMustHaveCount = resumeMissing.filter(m => m.importance === "Required").length;
    const hardBaseScore = Math.round((resumeHardWeightedSum / totalRequiredWeight) * 100);
    const hardPenalty = missingMustHaveCount * 15;
    const resumeHardSkillScore = Math.max(0, Math.min(100, hardBaseScore - hardPenalty));

    // Soft Skills (10%) — evidence-based
    const resumeSoftSkillScore = computeSoftSkillsScore(parsedResume);

    // Experience (10%) — fresher heuristics
    const resumeExperienceScore = computeExperienceScore(parsedResume, jd);

    // Domain Match (60%) — education(30%) + project semantic overlap(40%) + artifacts(30%)
    const educationAlignment = computeEducationAlignment(parsedResume, jd);
    const projectSemanticOverlap = resumeSemanticScore > 0.01
        ? Math.round(resumeSemanticScore * 100)
        : computeKeywordProjectOverlap(parsedResume, jd);
    const artifactScore = computeArtifactScore(parsedResume, jd);
    const resumeDomainMatch = Math.round(
        educationAlignment * 0.30 + projectSemanticOverlap * 0.40 + artifactScore * 0.30
    );

    // Missed required hard skills percentage (for red flags)
    const hardMissedPct = requiredSkillsCount > 0
        ? Math.round((missingMustHaveCount / requiredSkillsCount) * 100)
        : 0;

    const resumeScoreBreakdown: ScoreBreakdown = {
        hardSkills: Math.min(100, resumeHardSkillScore),
        softSkills: Math.min(100, resumeSoftSkillScore),
        experience: resumeExperienceScore,
        domainMatch: Math.min(100, resumeDomainMatch),
    };

    // ─── PROFILE SCORES ───

    const profileHardMatched = profileAnalysis.matched.filter(m => m.matched_category === "Hard Requirement");
    const profileMissing = profileAnalysis.missing_critical;

    const profileHardWeightedSum = profileHardMatched.reduce((sum, m) => sum + (EVIDENCE_WEIGHTS[m.evidence_level] ?? 0.3), 0);
    const profileMissingCount = profileMissing.filter(m => m.importance === "Required").length;
    const profileHardBase = Math.round((profileHardWeightedSum / totalRequiredWeight) * 100);
    const profileHardSkillScore = Math.max(0, Math.min(100, profileHardBase - profileMissingCount * 15));

    // Profile soft skills: use same evidence computation as resume, from profile data
    let profileSoftScore = 20;
    if ((studentProfile.softSkills?.length || 0) > 0) profileSoftScore = 50;
    if ((studentProfile.certifications?.length || 0) > 0) profileSoftScore = Math.max(profileSoftScore, 60);
    if ((studentProfile.codingProfiles?.length || 0) > 0) profileSoftScore = Math.max(profileSoftScore, 55);
    const profileSoftSkillScore = Math.min(100, profileSoftScore);

    // Profile experience: check if any internship is relevant to JD
    const jdDomainKeywords = [
        jd.role_metadata?.role_type || "",
        ...(jd.normalized_skills?.domains || [])
    ].map(d => d.toLowerCase()).filter(Boolean);
    
    const profileInternships = studentProfile.workExperience || [];
    const hasRelevantInternship = profileInternships.some(e => {
        const text = `${e.role || ""} ${e.company || ""} ${e.description || ""}`.toLowerCase();
        return jdDomainKeywords.length === 0 || jdDomainKeywords.some(k => text.includes(k));
    });
    const profileExperienceScore = hasRelevantInternship ? 85 : (profileInternships.length > 0 ? 60 : 20);

    // Profile domain: use keyword fallback when embedding missing
    const profileKeywordOverlap = profileSemanticScore > 0.01
        ? Math.round(profileSemanticScore * 100)
        : computeKeywordProjectOverlap(
            { ...parsedResume, projects: (studentProfile.projects || []).map((p: any) => ({
                title: p.title, description: p.description, tech_stack: p.techStack
            }))
            } as ParsedResumeData,
            jd
        );
    const profileDomainMatch = Math.min(100, profileKeywordOverlap);

    const profileScoreBreakdown: ScoreBreakdown = {
        hardSkills: Math.min(100, profileHardSkillScore),
        softSkills: profileSoftSkillScore,
        experience: profileExperienceScore,
        domainMatch: Math.min(100, profileDomainMatch),
    };

    // 6. Overall Match Scores — 20% Hard + 10% Soft + 10% Experience + 60% Domain
    const computeOverall = (b: ScoreBreakdown) =>
        Math.round(b.hardSkills * 0.20 + b.softSkills * 0.10 + b.experience * 0.10 + b.domainMatch * 0.60);

    let resumeMatchScore = computeOverall(resumeScoreBreakdown);
    const profileMatchScore = computeOverall(profileScoreBreakdown);

    // 6a. Red Flags
    const redFlags = computeRedFlags(hardMissedPct, resumeDomainMatch, jd);
    for (const rf of redFlags) {
        resumeMatchScore = Math.max(0, resumeMatchScore + rf.impact);
    }

    // 6b. Consistency Checks
    resumeMatchScore = applyConsistencyChecks(resumeMatchScore, resumeScoreBreakdown);

    // 6c. Recommendation
    const recommendation = getRecommendation(resumeMatchScore);


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

    // 8e. Domain mismatch guidance
    if (resumeDomainMatch < 50 && jd.tech_stack_cluster?.primary_cluster) {
        const cluster = jd.tech_stack_cluster.primary_cluster;
        actionableFeedback.push({
            type: "tailor_resume",
            priority: "High",
            message: `This role targets the "${cluster}" domain. Reframe your experience to highlight any ${cluster}-relevant work. Even adjacent experience counts — surface it explicitly.`,
        });
    }

    // 8f. Quantification nudge — if no quantified achievements found
    const hasQuantified = /\d+%|\d+x|reduced|improved|increased|optimized|\d+K|\d+ users/i.test(
        parsedResume.experience.map(e => e.description || "").join(" ") +
        parsedResume.projects.map(p => p.description || "").join(" ")
    );
    if (!hasQuantified) {
        actionableFeedback.push({
            type: "strengthen_evidence",
            priority: "Medium",
            message: "None of your experience bullets contain measurable impact. Add numbers: latency reduced by X%, throughput of Y requests/sec, team of Z people, N% accuracy improvement. Numbers dramatically increase recruiter confidence.",
        });
    }

    // 8g. Missing GitHub/LinkedIn if coding profiles empty
    const hasGithub = parsedResume.coding_profiles?.some(p => p.platform?.toLowerCase().includes("github")) || false;
    if (!hasGithub) {
        actionableFeedback.push({
            type: "add_skill",
            priority: "Medium",
            message: "No GitHub profile detected in your resume. Recruiters for technical roles almost always check GitHub. Add your GitHub URL to the resume header.",
            skill: "GitHub",
        });
    }

    // 8h. Certification relevance nudge
    const certs = parsedResume.certifications || [];
    const jdDomainWords = [
        jd.role_metadata?.role_type || "",
        ...(jd.normalized_skills?.domains || [])
    ].map(d => d.toLowerCase());
    const hasRelevantCert = certs.some(c => {
        const certText = `${c.certification_name || ""} ${c.issuer || ""}`.toLowerCase();
        return jdDomainWords.some(d => d && certText.includes(d));
    });
    if (certs.length > 0 && !hasRelevantCert && jdDomainWords.filter(Boolean).length > 0) {
        actionableFeedback.push({
            type: "tailor_resume",
            priority: "Low",
            message: `Your certifications don't directly reference this role's domain. If you have any relevant coursework or micro-credentials in ${jd.role_metadata?.role_type || "this domain"}, add them — even informal ones signal intent.`,
        });
    }

    // Fallback if no feedback generated
    if (missedOpportunities.length === 0 && actionableFeedback.length === 0) {
        actionableFeedback.push({
            type: "tailor_resume",
            priority: "Medium",
            message: "Tailor your resume summary to directly reference this role's key requirements. A targeted 2-sentence summary that mirrors JD language significantly increases ATS match rates.",
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
        recommendation,
        resumeScoreBreakdown,
        profileScoreBreakdown,
        categorizedSkills,
        actionableFeedback,
        redFlags,
        parsedResume,
        resumeAnalysis,
        profileAnalysis,
        missedOpportunities,
    };
}
