/**
 * AI-powered Resume Parser with multi-model fallback.
 * 
 * Flow:
 * 1. Tier 1: Gemini 1.5 Flash (Primary)
 * 2. Tier 2: Gemini 1.5 Flash 8B (Lite)
 * 3. Tier 3: Groq Llama 3.3 70B (Heavy Duty)
 * 4. Tier 3: Groq Llama 3.1 8B (Fast)
 * 5. Final fallback to regex-based parser
 * 
 * All models receive the same structured schema and prompt to ensure
 * consistent JSON output matching the ParsedResumeData interface.
 */

import { env } from "@/lib/env";
import { AntigravityRouter } from "@/lib/antigravity/router";

// Initialize Router (Singleton-ish behavior in module scope is okay for Next.js serverless if stateless)
const router = new AntigravityRouter({
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    groqApiKey: env.GROQ_API_KEY,
    enableLogging: true,
});

/**
 * Schema for parsed resume data.
 * Matches the database fields and JSONB types.
 */
export interface ParsedResumeData {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    professional_summary: string | null;

    coding_profiles: Array<{
        platform: string;
        profile_url: string;
        rating_or_score?: string;
    }>;

    education_history: Array<{
        level: string;
        institution: string;
        degree_major?: string;
        year_of_completion?: string;
        score_or_cgpa?: string;
    }>;

    experience: Array<{
        title: string;
        company: string;
        is_internship?: boolean;
        duration?: string;
        description?: string[];
        skills_used?: string[];
    }>;

    projects: Array<{
        name: string;
        description?: string;
        link?: string;
        tech_stack?: string[];
    }>;

    research_papers: Array<{
        title: string;
        field?: string;
        paper_link?: string;
        skills_demonstrated?: string[];
    }>;

    certifications: Array<{
        certification_name: string;
        issuer?: string;
        verification_link?: string;
        skills_acquired?: string[];
    }>;

    general_technical_skills: string[];
    soft_skills: string[];
    achievements: string[];
}

/**
 * The structured schema definition for AI models.
 * This ensures consistent output across different AI providers.
 */
const RESUME_SCHEMA_PROMPT = `
You are a resume parser. Extract structured information from the resume text below.

Return a valid JSON object with the following structure:
{
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "linkedin_url": "string or null (full LinkedIn URL)",
    "professional_summary": "string or null (brief summary if present)",
    
    "coding_profiles": [
        {
            "platform": "string (LeetCode, Codeforces, HackerRank, etc.)",
            "profile_url": "string (full URL)",
            "rating_or_score": "string or null"
        }
    ],
    
    "education_history": [
        {
            "level": "string (10th, 12th, Bachelor's, Master's, etc.)",
            "institution": "string",
            "degree_major": "string or null",
            "year_of_completion": "string or null",
            "score_or_cgpa": "string or null"
        }
    ],
    
    "experience": [
        {
            "title": "string (job title)",
            "company": "string",
            "is_internship": "boolean",
            "duration": "string or null (e.g., 'Jan 2024 - Mar 2024' or '3 months')",
            "description": ["array of bullet points"],
            "skills_used": ["array of skills/technologies used"]
        }
    ],
    
    "projects": [
        {
            "name": "string",
            "description": "string or null",
            "link": "string or null (GitHub, live demo URL)",
            "tech_stack": ["array of technologies used"]
        }
    ],
    
    "research_papers": [
        {
            "title": "string",
            "field": "string or null",
            "paper_link": "string or null",
            "skills_demonstrated": ["array of skills"]
        }
    ],
    
    "certifications": [
        {
            "certification_name": "string",
            "issuer": "string or null",
            "verification_link": "string or null",
            "skills_acquired": ["array of skills"]
        }
    ],
    
    "general_technical_skills": ["array of technical skills (languages, frameworks, tools, etc.)"],
    "soft_skills": ["array of soft skills (communication, leadership, teamwork, etc.)"],
    "achievements": ["array of achievement descriptions (awards, hackathons, competitions, etc.)"]
}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown code blocks, no explanations.
2. If a field is not found in the resume, use null for strings, empty array [] for arrays.
3. Extract as much information as possible from the resume.
4. For education: Include 10th, 12th, undergraduate, and any postgraduate degrees.
5. For coding profiles: Look for LeetCode, Codeforces, HackerRank, CodeChef, GitHub, etc.
6. Distinguish between internships and full-time experience.
7. Extract technologies/skills used in each project and experience.

RESUME TEXT:
`;

/**
 * Default empty result for fallback.
 */
const EMPTY_RESULT: ParsedResumeData = {
    full_name: null,
    email: null,
    phone: null,
    linkedin_url: null,
    professional_summary: null,
    coding_profiles: [],
    education_history: [],
    experience: [],
    projects: [],
    research_papers: [],
    certifications: [],
    general_technical_skills: [],
    soft_skills: [],
    achievements: [],
};

/**
 * Try to parse JSON from AI response, handling common issues.
 */
function parseAIResponse(response: string): ParsedResumeData | null {
    try {
        // Remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);

        // Validate required structure
        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        // Ensure arrays are arrays
        const result: ParsedResumeData = {
            full_name: parsed.full_name || null,
            email: parsed.email || null,
            phone: parsed.phone || null,
            linkedin_url: parsed.linkedin_url || null,
            professional_summary: parsed.professional_summary || null,
            coding_profiles: Array.isArray(parsed.coding_profiles) ? parsed.coding_profiles : [],
            education_history: Array.isArray(parsed.education_history) ? parsed.education_history : [],
            experience: Array.isArray(parsed.experience) ? parsed.experience : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            research_papers: Array.isArray(parsed.research_papers) ? parsed.research_papers : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            general_technical_skills: Array.isArray(parsed.general_technical_skills) ? parsed.general_technical_skills : [],
            soft_skills: Array.isArray(parsed.soft_skills) ? parsed.soft_skills : [],
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        };

        return result;
    } catch {
        return null;
    }
}

/**
 * Basic regex-based fallback parser.
 * Used when all AI models fail.
 */
function parseWithRegex(resumeText: string): ParsedResumeData {
    const result: ParsedResumeData = { ...EMPTY_RESULT };

    // Email extraction
    const emailMatch = resumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) result.email = emailMatch[1];

    // Phone extraction
    const phoneMatch = resumeText.match(/(\+?\d[\d -]{8,12}\d)/);
    if (phoneMatch) result.phone = phoneMatch[1];

    // LinkedIn extraction
    const linkedinMatch = resumeText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/);
    if (linkedinMatch) result.linkedin_url = "https://" + linkedinMatch[1];

    // GitHub extraction
    const githubMatch = resumeText.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    if (githubMatch) {
        result.coding_profiles.push({
            platform: "GitHub",
            profile_url: "https://github.com/" + githubMatch[1],
        });
    }

    // LeetCode extraction
    const leetcodeMatch = resumeText.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)/i);
    if (leetcodeMatch) {
        result.coding_profiles.push({
            platform: "LeetCode",
            profile_url: "https://leetcode.com/" + leetcodeMatch[1],
        });
    }

    // Skills extraction (common patterns)
    const skillsSection = resumeText.match(/(?:skills|technologies|tech stack)[:\s]*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    if (skillsSection) {
        const skills = skillsSection[1]
            .split(/[,|•·–\-\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 40);
        result.general_technical_skills = [...new Set(skills)].slice(0, 30);
    }

    return result;
}

/**
 * Main resume parsing function using Antigravity Router.
 * Enforces strict routing policy: Gemini 3 -> Gemini 2.5 Lite -> ... -> Fallback.
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
    if (!resumeText || resumeText.length < 50) {
        console.log("[AI Parser] Resume text too short, using empty result");
        return EMPTY_RESULT;
    }

    console.log("[AI Parser] Starting resume parsing via Antigravity Router...");

    // 1. Try "parse_resume_full" task chain
    const result = await router.execute<ParsedResumeData>(
        "parse_resume_full",
        RESUME_SCHEMA_PROMPT + resumeText,
        {
            responseFormat: "json",
            temperature: 0.1
        }
    );

    if (result.success && result.data) {
        // The router returns string for Google/Groq usually, but we need to parse it if it's not already object
        // The implementations in router currently return string. We need to parse here.

        const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        const parsedData = parseAIResponse(text);
        if (parsedData) {
            console.log(`[AI Parser] Success via ${result.modelUsed}`);
            return parsedData;
        }
        console.log(`[AI Parser] Router succeeded but JSON parsing failed for ${result.modelUsed}`);
    } else {
        console.error(`[AI Parser] Router execution failed: ${result.error}`);
    }

    // 2. Final fallback to regex
    console.log("[AI Parser] All AI models failed, using regex fallback");
    return parseWithRegex(resumeText);
}

/**
 * Convert ParsedResumeData to the format expected by the database.
 * Maps AI-parsed data to the student profile JSONB fields.
 */
export function mapParsedResumeToProfile(parsed: ParsedResumeData): {
    phone: string | null;
    linkedin: string | null;
    skills: Array<{ name: string; proficiency: 1 | 2 | 3 | 4 | 5 }>;
    projects: Array<{ title: string; description: string; techStack: string[]; url?: string }>;
    workExperience: Array<{ company: string; role: string; description: string; startDate: string; endDate?: string; location?: string }>;
    codingProfiles: Array<{ platform: string; username: string; rating?: number; url?: string }>;
    certifications: Array<{ title: string; issuer: string; url?: string }>;
    researchPapers: Array<{ title: string; abstract?: string; url?: string }>;
    achievements: Array<{ title: string; description?: string }>;
    softSkills: string[];
    tenthPercentage: number | null;
    twelfthPercentage: number | null;
    cgpa: number | null;
} {
    // Map skills
    const skills = parsed.general_technical_skills.map(name => ({
        name: name.trim(),
        proficiency: 3 as const, // Default to intermediate
    }));

    // Map projects
    const projects = parsed.projects.map(p => ({
        title: p.name,
        description: p.description || "",
        techStack: p.tech_stack || [],
        url: p.link,
    }));

    // Map work experience
    const workExperience = parsed.experience.map(exp => ({
        company: exp.company,
        role: exp.title,
        description: exp.description?.join(" ") || "",
        startDate: (exp.duration || "").split("-")[0]?.trim() || "",
        endDate: (exp.duration || "").split("-")[1]?.trim(),
        location: undefined,
    }));

    // Map coding profiles
    const codingProfiles = parsed.coding_profiles.map(cp => {
        const profileUrl = cp.profile_url || "";
        const urlParts = profileUrl.split("/");
        const username = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "";
        return {
            platform: cp.platform,
            username: username,
            rating: cp.rating_or_score ? parseInt(cp.rating_or_score) || undefined : undefined,
            url: profileUrl || undefined,
        };
    });

    // Map certifications
    const certifications = parsed.certifications.map(cert => ({
        title: cert.certification_name,
        issuer: cert.issuer || "",
        url: cert.verification_link,
    }));

    // Map research papers
    const researchPapers = parsed.research_papers.map(paper => ({
        title: paper.title,
        abstract: paper.field,
        url: paper.paper_link,
    }));

    // Map achievements
    const achievements = parsed.achievements.map(ach => ({
        title: ach,
        description: undefined,
    }));

    // Extract academic scores from education history
    let tenthPercentage: number | null = null;
    let twelfthPercentage: number | null = null;
    let cgpa: number | null = null;

    for (const edu of parsed.education_history) {
        const level = edu.level?.toLowerCase() || "";
        const score = edu.score_or_cgpa;

        if (score) {
            const numScore = parseFloat(score.replace(/[^0-9.]/g, ""));

            if (level.includes("10th") || level.includes("x") || level.includes("ssc")) {
                tenthPercentage = numScore <= 100 ? numScore : null;
            } else if (level.includes("12th") || level.includes("xii") || level.includes("hsc") || level.includes("intermediate")) {
                twelfthPercentage = numScore <= 100 ? numScore : null;
            } else if (level.includes("bachelor") || level.includes("b.tech") || level.includes("b.e") || level.includes("bsc")) {
                cgpa = numScore <= 10 ? numScore : null;
            }
        }
    }

    return {
        phone: parsed.phone,
        linkedin: parsed.linkedin_url,
        skills,
        projects,
        workExperience,
        codingProfiles,
        certifications,
        researchPapers,
        achievements,
        softSkills: parsed.soft_skills,
        tenthPercentage,
        twelfthPercentage,
        cgpa,
    };
}
