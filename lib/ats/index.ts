
import { StructuredJD } from "@/lib/jd/parser";
import { ParsedResumeData } from "@/lib/resume/ai-parser";
import { enhanceResumeData } from "./resume-processor";
import { matchSkills } from "./matching";
import { calculateATSScore } from "./scoring";
import { ATSScore } from "./types";

export function analyzeMatch(jd: StructuredJD, resumeRaw: ParsedResumeData): ATSScore {
    // 1. Enhance Resume
    const enhancedResume = enhanceResumeData(resumeRaw);

    // 2. Match Skills
    const skillAnalysis = matchSkills(jd, enhancedResume);

    // 3. Score
    return calculateATSScore(jd, enhancedResume, skillAnalysis);
}

export * from "./types";
