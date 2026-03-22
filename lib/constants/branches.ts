// All CSE specializations — selecting "CSE" includes all of these
export const CSE_VARIANTS = [
    "CSE",
    "CSE-AIML",
    "CSE-DS",
    "CSE-CCVT",
    "CSE-Cyber",
    "CSE-Blockchain",
    "CSE-Fullstack",
    "CSE-IoT",
] as const;

/**
 * Expands a list of eligible branches to include all sub-branches.
 * If "CSE" is in the list -> also includes CSE-AIML, CSE-DS, etc.
 * Used in drive eligibility checks and ranking filters.
 */
export function expandBranches(branches: string[]): string[] {
    const expanded = new Set(branches);
    if (expanded.has("CSE")) {
        CSE_VARIANTS.forEach((v) => expanded.add(v));
    }
    return Array.from(expanded);
}

export const UPES_BRANCHES = [
    // All CSE Specializations
    { value: "CSE-AIML", label: "CSE — AI & Machine Learning" },
    { value: "CSE-DS", label: "CSE — Data Science" },
    { value: "CSE-CCVT", label: "CSE — Cloud Computing" },
    { value: "CSE-Cyber", label: "CSE — Cyber Security" },
    { value: "CSE-Blockchain", label: "CSE — Blockchain" },
    { value: "CSE-Fullstack", label: "CSE — Full Stack Development" },
    { value: "CSE-IoT", label: "CSE — Internet of Things" },
    // Other departments
    { value: "IT", label: "Information Technology" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "EEE", label: "Electrical & Electronics" },
    { value: "MCA", label: "Master of Computer Applications" },
] as const;

// Kept for backward compatibility (existing drives may have "CSE")
export const CSE_GROUP_LABEL = "All CSE Branches";

export type UPESBranch = typeof UPES_BRANCHES[number]["value"];
