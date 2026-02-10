/**
 * Deterministic resume text parser.
 *
 * Extracts structured data (email, phone, skills, projects, etc.)
 * from raw resume text using regex and section-header heuristics.
 *
 * Pure function — no I/O, no side effects.  Safe to call from
 * both client and server contexts.
 */

export interface ParsedResume {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    skills: string[];
    projects: string[];
    workExperience: string[];
    education: string[];
}

export function parseResumeText(text: string): ParsedResume {
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    // ── Contact extraction ──────────────────────────────────────────────

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex = /(\+?\d[\d -]{8,12}\d)/;
    const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const linkedinMatch = text.match(linkedinRegex);

    // ── Section detection ───────────────────────────────────────────────
    // Section keywords mapped to canonical section names.
    // Order matters: longer/more-specific keywords first to avoid partial matches.

    const sectionKeywords: [string, string][] = [
        // Skills
        ["technical skills", "skills"],
        ["core competencies", "skills"],
        ["tools & technologies", "skills"],
        ["tools and technologies", "skills"],
        ["key skills", "skills"],
        ["skills", "skills"],

        // Projects
        ["personal projects", "projects"],
        ["academic projects", "projects"],
        ["key projects", "projects"],
        ["projects", "projects"],

        // Work Experience
        ["professional experience", "workExperience"],
        ["work experience", "workExperience"],
        ["internships", "workExperience"],
        ["internship", "workExperience"],
        ["experience", "workExperience"],

        // Education
        ["academic background", "education"],
        ["qualifications", "education"],
        ["education", "education"],

        // Certifications (fold into education for now)
        ["certifications", "education"],
        ["courses", "education"],

        // Sections to skip (reset to summary)
        ["summary", "summary"],
        ["objective", "summary"],
        ["about me", "summary"],
        ["achievements", "achievements"],
        ["awards", "achievements"],
        ["extracurricular", "extracurricular"],
        ["hobbies", "extracurricular"],
        ["interests", "extracurricular"],
        ["languages", "extracurricular"],
        ["references", "references"],
        ["declaration", "references"],
    ];

    const sections: Record<string, string[]> = {
        skills: [],
        projects: [],
        workExperience: [],
        education: [],
    };

    let currentSection = "summary";

    for (const line of lines) {
        // Normalize: lowercase, strip trailing colon/dashes, collapse whitespace
        const lowerLine = line
            .toLowerCase()
            .replace(/[:–—\-]+$/, "")
            .replace(/\s+/g, " ")
            .trim();

        let isHeader = false;
        let remainder = "";

        for (const [keyword, sectionName] of sectionKeywords) {
            // Match if the line starts with or exactly equals the keyword
            if (lowerLine === keyword || lowerLine.startsWith(keyword + " ") || lowerLine.startsWith(keyword + ":")) {
                currentSection = sectionName;
                isHeader = true;

                // Capture content after the header keyword on the same line
                // e.g. "Technical Skills Languages: Python, JS" → "Languages: Python, JS"
                const afterKeyword = line.substring(keyword.length).replace(/^[\s:–—\-]+/, "").trim();
                if (afterKeyword.length > 2) {
                    remainder = afterKeyword;
                }
                break;
            }
        }

        // Push remainder from merged header+content lines
        if (isHeader && remainder && sections[currentSection]) {
            sections[currentSection].push(remainder);
        }

        // Push non-header lines into the current section
        if (!isHeader && currentSection !== "summary" && sections[currentSection]) {
            sections[currentSection].push(line);
        }
    }

    // ── Skill tokenisation ──────────────────────────────────────────────

    const skillsRaw = sections.skills.join(" ");
    const skillsList = skillsRaw
        .split(/[,|•·;]/)
        .map((s) => s.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "").trim())
        .filter((s) => s.length > 1 && s.length < 50);

    return {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedinMatch ? "https://" + linkedinMatch[0] : null,
        skills: skillsList,
        projects: sections.projects.slice(0, 10),
        workExperience: sections.workExperience,
        education: sections.education,
    };
}

