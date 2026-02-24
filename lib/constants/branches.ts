export const UPES_BRANCHES = [
    { value: "CSE", label: "Computer Science & Engineering" },
    { value: "CSE-AIML", label: "CSE with AI & Machine Learning" },
    { value: "CSE-DS", label: "CSE with Data Science" },
    { value: "CSE-CCVT", label: "CSE with Cloud Computing & Virtualization" },
    { value: "CSE-Cyber", label: "CSE with Cyber Security" },
    { value: "CSE-Blockchain", label: "CSE with Blockchain" },
    { value: "CSE-Fullstack", label: "CSE with Full Stack Development" },
    { value: "CSE-IoT", label: "CSE with Internet of Things" },
    { value: "IT", label: "Information Technology" },
    { value: "ECE", label: "Electronics & Communication Engineering" },
    { value: "EEE", label: "Electrical & Electronics Engineering" },
    { value: "MCA", label: "Master of Computer Applications" },
] as const;

export type UPESBranch = typeof UPES_BRANCHES[number]["value"];
