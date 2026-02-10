
import { AntigravityRouter } from "@/lib/antigravity/router";
import { env } from "@/lib/env";

export interface EnhancedJD {
    title: string;
    company: string;
    summary: string;
    responsibilities: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    qualifications: string[];
    salaryRange?: string;
    location?: string;
    formattedContent?: string; // Markdown formatted full JD
}

const router = new AntigravityRouter({
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    groqApiKey: env.GROQ_API_KEY,
    enableLogging: true,
});

const JD_ENHANCEMENT_PROMPT = `
You are an expert technical recruiter and job analyst. 
Analyze the following Job Description (JD) and extract structured information.
Enhance the content to be more professional and clear if needed, but keep the core requirements intact.

Return a valid JSON object with the following structure:
{
    "title": "string (Job Title)",
    "company": "string (Company Name)",
    "summary": "string (Short generic summary of the role, max 3 sentences)",
    "responsibilities": ["array of key responsibilities"],
    "requiredSkills": ["array of MUST HAVE technical skills/technologies"],
    "preferredSkills": ["array of NICE TO HAVE skills"],
    "qualifications": ["array of educational or experience requirements"],
    "salaryRange": "string or null",
    "location": "string or null"
}

IMPORTANT:
1. Return ONLY valid JSON.
2. If the input text is messy, clean it up in the extracted fields.
3. Normalize skill names (e.g., "React.js" -> "React", "NodeJS" -> "Node.js").
4. If a field is missing, use empty array [] or null.

RAW JD TEXT:
`;

export async function enhanceJDWithAI(rawJd: string, titleHint?: string, companyHint?: string): Promise<EnhancedJD> {
    if (!rawJd || rawJd.length < 20) {
        throw new Error("JD text too short to process");
    }

    console.log("[JD Enhancer] Starting JD enhancement via Antigravity Router...");

    // Construct prompt
    let prompt = JD_ENHANCEMENT_PROMPT + rawJd;
    if (titleHint || companyHint) {
        prompt += `\n\nCONTEXT HINTS: Title: ${titleHint || "Unknown"}, Company: ${companyHint || "Unknown"}`;
    }

    const result = await router.execute<EnhancedJD>(
        "enhance_jd",
        prompt,
        {
            responseFormat: "json",
            temperature: 0.2
        }
    );

    if (result.success && result.data) {
        const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        const parsed = parseAIResponse(text);

        if (parsed) {
            console.log(`[JD Enhancer] Success via ${result.modelUsed}`);

            // Fallback to hints if extraction failed/null
            if (!parsed.title && titleHint) parsed.title = titleHint;
            if (!parsed.company && companyHint) parsed.company = companyHint;

            return parsed;
        }
    }

    console.warn(`[JD Enhancer] AI enhancement failed: ${result.error || "Parsing error"}. Returning basic structure.`);

    // Fallback: Return basic structure wrapping the raw text
    return {
        title: titleHint || "Unknown Role",
        company: companyHint || "Unknown Company",
        summary: rawJd.slice(0, 300) + "...",
        responsibilities: [],
        requiredSkills: [], // We could allow a regex fallback here if needed
        preferredSkills: [],
        qualifications: [],
        formattedContent: rawJd
    };
}

function parseAIResponse(response: string): EnhancedJD | null {
    try {
        let cleaned = response.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

        const parsed = JSON.parse(cleaned.trim());

        // Basic validation
        if (typeof parsed !== 'object' || !parsed) return null;

        return {
            title: parsed.title || "",
            company: parsed.company || "",
            summary: parsed.summary || "",
            responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
            requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
            preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
            qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
            salaryRange: parsed.salaryRange,
            location: parsed.location
        };
    } catch (e) {
        console.error("[JD Enhancer] JSON Parse Error:", e);
        return null;
    }
}
