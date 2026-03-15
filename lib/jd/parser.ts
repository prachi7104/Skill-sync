import { getRouter } from "@/lib/antigravity/instance";


// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JDRoleMetadata {
  job_title: string;
  role_type: string;
  seniority_level: "Entry" | "Mid" | "Senior" | "Staff+" | "Unknown";
  work_arrangement: "Remote" | "Hybrid" | "Onsite" | "Unknown";
  employment_type: "Full-time" | "Part-time" | "Contract" | "Hourly" | "Unknown";
  location: string;
  company_info: {
    name: string;
    industry: string;
    stage: string;
  };
}

export interface JDTechnicalSkill {
  skill: string;
  proficiency_level: "Familiar" | "Professional" | "Expert" | "Unknown";
  years_required?: string;
  context?: string;
  critical?: boolean;
  priority?: "Required" | "Preferred" | "Bonus";
}

export interface JDEducation {
  degree_level: string;
  field: string;
  mandatory: boolean;
  alternatives_accepted?: string;
}

export interface JDExperience {
  total_years: string;
  relevant_experience?: string;
  context?: string;
  type?: string;
  description?: string;
  priority?: string;
}

export interface JDDomainKnowledge {
  domain: string;
  description: string;
  critical?: boolean;
}

export interface JDSoftSkill {
  skill: string;
  proficiency?: string;
  context?: string;
  critical?: boolean;
}

export interface JDRequirements {
  hard_requirements: {
    technical_skills: JDTechnicalSkill[];
    education: JDEducation;
    experience: JDExperience;
    domain_knowledge?: JDDomainKnowledge[];
    soft_skills?: JDSoftSkill[];
  };
  soft_requirements: {
    technical_skills: JDTechnicalSkill[];
    experience?: JDExperience[];
  };
}

export interface JDResponsibilities {
  primary_tasks: string[];
  deliverables?: string[];
  quality_expectations?: {
    code_quality?: string;
    accuracy?: string;
    clarity?: string;
    [key: string]: string | undefined;
  };
}

export interface JDTechStackCluster {
  primary_cluster: string;
  related_clusters: string[];
  core_technologies: string[];
  secondary_technologies: string[];
  complementary_skills: string[];
}

export interface JDNormalizedSkills {
  programming_languages: string[];
  frameworks: string[];
  concepts: string[];
  tools: string[];
  methodologies: string[];
  domains: string[];
}

export interface JDMatchingKeywords {
  critical: string[];
  important: string[];
  context: string[];
}

export interface JDNoiseFiltered {
  company_description: string;
  removed_content: string[];
}

export interface StructuredJD {
  role_metadata: JDRoleMetadata;
  requirements: JDRequirements;
  responsibilities: JDResponsibilities;
  tech_stack_cluster: JDTechStackCluster;
  normalized_skills: JDNormalizedSkills;
  matching_keywords: JDMatchingKeywords;
  implicit_requirements: string[];
  noise_filtered: JDNoiseFiltered;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const JD_PARSER_SYSTEM_PROMPT = `You are a precise job description parser for a university placement system in India. Students are B.Tech/M.Tech undergraduates. Be conservative — only mark skills as required if the JD explicitly says so.

## STACK CLUSTER ASSIGNMENT — pick exactly ONE

- MERN Stack: MongoDB + Express + React + Node.js focused roles
- Python Web: Django / Flask / FastAPI backend roles
- Python ML/AI: scikit-learn, PyTorch, TensorFlow, Pandas — ML model work
- AI/LLM Engineering: LLMs, GPT, Gemini, LangChain, RAG, prompt engineering, LLM APIs
- Data Engineering: Spark, Airflow, Kafka, ETL, data pipelines
- DevOps/SRE: Kubernetes, Docker, Terraform, CI/CD, cloud infrastructure management
- Java Enterprise: Spring Boot, Hibernate, Maven
- Android Native: Kotlin, Android SDK
- iOS Native: Swift, SwiftUI
- Research/Academic ML: PyTorch + conference papers + publications — academic roles
- Cybersecurity: pen testing, SIEM, SOC, OWASP, network security, forensics
- Cloud/Infrastructure: AWS/GCP/Azure architecture, serverless, IaC
- Frontend Development: React/Vue/Angular + HTML/CSS focused roles
- General Software Engineering: mixed or unclear roles

## CRITICAL RULES

1. One primary cluster. Never empty string — use "General Software Engineering" if unclear.
2. Max 5 skills with critical:true. Only skills without which the job cannot be done.
3. Soft skills (English, communication, teamwork) → ONLY in hard_requirements.soft_skills[]. NEVER in technical_skills[].
4. If JD says "primarily React.js" — React.js is required. Vue/Angular mentioned as alternatives are preferred, not required.
5. For Indian internship roles: seniority_level = "Intern". Do not over-read into generic "engineer" title.

## OUTPUT — return ONLY this JSON, no markdown fences

{
  "role_metadata": {
    "job_title": "string",
    "role_type": "Backend Developer | Frontend Developer | Full-Stack Developer | Mobile Developer | ML Engineer | Data Scientist | DevOps Engineer | AI/LLM Engineer | Research Engineer | Cybersecurity Engineer | Cloud Engineer | Other",
    "seniority_level": "Intern | Entry | Mid | Senior | Staff+",
    "work_arrangement": "Remote | Hybrid | Onsite | Unknown",
    "employment_type": "Full-time | Internship | Contract | Unknown",
    "location": "string | null",
    "company_info": {
      "name": "string",
      "industry": "Tech | Finance | Healthcare | EdTech | E-commerce | Research | Other",
      "stage": "Startup | Scaleup | Enterprise | Unknown"
    }
  },
  "requirements": {
    "hard_requirements": {
      "technical_skills": [
        {
          "skill": "normalized skill name",
          "proficiency_level": "Familiar | Professional | Expert",
          "years_required": "string | null",
          "context": "what this skill is used for | null",
          "critical": true
        }
      ],
      "education": {
        "degree_level": "Bachelor's | Master's | PhD | Any",
        "field": "Computer Science | ECE | IT | Any Engineering | null",
        "mandatory": true,
        "alternatives_accepted": "string | null"
      },
      "experience": {
        "total_years": "0",
        "relevant_experience": "string | null",
        "type": "internship | full-time | any | null"
      },
      "domain_knowledge": [],
      "soft_skills": [
        {
          "skill": "English proficiency | communication | etc.",
          "proficiency": "string | null",
          "context": "string | null",
          "critical": true
        }
      ]
    },
    "soft_requirements": {
      "technical_skills": [
        {
          "skill": "normalized skill name",
          "proficiency_level": "Familiar",
          "priority": "Preferred | Nice-to-have"
        }
      ],
      "experience": []
    }
  },
  "responsibilities": {
    "primary_tasks": ["string"],
    "deliverables": [],
    "quality_expectations": {}
  },
  "tech_stack_cluster": {
    "primary_cluster": "one cluster from the list above — NEVER empty string",
    "related_clusters": [],
    "core_technologies": [],
    "secondary_technologies": [],
    "complementary_skills": []
  },
  "normalized_skills": {
    "programming_languages": [],
    "frameworks": [],
    "concepts": [],
    "tools": [],
    "methodologies": [],
    "domains": []
  },
  "matching_keywords": {
    "critical": [],
    "important": [],
    "context": []
  },
  "implicit_requirements": [],
  "noise_filtered": {
    "company_description": "string",
    "removed_content": []
  }
}`;

// ============================================================================
// PARSER IMPLEMENTATION
// ============================================================================


export async function parseJD(rawJd: string, titleHint?: string, companyHint?: string): Promise<StructuredJD> {
  if (!rawJd || rawJd.length < 50) {
    throw new Error("JD text too short to process");
  }

  const router = getRouter();


  // eslint-disable-next-line no-console
  console.log("[JD Parser] Starting advanced JD parsing via Antigravity Router...");

  let prompt = JD_PARSER_SYSTEM_PROMPT + "\n\nRAW JD TEXT:\n" + rawJd;
  if (titleHint || companyHint) {
    prompt += `\n\nCONTEXT HINTS: Title: ${titleHint || "Unknown"}, Company: ${companyHint || "Unknown"}`;
  }

  const result = await router.execute<StructuredJD>(
    "parse_jd_advanced",
    prompt,
    {
      responseFormat: "json",
      temperature: 0.1 // Low temperature for consistent extraction
    }
  );

  if (result.success && result.data) {
    const parsed = typeof result.data === 'string'
      ? parseAIResponse(result.data)
      : result.data as StructuredJD;

    if (parsed) {
      // eslint-disable-next-line no-console
      console.log(`[JD Parser] Success via ${result.modelUsed}`);
      return validateAndFillDefaults(parsed, titleHint, companyHint);
    }
  }

  throw new Error(`JD advanced parsing failed: ${result.error || "Unknown error"}`);
}

function parseAIResponse(response: string): StructuredJD | null {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

    return JSON.parse(cleaned.trim());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[JD Parser] JSON Parse Error:", e);
    return null;
  }
}

function validateAndFillDefaults(data: StructuredJD, titleHint?: string, companyHint?: string): StructuredJD {
  // Ensure basic structure exists even if LLM missed some fields
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
  } else {
    if (!safeData.role_metadata.job_title && titleHint) safeData.role_metadata.job_title = titleHint;
    if (!safeData.role_metadata.company_info) safeData.role_metadata.company_info = { name: companyHint || "Unknown Company", industry: "Tech", stage: "Unknown" };
    else if (!safeData.role_metadata.company_info.name && companyHint) safeData.role_metadata.company_info.name = companyHint;
  }

  if (!safeData.requirements) {
    safeData.requirements = {
      hard_requirements: { technical_skills: [], education: { degree_level: "Unknown", field: "Unknown", mandatory: false }, experience: { total_years: "0" } },
      soft_requirements: { technical_skills: [] }
    };
  }

  // Ensure primary_cluster is never an empty string
  if (safeData.tech_stack_cluster) {
    if (!safeData.tech_stack_cluster.primary_cluster ||
      safeData.tech_stack_cluster.primary_cluster.trim() === "") {
      safeData.tech_stack_cluster.primary_cluster = "General Software Engineering";
    }
  }

  return safeData;
}
