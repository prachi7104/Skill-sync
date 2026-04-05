// All CSE specializations — selecting "CSE" includes all of these
export const CSE_VARIANTS = [
    "CSE",
    "AIML",
    "Data Science",
    "CCVT",
    "CSF",
    "Blockchain",
    "Full Stack",
    "IoT",
    "GG",
] as const;

// Keep legacy aliases so older CSE-* values still normalize to short names.
export const BRANCH_NORMALIZE_MAP: Record<string, string> = {
    "cse-aiml": "AIML",
    "cse-ds": "Data Science",
    "cse-ccvt": "CCVT",
    "cse-cyber": "CSF",
    "cse-blockchain": "Blockchain",
    "cse-fullstack": "Full Stack",
    "cse-iot": "IoT",
    "cse-gg": "GG",
    "aiml": "AIML",
    "data science": "Data Science",
    "ccvt": "CCVT",
    "devops": "CCVT",
    "full stack": "Full Stack",
    "fullstack": "Full Stack",
    "iot": "IoT",
    "csf": "CSF",
    "bigdata": "Data Science",
    "gg": "GG",
};

export function normalizeBranch(branch: string): string {
    return BRANCH_NORMALIZE_MAP[branch.toLowerCase().trim()] ?? branch;
}

/**
 * Expands a list of eligible branches to include all CSE sub-branches.
 * If "CSE" is in the list -> also includes AIML, Data Science, etc.
 * Used in drive eligibility checks and ranking filters.
 */
export function expandBranches(branches: string[]): string[] {
    const expanded = new Set(branches.map((branch) => normalizeBranch(branch)));
    if (expanded.has("CSE")) {
        CSE_VARIANTS.forEach((v) => expanded.add(v));
    }
    return Array.from(expanded);
}

export const UPES_BRANCHES = [
    { value: "AIML", label: "AIML" },
    { value: "Data Science", label: "Data Science" },
    { value: "CCVT", label: "CCVT" },
    { value: "CSF", label: "Cyber Security (CSF)" },
    { value: "Blockchain", label: "Blockchain" },
    { value: "Full Stack", label: "Full Stack" },
    { value: "IoT", label: "IoT" },
    { value: "GG", label: "GG" },
    { value: "IT", label: "IT" },
    { value: "ECE", label: "ECE" },
    { value: "EEE", label: "EEE" },
    { value: "MCA", label: "MCA" },
] as const;

// Kept for backward compatibility (existing drives may have "CSE")
export const CSE_GROUP_LABEL = "All CSE Branches";

export type UPESBranch = typeof UPES_BRANCHES[number]["value"];
