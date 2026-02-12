
import { EnhancedResume, SkillMatch, MissingSkill, SkillAnalysis, EvidenceLevel } from "./types";
import { StructuredJD } from "@/lib/jd/parser";
import { SKILL_ALIASES } from "./constants";

// ============================================================================
// HELPERS
// ============================================================================

function normalize(s: string) {
    return s.toLowerCase().trim();
}

/**
 * Word-boundary match to prevent substring false positives.
 * E.g. "java" must NOT match inside "javascript", "js" must NOT match inside "json".
 */
function wordMatch(text: string, term: string): boolean {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function getAliases(skill: string): string[] {
    const norm = normalize(skill);
    // return SKILL_ALIASES[norm] || [norm];
    for (const [key, aliases] of Object.entries(SKILL_ALIASES)) {
        if (normalize(key) === norm || aliases.map(normalize).includes(norm)) {
            return [normalize(key), ...aliases.map(normalize)];
        }
    }
    return [norm];
}

function calculateEvidenceLevel(skill: string, resume: EnhancedResume): { level: EvidenceLevel; description: string } {
    const aliases = getAliases(skill);
    let level: EvidenceLevel = 0;

    const descriptions: string[] = [];

    // 1. Explicit Skill Section
    const inSkills = resume.skills.find(s => aliases.includes(normalize(s.name)));
    if (inSkills) {
        level = Math.max(level, 1) as EvidenceLevel;
        descriptions.push("Listed in Skills section");
    }

    // 2. Implicit Skills
    if (resume.implicit_skills.some(s => aliases.includes(normalize(s)))) {
        level = Math.max(level, 1) as EvidenceLevel;
        descriptions.push("Implied from context");
    }

    // 3. Projects
    resume.projects.forEach(p => {
        const text = (p.title + " " + (p.description || "") + " " + (p.tech_stack?.join(" ") || "")).toLowerCase();
        if (aliases.some(a => wordMatch(text, a))) {
            level = Math.max(level, 2) as EvidenceLevel;
            descriptions.push(`Used in project "${p.title}"`);
        }
    });

    // 4. Work Experience
    resume.experience.forEach(e => {
        const text = (e.role + " " + e.company + " " + (e.description || "") + " " + (e.skills_used?.join(" ") || "")).toLowerCase();
        if (aliases.some(a => wordMatch(text, a))) {
            level = Math.max(level, 3) as EvidenceLevel; // Professional usage
            descriptions.push(`Used in role at ${e.company}`);
        }
    });

    // 5. Research Papers
    resume.research_papers.forEach(r => {
        const text = (r.title + " " + (r.field || "") + " " + (r.skills_demonstrated?.join(" ") || "")).toLowerCase();
        if (aliases.some(a => wordMatch(text, a))) {
            level = Math.max(level, 4) as EvidenceLevel; // Research usage counts as Expert/High for Research roles
            descriptions.push(`Demonstrated in research "${r.title}"`);
        }
    });

    // 6. Professional Summary
    if (resume.professional_summary) {
        const summaryText = resume.professional_summary.toLowerCase();
        if (aliases.some(a => wordMatch(summaryText, a))) {
            level = Math.max(level, 1) as EvidenceLevel;
            descriptions.push("Mentioned in professional summary");
        }
    }

    // 7. Soft Skills
    if (resume.soft_skills && resume.soft_skills.length > 0) {
        const softText = resume.soft_skills.join(" ").toLowerCase();
        if (aliases.some(a => wordMatch(softText, a))) {
            level = Math.max(level, 1) as EvidenceLevel;
            descriptions.push("Listed in soft skills");
        }
    }

    return { level, description: descriptions.join("; ") };
}

//Context check
function checkContext(_skill: string, _resume: EnhancedResume): "High" | "Moderate" | "Low" | "None" {
    // Simple placeholder for now. 
    // Real implementation would check 5-word window.
    return "High";
}

// ============================================================================
// CORE MATCHING
// ============================================================================

export function matchSkills(jd: StructuredJD, resume: EnhancedResume): SkillAnalysis {
    const matched: SkillMatch[] = [];
    const missing: MissingSkill[] = [];
    const partial: SkillAnalysis["partial_matches"] = [];
    const transferable: SkillAnalysis["transferable_strengths"] = [];

    const allRequired = [...jd.requirements.hard_requirements.technical_skills];
    const allPreferred = [...jd.requirements.soft_requirements.technical_skills];

    // Process Required Skills
    for (const req of allRequired) {
        const evidence = calculateEvidenceLevel(req.skill, resume);

        if (evidence.level > 0) {
            matched.push({
                skill: req.skill,
                evidence_level: evidence.level,
                evidence_description: evidence.description,
                context_alignment: checkContext(req.skill, resume),
                flag: evidence.level >= 3 ? "✓✓ Professional experience" : "✓ Demonstrated usage",
                matched_category: "Hard Requirement"
            });
        } else {
            // Check for partial/transferable
            missing.push({
                skill: req.skill,
                importance: "Required",
                impact: "Critical skill missing",
                verdict: "Not found in resume"
            });
        }
    }

    // Process Preferred Skills
    for (const req of allPreferred) {
        const evidence = calculateEvidenceLevel(req.skill, resume);
        if (evidence.level > 0) {
            matched.push({
                skill: req.skill,
                evidence_level: evidence.level,
                evidence_description: evidence.description,
                context_alignment: checkContext(req.skill, resume),
                flag: "Bonus skill matched",
                matched_category: "Soft Requirement"
            });
        }
    }

    return {
        matched,
        missing_critical: missing,
        partial_matches: partial,
        transferable_strengths: transferable
    };
}
