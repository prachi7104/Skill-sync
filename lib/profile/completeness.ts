
import type { Skill, Project, WorkExperience, Certification, CodingProfile } from "@/lib/db/schema";

interface StudentForCompleteness {
    name?: string | null;
    email?: string | null;
    skills?: Skill[] | null;
    projects?: Project[] | null;
    workExperience?: WorkExperience[] | null;
    certifications?: Certification[] | null;
    codingProfiles?: CodingProfile[] | null;
    branch?: string | null;
    batchYear?: number | null;
}

interface CompletenessResult {
    score: number;
    breakdown: Record<string, number>;
    missing: string[];
}

export function computeCompleteness(student: StudentForCompleteness): CompletenessResult {
    let score = 0;
    const breakdown: Record<string, number> = {};
    const missing: string[] = [];

    // 1. Core Info (20)
    // Name and Email are usually guaranteed by auth/schema, but we check conceptually
    let coreScore = 0;
    if (student.name && student.email) coreScore = 20; // Assuming basic info is present
    score += coreScore;
    breakdown.core = coreScore;

    // 2. Skills (20)
    // >= 5 skills -> full (20)
    // 1-4 -> 4pts each? No, prompt said "1-4 -> partial". Let's do 4pts per skill up to 5.
    const skillCount = (student.skills as Skill[])?.length || 0;
    let skillScore = 0;
    if (skillCount >= 5) {
        skillScore = 20;
    } else {
        skillScore = skillCount * 4;
        missing.push(`Add ${5 - skillCount} more skill(s)`);
    }
    score += skillScore;
    breakdown.skills = skillScore;

    // 3. Projects (20)
    // >= 2 projects -> full (20)
    // 1 -> 10pts
    const projectCount = (student.projects as Project[])?.length || 0;
    let projectScore = 0;
    if (projectCount >= 2) {
        projectScore = 20;
    } else {
        projectScore = projectCount * 10;
        missing.push(`Add ${2 - projectCount} more project(s)`);
    }
    score += projectScore;
    breakdown.projects = projectScore;

    // 4. Work Experience (15)
    // >= 1 entry -> full
    const workCount = (student.workExperience as WorkExperience[])?.length || 0;
    let workScore = 0;
    if (workCount >= 1) {
        workScore = 15;
    } else {
        // No partial credit as per requirement implied "1 -> full"
        missing.push("Add at least one internship or work experience");
    }
    score += workScore;
    breakdown.workExperience = workScore;

    // 5. Education (10)
    // Basic education present (branch, batchYear)
    let eduScore = 0;
    if (student.branch && student.batchYear) {
        eduScore = 10;
    } else {
        missing.push("Complete academic details (Branch & Batch)");
    }
    score += eduScore;
    breakdown.education = eduScore;

    // 6. Certifications (10)
    // >= 1 -> full
    const certCount = (student.certifications as Certification[])?.length || 0;
    let certScore = 0;
    if (certCount >= 1) {
        certScore = 10;
    } else {
        missing.push("Add at least one certification");
    }
    score += certScore;
    breakdown.certifications = certScore;

    // 7. Coding Profiles (5)
    // >= 1 -> full
    const cpCount = (student.codingProfiles as CodingProfile[])?.length || 0;
    let cpScore = 0;
    if (cpCount >= 1) {
        cpScore = 5;
    } else {
        missing.push("Link at least one coding profile");
    }
    score += cpScore;
    breakdown.codingProfiles = cpScore;

    return {
        score: Math.min(100, score), // Cap at 100 just in case
        breakdown,
        missing
    };
}
