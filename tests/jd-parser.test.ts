import { describe, it, expect } from "vitest";

// Inline the validateAndFillDefaults logic for testing
function validateAndFillDefaults(data: any, titleHint?: string, companyHint?: string) {
  const safeData = { ...data };
  if (!safeData.role_metadata) {
    safeData.role_metadata = {
      job_title: titleHint || "Unknown Role",
      company_info: { name: companyHint || "Unknown Company", industry: "Tech", stage: "Unknown" },
      role_type: "Unknown",
      seniority_level: "Entry",
      work_arrangement: "Unknown",
      employment_type: "Full-time",
      location: "Unknown"
    };
  }
  if (!safeData.requirements) {
    safeData.requirements = {
      hard_requirements: { technical_skills: [], education: { degree_level: "Unknown", field: "Unknown", mandatory: false }, experience: { total_years: "0" } },
      soft_requirements: { technical_skills: [] }
    };
  }
  // Ensure primary_cluster is never empty string
  if (safeData.tech_stack_cluster) {
    if (!safeData.tech_stack_cluster.primary_cluster || safeData.tech_stack_cluster.primary_cluster === "") {
      safeData.tech_stack_cluster.primary_cluster = "General Software Engineering";
    }
  }
  return safeData;
}

describe("validateAndFillDefaults — null safety", () => {
  it("should fill missing role_metadata with titleHint and companyHint", () => {
    const result = validateAndFillDefaults({}, "SDE Intern", "Google");
    expect(result.role_metadata.job_title).toBe("SDE Intern");
    expect(result.role_metadata.company_info.name).toBe("Google");
  });

  it("should fill missing requirements with empty arrays", () => {
    const result = validateAndFillDefaults({ role_metadata: { job_title: "Test" } });
    expect(result.requirements.hard_requirements.technical_skills).toEqual([]);
    expect(result.requirements.soft_requirements.technical_skills).toEqual([]);
  });

  it("should NOT overwrite existing requirements", () => {
    const data = {
      role_metadata: { job_title: "Intern" },
      requirements: {
        hard_requirements: {
          technical_skills: [{ skill: "Python" }],
          education: { degree_level: "Bachelor's", field: "CS", mandatory: true },
          experience: { total_years: "0" }
        },
        soft_requirements: { technical_skills: [] }
      }
    };
    const result = validateAndFillDefaults(data);
    expect(result.requirements.hard_requirements.technical_skills).toHaveLength(1);
    expect(result.requirements.hard_requirements.technical_skills[0].skill).toBe("Python");
  });
});

describe("validateAndFillDefaults — primary_cluster cannot be empty", () => {
  it("should replace empty primary_cluster with General Software Engineering", () => {
    const data = {
      tech_stack_cluster: { primary_cluster: "", related_clusters: [], core_technologies: [] }
    };
    const result = validateAndFillDefaults(data);
    expect(result.tech_stack_cluster.primary_cluster).toBe("General Software Engineering");
    expect(result.tech_stack_cluster.primary_cluster).not.toBe("");
  });

  it("should replace null primary_cluster with General Software Engineering", () => {
    const data = {
      tech_stack_cluster: { primary_cluster: null, related_clusters: [] }
    };
    const result = validateAndFillDefaults(data);
    expect(result.tech_stack_cluster.primary_cluster).toBe("General Software Engineering");
  });

  it("should preserve a valid primary_cluster", () => {
    const data = {
      tech_stack_cluster: { primary_cluster: "Automation/No-Code", related_clusters: [] }
    };
    const result = validateAndFillDefaults(data);
    expect(result.tech_stack_cluster.primary_cluster).toBe("Automation/No-Code");
  });
});

describe("Cluster detection — stack alignment scoring", () => {
  // Inline calculateStackAlignment for testing
  const RELATED_CLUSTERS: Record<string, string[]> = {
    "Automation/No-Code": ["Python Web", "MERN Stack", "DevOps/SRE"],
    "AI/LLM Engineering": ["Python ML/AI", "Python Web", "MERN Stack"],
    "MERN Stack": ["Python Web", "Java Enterprise", "AI/LLM Engineering"],
    "Python ML/AI": ["Research/Academic ML", "Data Engineering", "AI/LLM Engineering"],
  };

  function calculateStackAlignment(jdCluster: string, candidatePrimary: string, candidateSecondary?: string): number {
    if (candidatePrimary === jdCluster) return 1.0;
    if (candidateSecondary === jdCluster) return 0.8;
    const related = RELATED_CLUSTERS[jdCluster] || [];
    if (related.includes(candidatePrimary)) return 0.6;
    if (candidateSecondary && related.includes(candidateSecondary)) return 0.5;
    return 0.3;
  }

  it("exact cluster match should return 1.0", () => {
    expect(calculateStackAlignment("MERN Stack", "MERN Stack")).toBe(1.0);
  });

  it("MERN candidate applying to Automation/No-Code role should get 0.6 (related)", () => {
    expect(calculateStackAlignment("Automation/No-Code", "MERN Stack")).toBe(0.6);
  });

  it("MERN candidate applying to AI/LLM Engineering should get 0.6 (related)", () => {
    expect(calculateStackAlignment("AI/LLM Engineering", "MERN Stack")).toBe(0.6);
  });

  it("unrelated cluster should return 0.3", () => {
    expect(calculateStackAlignment("Android Native", "MERN Stack")).toBe(0.3);
  });

  it("empty cluster string should NOT produce NaN or exception", () => {
    const result = calculateStackAlignment("", "MERN Stack");
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
    expect(result).toBe(0.3); // falls through to unrelated default
  });
});
