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
    "CSE-GG",
] as const;

export const BRANCH_NORMALIZE_MAP: Record<string, string> = {
    "aiml": "CSE-AIML",
    "data science": "CSE-DS",
    "ccvt": "CSE-CCVT",
    "devops": "CSE-CCVT",
    "full stack": "CSE-Fullstack",
    "fullstack": "CSE-Fullstack",
    "iot": "CSE-IoT",
    "csf": "CSE-Cyber",
    "bigdata": "CSE-DS",
    "gg": "CSE-GG",
};

export function normalizeBranch(branch: string): string {
    return BRANCH_NORMALIZE_MAP[branch.toLowerCase().trim()] ?? branch;
}

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
    { value: "CSE-AIML", label: "AIML" },
    { value: "CSE-DS", label: "Data Science" },
    { value: "CSE-CCVT", label: "CCVT" },
    { value: "CSE-Cyber", label: "Cyber Security (CSF)" },
    { value: "CSE-Blockchain", label: "Blockchain" },
    { value: "CSE-Fullstack", label: "Full Stack" },
    { value: "CSE-IoT", label: "IoT" },
    { value: "CSE-GG", label: "GG" },
    // Other departments
    { value: "IT", label: "IT" },
    { value: "ECE", label: "ECE" },
    { value: "EEE", label: "EEE" },
    { value: "MCA", label: "MCA" },
] as const;

// Kept for backward compatibility (existing drives may have "CSE")
export const CSE_GROUP_LABEL = "All CSE Branches";

export type UPESBranch = typeof UPES_BRANCHES[number]["value"];
