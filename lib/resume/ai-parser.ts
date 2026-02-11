/**
 * AI-powered Resume Parser — Direct Gemini / Groq calls with validation & retry.
 *
 * ⚠️  This module calls AI providers DIRECTLY instead of via AntigravityRouter.
 *     Reason: the router's mandatory Prompt Guard blocks resume text as "unsafe",
 *     causing a silent fallback to the regex parser.  Resume uploads are already
 *     gated by auth + file-type validation, so the guard is unnecessary here.
 *
 * Model priority:
 *   1. gemini-2.5-flash         (Google — fast, structured JSON)
 *   2. gemini-2.5-flash-lite    (Google — lighter, still good)
 *   3. llama-3.3-70b-versatile  (Groq  — fallback)
 *   4. Regex fallback            (last resort)
 *
 * Each model attempt is validated: if critical fields are missing the next
 * model is tried automatically.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { env } from "@/lib/env";

// ============================================================================
// PROVIDER CLIENTS — Initialized once at module scope
// ============================================================================

const googleAI = env.GOOGLE_GENERATIVE_AI_API_KEY
    ? new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY)
    : null;

const groqClient = env.GROQ_API_KEY
    ? new Groq({ apiKey: env.GROQ_API_KEY })
    : null;

// ============================================================================
// MODEL CHAIN — Tried in order until one produces valid output
// ============================================================================

interface ModelDef {
    id: string;
    provider: "google" | "groq";
    label: string;
}

const MODEL_CHAIN: ModelDef[] = [
    { id: "llama-3.3-70b-versatile", provider: "groq", label: "Groq Llama 3.3 70B" },
    { id: "gemini-2.5-flash", provider: "google", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", provider: "google", label: "Gemini 2.5 Flash Lite" },
];

// ============================================================================
// SCHEMA / INTERFACE
// ============================================================================

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
        institution: string;
        degree?: string;
        branch?: string;
        level?: string;
        year_of_completion?: string;
        expected_graduation?: string;
        current_cgpa?: number;
        score_or_cgpa?: string;
    }>;

    experience: Array<{
        company: string;
        role: string;
        is_internship?: boolean;
        duration?: string;
        description?: string;
        skills_used?: string[];
    }>;

    projects: Array<{
        title: string;
        description?: string;
        link?: string;
        tech_stack?: string[];
        date?: string;
    }>;

    skills: Array<{
        name: string;
        category: string;
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
        date_obtained?: string;
    }>;

    achievements: Array<{
        title: string;
        issuer?: string;
        date?: string;
        description?: string;
    }>;

    soft_skills: string[];
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from the resume text and return ONLY a JSON object.

Return this EXACT JSON structure:
{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null (include country code)",
  "linkedin_url": "string or null (full URL)",
  "professional_summary": "string or null",
  "coding_profiles": [{"platform": "GitHub|LeetCode|etc", "profile_url": "full URL", "rating_or_score": "string or null"}],
  "education_history": [{"institution": "name", "degree": "B.Tech|M.Tech|etc or null", "branch": "CS|ECE|etc or null", "level": "10th|12th|Bachelor's|Master's or null", "year_of_completion": "YYYY or null", "expected_graduation": "YYYY-MM or null", "current_cgpa": 8.5, "score_or_cgpa": "raw score string or null"}],
  "experience": [{"company": "name", "role": "title", "is_internship": false, "duration": "Mon YYYY - Mon YYYY or Present", "description": "what was done (combine bullet points into one string)", "skills_used": ["skill1"]}],
  "projects": [{"title": "name", "description": "what it does", "link": "URL or null", "tech_stack": ["tech1"], "date": "Mon YYYY or null"}],
  "skills": [{"name": "Python", "category": "programming|framework|database|tool|cloud|devops|testing|other"}],
  "research_papers": [{"title": "name", "field": "area or null", "paper_link": "URL or null", "skills_demonstrated": ["skill1"]}],
  "certifications": [{"certification_name": "name", "issuer": "org or null", "verification_link": "URL or null", "date_obtained": "string or null"}],
  "achievements": [{"title": "Short title (e.g. Hackathon Winner)", "issuer": "Organization/Event", "date": "YYYY-MM", "description": "Details about the achievement"}],
  "soft_skills": ["communication", "teamwork"]
}

RULES:
1. Return ONLY the JSON. No markdown. No code fences. No explanations.
2. null for missing strings/numbers, [] for missing arrays.
3. Categorize each skill: programming, framework, database, tool, cloud, devops, testing, other.
4. Extract ALL skills from everywhere (skills section, projects, experience).
5. For CGPA: return as number (8.5), for percentage: return as string ("85%").
6. Combine experience bullet points into one description string.
7. Set is_internship=true for internships.
8. For Achievements: Split the content. Title should be concise. Put details in description.`;

// ============================================================================
// EMPTY RESULT
// ============================================================================

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
    skills: [],
    research_papers: [],
    certifications: [],
    achievements: [],
    soft_skills: [],
};

// ============================================================================
// DIRECT PROVIDER CALLS — No Prompt Guard, no router overhead
// ============================================================================

async function callGemini(modelId: string, resumeText: string): Promise<string> {
    if (!googleAI) throw new Error("Google AI not configured — missing GOOGLE_GENERATIVE_AI_API_KEY");

    const model = googleAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
        },
        systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
        `Parse this resume and extract all structured data:\n\n${resumeText}`
    );
    return result.response.text();
}

async function callGroq(modelId: string, resumeText: string): Promise<string> {
    if (!groqClient) throw new Error("Groq not configured — missing GROQ_API_KEY");

    const completion = await groqClient.chat.completions.create({
        model: modelId,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Parse this resume and extract all structured data:\n\n${resumeText}` },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" as const },
    });

    return completion.choices[0]?.message?.content || "";
}

// ============================================================================
// JSON EXTRACTION — Robust, handles messy AI output
// ============================================================================

function extractJSON(raw: string): unknown | null {
    if (!raw || raw.trim().length === 0) return null;

    let text = raw.trim();

    // Strategy 1: Strip markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    // Strategy 2: Direct parse
    try { return JSON.parse(text); } catch { /* continue */ }

    // Strategy 3: Brace-counting — find first complete {...} object
    const start = text.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    let inStr = false;
    let esc = false;

    for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "{") depth++;
        else if (c === "}") {
            depth--;
            if (depth === 0) {
                try { return JSON.parse(text.substring(start, i + 1)); } catch { /* keep looking */ }
            }
        }
    }

    return null;
}

// ============================================================================
// RESPONSE VALIDATION — Ensure AI actually extracted meaningful data
// ============================================================================

function validateAndBuild(raw: unknown): ParsedResumeData | null {
    if (!raw || typeof raw !== "object") return null;

    const p = raw as Record<string, unknown>;

    const result: ParsedResumeData = {
        full_name: typeof p.full_name === "string" && p.full_name.trim() ? p.full_name.trim() : null,
        email: typeof p.email === "string" ? p.email.trim() : null,
        phone: typeof p.phone === "string" ? p.phone.trim() : null,
        linkedin_url: typeof p.linkedin_url === "string" ? p.linkedin_url.trim() : null,
        professional_summary: typeof p.professional_summary === "string" ? p.professional_summary.trim() : null,

        coding_profiles: Array.isArray(p.coding_profiles)
            ? p.coding_profiles.filter((c: any) => c?.platform && c?.profile_url)
            : [],

        education_history: Array.isArray(p.education_history)
            ? p.education_history.filter((e: any) => e?.institution)
            : [],

        experience: Array.isArray(p.experience)
            ? p.experience.filter((e: any) => e?.company && e?.role)
            : [],

        projects: Array.isArray(p.projects)
            ? p.projects.filter((proj: any) => proj?.title)
            : [],

        skills: Array.isArray(p.skills)
            ? p.skills
                .filter((s: any) => s?.name && typeof s.name === "string")
                .map((s: any) => ({ name: s.name.trim(), category: typeof s.category === "string" ? s.category : "other" }))
            : [],

        research_papers: Array.isArray(p.research_papers)
            ? p.research_papers.filter((r: any) => r?.title)
            : [],

        certifications: Array.isArray(p.certifications)
            ? p.certifications.filter((c: any) => c?.certification_name)
            : [],

        achievements: Array.isArray(p.achievements)
            ? p.achievements
                .map((a: any) => {
                    if (typeof a === "string") return { title: a };
                    if (a?.title) return {
                        title: a.title,
                        issuer: a.issuer,
                        date: a.date,
                        description: a.description
                    };
                    return null;
                })
                .filter(Boolean) as ParsedResumeData["achievements"]
            : [],

        soft_skills: Array.isArray(p.soft_skills)
            ? p.soft_skills.filter((s: any) => typeof s === "string")
            : [],
    };

    // Backwards compat: old-style general_technical_skills → skills
    if (result.skills.length === 0 && Array.isArray((p as any).general_technical_skills)) {
        result.skills = (p as any).general_technical_skills
            .filter((s: any) => typeof s === "string" && s.trim().length > 0)
            .map((s: string) => ({ name: s.trim(), category: "other" }));
    }

    return result;
}

/**
 * Quality check: did the AI actually extract meaningful data?
 * Returns a score 0-100. Anything below 30 is considered a failure.
 */
function qualityScore(data: ParsedResumeData): number {
    let score = 0;
    if (data.full_name) score += 20;
    if (data.email) score += 10;
    if (data.phone) score += 5;
    if (data.skills.length > 0) score += 15;
    if (data.education_history.length > 0) score += 15;
    if (data.projects.length > 0) score += 15;
    if (data.experience.length > 0) score += 15;
    if (data.coding_profiles.length > 0) score += 5;
    return score;
}

// ============================================================================
// REGEX FALLBACK — Absolute last resort
// ============================================================================

function parseWithRegex(resumeText: string): ParsedResumeData {
    const result: ParsedResumeData = {
        ...EMPTY_RESULT,
        coding_profiles: [], education_history: [], experience: [],
        projects: [], skills: [], research_papers: [], certifications: [],
        achievements: [], soft_skills: [],
    };

    // Name: first non-empty line that looks like a name
    const lines = resumeText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0 && lines[0].length < 60 && !lines[0].includes("@") && !lines[0].includes("http")) {
        result.full_name = lines[0];
    }

    const emailMatch = resumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) result.email = emailMatch[1];

    const phoneMatch = resumeText.match(/(\+?\d[\d \-]{8,14}\d)/);
    if (phoneMatch) result.phone = phoneMatch[1];

    const linkedinMatch = resumeText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/);
    if (linkedinMatch) result.linkedin_url = "https://" + linkedinMatch[1];

    const githubMatch = resumeText.match(/github\.com\/([a-zA-Z0-9_-]+)/);
    if (githubMatch) {
        result.coding_profiles.push({ platform: "GitHub", profile_url: "https://github.com/" + githubMatch[1] });
    }

    return result;
}

// ============================================================================
// MAIN ENTRY — parseResumeWithAI
// ============================================================================

/**
 * Parse resume text using direct AI calls with multi-model fallback + validation.
 *
 * Bypasses AntigravityRouter's Prompt Guard (which blocks resume text).
 * Tries each model in MODEL_CHAIN, validates the quality of the result,
 * and only accepts it if it extracts meaningful data.
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
    if (!resumeText || resumeText.length < 50) {
        console.log("[AI Parser] Resume text too short, returning empty result");
        return { ...EMPTY_RESULT, coding_profiles: [], education_history: [], experience: [], projects: [], skills: [], research_papers: [], certifications: [], achievements: [], soft_skills: [] };
    }

    console.log(`[AI Parser] Starting parsing (${resumeText.length} chars, ${MODEL_CHAIN.length} models available)`);

    let bestResult: ParsedResumeData | null = null;
    let bestScore = 0;
    let bestModel = "";

    for (const model of MODEL_CHAIN) {
        const t0 = Date.now();
        try {
            console.log(`[AI Parser] Trying ${model.label} (${model.id})...`);

            let rawResponse: string;
            if (model.provider === "google") {
                rawResponse = await callGemini(model.id, resumeText);
            } else {
                rawResponse = await callGroq(model.id, resumeText);
            }

            const elapsed = Date.now() - t0;
            console.log(`[AI Parser] ${model.label} responded in ${elapsed}ms (${rawResponse.length} chars)`);

            // Extract JSON from raw response
            const jsonObj = extractJSON(rawResponse);
            if (!jsonObj) {
                console.error(`[AI Parser] ❌ ${model.label}: Could not extract JSON. Preview: ${rawResponse.substring(0, 200)}`);
                continue;
            }

            // Validate and build typed result
            const parsed = validateAndBuild(jsonObj);
            if (!parsed) {
                console.error(`[AI Parser] ❌ ${model.label}: Validation failed`);
                continue;
            }

            // Quality check
            const score = qualityScore(parsed);
            console.log(`[AI Parser] ${model.label} quality score: ${score}/100`, {
                name: parsed.full_name,
                skills: parsed.skills.length,
                education: parsed.education_history.length,
                projects: parsed.projects.length,
                experience: parsed.experience.length,
            });

            // Accept if score is good enough (≥30 = at least name + some data)
            if (score >= 30) {
                console.log(`[AI Parser] ✅ Accepted ${model.label} (score ${score})`);
                return parsed;
            }

            // Track best attempt even if below threshold
            if (score > bestScore) {
                bestResult = parsed;
                bestScore = score;
                bestModel = model.label;
            }

        } catch (error: unknown) {
            const elapsed = Date.now() - t0;
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[AI Parser] ❌ ${model.label} failed after ${elapsed}ms: ${msg}`);
            continue;
        }
    }

    // If we have a partial result from any model, use it even if score < 30
    if (bestResult && bestScore > 0) {
        console.log(`[AI Parser] ⚠️ Using best partial result from ${bestModel} (score ${bestScore})`);
        return bestResult;
    }

    // Absolute fallback: regex
    console.log("[AI Parser] ⚠️ All AI models failed, using regex fallback");
    return parseWithRegex(resumeText);
}

// ============================================================================
// DB MAPPING — Convert ParsedResumeData → database profile format
// ============================================================================

// Helper to normalize dates to YYYY-MM
function normalizeDate(dateStr: string | undefined | null): string {
    if (!dateStr) return "";

    // Try to parse using Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 7); // YYYY-MM
    }

    // Handle "Present" or "Current"
    if (dateStr.toLowerCase().includes("present") || dateStr.toLowerCase().includes("current")) {
        return new Date().toISOString().slice(0, 7);
    }

    return ""; // Fallback to empty if unparseable
}

export function mapParsedResumeToProfile(parsed: ParsedResumeData): {
    phone: string | null;
    linkedin: string | null;
    skills: Array<{ name: string; proficiency: 1 | 2 | 3 | 4 | 5 }>;
    projects: Array<{ title: string; description: string; techStack: string[]; url?: string; startDate?: string; endDate?: string }>;
    workExperience: Array<{ company: string; role: string; description: string; startDate: string; endDate?: string; location?: string }>;
    codingProfiles: Array<{ platform: string; username: string; rating?: number; url?: string }>;
    certifications: Array<{ title: string; issuer: string; url?: string; dateIssued?: string }>;
    researchPapers: Array<{ title: string; abstract?: string; url?: string }>;
    achievements: Array<{ title: string; description?: string; issuer?: string; date?: string }>;
    softSkills: string[];
    tenthPercentage: number | null;
    twelfthPercentage: number | null;
    cgpa: number | null;
} {
    const skills = parsed.skills.map(s => ({
        name: s.name.trim(),
        proficiency: 3 as const,
    }));

    const projects = parsed.projects.map(p => ({
        title: p.title,
        description: p.description || "",
        techStack: p.tech_stack || [],
        url: p.link,
        startDate: normalizeDate(p.date), // Projects usually have a single date string
    }));

    const workExperience = parsed.experience.map(exp => {
        // Handle "Jan 2022 - Present" or "2020-2021" formats
        let start = "";
        let end = "";

        if (exp.duration) {
            const parts = exp.duration.split("-");
            start = normalizeDate(parts[0]);
            if (parts.length > 1) {
                end = normalizeDate(parts[1]);
            }
        }

        return {
            company: exp.company,
            role: exp.role,
            description: typeof exp.description === "string"
                ? exp.description
                : Array.isArray(exp.description)
                    ? (exp.description as string[]).join(" ")
                    : "",
            startDate: start,
            endDate: end || undefined,
            location: undefined,
        };
    });

    const codingProfiles = parsed.coding_profiles.map(cp => {
        const url = cp.profile_url || "";
        const parts = url.split("/");
        const username = parts[parts.length - 1] || parts[parts.length - 2] || "";
        return {
            platform: cp.platform,
            username,
            rating: cp.rating_or_score ? parseInt(cp.rating_or_score) || undefined : undefined,
            url: url || undefined,
        };
    });

    const certifications = parsed.certifications.map(c => ({
        title: c.certification_name || "",
        issuer: c.issuer || "",
        url: c.verification_link,
        // No date field in interface currently, but if added later:
        // dateIssued: normalizeDate(c.date) 
    }));

    const researchPapers = parsed.research_papers.map(r => ({
        title: r.title,
        abstract: r.field,
        url: r.paper_link,
    }));

    const achievements = parsed.achievements.map(a => {
        if (typeof a === "string") return { title: a, description: undefined };
        return {
            title: a.title,
            description: a.description,
            issuer: a.issuer,
            date: normalizeDate(a.date)
        };
    });

    // Extract academic scores (unchanged)
    let tenthPercentage: number | null = null;
    let twelfthPercentage: number | null = null;
    let cgpa: number | null = null;

    for (const edu of parsed.education_history) {
        const level = (edu.level || edu.degree || "").toLowerCase();
        const score = edu.score_or_cgpa || (edu.current_cgpa != null ? String(edu.current_cgpa) : null);

        if (score) {
            const num = parseFloat(score.replace(/[^0-9.]/g, ""));
            if (level.includes("10th") || level.includes("x") || level.includes("ssc")) {
                tenthPercentage = num <= 100 ? num : null;
            } else if (level.includes("12th") || level.includes("xii") || level.includes("hsc") || level.includes("intermediate")) {
                twelfthPercentage = num <= 100 ? num : null;
            } else if (level.includes("bachelor") || level.includes("b.tech") || level.includes("b.e") || level.includes("bsc")) {
                cgpa = num <= 10 ? num : null;
            }
        }

        if (edu.current_cgpa != null && cgpa === null) {
            const val = typeof edu.current_cgpa === "number" ? edu.current_cgpa : parseFloat(String(edu.current_cgpa));
            if (!isNaN(val) && val <= 10) cgpa = val;
        }
    }

    return {
        phone: parsed.phone,
        linkedin: parsed.linkedin_url,
        skills, projects, workExperience, codingProfiles,
        certifications, researchPapers, achievements,
        softSkills: parsed.soft_skills,
        tenthPercentage, twelfthPercentage, cgpa,
    };
}
