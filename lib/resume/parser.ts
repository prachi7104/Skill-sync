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

    const sections: Record<string, string[]> = {
        skills: [],
        projects: [],
        workExperience: [],
        education: [],
    };

    let currentSection = "summary";

    const sectionKeywords: Record<string, string> = {
        skills: "skills",
        "technical skills": "skills",
        "core competencies": "skills",
        projects: "projects",
        "personal projects": "projects",
        "academic projects": "projects",
        experience: "workExperience",
        "work experience": "workExperience",
        "professional experience": "workExperience",
        internships: "workExperience",
        education: "education",
        qualifications: "education",
        "academic background": "education",
    };

    for (const line of lines) {
        const lowerLine = line.toLowerCase().replace(/:$/, "").trim();
        let isHeader = false;

        for (const [key, sectionName] of Object.entries(sectionKeywords)) {
            if (lowerLine === key) {
                currentSection = sectionName;
                isHeader = true;
                break;
            }
        }

        if (!isHeader && currentSection !== "summary") {
            sections[currentSection].push(line);
        }
    }

    // ── Skill tokenisation ──────────────────────────────────────────────

    const skillsRaw = sections.skills.join(" ");
    const skillsList = skillsRaw
        .split(/[,|•·–\-]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && s.length < 40);

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
