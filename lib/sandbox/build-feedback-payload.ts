import type { StructuredJD } from "@/lib/jd/parser";
import type { ParsedResumeData } from "@/lib/resume/ai-parser";
import type { ATSScore } from "@/lib/ats/types";

const SOFT_SKILL_RE =
  /^(english|communication|teamwork|leadership|problem[\s-]solving|interpersonal|written|verbal|presentation|language|hindi|french|spanish|german|mandarin|arabic|japanese)/i;

export const isSoftSkill = (skill: string) => SOFT_SKILL_RE.test(skill.trim());

export function buildFeedbackPayload(
  parsedJd: StructuredJD,
  parsedResume: ParsedResumeData,
  atsResult: ATSScore
): string {
  return JSON.stringify({
    jd: {
      title: parsedJd.role_metadata?.job_title || "Unknown Role",
      cluster: parsedJd.tech_stack_cluster?.primary_cluster || "Unknown",
      requiredSkills: (parsedJd.requirements?.hard_requirements?.technical_skills || [])
        .map(s => ({ skill: s.skill, critical: s.critical })),
      preferredSkills: (parsedJd.requirements?.soft_requirements?.technical_skills || [])
        .map(s => s.skill),
      primaryTasks: (parsedJd.responsibilities?.primary_tasks || []).slice(0, 3),
    },
    resume: {
      skills: parsedResume.skills.map(s => s.name),
      projects: parsedResume.projects.map(p => ({
        title: p.title,
        stack: p.tech_stack || [],
        description: (p.description || "").substring(0, 250),
      })),
      experience: parsedResume.experience.map(e => ({
        role: e.role,
        company: e.company,
        isInternship: e.is_internship,
        description: (e.description || "").substring(0, 250),
        skillsUsed: e.skills_used || [],
      })),
      certifications: parsedResume.certifications.map(c => ({
        name: c.certification_name,
        issuer: c.issuer,
      })),
      achievements: (parsedResume.achievements || []).map(a => a.title),
      hasLinkedIn: !!parsedResume.linkedin_url,
      hasGitHub: (parsedResume.coding_profiles || []).some(p =>
        p.platform?.toLowerCase().includes("github")
      ),
    },
    matchResult: {
      hardSkillScore: atsResult.component_breakdown.hard_requirements.score,
      experienceScore: atsResult.component_breakdown.experience_level.score,
      domainScore: atsResult.component_breakdown.domain_alignment.score,
      overallScore: atsResult.match_score.overall,
      matchedSkills: atsResult.skill_analysis.matched.map(m => ({
        skill: m.skill,
        evidenceLevel: m.evidence_level,
        confidence: m.confidence,
      })),
      missingSkills: atsResult.skill_analysis.missing_critical
        .filter(s => !isSoftSkill(s.skill))
        .map(s => ({ skill: s.skill, importance: s.importance })),
      transferableStrengths: (atsResult.skill_analysis.transferable_strengths || [])
        .map(t => ({ skill: t.skill, relevance: t.relevance })),
    },
  });
}
