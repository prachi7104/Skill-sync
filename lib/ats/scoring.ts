
import { ATSScore, SkillAnalysis, EnhancedResume, ExperienceAnalysis } from "./types";
import { StructuredJD } from "@/lib/jd/parser";
import { SENIORITY_LEVELS } from "./constants";

// ============================================================================
// HELPERS
// ============================================================================

function calculateSeniorityScore(jdSeniority: string, candidate: EnhancedResume): number {
    const jdLevel = SENIORITY_LEVELS[jdSeniority as keyof typeof SENIORITY_LEVELS] || SENIORITY_LEVELS["Entry"];
    const candidateYears = candidate.computed_seniority.years;

    // Students applying for Intern/Entry/Mid roles shouldn't be heavily penalized
    if (candidate.computed_seniority.is_student && jdLevel.years_min <= 2) {
        return candidateYears >= jdLevel.years_min ? 1.0 : 0.80;
    }

    const gap = jdLevel.years_min - candidateYears;

    if (gap <= 0) return 1.0;
    if (gap <= 1) return 0.75;
    if (gap <= 2) return 0.50;
    if (gap <= 3) return 0.25;
    return 0.10;
}

const RELATED_CLUSTERS: Record<string, string[]> = {
    "Java Enterprise": ["MERN Stack", "Python Web"],
    "MERN Stack": ["Python Web", "Java Enterprise", "AI/LLM Engineering"],
    "Python ML/AI": ["Research/Academic ML", "Data Engineering", "AI/LLM Engineering"],
    "Python Web": ["MERN Stack", "Java Enterprise", "Data Engineering", "AI/LLM Engineering"],
    "Research/Academic ML": ["Python ML/AI", "Data Engineering", "AI/LLM Engineering"],
    "Data Engineering": ["Python ML/AI", "DevOps/SRE", "Python Web"],
    "DevOps/SRE": ["Data Engineering", "Java Enterprise", "MERN Stack"],
    "Android Native": ["iOS Native", "MERN Stack"],
    "iOS Native": ["Android Native", "MERN Stack"],
    "Automation/No-Code": ["Python Web", "MERN Stack", "DevOps/SRE"],
    "AI/LLM Engineering": ["Python ML/AI", "Python Web", "MERN Stack", "Research/Academic ML"],
};

function calculateStackAlignment(jd: StructuredJD, resume: EnhancedResume): number {
    const jdCluster = jd.tech_stack_cluster.primary_cluster;
    const candidatePrimary = resume.computed_stack.primary.cluster;
    const candidateSecondary = resume.computed_stack.secondary?.cluster;

    if (candidatePrimary === jdCluster) return 1.0;
    if (candidateSecondary === jdCluster) return 0.8;

    // Fuzzy cluster matching — related stacks get partial credit
    const related = RELATED_CLUSTERS[jdCluster] || [];
    if (related.includes(candidatePrimary)) return 0.6;
    if (candidateSecondary && related.includes(candidateSecondary)) return 0.5;

    return 0.3; // Unrelated but not zero
}

function getWeights(roleType: string, seniority: string) {
    if (roleType === "Research") {
        // Research roles: emphasize research background
        return { hard: 0.20, research: 0.30, soft: 0.05, exp: 0.10, domain: 0.35 };
    }
    if (seniority === "Senior" || seniority === "Staff+") {
        // Senior: hard skills + experience + domain
        return { hard: 0.25, research: 0.0, soft: 0.05, exp: 0.30, domain: 0.40 };
    }
    // Standard: matches UI labels (20/10/10/60)
    return { hard: 0.20, research: 0.0, soft: 0.10, exp: 0.10, domain: 0.60 };
}

function computeSoftEvidenceScore(resume: EnhancedResume): number {
    let evidenceCount = 0;
    
    // Certifications
    if ((resume.certifications?.length || 0) > 0) evidenceCount++;
    
    // Coding profiles
    if ((resume.coding_profiles?.length || 0) > 0) evidenceCount++;
    
    // Quantified achievements/experience
    const quantifiedPattern = /\d+%|\d+x|improved|optimized|reduced|increased/i;
    const allProjectText = resume.projects.map(p => `${p.description || ""}`).join(" ");
    const allExpText = resume.experience.map(e => `${e.description || ""}`).join(" ");
    const achText = (resume.achievements || []).map(a => `${a.title || ""} ${a.description || ""}`).join(" ");
    if (quantifiedPattern.test(allProjectText) || quantifiedPattern.test(allExpText) || quantifiedPattern.test(achText)) {
        evidenceCount++;
    }
    
    // Collaboration keywords
    const collabKeywords = ["team", "hackathon", "open-source", "club", "collaborative"];
    const fullText = `${allProjectText} ${allExpText} ${achText}`.toLowerCase();
    if (collabKeywords.some(k => fullText.includes(k))) evidenceCount++;
    
    const raw = Math.round((Math.min(evidenceCount, 4) / 4) * 100);
    return evidenceCount > 0 ? Math.max(10, raw) : 0;
}

// ============================================================================
// CORE SCORING
// ============================================================================

export function calculateATSScore(
    jd: StructuredJD,
    resume: EnhancedResume,
    skillAnalysis: SkillAnalysis
): ATSScore {
    const weights = getWeights(jd.role_metadata.role_type, jd.role_metadata.seniority_level);

    // 1. Hard Skills Score
    const totalHard = jd.requirements.hard_requirements.technical_skills.length;
    const matchedHard = skillAnalysis.matched.filter(m => m.matched_category === "Hard Requirement").length;
    // If JD has no extractable hard requirements, score conservatively at 50
    // (not 100 — we genuinely don't know if the candidate matches)
    const hardScore = totalHard > 0 ? (matchedHard / totalHard) * 100 : 50;

    // 2. Soft Skills Score
    const totalSoft = jd.requirements.soft_requirements.technical_skills.length;
    let softScore = 100;
    if (totalSoft > 0) {
        const matchedSoft = skillAnalysis.matched.filter(m => m.matched_category === "Soft Requirement").length;
        softScore = (matchedSoft / totalSoft) * 100;
    } else {
        softScore = computeSoftEvidenceScore(resume);
    }

    // 3. Experience Score
    const expScoreRaw = calculateSeniorityScore(jd.role_metadata.seniority_level, resume);
    const expScore = expScoreRaw * 100;

    // 4. Domain & Stack Score
    const domainScoreRaw = calculateStackAlignment(jd, resume);
    const domainScore = domainScoreRaw * 100;

    // 5. Research Score
    const researchScore = resume.research_score * 100;

    // Calculate Final Weighted Score
    // NOTE: soft skills are now included in the score explicitly.
    let finalScore =
        (hardScore * weights.hard) +
        (softScore * (weights.soft || 0)) +
        (expScore * (weights.exp || 0)) +
        (domainScore * weights.domain) +
        (researchScore * (weights.research || 0));

    // Penalties & Bonuses
    let penalties = 0;
    let bonuses = 0;
    const redFlags: ATSScore["red_flags"] = [];
    const positiveSignals: ATSScore["positive_signals"] = [];

    // Critical missing skills penalty
    const criticalMissing = skillAnalysis.missing_critical.length;
    if (criticalMissing > 0) {
        const penalty = criticalMissing * 5;
        penalties += penalty;
        redFlags.push({
            flag: `${criticalMissing} critical skills missing`,
            severity: "High",
            impact: -penalty
        });
    }

    // Research mismatch penalty
    if (jd.role_metadata.role_type === "Research" && resume.research_score < 0.3) {
        penalties += 20;
        redFlags.push({
            flag: "Missing significant research background for Research role",
            severity: "Critical",
            impact: -20
        });
    }

    // Stack mismatch penalty
    if (domainScore < 50) {
        penalties += 10;
        const jdStack = jd.tech_stack_cluster?.primary_cluster?.trim() || "Unknown";
        const candidateStack = resume.computed_stack.primary.cluster || "Unknown";
        redFlags.push({
            flag: `Domain mismatch: JD targets ${jdStack} stack — candidate's primary stack is ${candidateStack}`,
            severity: "High",
            impact: -10
        });
    }

    // Bonuses
    if (resume.research_score > 0.6 && jd.role_metadata.role_type === "Research") {
        bonuses += 10;
        positiveSignals.push({ signal: "Strong research publication record", value: "+10" });
    }
    if (resume.computed_seniority.years > SENIORITY_LEVELS[jd.role_metadata.seniority_level as keyof typeof SENIORITY_LEVELS]?.years_max) {
        // Overqualified? Maybe slight bonus or warning?
        // Let's give a small signal
        positiveSignals.push({ signal: "Experience exceeds requirements", value: "Verified" });
    }

    finalScore = finalScore - penalties + bonuses;
    finalScore = Math.max(0, Math.min(100, finalScore));

    // Experience Analysis
    const expAnalysis: ExperienceAnalysis = {
        gap_years: parseFloat(((SENIORITY_LEVELS[jd.role_metadata.seniority_level as keyof typeof SENIORITY_LEVELS]?.years_min || 0) - resume.computed_seniority.years).toFixed(1)),
        level_gap_verdict: expScoreRaw < 1.0 ? "Below Requirements" : "Meets Requirements",
        visual_gap: `${resume.computed_seniority.years} years vs ${SENIORITY_LEVELS[jd.role_metadata.seniority_level as keyof typeof SENIORITY_LEVELS]?.years_min}+ required`,
        jd_seniority: jd.role_metadata.seniority_level,
        candidate_seniority: resume.computed_seniority.level
    };

    // Components Breakdown
    const components = {
        hard_requirements: { score: hardScore, max: 100, percentage: hardScore, verdict: hardScore > 80 ? "Strong" : "Weak" },
        // soft_requirements is informational only — not part of the score
        // Frontend should use this to suggest soft skills for the student to add to their resume
        soft_requirements: { score: softScore, max: 100, percentage: softScore, verdict: softScore > 50 ? "Good" : "Could Improve", note: "Not scored — for suggestions only" },
        experience_level: { score: expScore, max: 100, percentage: expScore, gap_years: expAnalysis.gap_years, verdict: expAnalysis.level_gap_verdict },
        domain_alignment: { score: domainScore, max: 100, percentage: domainScore, jd_stack: jd.tech_stack_cluster.primary_cluster, candidate_stack: resume.computed_stack.primary.cluster, verdict: domainScore > 70 ? "Aligned" : "Mismatch" }
    };

    // Interpretation
    let interpretation = "";
    let recommendation: ATSScore["match_score"]["hire_recommendation"] = "PASS";

    if (finalScore >= 90) { interpretation = "Exceptional Match"; recommendation = "STRONG_HIRE"; }
    else if (finalScore >= 75) { interpretation = "Strong Match"; recommendation = "HIRE"; }
    else if (finalScore >= 60) { interpretation = "Moderate Match"; recommendation = "INTERVIEW"; }
    else if (finalScore >= 45) { interpretation = "Weak Match"; recommendation = "HOLD"; }
    else if (finalScore >= 30) { interpretation = "Poor Match"; recommendation = "PASS"; }
    else { interpretation = "No Match"; recommendation = "REJECT"; }

    // Recommendations Generation
    const candRecs: string[] = [];
    const recruiterRecs: string[] = [];

    if (criticalMissing > 0) {
        candRecs.push(`Focus on acquiring critical skills: ${skillAnalysis.missing_critical.map(s => s.skill).slice(0, 3).join(", ")}`);
        recruiterRecs.push(`Candidate is missing ${criticalMissing} critical skills.`);
    }
    if (domainScore < 50) {
        candRecs.push(`Consider roles more aligned with your ${resume.computed_stack.primary.cluster} background.`);
        recruiterRecs.push("Tech stack mismatch.");
    }

    return {
        match_score: {
            overall: parseFloat(finalScore.toFixed(1)),
            interpretation,
            confidence: "High",
            hire_recommendation: recommendation
        },
        component_breakdown: components,
        skill_analysis: skillAnalysis,
        experience_analysis: expAnalysis,
        red_flags: redFlags,
        positive_signals: positiveSignals,
        recommendations: {
            for_candidate: {
                should_apply: finalScore >= 60,
                reasons: redFlags.map(f => f.flag),
                to_become_competitive: candRecs,
                better_fit_roles: [resume.computed_stack.primary.cluster + " Developer"]
            },
            for_recruiter: {
                hire_decision: recommendation,
                reasoning: recruiterRecs,
                alternative_consideration: finalScore < 60 ? "Consider for junior role or different stack" : "None"
            }
        },
        metadata: {
            analysis_version: "2.0",
            analysis_date: new Date().toISOString(),
            confidence: "High",
            edge_cases_detected: []
        }
    };
}
