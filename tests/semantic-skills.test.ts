
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Tests for Semantic Skill Extraction Engine
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * These tests verify the core semantic inference engine:
 * 1. Technology → Capability mapping
 * 2. Tech stack bundle expansion
 * 3. Activity pattern matching from project descriptions
 * 4. Hybrid 70/30 semantic+keyword matching
 * 5. Edge cases and false positive prevention
 *
 * NOTE: Functions are inlined to avoid `server-only` import restrictions,
 * following the same pattern as tests/scoring.test.ts.
 */

import { describe, it, expect } from "vitest";

// ============================================================================
// INLINED TYPES (from lib/ats/types.ts, avoiding server-only)
// ============================================================================


interface SemanticSkillEvidence {
    skill: string;
    confidence: number;
    source: string;
    trigger: string;
    inference: string;
    type: "technology_map" | "stack_bundle" | "activity_pattern" | "education";
    strength: "strong" | "moderate" | "weak";
}

interface SemanticMatchResult {
    matched: true;
    confidence: number;
    primary_evidence_type: "semantic" | "keyword" | "both";
    evidence: SemanticSkillEvidence[];
}

interface CapabilityMapping {
    skill: string;
    confidence: number;
    inference: string;
}

interface ActivityPattern {
    pattern: RegExp;
    skill: string;
    confidence: number;
    inference: string;
    strength: "strong" | "moderate" | "weak";
}

// ============================================================================
// INLINED MAPS (subset for testing)
// ============================================================================

const TECHNOLOGY_CAPABILITY_MAP: Record<string, CapabilityMapping[]> = {
    "fastapi": [
        { skill: "Backend Development", confidence: 95, inference: "FastAPI is a backend framework" },
        { skill: "RESTful API design", confidence: 95, inference: "FastAPI is specifically for building REST APIs" },
        { skill: "Python", confidence: 90, inference: "FastAPI requires Python" },
        { skill: "Async programming", confidence: 80, inference: "FastAPI supports async/await natively" },
    ],
    "express": [
        { skill: "Backend Development", confidence: 90, inference: "Express is a backend framework for Node.js" },
        { skill: "RESTful API design", confidence: 85, inference: "Express is commonly used for REST APIs" },
        { skill: "Node.js", confidence: 90, inference: "Express runs on Node.js" },
        { skill: "JavaScript", confidence: 85, inference: "Express is a JavaScript framework" },
    ],
    "react": [
        { skill: "Frontend Development", confidence: 95, inference: "React is a frontend UI library" },
        { skill: "JavaScript", confidence: 85, inference: "React is a JavaScript library" },
        { skill: "Web Development", confidence: 90, inference: "React is a web technology" },
    ],
    "mongodb": [
        { skill: "NoSQL databases", confidence: 100, inference: "MongoDB is a NoSQL document database" },
        { skill: "Database Management", confidence: 85, inference: "MongoDB usage shows database skills" },
    ],
    "docker": [
        { skill: "Containerization", confidence: 100, inference: "Docker is a containerization tool" },
        { skill: "DevOps", confidence: 85, inference: "Docker is a core DevOps technology" },
    ],
    "tensorflow": [
        { skill: "Machine Learning", confidence: 95, inference: "TensorFlow is an ML framework" },
        { skill: "Deep Learning", confidence: 90, inference: "TensorFlow is used for deep learning" },
        { skill: "Python", confidence: 80, inference: "TensorFlow is primarily used with Python" },
    ],
    "postgresql": [
        { skill: "SQL databases", confidence: 100, inference: "PostgreSQL is a SQL database" },
        { skill: "Database Management", confidence: 85, inference: "PostgreSQL usage shows database skills" },
    ],
    "kubernetes": [
        { skill: "Container orchestration", confidence: 100, inference: "Kubernetes orchestrates containers" },
        { skill: "DevOps", confidence: 90, inference: "Kubernetes is a core DevOps technology" },
    ],
    "aws": [
        { skill: "Cloud platforms", confidence: 100, inference: "AWS is a major cloud platform" },
    ],
};

const TECH_STACK_BUNDLES: Record<string, CapabilityMapping[]> = {
    "mern stack": [
        { skill: "Full-stack Development", confidence: 90, inference: "MERN = full-stack" },
        { skill: "Web Development", confidence: 95, inference: "MERN is a web development stack" },
        { skill: "Backend Development", confidence: 85, inference: "Express + Node.js = backend" },
        { skill: "Frontend Development", confidence: 85, inference: "React = frontend" },
        { skill: "NoSQL databases", confidence: 90, inference: "MongoDB = NoSQL" },
        { skill: "JavaScript", confidence: 95, inference: "MERN stack is JavaScript-based" },
        { skill: "RESTful API design", confidence: 80, inference: "Express is commonly used for REST APIs" },
    ],
};

const ACTIVITY_PATTERNS: ActivityPattern[] = [
    { pattern: /\b(?:RMSE|MAE|MSE|accuracy|precision|recall|F1[- ]score|AUC[- ]ROC|confusion matrix)\b/i, skill: "Machine Learning", confidence: 90, inference: "ML metrics indicate ML work", strength: "strong" },
    { pattern: /\b(?:model training|trained model|model accuracy|model performance|model optimization)\b/i, skill: "Machine Learning", confidence: 90, inference: "Model training is ML work", strength: "strong" },
    { pattern: /\bETL\b/i, skill: "Data Engineering", confidence: 90, inference: "ETL is a data engineering process", strength: "strong" },
    { pattern: /\b(?:REST(?:ful)?\s*API|API\s*(?:endpoint|route|backend|development|design|integration))\b/i, skill: "RESTful API design", confidence: 90, inference: "Explicit API development work", strength: "strong" },
    { pattern: /\breduced\b.*\b(?:latency|response time|load time)\b.*\d+\s*%/i, skill: "Performance Optimization", confidence: 90, inference: "Quantified performance improvement", strength: "strong" },
    { pattern: /\b(?:CI\/CD|continuous\s*(?:integration|deployment|delivery))\b/i, skill: "CI/CD", confidence: 95, inference: "CI/CD pipeline work", strength: "strong" },
    { pattern: /\b(?:led\s*(?:a\s*)?team|team\s*lead|managed\s*(?:a\s*)?team|mentored)\b/i, skill: "Leadership", confidence: 85, inference: "Leadership activity described", strength: "strong" },
    { pattern: /\b(?:server[- ]side|backend\s*(?:service|logic|system|development)|API\s*backend)\b/i, skill: "Backend Development", confidence: 90, inference: "Explicit backend work", strength: "strong" },
    { pattern: /\b(?:data pipeline|data ingestion|data warehouse|data lake)\b/i, skill: "Data Engineering", confidence: 90, inference: "Data infrastructure work", strength: "strong" },
];

const SKILL_CATEGORY_MAP: Record<string, string[]> = {
    "backend development": [
        "node.js", "express", "express.js", "fastapi", "django", "flask",
        "spring boot", "spring", "laravel", ".net", "dotnet", "rails",
        "api backend", "server-side", "backend service", "backend"
    ],
    "frontend development": [
        "react", "react.js", "angular", "vue", "vue.js", "svelte",
        "next.js", "nuxt", "gatsby", "html", "css", "sass", "less",
        "tailwind", "bootstrap", "responsive design", "ui development",
        "web-based dashboard", "interactive dashboard", "frontend"
    ],
    "sql databases": [
        "mysql", "postgresql", "postgres", "sql server", "oracle",
        "sqlite", "mariadb", "sql", "relational database"
    ],
    "nosql databases": [
        "mongodb", "redis", "cassandra", "dynamodb", "firebase",
        "couchdb", "document database", "key-value store", "nosql"
    ],
    "cloud platforms": [
        "aws", "gcp", "google cloud", "azure", "heroku", "vercel",
        "digitalocean", "cloud deployment", "cloud-hosted", "cloud run",
        "ec2", "s3", "lambda", "cloud functions", "app engine", "netlify"
    ],
    "machine learning": [
        "tensorflow", "pytorch", "scikit-learn", "sklearn", "xgboost",
        "lightgbm", "neural network", "deep learning", "model training"
    ],
    "devops": [
        "docker", "kubernetes", "jenkins", "terraform", "ansible",
        "ci/cd", "gitlab ci", "github actions", "circleci",
        "deployment pipeline", "infrastructure as code", "monitoring"
    ],
    "containerization": [
        "docker", "container", "containerized", "docker-compose", "podman"
    ],
};

// ============================================================================
// INLINED EXTRACTION & MATCHING (from semantic-skills.ts)
// ============================================================================

interface MinimalResume {
    skills: Array<{ name: string; proficiency?: string }>;
    projects: Array<{ title: string; description?: string; tech_stack?: string[] }>;
    experience: Array<{ role: string; company: string; description?: string; skills_used?: string[] }>;
    education_history: Array<{ institution: string; degree?: string; branch?: string; level?: string }>;
    certifications: Array<{ certification_name?: string; issuer?: string }>;
    research_papers: Array<{ title: string; field?: string; skills_demonstrated?: string[] }>;
    professional_summary?: string;
    soft_skills?: string[];
    implicit_skills: string[];
}

function extractSemanticSkills(resume: MinimalResume): SemanticSkillEvidence[] {
    const evidence: SemanticSkillEvidence[] = [];
    const seen = new Set<string>();

    function addEvidence(e: SemanticSkillEvidence) {
        const key = `${e.skill.toLowerCase()}|${e.source}|${e.trigger.toLowerCase()}`;
        if (!seen.has(key)) {
            seen.add(key);
            evidence.push(e);
        }
    }

    // 1. Skills section
    for (const s of resume.skills) {
        const techKey = s.name.toLowerCase().trim();
        const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
        if (mappings) {
            for (const m of mappings) {
                addEvidence({
                    skill: m.skill, confidence: m.confidence, source: "Skills Section",
                    trigger: s.name, inference: m.inference, type: "technology_map",
                    strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                });
            }
        }
    }

    // 2. Text corpus (projects + experience + summary)
    const allTexts = [
        ...resume.projects.map((p, _i) => ({
            text: `${p.title || ""} ${p.description || ""} ${(p.tech_stack || []).join(" ")}`,
            source: `Project: ${p.title || "Untitled"}`,
        })),
        ...resume.experience.map((e, _i) => ({
            text: `${e.role || ""} ${e.company || ""} ${e.description || ""} ${(e.skills_used || []).join(" ")}`,
            source: `Experience: ${e.role || "Unknown"} at ${e.company || "Unknown"}`,
        })),
    ];
    if (resume.professional_summary) {
        allTexts.push({ text: resume.professional_summary, source: "Professional Summary" });
    }

    for (const { text, source } of allTexts) {
        const lowerText = text.toLowerCase();

        // Tech mentions
        for (const [tech, mappings] of Object.entries(TECHNOLOGY_CAPABILITY_MAP)) {
            const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText)) {
                for (const m of mappings) {
                    addEvidence({
                        skill: m.skill, confidence: m.confidence, source, trigger: tech,
                        inference: m.inference, type: "technology_map",
                        strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                    });
                }
            }
        }

        // Stack bundles
        for (const [stack, mappings] of Object.entries(TECH_STACK_BUNDLES)) {
            const escaped = stack.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText)) {
                for (const m of mappings) {
                    addEvidence({
                        skill: m.skill, confidence: m.confidence, source, trigger: stack,
                        inference: m.inference, type: "stack_bundle",
                        strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                    });
                }
            }
        }

        // Activity patterns
        for (const ap of ACTIVITY_PATTERNS) {
            if (ap.pattern.test(text)) {
                const match = text.match(ap.pattern);
                addEvidence({
                    skill: ap.skill, confidence: ap.confidence, source,
                    trigger: match?.[0] || "pattern match", inference: ap.inference,
                    type: "activity_pattern", strength: ap.strength,
                });
            }
        }
    }

    // 3. Project tech stacks
    for (const project of resume.projects) {
        if (project.tech_stack) {
            for (const tech of project.tech_stack) {
                const techKey = tech.toLowerCase().trim();
                const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
                if (mappings) {
                    for (const m of mappings) {
                        addEvidence({
                            skill: m.skill, confidence: m.confidence,
                            source: `Project: ${project.title || "Untitled"} (tech stack)`,
                            trigger: tech, inference: m.inference, type: "technology_map",
                            strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                        });
                    }
                }
            }
        }
    }

    // 4. Experience skills_used
    for (const exp of resume.experience) {
        if (exp.skills_used) {
            for (const tech of exp.skills_used) {
                const techKey = tech.toLowerCase().trim();
                const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
                if (mappings) {
                    for (const m of mappings) {
                        addEvidence({
                            skill: m.skill, confidence: Math.min(m.confidence + 5, 100),
                            source: `Experience: ${exp.role} at ${exp.company} (skills used)`,
                            trigger: tech, inference: m.inference + " (professional usage)",
                            type: "technology_map", strength: "strong",
                        });
                    }
                }
            }
        }
    }

    return evidence;
}

function matchSkillSemantically(
    jdSkill: string,
    allEvidence: SemanticSkillEvidence[],
): SemanticMatchResult | null {
    const normalizedJdSkill = jdSkill.toLowerCase().trim();

    const directMatches = allEvidence.filter(
        e => e.skill.toLowerCase().trim() === normalizedJdSkill
    );

    const categoryTerms = SKILL_CATEGORY_MAP[normalizedJdSkill] || [];
    const categoryMatches: SemanticSkillEvidence[] = [];

    if (categoryTerms.length > 0) {
        for (const e of allEvidence) {
            const triggerLower = e.trigger.toLowerCase().trim();
            if (categoryTerms.some(term => {
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`\\b${escaped}\\b`, 'i').test(triggerLower) || triggerLower === term;
            })) {
                categoryMatches.push({
                    ...e,
                    skill: jdSkill,
                    inference: `${e.trigger} proves ${jdSkill} (${e.inference})`,
                });
            }
        }
    }

    const allMatches = [...directMatches, ...categoryMatches];

    if (allMatches.length === 0) return null;

    const maxConfidence = Math.max(...allMatches.map(e => e.confidence));
    const uniqueSources = new Set(allMatches.map(e => e.source));
    const corroborationBoost = Math.min((uniqueSources.size - 1) * 3, 10);
    const finalConfidence = Math.min(maxConfidence + corroborationBoost, 100);

    return {
        matched: true,
        confidence: finalConfidence,
        primary_evidence_type: "semantic",
        evidence: allMatches,
    };
}

function combineEvidence(
    semanticResult: SemanticMatchResult | null,
    keywordLevel: number,
): {
    matched: boolean;
    confidence: number;
    primary_evidence_type: "semantic" | "keyword" | "both" | "none";
} {
    const hasKeyword = keywordLevel > 0;
    const hasSemantic = semanticResult !== null;

    if (!hasKeyword && !hasSemantic) {
        return { matched: false, confidence: 0, primary_evidence_type: "none" };
    }

    const keywordConfidence = keywordLevel === 0 ? 0 :
        keywordLevel === 1 ? 60 :
            keywordLevel === 2 ? 75 :
                keywordLevel === 3 ? 90 :
                    100;

    const semanticConfidence = semanticResult?.confidence ?? 0;

    const combined = hasSemantic && hasKeyword
        ? (0.7 * semanticConfidence + 0.3 * keywordConfidence)
        : hasSemantic
            ? semanticConfidence
            : keywordConfidence;

    const primary_evidence_type: "semantic" | "keyword" | "both" =
        hasSemantic && hasKeyword ? "both" :
            hasSemantic ? "semantic" : "keyword";

    return {
        matched: combined >= 40,
        confidence: Math.round(combined),
        primary_evidence_type,
    };
}

// ============================================================================
// HELPER: Create a minimal "resume" for testing
// ============================================================================

function makeResume(overrides: Partial<MinimalResume> = {}): MinimalResume {
    return {
        skills: [],
        projects: [],
        experience: [],
        education_history: [],
        certifications: [],
        research_papers: [],
        soft_skills: [],
        implicit_skills: [],
        ...overrides,
    };
}

// ============================================================================
// TESTS
// ============================================================================

describe("Semantic Skill Extraction Engine", () => {

    // ────────────────────────────────────────────────────────
    // 1. Technology → Capability Mapping
    // ────────────────────────────────────────────────────────
    describe("Technology → Capability Mapping", () => {

        it("FastAPI → Python + Backend Dev + REST APIs + Async", () => {
            const resume = makeResume({
                skills: [{ name: "FastAPI" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Backend Development");
            expect(skills).toContain("RESTful API design");
            expect(skills).toContain("Python");
            expect(skills).toContain("Async programming");
        });

        it("React → Frontend Dev + JavaScript + Web Dev", () => {
            const resume = makeResume({
                skills: [{ name: "React" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Frontend Development");
            expect(skills).toContain("JavaScript");
            expect(skills).toContain("Web Development");
        });

        it("Docker → Containerization + DevOps", () => {
            const resume = makeResume({
                skills: [{ name: "Docker" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Containerization");
            expect(skills).toContain("DevOps");
        });

        it("TensorFlow → ML + Deep Learning + Python", () => {
            const resume = makeResume({
                skills: [{ name: "TensorFlow" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Machine Learning");
            expect(skills).toContain("Deep Learning");
            expect(skills).toContain("Python");
        });

        it("MongoDB → NoSQL databases + Database Management", () => {
            const resume = makeResume({
                skills: [{ name: "MongoDB" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("NoSQL databases");
            expect(skills).toContain("Database Management");
        });

        it("catches techs from project descriptions (not just skills list)", () => {
            const resume = makeResume({
                projects: [{
                    title: "E-Commerce Platform",
                    description: "Built a full e-commerce platform using Express and MongoDB",
                    tech_stack: ["Express", "MongoDB", "React"],
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Backend Development");
            expect(skills).toContain("NoSQL databases");
            expect(skills).toContain("Frontend Development");
        });

        it("catches techs from work experience", () => {
            const resume = makeResume({
                experience: [{
                    role: "Backend Developer",
                    company: "ACME Corp",
                    description: "Developed REST APIs using FastAPI and PostgreSQL",
                    skills_used: ["FastAPI", "PostgreSQL"],
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Backend Development");
            expect(skills).toContain("RESTful API design");
            expect(skills).toContain("SQL databases");
        });
    });

    // ────────────────────────────────────────────────────────
    // 2. Tech Stack Bundle Expansion
    // ────────────────────────────────────────────────────────
    describe("Tech Stack Bundle Expansion", () => {

        it("MERN Stack → 6+ derived skills", () => {
            const resume = makeResume({
                projects: [{
                    title: "Web App",
                    description: "Built using the MERN Stack",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Full-stack Development");
            expect(skills).toContain("Web Development");
            expect(skills).toContain("Backend Development");
            expect(skills).toContain("Frontend Development");
            expect(skills).toContain("NoSQL databases");
            expect(skills).toContain("JavaScript");
            expect(skills.length).toBeGreaterThanOrEqual(6);
        });

        it("MERN Stack evidence has stack_bundle type", () => {
            const resume = makeResume({
                projects: [{
                    title: "Web App",
                    description: "Built using the MERN Stack",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const stackEvidence = evidence.filter(e => e.type === "stack_bundle");

            expect(stackEvidence.length).toBeGreaterThan(0);
            expect(stackEvidence[0].trigger).toBe("mern stack");
        });
    });

    // ────────────────────────────────────────────────────────
    // 3. Activity Pattern Matching
    // ────────────────────────────────────────────────────────
    describe("Activity Pattern Matching", () => {

        it("ML metrics (RMSE) → Machine Learning", () => {
            const resume = makeResume({
                projects: [{
                    title: "House Price Predictor",
                    description: "Reduced RMSE from 920 to 115 using gradient boosting",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const mlEvidence = evidence.filter(e => e.skill === "Machine Learning");

            expect(mlEvidence.length).toBeGreaterThan(0);
            expect(mlEvidence.some(e => e.confidence >= 85)).toBe(true);
        });

        it("'model training' → Machine Learning", () => {
            const resume = makeResume({
                experience: [{
                    role: "Data Scientist",
                    company: "ML Corp",
                    description: "Responsible for model training and validation on production datasets",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const mlEvidence = evidence.filter(e => e.skill === "Machine Learning");

            expect(mlEvidence.length).toBeGreaterThan(0);
        });

        it("ETL → Data Engineering", () => {
            const resume = makeResume({
                projects: [{
                    title: "Data Pipeline",
                    description: "Built an ETL pipeline processing 10M records daily",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const deEvidence = evidence.filter(e => e.skill === "Data Engineering");

            expect(deEvidence.length).toBeGreaterThan(0);
        });

        it("'reduced latency by 40%' → Performance Optimization", () => {
            const resume = makeResume({
                experience: [{
                    role: "Software Engineer",
                    company: "FastCo",
                    description: "Reduced API latency by 40% through query optimization",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const optEvidence = evidence.filter(e => e.skill === "Performance Optimization");

            expect(optEvidence.length).toBeGreaterThan(0);
            expect(optEvidence[0].strength).toBe("strong");
        });

        it("CI/CD pipeline → CI/CD skill", () => {
            const resume = makeResume({
                experience: [{
                    role: "DevOps Engineer",
                    company: "Cloud Inc",
                    description: "Implemented CI/CD pipelines using Jenkins and GitLab CI",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const cicdEvidence = evidence.filter(e => e.skill === "CI/CD");

            expect(cicdEvidence.length).toBeGreaterThan(0);
        });

        it("'led a team' → Leadership", () => {
            const resume = makeResume({
                experience: [{
                    role: "Tech Lead",
                    company: "BigCo",
                    description: "Led a team of 8 engineers building microservices",
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const leaderEvidence = evidence.filter(e => e.skill === "Leadership");

            expect(leaderEvidence.length).toBeGreaterThan(0);
        });
    });

    // ────────────────────────────────────────────────────────
    // 4. Semantic Skill Matching against JD requirements
    // ────────────────────────────────────────────────────────
    describe("Semantic Matching (JD skill ↔ Resume evidence)", () => {

        it("JD: 'Backend Development' matched when resume has FastAPI", () => {
            const resume = makeResume({
                skills: [{ name: "FastAPI" }],
            });

            const evidence = extractSemanticSkills(resume);
            const result = matchSkillSemantically("Backend Development", evidence);

            expect(result).not.toBeNull();
            expect(result!.confidence).toBeGreaterThanOrEqual(85);
        });

        it("JD: 'SQL databases' matched when resume has PostgreSQL", () => {
            const resume = makeResume({
                skills: [{ name: "PostgreSQL" }],
            });

            const evidence = extractSemanticSkills(resume);
            const result = matchSkillSemantically("SQL databases", evidence);

            expect(result).not.toBeNull();
            expect(result!.confidence).toEqual(100);
        });

        it("JD: 'Machine Learning' matched when resume describes model training with TensorFlow", () => {
            const resume = makeResume({
                projects: [{
                    title: "Image Classifier",
                    description: "Built a CNN model for image classification with 95% accuracy",
                    tech_stack: ["TensorFlow", "Python"],
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const result = matchSkillSemantically("Machine Learning", evidence);

            expect(result).not.toBeNull();
            expect(result!.confidence).toBeGreaterThanOrEqual(90);
        });

        it("JD: 'Cloud platforms' matched when resume mentions AWS", () => {
            const resume = makeResume({
                experience: [{
                    role: "SDE",
                    company: "Amazon",
                    description: "Deployed services on AWS EC2 and S3",
                    skills_used: ["AWS"],
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const result = matchSkillSemantically("Cloud platforms", evidence);

            expect(result).not.toBeNull();
            expect(result!.confidence).toEqual(100);
        });

        it("unrelated skill returns null", () => {
            const resume = makeResume({
                skills: [{ name: "React" }],
            });

            const evidence = extractSemanticSkills(resume);
            const result = matchSkillSemantically("Data Engineering", evidence);

            expect(result).toBeNull();
        });

        it("corroboration boost: multiple evidence sources increase confidence", () => {
            const resume = makeResume({
                skills: [{ name: "Docker" }],
                experience: [{
                    role: "DevOps Engineer",
                    company: "Cloud Inc",
                    description: "Containerized applications using Docker",
                    skills_used: ["Docker"],
                }],
            });

            const evidence = extractSemanticSkills(resume);
            const singleSourceResult = matchSkillSemantically("Containerization", (() => {
                const r = makeResume({ skills: [{ name: "Docker" }] });
                return extractSemanticSkills(r);
            })());
            const multiSourceResult = matchSkillSemantically("Containerization", evidence);

            expect(multiSourceResult).not.toBeNull();
            // Multi-source should have higher or equal confidence
            expect(multiSourceResult!.confidence).toBeGreaterThanOrEqual(singleSourceResult!.confidence);
        });
    });

    // ────────────────────────────────────────────────────────
    // 5. Combined Evidence (70/30 weighting)
    // ────────────────────────────────────────────────────────
    describe("Combined Evidence (70% Semantic + 30% Keyword)", () => {

        it("semantic-only match works (no keyword needed)", () => {
            const semanticResult: SemanticMatchResult = {
                matched: true,
                confidence: 95,
                primary_evidence_type: "semantic",
                evidence: [],
            };

            const result = combineEvidence(semanticResult, 0);

            expect(result.matched).toBe(true);
            expect(result.confidence).toBe(95);
            expect(result.primary_evidence_type).toBe("semantic");
        });

        it("keyword-only match works", () => {
            const result = combineEvidence(null, 3); // level 3 = 90% confidence

            expect(result.matched).toBe(true);
            expect(result.confidence).toBe(90);
            expect(result.primary_evidence_type).toBe("keyword");
        });

        it("both semantic + keyword → 70/30 weighting", () => {
            const semanticResult: SemanticMatchResult = {
                matched: true,
                confidence: 80,
                primary_evidence_type: "semantic",
                evidence: [],
            };

            const result = combineEvidence(semanticResult, 3); // 70% of 80 + 30% of 90 = 56 + 27 = 83

            expect(result.matched).toBe(true);
            expect(result.confidence).toBe(83);
            expect(result.primary_evidence_type).toBe("both");
        });

        it("no evidence → not matched", () => {
            const result = combineEvidence(null, 0);

            expect(result.matched).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.primary_evidence_type).toBe("none");
        });

        it("weak semantic evidence below threshold → not matched", () => {
            const semanticResult: SemanticMatchResult = {
                matched: true,
                confidence: 30, // Very weak semantic evidence
                primary_evidence_type: "semantic",
                evidence: [],
            };

            const result = combineEvidence(semanticResult, 0);

            expect(result.matched).toBe(false); // 30 < 40 threshold
            expect(result.confidence).toBe(30);
        });

        it("keyword level conversion: level 1 = 60, level 2 = 75, level 4 = 100", () => {
            expect(combineEvidence(null, 1).confidence).toBe(60);
            expect(combineEvidence(null, 2).confidence).toBe(75);
            expect(combineEvidence(null, 4).confidence).toBe(100);
        });
    });

    // ────────────────────────────────────────────────────────
    // 6. No False Positives
    // ────────────────────────────────────────────────────────
    describe("False Positive Prevention", () => {

        it("Docker alone does NOT claim Kubernetes", () => {
            const resume = makeResume({
                skills: [{ name: "Docker" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).not.toContain("Container orchestration"); // That's Kubernetes-specific
        });

        it("React alone does NOT claim Backend Development", () => {
            const resume = makeResume({
                skills: [{ name: "React" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).not.toContain("Backend Development");
        });

        it("case insensitive matching works", () => {
            const resume = makeResume({
                skills: [{ name: "FASTAPI" }],
            });

            const evidence = extractSemanticSkills(resume);
            const skills = [...new Set(evidence.map(e => e.skill))];

            expect(skills).toContain("Backend Development");
        });
    });

    // ────────────────────────────────────────────────────────
    // 7. End-to-End: Full Pipeline
    // ────────────────────────────────────────────────────────
    describe("End-to-End Pipeline", () => {

        it("realistic backend developer resume matches Backend Development", () => {
            const resume = makeResume({
                skills: [
                    { name: "Python" },
                    { name: "FastAPI" },
                    { name: "PostgreSQL" },
                    { name: "Docker" },
                ],
                projects: [{
                    title: "Inventory Management System",
                    description: "Built RESTful APIs for managing inventory with FastAPI and PostgreSQL. Deployed using Docker.",
                    tech_stack: ["FastAPI", "PostgreSQL", "Docker"],
                }],
                experience: [{
                    role: "Backend Developer",
                    company: "TechCo",
                    description: "Developed server-side APIs serving 50K requests/day. Reduced response time latency by 35%.",
                    skills_used: ["FastAPI", "PostgreSQL", "Docker"],
                }],
            });

            const evidence = extractSemanticSkills(resume);

            // Should strongly match Backend Development
            const backendMatch = matchSkillSemantically("Backend Development", evidence);
            expect(backendMatch).not.toBeNull();
            expect(backendMatch!.confidence).toBeGreaterThanOrEqual(90);

            // Should match SQL databases
            const sqlMatch = matchSkillSemantically("SQL databases", evidence);
            expect(sqlMatch).not.toBeNull();

            // Should match DevOps (via Docker)
            const devopsMatch = matchSkillSemantically("DevOps", evidence);
            expect(devopsMatch).not.toBeNull();

            // Should match Containerization (via Docker)
            const containerMatch = matchSkillSemantically("Containerization", evidence);
            expect(containerMatch).not.toBeNull();

            // Should NOT match Machine Learning
            const mlMatch = matchSkillSemantically("Machine Learning", evidence);
            expect(mlMatch).toBeNull();
        });

        it("data science resume doesn't claim Backend Development", () => {
            const resume = makeResume({
                skills: [
                    { name: "Python" },
                    { name: "TensorFlow" },
                ],
                projects: [{
                    title: "Sentiment Analysis",
                    description: "Built a sentiment analysis model with 92% accuracy using LSTM networks. Achieved F1-score of 0.89.",
                    tech_stack: ["TensorFlow", "Python"],
                }],
            });

            const evidence = extractSemanticSkills(resume);

            // Should match Machine Learning
            const mlMatch = matchSkillSemantically("Machine Learning", evidence);
            expect(mlMatch).not.toBeNull();
            expect(mlMatch!.confidence).toBeGreaterThanOrEqual(90);

            // Should NOT match Backend Development (no backend framework)
            const backendEvidence = evidence.filter(e =>
                e.skill === "Backend Development" &&
                e.type === "technology_map"
            );
            expect(backendEvidence.length).toBe(0);
        });
    });

    // ────────────────────────────────────────────────────────
    // 8. Deduplication
    // ────────────────────────────────────────────────────────
    describe("Deduplication", () => {

        it("same skill from same source and trigger is not duplicated", () => {
            const resume = makeResume({
                skills: [{ name: "Docker" }],
                projects: [{
                    title: "App",
                    description: "Used Docker for containerization",
                    tech_stack: ["Docker"],
                }],
            });

            const evidence = extractSemanticSkills(resume);

            // Docker → Containerization from skills section should appear once
            const skillsSectionContainer = evidence.filter(
                e => e.skill === "Containerization" && e.source === "Skills Section" && e.trigger.toLowerCase() === "docker"
            );
            expect(skillsSectionContainer.length).toBe(1);
        });

        it("same skill from different sources IS kept (corroboration)", () => {
            const resume = makeResume({
                skills: [{ name: "Docker" }],
                projects: [{
                    title: "App",
                    description: "Used Docker for containerization",
                    tech_stack: ["Docker"],
                }],
            });

            const evidence = extractSemanticSkills(resume);

            const containerEvidence = evidence.filter(e => e.skill === "Containerization");
            const sources = new Set(containerEvidence.map(e => e.source));

            // Should appear in at least skills section + project
            expect(sources.size).toBeGreaterThanOrEqual(2);
        });
    });
});
