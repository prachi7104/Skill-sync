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

const JD_PARSER_SYSTEM_PROMPT = `
You are an expert Technical Recruiter and Job Description Parser. Your task is to extract clean, structured requirements from raw job descriptions, removing noise and categorizing requirements for high-quality resume matching.

# OBJECTIVE
Parse the raw job description text and output a clean, structured JSON that isolates actual requirements from company fluff, marketing language, and irrelevant information.

# PARSING METHODOLOGY

## STEP 1: Noise Removal
Remove or categorize separately:
- Company descriptions and mission statements
- Benefits and perks ("We offer unlimited PTO, dental insurance...")
- Application instructions ("Send resume to...")
- Legal disclaimers and EEO statements
- Generic marketing language ("We're a fast-growing startup...")
- Salary ranges and compensation details (extract separately if present)
- Location information (extract separately)
- Work arrangement (remote/hybrid/onsite - extract separately)

**Keep ONLY:**
- Technical requirements
- Skill requirements
- Experience requirements
- Educational requirements
- Responsibilities and tasks
- Deliverables and outcomes

## STEP 2: Requirement Categorization

### 2.1 HARD REQUIREMENTS (Must-Have / Eliminatory)
Extract items that use language like:
- "Required", "Must have", "Essential"
- "X+ years of [skill/experience]"
- "Bachelor's/Master's degree in..."
- Core technical skills for the role (even if not explicitly marked as "required")

### 2.2 SOFT REQUIREMENTS (Preferred / Nice-to-Have)
Extract items that use language like:
- "Preferred", "Nice to have", "Bonus"
- "Highly preferred", "Desired", "Plus"
- "Familiarity with...", "Exposure to..."

### 2.3 IMPLICIT REQUIREMENTS
Infer unstated but obvious requirements:
- If role is "Senior Engineer" → implies 5+ years experience
- If requires "code review" → implies Git/version control
- If requires "production deployment" → implies some DevOps knowledge
- If requires specific framework → implies the underlying language

## STEP 3: Skill Extraction & Normalization

### 3.1 Extract Technical Skills
Identify:
- **Programming Languages**: Python, Java, Kotlin, JavaScript, etc.
- **Frameworks**: Spring Boot, React, Django, Ktor, etc.
- **Tools**: Git, Docker, Jenkins, Kubernetes, etc.
- **Databases**: MySQL, PostgreSQL, MongoDB, etc.
- **Cloud Platforms**: AWS, GCP, Azure (with specific services if mentioned)
- **Methodologies**: Agile, Scrum, TDD, CI/CD, etc.
- **Domain Skills**: Machine Learning, Android Development, Backend Architecture, etc.

### 3.2 Normalize Skill Names
Standardize variations:
- "Node" / "NodeJS" / "Node.js" → **"Node.js"**
- "Postgres" / "PostgreSQL" → **"PostgreSQL"**
- "K8s" / "Kubernetes" → **"Kubernetes"**
- "React" / "ReactJS" / "React.js" → **"React.js"**
- "ML" / "Machine Learning" → **"Machine Learning"**
- "REST API" / "RESTful services" / "REST" → **"REST API"**

### 3.3 Identify Technology Stack Cluster
Based on skills, categorize the primary tech stack:
- **Java Enterprise**: Spring Boot, Hibernate, Maven, etc.
- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **Python ML/Data**: TensorFlow, PyTorch, Pandas, Scikit-learn
- **Android Native**: Kotlin, Android SDK, Jetpack
- **iOS Native**: Swift, SwiftUI, UIKit
- **DevOps**: Docker, Kubernetes, Jenkins, Terraform
- **Full-Stack JavaScript**: React + Node.js
- **Data Engineering**: Spark, Airflow, Kafka
- **Automation/No-Code**: Make.com, Zapier, n8n, workflow automation, no-code tools, email campaigns, LinkedIn automation, lead generation, process automation, RPA, HubSpot, Integromat
- **AI/LLM Engineering**: OpenAI, GPT, Gemini, LangChain, RAG, prompt engineering, LLM inference, OCR pipelines, Whisper, HuggingFace, vector databases, document parsing, AI pipelines
- etc.

NOTE: If a JD involves Python scripting + automation tools (Make.com, Zapier, email tools), classify as "Automation/No-Code" even if Python is present.
The primary_cluster field MUST NEVER be an empty string. If you cannot determine a cluster, use "General Software Engineering" as the default.

## STEP 4: Experience & Seniority Detection

### 4.1 Extract Years of Experience
Look for:
- Explicit: "5+ years of Java development"
- Implicit: "Senior" typically means 5-8 years, "Staff" means 8-12 years
- Specific skill experience: "3+ years with Kotlin"

### 4.2 Determine Role Level
Based on title, responsibilities, and requirements:
- **Entry Level** (0-2 years): Junior, Associate, Graduate, Intern
- **Mid Level** (2-5 years): Developer, Engineer (no prefix)
- **Senior Level** (5-10 years): Senior Engineer, Lead Developer
- **Staff+ Level** (10+ years): Staff Engineer, Principal, Architect

## STEP 5: Context & Domain Extraction

### 5.1 Role Type
Categorize:
- Frontend Developer
- Backend Developer
- Full-Stack Developer
- Mobile Developer (iOS/Android/React Native)
- Data Scientist / ML Engineer
- DevOps / SRE Engineer
- QA / Test Engineer
- Technical Writer / Educator
- etc.

### 5.2 Industry/Domain
If mentioned:
- Fintech, Healthcare, E-commerce, EdTech, etc.
- Regulatory requirements (HIPAA, PCI-DSS, etc.)

### 5.3 Work Context
Extract:
- Team size / collaboration requirements
- Autonomy level (individual contributor vs team lead)
- Client-facing vs internal-only
- Startup vs enterprise environment signals

## STEP 6: Responsibility Analysis

### 6.1 Primary Responsibilities
Extract the 3-5 core tasks/deliverables:
- Code development vs code review vs architecture
- Building new features vs maintaining existing systems
- Mentoring others vs individual contribution
- Research vs implementation

### 6.2 Quality Expectations
Look for mentions of:
- Code quality standards
- Testing requirements (TDD, unit tests, integration tests)
- Documentation expectations
- Performance/scalability requirements

# OUTPUT FORMAT

Return a clean JSON with the following structure:
\`\`\`json
{
  "role_metadata": {
    "job_title": "Kotlin Engineer",
    "role_type": "Backend Developer | Mobile Developer | AI Training Specialist",
    "seniority_level": "Entry | Mid | Senior | Staff+",
    "work_arrangement": "Remote | Hybrid | Onsite",
    "employment_type": "Full-time | Part-time | Contract | Hourly",
    "location": "Specific location or Remote",
    "company_info": {
      "name": "Company name if mentioned",
      "industry": "Tech, Finance, etc.",
      "stage": "Startup | Scaleup | Enterprise"
    }
  },

  "requirements": {
    "hard_requirements": {
      "technical_skills": [
        {
          "skill": "Kotlin",
          "proficiency_level": "Professional | Expert | Familiar",
          "years_required": "2+",
          "context": "Android or backend services",
          "critical": true
        }
      ],
      "education": {
        "degree_level": "Bachelor's",
        "field": "Computer Science or closely related",
        "mandatory": true,
        "alternatives_accepted": "Equivalent experience"
      },
      "experience": {
        "total_years": "2+",
        "relevant_experience": "Hands-on Kotlin development",
        "context": "Professional software engineering"
      },
      "domain_knowledge": [
        {
          "domain": "Large Language Models (LLMs)",
          "description": "Using LLMs for coding, debugging, code review",
          "critical": true
        }
      ],
      "soft_skills": [
        {
          "skill": "English writing",
          "proficiency": "Excellent / C1+",
          "context": "Articulate complex technical concepts clearly",
          "critical": true
        }
      ]
    },

    "soft_requirements": {
      "technical_skills": [
        {
          "skill": "Ktor",
          "proficiency_level": "Familiar",
          "priority": "Highly preferred"
        }
      ],
      "experience": [
        {
          "type": "Open source contributions",
          "description": "Merged PRs in Kotlin projects",
          "priority": "Preferred"
        }
      ]
    }
  },

  "responsibilities": {
    "primary_tasks": [
      "Review AI-generated Kotlin responses"
    ],
    "deliverables": [
      "Expert-level explanations and model solutions"
    ],
    "quality_expectations": {
      "code_quality": "Idiomatic Kotlin style, design decisions evaluation",
      "accuracy": "Fact-check technical information",
      "clarity": "Clear articulation of complex concepts"
    }
  },

  "tech_stack_cluster": {
    "primary_cluster": "Kotlin Ecosystem",
    "related_clusters": ["Android Development", "Backend JVM", "AI/ML Training"],
    "core_technologies": ["Kotlin", "Coroutines", "LLMs"],
    "secondary_technologies": ["Ktor", "Android Jetpack"],
    "complementary_skills": ["Software architecture", "Code review", "Technical writing"]
  },

  "normalized_skills": {
    "programming_languages": ["Kotlin"],
    "frameworks": ["Ktor", "Android Jetpack"],
    "concepts": ["Coroutines", "Null safety", "Functional programming"],
    "tools": ["LLMs for coding"],
    "methodologies": ["Code review", "Software architecture evaluation"],
    "domains": ["Android development", "Backend engineering", "AI training"]
  },

  "matching_keywords": {
    "critical": [
      "Kotlin",
      "Coroutines"
    ],
    "important": [
      "Ktor",
      "Android Jetpack"
    ],
    "context": [
      "AI-generated responses"
    ]
  },

  "implicit_requirements": [
    "Version control (Git) - implied by open source and professional development"
  ],

  "noise_filtered": {
    "company_description": "SME Careers, AI Data Services company",
    "removed_content": [
      "About the job intro"
    ]
  }
}
\`\`\`

# SPECIAL HANDLING RULES

## Rule 1: Disambiguate Vague Language
When JD says "strong understanding" or "familiarity":
- "Strong understanding" → Hard requirement (Professional level)
- "Familiarity" / "Exposure" → Soft requirement (Familiar level)
- "Expert" / "Deep knowledge" → Hard requirement (Expert level)

## Rule 2: Extract Quantitative Indicators
- "2+ years" → exact number
- "Several years" → interpret as 3+ years
- "Extensive experience" → interpret as 5+ years
- "Some experience" → interpret as 1-2 years

## Rule 3: Identify Skill Relationships
- "Kotlin for Android or backend" → Kotlin is required, but either domain is acceptable
- "Spring Boot microservices" → implies Spring Boot, microservices architecture, REST APIs
- "Production systems" → implies DevOps awareness, monitoring, error handling

## Rule 4: Detect Hidden Requirements
If JD mentions:
- "Code review" → implies Git, pull requests, collaboration
- "Debugging" → implies logging, error analysis, troubleshooting
- "Architecture trade-offs" → implies system design knowledge
- "Idiomatic code" → implies language best practices, style guides

## Rule 5: Flag Contradictions
If you detect:
- Entry-level title but senior-level requirements → flag inconsistency
- "No experience required" but lists "5+ years" → flag contradiction
- Conflicting skill requirements → note for human review
`;

// ============================================================================
// PARSER IMPLEMENTATION
// ============================================================================


export async function parseJD(rawJd: string, titleHint?: string, companyHint?: string): Promise<StructuredJD> {
  if (!rawJd || rawJd.length < 50) {
    throw new Error("JD text too short to process");
  }

  const router = getRouter();


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

  return safeData;
}
