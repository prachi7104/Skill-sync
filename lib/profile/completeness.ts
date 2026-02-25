/**
 * Profile completeness calculation.
 * 
 * Returns:
 *   - score: 0-100 integer
 *   - isGated: true if score < 70 (cannot access placement features)
 *   - isBlocked: true if critical fields missing (sap_id/roll_no/resume)
 *   - missing: array of human-readable missing field descriptions
 *   - blocked: array of critical fields blocking ALL access (sap_id, roll_no, resume)
 */

export interface CompletenessResult {
    score: number;
    isGated: boolean;        // true if < 70%
    isBlocked: boolean;      // true if critical fields missing (sap_id/roll_no/resume)
    missing: string[];       // What's missing (for UI hints)
    blocked: string[];       // Critical blocks (for hard gate message)
}

interface ProfileInput {
    sapId?: string | null;
    rollNo?: string | null;
    phone?: string | null;
    linkedin?: string | null;
    cgpa?: number | null;
    branch?: string | null;
    batchYear?: number | null;
    skills?: unknown[] | null;
    projects?: unknown[] | null;
    workExperience?: unknown[] | null;
    certifications?: unknown[] | null;
    codingProfiles?: unknown[] | null;
    resumeUrl?: string | null;
    name?: string | null;
    email?: string | null;
}

export function computeCompleteness(profile: ProfileInput): CompletenessResult {
    const missing: string[] = [];
    const blocked: string[] = [];
    let score = 0;

    // ── CRITICAL BLOCKS (must have all three to use ANY placement feature) ──────

    if (!profile.sapId?.trim()) {
        blocked.push("SAP ID is required");
    }

    if (!profile.rollNo?.trim()) {
        blocked.push("Roll Number is required");
    }

    if (!profile.resumeUrl) {
        blocked.push("Resume upload is required");
    }

    // ── SCORED FIELDS ──────────────────────────────────────────────────────────

    if (profile.cgpa != null && profile.cgpa > 0) {
        score += 15;
    } else {
        missing.push("Add your CGPA (15 pts)");
    }

    if (profile.branch?.trim()) {
        score += 10;
    } else {
        missing.push("Add your branch/department (10 pts)");
    }

    if (profile.batchYear && profile.batchYear > 2000) {
        score += 10;
    } else {
        missing.push("Add your graduation year (10 pts)");
    }

    const skills = profile.skills as unknown[] | null;
    if (skills && skills.length > 0) {
        score += 20;
    } else {
        missing.push("Add at least one skill (20 pts)");
    }

    const projects = profile.projects as unknown[] | null;
    if (projects && projects.length > 0) {
        score += 15;
    } else {
        missing.push("Add at least one project (15 pts)");
    }

    if (profile.phone?.trim()) {
        score += 5;
    } else {
        missing.push("Add your phone number (5 pts)");
    }

    if (profile.linkedin?.trim()) {
        score += 5;
    } else {
        missing.push("Add your LinkedIn URL (5 pts)");
    }

    const workExp = profile.workExperience as unknown[] | null;
    if (workExp && workExp.length > 0) {
        score += 10;
    } else {
        missing.push("Add internship/work experience (10 pts)");
    }

    const coding = profile.codingProfiles as unknown[] | null;
    if (coding && coding.length > 0) {
        score += 5;
    } else {
        missing.push("Add coding profiles (LeetCode etc.) (5 pts)");
    }

    const certs = profile.certifications as unknown[] | null;
    if (certs && certs.length > 0) {
        score += 5;
    } else {
        missing.push("Add certifications (5 pts)");
    }

    const isBlocked = blocked.length > 0;
    const isGated = score < 70;

    return {
        score,
        isGated: isBlocked || isGated,
        isBlocked,
        missing: missing.slice(0, 5), // Top 5 suggestions
        blocked,
    };
}
