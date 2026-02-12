
import { EnhancedResume, SkillMatch, MissingSkill, SkillAnalysis, EvidenceLevel } from "./types";
import { StructuredJD } from "@/lib/jd/parser";
import { SKILL_ALIASES } from "./constants";
import { extractSemanticSkills, matchSkillSemantically, combineEvidence, SemanticSkillEvidence } from "./semantic-skills";

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
    for (const [key, aliases] of Object.entries(SKILL_ALIASES)) {
        if (normalize(key) === norm || aliases.map(normalize).includes(norm)) {
            return [normalize(key), ...aliases.map(normalize)];
        }
    }
    return [norm];
}

/**
 * Keyword-based evidence level (the original 30% channel).
 * Returns 0-4 based on where the skill appears in the resume.
 */
export function calculateEvidenceLevel(skill: string, resume: EnhancedResume): { level: EvidenceLevel; description: string } {
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
            level = Math.max(level, 4) as EvidenceLevel;
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

// ============================================================================
// CORE MATCHING — 70% Semantic + 30% Keyword
// ============================================================================

/**
 * Build the semantic evidence for a matched skill.
 */
function buildSemanticEvidenceChain(evidence: SemanticSkillEvidence[]): SkillMatch["semantic_evidence"] {
    // Dedupe and take top 5 strongest
    const sorted = [...evidence].sort((a, b) => b.confidence - a.confidence);
    const seen = new Set<string>();
    const result: NonNullable<SkillMatch["semantic_evidence"]> = [];

    for (const e of sorted) {
        const key = `${e.source}|${e.trigger}`;
        if (!seen.has(key) && result.length < 5) {
            seen.add(key);
            result.push({
                source: e.source,
                text: e.trigger,
                inference: e.inference,
                strength: e.strength,
            });
        }
    }

    return result;
}

/**
 * Determine context alignment based on how many different resume sections
 * the skill appears in.
 */
function determineContextAlignment(
    semanticEvidence: SemanticSkillEvidence[] | undefined,
    keywordLevel: EvidenceLevel,
): "High" | "Moderate" | "Low" | "None" {
    const sections = new Set<string>();

    if (keywordLevel > 0) sections.add("keyword");

    if (semanticEvidence) {
        for (const e of semanticEvidence) {
            if (e.source.startsWith("Project:")) sections.add("project");
            else if (e.source.startsWith("Experience:")) sections.add("experience");
            else if (e.source.startsWith("Skills")) sections.add("skills");
            else if (e.source.startsWith("Education:")) sections.add("education");
            else if (e.source.startsWith("Certification:")) sections.add("certification");
            else if (e.source.startsWith("Professional")) sections.add("summary");
        }
    }

    if (sections.size >= 3) return "High";
    if (sections.size === 2) return "Moderate";
    if (sections.size === 1) return "Low";
    return "None";
}

export function matchSkills(jd: StructuredJD, resume: EnhancedResume): SkillAnalysis {
    const matched: SkillMatch[] = [];
    const missing: MissingSkill[] = [];
    const partial: SkillAnalysis["partial_matches"] = [];
    const transferable: SkillAnalysis["transferable_strengths"] = [];

    // ═══════════════════════════════════════════════════════════════════════
    // Step 1: Extract ALL semantic evidence from the resume ONCE
    // ═══════════════════════════════════════════════════════════════════════
    const semanticEvidence = extractSemanticSkills(resume);

    const allRequired = [...jd.requirements.hard_requirements.technical_skills];
    const allPreferred = [...jd.requirements.soft_requirements.technical_skills];

    // ═══════════════════════════════════════════════════════════════════════
    // Step 2: Process Required Skills (hybrid matching)
    // ═══════════════════════════════════════════════════════════════════════
    for (const req of allRequired) {
        // Layer 1: Semantic analysis (70% weight)
        const semanticResult = matchSkillSemantically(req.skill, semanticEvidence);

        // Layer 2: Keyword matching (30% weight)
        const keywordResult = calculateEvidenceLevel(req.skill, resume);

        // Combine: 70% semantic + 30% keyword
        const combined = combineEvidence(semanticResult, keywordResult.level);

        if (combined.matched) {
            const evidenceChain = semanticResult
                ? buildSemanticEvidenceChain(semanticResult.evidence)
                : undefined;

            // The evidence level reflects the best keyword finding
            const effectiveLevel = keywordResult.level > 0
                ? keywordResult.level
                : (combined.confidence >= 90 ? 3 :
                    combined.confidence >= 70 ? 2 : 1) as EvidenceLevel;

            // Build description combining both channels
            const descParts: string[] = [];
            if (keywordResult.description) descParts.push(keywordResult.description);
            if (semanticResult && semanticResult.evidence.length > 0) {
                const topEvidence = semanticResult.evidence[0];
                descParts.push(`Semantic: ${topEvidence.inference} (via ${topEvidence.trigger})`);
            }

            matched.push({
                skill: req.skill,
                evidence_level: effectiveLevel,
                evidence_description: descParts.join("; ") || "Matched via semantic analysis",
                context_alignment: determineContextAlignment(semanticResult?.evidence, keywordResult.level),
                flag: combined.primary_evidence_type === "both"
                    ? "✓✓ Verified (keyword + semantic)"
                    : combined.primary_evidence_type === "semantic"
                        ? "✓ Inferred from context"
                        : "✓ Keyword match",
                matched_category: "Hard Requirement",
                confidence: combined.confidence,
                primary_evidence_type: combined.primary_evidence_type as "semantic" | "keyword" | "both",
                semantic_evidence: evidenceChain,
            });
        } else {
            // Check if there's weak semantic evidence (near miss)
            const nearMiss = semanticResult && combined.confidence > 0 && combined.confidence < 40
                ? {
                    confidence: combined.confidence,
                    reason: `Weak evidence found (${semanticResult.evidence[0]?.inference || "contextual"}) but below match threshold`,
                }
                : undefined;

            missing.push({
                skill: req.skill,
                importance: "Required",
                impact: "Critical skill not demonstrated in resume",
                verdict: nearMiss
                    ? `Weak contextual evidence found (${nearMiss.confidence}% confidence) but insufficient for match`
                    : "Not found in resume",
                semantic_near_miss: nearMiss,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Step 3: Process Preferred Skills (same hybrid approach)
    // ═══════════════════════════════════════════════════════════════════════
    for (const req of allPreferred) {
        const semanticResult = matchSkillSemantically(req.skill, semanticEvidence);
        const keywordResult = calculateEvidenceLevel(req.skill, resume);
        const combined = combineEvidence(semanticResult, keywordResult.level);

        if (combined.matched) {
            const evidenceChain = semanticResult
                ? buildSemanticEvidenceChain(semanticResult.evidence)
                : undefined;

            const effectiveLevel = keywordResult.level > 0
                ? keywordResult.level
                : (combined.confidence >= 90 ? 3 :
                    combined.confidence >= 70 ? 2 : 1) as EvidenceLevel;

            const descParts: string[] = [];
            if (keywordResult.description) descParts.push(keywordResult.description);
            if (semanticResult && semanticResult.evidence.length > 0) {
                const topEvidence = semanticResult.evidence[0];
                descParts.push(`Semantic: ${topEvidence.inference} (via ${topEvidence.trigger})`);
            }

            matched.push({
                skill: req.skill,
                evidence_level: effectiveLevel,
                evidence_description: descParts.join("; ") || "Matched via semantic analysis",
                context_alignment: determineContextAlignment(semanticResult?.evidence, keywordResult.level),
                flag: "Bonus skill matched",
                matched_category: "Soft Requirement",
                confidence: combined.confidence,
                primary_evidence_type: combined.primary_evidence_type as "semantic" | "keyword" | "both",
                semantic_evidence: evidenceChain,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Step 4: Identify transferable strengths
    // ═══════════════════════════════════════════════════════════════════════
    // Find strong semantic evidence that doesn't match any JD requirement
    // but could be relevant transferable skills
    const matchedSkillNames = new Set(matched.map(m => m.skill.toLowerCase()));
    const missingSkillNames = new Set(missing.map(m => m.skill.toLowerCase()));

    const transferableEvidence = new Map<string, SemanticSkillEvidence>();
    for (const e of semanticEvidence) {
        const skillLower = e.skill.toLowerCase();
        if (!matchedSkillNames.has(skillLower) && !missingSkillNames.has(skillLower)) {
            const existing = transferableEvidence.get(skillLower);
            if (!existing || e.confidence > existing.confidence) {
                transferableEvidence.set(skillLower, e);
            }
        }
    }

    // Take top 5 strongest transferable skills
    const sortedTransferable = [...transferableEvidence.values()]
        .filter(e => e.confidence >= 70)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

    for (const e of sortedTransferable) {
        transferable.push({
            skill: e.skill,
            relevance: e.inference,
            credit: Math.round(e.confidence / 100 * 0.5 * 100) / 100, // 50% credit for non-matched skills
        });
    }

    return {
        matched,
        missing_critical: missing,
        partial_matches: partial,
        transferable_strengths: transferable
    };
}
