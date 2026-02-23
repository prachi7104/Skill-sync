
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { EnhancedResume, TechStack, SeniorityLevel } from "./types";
import { TECH_STACK_CLUSTERS, IMPLICIT_SKILLS, RESEARCH_INDICATORS } from "./constants";

// ============================================================================
// HELPERS
// ============================================================================

function parseDurationString(durationStr: string): number {
    if (!durationStr) return 0;

    // Try to split by " - ", " to ", etc.
    const parts = durationStr.split(/ - | to |–/i);
    if (parts.length < 2 && !durationStr.toLowerCase().includes("present")) {
        // Maybe just "2 years" or "3 months"
        if (durationStr.match(/(\d+)\+?\s*years?/i)) {
            return parseInt(RegExp.$1);
        }
        if (durationStr.match(/(\d+)\+?\s*months?/i)) {
            return parseInt(RegExp.$1) / 12;
        }
        return 0; // Fallback
    }

    const startStr = parts[0];
    const endStr = parts[1] || "Present";

    const startDate = parseDate(startStr);
    const endDate = parseDate(endStr);

    if (!startDate || !endDate) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return diffTime / (1000 * 60 * 60 * 24 * 365.25);
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const lowered = dateStr.toLowerCase();
    if (lowered.includes("present") || lowered.includes("current") || lowered.includes("now")) {
        return new Date();
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

export function enhanceResumeData(resume: ParsedResumeData): EnhancedResume {
    const fullText = [
        resume.professional_summary,
        ...resume.experience.map(e => `${e.role} ${e.company} ${e.description}`),
        ...resume.projects.map(p => `${p.title} ${p.description} ${p.tech_stack?.join(" ")}`),
        ...resume.skills.map(s => s.name)
    ].join(" ").toLowerCase();

    // 1. Calculate Seniority
    let totalYears = 0;
    resume.experience.forEach(exp => {
        if (exp.duration) {
            totalYears += parseDurationString(exp.duration);
        }
    });

    // Check if student
    const isStudent = resume.education_history.some(edu => {
        const gradYear = parseInt(edu.expected_graduation || edu.year_of_completion || "0");
        const currentYear = new Date().getFullYear();
        return gradYear >= currentYear;
    }) || totalYears < 1;

    let seniorityLevel: SeniorityLevel = "Entry";
    if (isStudent && totalYears < 1) seniorityLevel = "Intern";
    else if (totalYears < 2) seniorityLevel = "Entry";
    else if (totalYears < 5) seniorityLevel = "Mid";
    else if (totalYears < 10) seniorityLevel = "Senior";
    else seniorityLevel = "Staff+";

    const computed_seniority = {
        level: seniorityLevel,
        years: parseFloat(totalYears.toFixed(1)),
        rationale: `${totalYears.toFixed(1)} years of experience extracted from timeline.`,
        is_student: isStudent
    };

    // 2. Compute Tech Stack
    const techCounts: Record<string, number> = {};
    const textForStack = fullText + " " + resume.skills.map(s => s.name).join(" "); // Weight explicit skills higher? No, simple count first.

    Object.entries(TECH_STACK_CLUSTERS).forEach(([cluster, keywords]) => {
        let hits = 0;
        const evidence: string[] = [];
        keywords.forEach(kw => {
            const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(textForStack)) {
                hits++;
                evidence.push(kw);
            }
        });
        if (hits > 0) {
            techCounts[cluster] = { hits, evidence } as any;
        }
    });

    const sortedStacks = Object.entries(techCounts)
        .map(([cluster, data]: any) => ({
            cluster,
            hits: data.hits,
            evidence: data.evidence,
            confidence: Math.min(data.hits / 3, 1.0) // Cap confidence
        }))
        .sort((a, b) => b.hits - a.hits);

    const computed_stack: TechStack = {
        primary: sortedStacks[0] || { cluster: "Unknown", confidence: 0, evidence: [] },
        secondary: sortedStacks[1]
    };

    // 3. Research Score
    let researchScore = 0;
    const researchText = [
        ...resume.research_papers.map(r => r.title + " " + (r.field || "")),
        resume.professional_summary || "",
        ...resume.experience.map(e => e.description || "")
    ].join(" ").toLowerCase();

    // Check strong indicators
    let strongCount = 0;
    RESEARCH_INDICATORS.strong.forEach(ind => {
        if (researchText.includes(ind)) strongCount++;
    });

    // Check moderate indicators
    let moderateCount = 0;
    RESEARCH_INDICATORS.moderate.forEach(ind => {
        if (researchText.includes(ind)) moderateCount++;
    });

    if (resume.research_papers.length > 0) strongCount += resume.research_papers.length * 2;

    // Calc score 0-1
    // 1 strong = 0.6, 2 strong = 1.0
    // 1 moderate = 0.2
    const rawResearchScore = (strongCount * 0.5) + (moderateCount * 0.2);
    researchScore = Math.min(rawResearchScore, 1.0);


    // 4. Implicit Skills
    const implicit_skills: string[] = [];
    Object.entries(IMPLICIT_SKILLS).forEach(([skill, def]) => {
        const textToSearch = fullText;
        let found = false;

        // Strong signals
        for (const sig of def.strong_signals) {
            if (textToSearch.includes(sig)) {
                implicit_skills.push(skill);
                found = true;
                break;
            }
        }
        if (!found) {
            // Weak signals
            for (const sig of def.weak_signals) {
                if (textToSearch.includes(sig)) {
                    implicit_skills.push(skill);
                    found = true;
                    break;
                }
            }
        }
    });

    return {
        ...resume,
        computed_stack,
        computed_seniority,
        research_score: researchScore,
        implicit_skills
    };
}
