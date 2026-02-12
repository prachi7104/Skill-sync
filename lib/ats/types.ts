
import { ParsedResumeData } from "@/lib/resume/ai-parser";

export type RoleType = "Engineering" | "Research" | "Data Science" | "Product" | "Design" | "Other";
export type SeniorityLevel = "Intern" | "Entry" | "Mid" | "Senior" | "Staff+" | "Unknown";
export type EvidenceLevel = 0 | 1 | 2 | 3 | 4;

export interface TechStack {
    primary: {
        cluster: string;
        confidence: number;
        evidence: string[];
    };
    secondary?: {
        cluster: string;
        confidence: number;
        evidence: string[];
    };
}

export interface SkillMatch {
    skill: string;
    evidence_level: EvidenceLevel;
    evidence_description: string;
    context_alignment: "High" | "Moderate" | "Low" | "None";
    flag: string;
    note?: string;
    matched_category?: string;
    /** 0-100 combined confidence from semantic + keyword analysis */
    confidence: number;
    /** Whether this match was found via semantic inference, keyword, or both */
    primary_evidence_type: "semantic" | "keyword" | "both";
    /** Detailed semantic evidence chain */
    semantic_evidence?: Array<{
        source: string;
        text: string;
        inference: string;
        strength: "strong" | "moderate" | "weak";
    }>;
}

export interface MissingSkill {
    skill: string;
    importance: "Required" | "Preferred";
    impact: string;
    alternatives_found?: string[];
    transferability?: number;
    verdict: string;
    /** If semantic analysis found weak/contextual evidence that didn't meet threshold */
    semantic_near_miss?: {
        confidence: number;
        reason: string;
    };
}

export interface SkillAnalysis {
    matched: SkillMatch[];
    missing_critical: MissingSkill[];
    partial_matches: Array<{
        skill: string;
        jd_requires: string;
        candidate_has: string;
        level_gap: string;
        credit_given: number;
        flag: string;
    }>;
    transferable_strengths: Array<{
        skill: string;
        relevance: string;
        credit: number;
    }>;
}

export interface ExperienceAnalysis {
    gap_years: number;
    level_gap_verdict: string;
    visual_gap: string;
    jd_seniority: string;
    candidate_seniority: string;
}

export interface ATSScore {
    match_score: {
        overall: number;
        interpretation: string;
        confidence: "High" | "Medium" | "Low";
        hire_recommendation: "STRONG_HIRE" | "HIRE" | "INTERVIEW" | "HOLD" | "PASS" | "REJECT";
    };
    component_breakdown: {
        hard_requirements: { score: number; max: number; percentage: number; verdict: string };
        soft_requirements: { score: number; max: number; percentage: number; verdict: string };
        experience_level: { score: number; max: number; percentage: number; gap_years: number; verdict: string };
        domain_alignment: { score: number; max: number; percentage: number; jd_stack: string; candidate_stack: string; verdict: string };
    };
    skill_analysis: SkillAnalysis;
    experience_analysis: ExperienceAnalysis;
    red_flags: Array<{ flag: string; severity: "Critical" | "High" | "Medium" | "Low"; impact: number }>;
    positive_signals: Array<{ signal: string; value: string }>;
    recommendations: {
        for_candidate: {
            should_apply: boolean;
            reasons: string[];
            to_become_competitive: string[];
            better_fit_roles: string[];
        };
        for_recruiter: {
            hire_decision: string;
            reasoning: string[];
            alternative_consideration: string;
        };
    };
    metadata: {
        analysis_version: string;
        analysis_date: string;
        confidence: string;
        edge_cases_detected: string[];
        model_used?: string;
    };
}

export interface EnhancedResume extends ParsedResumeData {
    computed_stack: TechStack;
    computed_seniority: {
        level: SeniorityLevel;
        years: number;
        rationale: string;
        is_student: boolean;
    };
    research_score: number; // 0-1
    implicit_skills: string[];
}
