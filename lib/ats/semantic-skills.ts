
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Semantic Skill Extraction Engine
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Deep, deterministic skill inference from resume context.
 * 
 * Philosophy: If a candidate built production RESTful APIs using FastAPI,
 * they have "RESTful API design" skills even if those exact words never
 * appear in their resume.
 *
 * Approach:  70% Semantic (rules-based inference) + 30% Keyword (exact match)
 *            No LLM calls — pure pattern matching and technology maps.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { EnhancedResume } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface SemanticSkillEvidence {
    /** The inferred capability (e.g. "Backend Development") */
    skill: string;
    /** 0-100 confidence */
    confidence: number;
    /** Where this evidence came from */
    source: string;
    /** The actual text / technology that triggered the inference */
    trigger: string;
    /** Human-readable reasoning */
    inference: string;
    /** Evidence type */
    type: "technology_map" | "stack_bundle" | "activity_pattern" | "education";
    /** How strong is this particular evidence? */
    strength: "strong" | "moderate" | "weak";
}

export interface SemanticMatchResult {
    matched: true;
    confidence: number;
    primary_evidence_type: "semantic" | "keyword" | "both";
    evidence: SemanticSkillEvidence[];
}

// ============================================================================
// TECHNOLOGY → CAPABILITY MAP
// ============================================================================
// Maps specific technologies to the capabilities they prove.
// Each entry: technology → [{ skill, confidence, inference }]

interface CapabilityMapping {
    skill: string;
    confidence: number;
    inference: string;
}

const TECHNOLOGY_CAPABILITY_MAP: Record<string, CapabilityMapping[]> = {
    // ── Backend Frameworks ──
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
    "express.js": [
        { skill: "Backend Development", confidence: 90, inference: "Express.js is a backend framework" },
        { skill: "RESTful API design", confidence: 85, inference: "Express.js is commonly used for REST APIs" },
        { skill: "Node.js", confidence: 90, inference: "Express.js runs on Node.js" },
        { skill: "JavaScript", confidence: 85, inference: "Express.js is a JavaScript framework" },
    ],
    "django": [
        { skill: "Backend Development", confidence: 95, inference: "Django is a backend web framework" },
        { skill: "Python", confidence: 95, inference: "Django is a Python framework" },
        { skill: "Web Development", confidence: 90, inference: "Django is a web framework" },
    ],
    "django rest framework": [
        { skill: "Backend Development", confidence: 95, inference: "DRF is for building REST APIs" },
        { skill: "RESTful API design", confidence: 95, inference: "DRF is specifically for REST API design" },
        { skill: "Python", confidence: 95, inference: "DRF is a Python framework" },
    ],
    "flask": [
        { skill: "Backend Development", confidence: 85, inference: "Flask is a backend micro-framework" },
        { skill: "Python", confidence: 95, inference: "Flask is a Python framework" },
        { skill: "Web Development", confidence: 85, inference: "Flask is a web framework" },
    ],
    "spring boot": [
        { skill: "Backend Development", confidence: 95, inference: "Spring Boot is a backend framework" },
        { skill: "Java", confidence: 95, inference: "Spring Boot is a Java framework" },
        { skill: "RESTful API design", confidence: 85, inference: "Spring Boot commonly used for REST APIs" },
        { skill: "Microservices architecture", confidence: 75, inference: "Spring Boot is commonly used for microservices" },
    ],
    "node.js": [
        { skill: "Backend Development", confidence: 80, inference: "Node.js is a server-side JavaScript runtime" },
        { skill: "JavaScript", confidence: 95, inference: "Node.js runs JavaScript" },
    ],
    // Common variants: "nodejs", "node js", "node"
    "nodejs": [
        { skill: "Backend Development", confidence: 80, inference: "Node.js is a server-side JavaScript runtime" },
        { skill: "JavaScript", confidence: 95, inference: "Node.js runs JavaScript" },
    ],
    "node js": [
        { skill: "Backend Development", confidence: 80, inference: "Node.js is a server-side JavaScript runtime" },
        { skill: "JavaScript", confidence: 95, inference: "Node.js runs JavaScript" },
    ],
    "node": [
        { skill: "Backend Development", confidence: 75, inference: "Node (Node.js) is a server-side JavaScript runtime" },
        { skill: "JavaScript", confidence: 90, inference: "Node.js runs JavaScript" },
    ],
    "laravel": [
        { skill: "Backend Development", confidence: 90, inference: "Laravel is a backend web framework" },
        { skill: "PHP", confidence: 95, inference: "Laravel is a PHP framework" },
        { skill: "Web Development", confidence: 85, inference: "Laravel is a web framework" },
    ],
    ".net": [
        { skill: "Backend Development", confidence: 85, inference: ".NET is commonly used for backend services" },
        { skill: "C#", confidence: 85, inference: ".NET primarily uses C#" },
    ],

    // ── Frontend Frameworks ──
    "react": [
        { skill: "Frontend Development", confidence: 95, inference: "React is a frontend UI library" },
        { skill: "JavaScript", confidence: 85, inference: "React is a JavaScript library" },
        { skill: "Web Development", confidence: 90, inference: "React is a web technology" },
    ],
    "react.js": [
        { skill: "Frontend Development", confidence: 95, inference: "React.js is a frontend UI library" },
        { skill: "JavaScript", confidence: 85, inference: "React.js is a JavaScript library" },
        { skill: "Web Development", confidence: 90, inference: "React.js is a web technology" },
    ],
    "reactjs": [
        { skill: "Frontend Development", confidence: 95, inference: "React.js is a frontend UI library" },
        { skill: "JavaScript", confidence: 85, inference: "React.js is a JavaScript library" },
        { skill: "Web Development", confidence: 90, inference: "React.js is a web technology" },
    ],
    // React Native — implies React, JavaScript, and mobile development
    "react native": [
        { skill: "Frontend Development", confidence: 90, inference: "React Native is a UI framework" },
        { skill: "Mobile Development", confidence: 95, inference: "React Native builds mobile apps" },
        { skill: "JavaScript", confidence: 95, inference: "React Native uses JavaScript/TypeScript" },
        { skill: "React", confidence: 90, inference: "React Native is built on React" },
    ],
    "react-native": [
        { skill: "Frontend Development", confidence: 90, inference: "React Native is a UI framework" },
        { skill: "Mobile Development", confidence: 95, inference: "React Native builds mobile apps" },
        { skill: "JavaScript", confidence: 95, inference: "React Native uses JavaScript/TypeScript" },
        { skill: "React", confidence: 90, inference: "React Native is built on React" },
    ],
    "next.js": [
        { skill: "Frontend Development", confidence: 90, inference: "Next.js is a React-based framework" },
        { skill: "Full-stack Development", confidence: 75, inference: "Next.js supports server-side rendering and API routes" },
        { skill: "Web Development", confidence: 95, inference: "Next.js is a web framework" },
        { skill: "React", confidence: 90, inference: "Next.js is built on React" },
        { skill: "JavaScript", confidence: 85, inference: "Next.js is a JavaScript framework" },
    ],
    "nextjs": [
        { skill: "Frontend Development", confidence: 90, inference: "Next.js is a React-based framework" },
        { skill: "Full-stack Development", confidence: 75, inference: "Next.js supports server-side rendering and API routes" },
        { skill: "Web Development", confidence: 95, inference: "Next.js is a web framework" },
        { skill: "React", confidence: 90, inference: "Next.js is built on React" },
        { skill: "JavaScript", confidence: 85, inference: "Next.js is a JavaScript framework" },
    ],
    "angular": [
        { skill: "Frontend Development", confidence: 95, inference: "Angular is a frontend framework" },
        { skill: "TypeScript", confidence: 85, inference: "Angular uses TypeScript by default" },
        { skill: "JavaScript", confidence: 80, inference: "Angular/TypeScript is a JavaScript superset" },
        { skill: "Web Development", confidence: 90, inference: "Angular is a web framework" },
    ],
    "vue.js": [
        { skill: "Frontend Development", confidence: 95, inference: "Vue.js is a frontend framework" },
        { skill: "JavaScript", confidence: 85, inference: "Vue.js is a JavaScript framework" },
        { skill: "Web Development", confidence: 90, inference: "Vue.js is a web technology" },
    ],
    "vuejs": [
        { skill: "Frontend Development", confidence: 95, inference: "Vue.js is a frontend framework" },
        { skill: "JavaScript", confidence: 85, inference: "Vue.js is a JavaScript framework" },
        { skill: "Web Development", confidence: 90, inference: "Vue.js is a web technology" },
    ],
    // ── JS/TS as explicit skills ──
    // If student lists "JavaScript" or "JS" explicitly
    "javascript": [
        { skill: "Frontend Development", confidence: 70, inference: "JavaScript is the primary web language" },
        { skill: "Web Development", confidence: 85, inference: "JavaScript is the foundation of web development" },
    ],
    "js": [
        { skill: "Frontend Development", confidence: 70, inference: "JS (JavaScript) is the primary web language" },
        { skill: "Web Development", confidence: 85, inference: "JS is the foundation of web development" },
        { skill: "JavaScript", confidence: 95, inference: "JS is the standard abbreviation for JavaScript" },
    ],
    // TypeScript implies JavaScript (TS is a superset of JS)
    "typescript": [
        { skill: "Frontend Development", confidence: 70, inference: "TypeScript is heavily used in frontend development" },
        { skill: "JavaScript", confidence: 90, inference: "TypeScript is a superset of JavaScript — TypeScript developers know JavaScript" },
        { skill: "Web Development", confidence: 75, inference: "TypeScript is a web technology" },
    ],
    "ts": [
        { skill: "JavaScript", confidence: 88, inference: "TS (TypeScript) is a superset of JavaScript" },
        { skill: "Frontend Development", confidence: 65, inference: "TypeScript is often used for frontend development" },
    ],

    // ── Databases ──
    "mongodb": [
        { skill: "NoSQL databases", confidence: 100, inference: "MongoDB is a NoSQL document database" },
        { skill: "Database Management", confidence: 85, inference: "MongoDB usage shows database skills" },
    ],
    "mysql": [
        { skill: "SQL databases", confidence: 100, inference: "MySQL is a SQL database" },
        { skill: "Database Management", confidence: 85, inference: "MySQL usage shows database skills" },
    ],
    "postgresql": [
        { skill: "SQL databases", confidence: 100, inference: "PostgreSQL is a SQL database" },
        { skill: "Database Management", confidence: 85, inference: "PostgreSQL usage shows database skills" },
    ],
    "postgres": [
        { skill: "SQL databases", confidence: 100, inference: "Postgres is a SQL database" },
        { skill: "Database Management", confidence: 85, inference: "Postgres usage shows database skills" },
    ],
    "redis": [
        { skill: "Caching strategies", confidence: 85, inference: "Redis is commonly used for caching" },
        { skill: "NoSQL databases", confidence: 75, inference: "Redis is a key-value store (NoSQL)" },
    ],
    "sql server": [
        { skill: "SQL databases", confidence: 100, inference: "SQL Server is a SQL database" },
    ],
    "sqlite": [
        { skill: "SQL databases", confidence: 90, inference: "SQLite is a SQL database" },
    ],
    "cassandra": [
        { skill: "NoSQL databases", confidence: 100, inference: "Cassandra is a NoSQL database" },
        { skill: "Distributed systems", confidence: 75, inference: "Cassandra is a distributed database" },
    ],
    "dynamodb": [
        { skill: "NoSQL databases", confidence: 100, inference: "DynamoDB is a NoSQL database" },
        { skill: "Cloud platforms", confidence: 75, inference: "DynamoDB is an AWS service" },
    ],
    "firebase": [
        { skill: "NoSQL databases", confidence: 80, inference: "Firebase includes a NoSQL database" },
        { skill: "Cloud platforms", confidence: 70, inference: "Firebase is a cloud platform" },
    ],

    // ── Cloud & DevOps ──
    "docker": [
        { skill: "Containerization", confidence: 100, inference: "Docker is a containerization tool" },
        { skill: "DevOps", confidence: 85, inference: "Docker is a core DevOps technology" },
        { skill: "Microservices architecture", confidence: 60, inference: "Docker is commonly used in microservices" },
    ],
    "kubernetes": [
        { skill: "Container orchestration", confidence: 100, inference: "Kubernetes orchestrates containers" },
        { skill: "DevOps", confidence: 90, inference: "Kubernetes is a core DevOps technology" },
        { skill: "Microservices architecture", confidence: 80, inference: "Kubernetes is used for microservices" },
        { skill: "Cloud platforms", confidence: 75, inference: "Kubernetes is typically deployed on cloud" },
    ],
    "k8s": [
        { skill: "Container orchestration", confidence: 100, inference: "K8s (Kubernetes) orchestrates containers" },
        { skill: "DevOps", confidence: 90, inference: "K8s is a core DevOps technology" },
        { skill: "Microservices architecture", confidence: 80, inference: "K8s is used for microservices" },
    ],
    "aws": [
        { skill: "Cloud platforms", confidence: 100, inference: "AWS is a major cloud platform" },
    ],
    "gcp": [
        { skill: "Cloud platforms", confidence: 100, inference: "GCP is a major cloud platform" },
        { skill: "Google Cloud Platform", confidence: 100, inference: "GCP = Google Cloud Platform" },
    ],
    "google cloud": [
        { skill: "Cloud platforms", confidence: 100, inference: "Google Cloud is a cloud platform" },
        { skill: "Google Cloud Platform", confidence: 100, inference: "Explicit Google Cloud mention" },
    ],
    "azure": [
        { skill: "Cloud platforms", confidence: 100, inference: "Azure is a major cloud platform" },
    ],
    "heroku": [
        { skill: "Cloud platforms", confidence: 85, inference: "Heroku is a cloud platform" },
    ],
    "vercel": [
        { skill: "Cloud platforms", confidence: 80, inference: "Vercel is a cloud deployment platform" },
        { skill: "Frontend Development", confidence: 60, inference: "Vercel is typically used for frontend deployment" },
    ],
    "terraform": [
        { skill: "Infrastructure as Code", confidence: 100, inference: "Terraform is an IaC tool" },
        { skill: "DevOps", confidence: 90, inference: "Terraform is a core DevOps tool" },
        { skill: "Cloud platforms", confidence: 75, inference: "Terraform manages cloud infrastructure" },
    ],
    "jenkins": [
        { skill: "CI/CD", confidence: 95, inference: "Jenkins is a CI/CD tool" },
        { skill: "DevOps", confidence: 85, inference: "Jenkins is a DevOps tool" },
    ],
    "gitlab ci": [
        { skill: "CI/CD", confidence: 95, inference: "GitLab CI is a CI/CD tool" },
        { skill: "DevOps", confidence: 85, inference: "GitLab CI is a DevOps tool" },
    ],
    "github actions": [
        { skill: "CI/CD", confidence: 90, inference: "GitHub Actions is a CI/CD tool" },
        { skill: "DevOps", confidence: 80, inference: "GitHub Actions is used for DevOps workflows" },
    ],

    // ── Message Queues ──
    "kafka": [
        { skill: "Message queues", confidence: 100, inference: "Kafka is a message streaming platform" },
        { skill: "Distributed systems", confidence: 80, inference: "Kafka is a distributed system" },
        { skill: "Data Engineering", confidence: 75, inference: "Kafka is commonly used in data pipelines" },
    ],
    "rabbitmq": [
        { skill: "Message queues", confidence: 100, inference: "RabbitMQ is a message broker" },
    ],
    "aws sqs": [
        { skill: "Message queues", confidence: 100, inference: "SQS is a message queue service" },
        { skill: "Cloud platforms", confidence: 80, inference: "SQS is an AWS service" },
    ],

    // ── ML / AI ──
    "tensorflow": [
        { skill: "Machine Learning", confidence: 95, inference: "TensorFlow is an ML framework" },
        { skill: "Deep Learning", confidence: 90, inference: "TensorFlow is used for deep learning" },
        { skill: "Python", confidence: 80, inference: "TensorFlow is primarily used with Python" },
    ],
    "pytorch": [
        { skill: "Machine Learning", confidence: 95, inference: "PyTorch is an ML framework" },
        { skill: "Deep Learning", confidence: 90, inference: "PyTorch is used for deep learning" },
        { skill: "Python", confidence: 80, inference: "PyTorch is primarily used with Python" },
    ],
    "scikit-learn": [
        { skill: "Machine Learning", confidence: 95, inference: "scikit-learn is an ML library" },
        { skill: "Python", confidence: 85, inference: "scikit-learn is a Python library" },
        { skill: "Data Science", confidence: 80, inference: "scikit-learn is a data science tool" },
    ],
    "sklearn": [
        { skill: "Machine Learning", confidence: 95, inference: "sklearn is scikit-learn, an ML library" },
        { skill: "Python", confidence: 85, inference: "sklearn is a Python library" },
    ],
    "xgboost": [
        { skill: "Machine Learning", confidence: 95, inference: "XGBoost is an ML algorithm/library" },
        { skill: "Python", confidence: 75, inference: "XGBoost is commonly used with Python" },
    ],
    "pandas": [
        { skill: "Data Science", confidence: 85, inference: "Pandas is a data analysis library" },
        { skill: "Python", confidence: 90, inference: "Pandas is a Python library" },
    ],
    "numpy": [
        { skill: "Data Science", confidence: 75, inference: "NumPy is a numerical computing library" },
        { skill: "Python", confidence: 90, inference: "NumPy is a Python library" },
    ],
    "opencv": [
        { skill: "Computer Vision", confidence: 95, inference: "OpenCV is a computer vision library" },
        { skill: "Machine Learning", confidence: 70, inference: "OpenCV is often used with ML" },
    ],
    // ── Data Engineering ──
    "spark": [
        { skill: "Data Engineering", confidence: 95, inference: "Apache Spark is a data processing engine" },
        { skill: "Big Data", confidence: 90, inference: "Spark processes large-scale data" },
    ],
    "airflow": [
        { skill: "Data Engineering", confidence: 95, inference: "Airflow is a workflow orchestration tool" },
        { skill: "Pipeline Development", confidence: 90, inference: "Airflow manages data pipelines" },
    ],
    "hadoop": [
        { skill: "Big Data", confidence: 95, inference: "Hadoop is a big data framework" },
        { skill: "Data Engineering", confidence: 85, inference: "Hadoop is used in data engineering" },
    ],

    // ── Testing ──
    "jest": [
        { skill: "Testing", confidence: 90, inference: "Jest is a testing framework" },
        { skill: "JavaScript", confidence: 75, inference: "Jest is a JavaScript testing framework" },
    ],
    "pytest": [
        { skill: "Testing", confidence: 90, inference: "pytest is a testing framework" },
        { skill: "Python", confidence: 80, inference: "pytest is a Python testing framework" },
    ],
    "junit": [
        { skill: "Testing", confidence: 90, inference: "JUnit is a testing framework" },
        { skill: "Java", confidence: 80, inference: "JUnit is a Java testing framework" },
    ],
    "selenium": [
        { skill: "Testing", confidence: 85, inference: "Selenium is a testing/automation tool" },
        { skill: "Web Development", confidence: 60, inference: "Selenium tests web applications" },
    ],
    "cypress": [
        { skill: "Testing", confidence: 90, inference: "Cypress is an end-to-end testing framework" },
        { skill: "Frontend Development", confidence: 60, inference: "Cypress tests frontend applications" },
    ],
    // ── Mobile Development ──
    "kotlin": [
        { skill: "Android Development", confidence: 95, inference: "Kotlin is the primary language for Android development" },
        { skill: "Mobile Development", confidence: 90, inference: "Kotlin is used for Android mobile apps" },
        { skill: "Java", confidence: 70, inference: "Kotlin is interoperable with Java" },
    ],
    "swift": [
        { skill: "iOS Development", confidence: 95, inference: "Swift is the primary language for iOS development" },
        { skill: "Mobile Development", confidence: 90, inference: "Swift is used for iOS/macOS apps" },
    ],
    "flutter": [
        { skill: "Mobile Development", confidence: 95, inference: "Flutter is a cross-platform mobile framework" },
        { skill: "Frontend Development", confidence: 75, inference: "Flutter also targets web and desktop" },
    ],
    "dart": [
        { skill: "Mobile Development", confidence: 80, inference: "Dart is Flutter's language, used for mobile development" },
        { skill: "Flutter", confidence: 90, inference: "Dart is the language used with Flutter" },
    ],
    "android": [
        { skill: "Android Development", confidence: 90, inference: "Explicit Android mention" },
        { skill: "Mobile Development", confidence: 85, inference: "Android is a mobile platform" },
        { skill: "Java", confidence: 65, inference: "Android traditionally uses Java" },
    ],
    "android sdk": [
        { skill: "Android Development", confidence: 95, inference: "Android SDK is for building Android apps" },
        { skill: "Mobile Development", confidence: 90, inference: "Android SDK is for mobile development" },
    ],
    "jetpack compose": [
        { skill: "Android Development", confidence: 95, inference: "Jetpack Compose is Android's UI toolkit" },
        { skill: "Mobile Development", confidence: 90, inference: "Jetpack Compose is for Android mobile apps" },
        { skill: "Kotlin", confidence: 90, inference: "Jetpack Compose uses Kotlin" },
    ],
    // ── Common Language Shorthands ──
    "sql": [
        { skill: "SQL databases", confidence: 90, inference: "SQL indicates relational database knowledge" },
        { skill: "Database Management", confidence: 85, inference: "SQL is used to manage databases" },
    ],
    "c++": [
        { skill: "Systems Programming", confidence: 85, inference: "C++ is a systems programming language" },
        { skill: "Competitive Programming", confidence: 70, inference: "C++ is the most popular competitive programming language" },
    ],
    "cpp": [
        { skill: "Systems Programming", confidence: 85, inference: "C++ is a systems programming language" },
        { skill: "Competitive Programming", confidence: 70, inference: "C++ is the most popular competitive programming language" },
    ],
    "java": [
        { skill: "Backend Development", confidence: 70, inference: "Java is widely used for backend development" },
        { skill: "Object-Oriented Programming", confidence: 85, inference: "Java is a core OOP language" },
    ],
    "python": [
        { skill: "Scripting", confidence: 75, inference: "Python is widely used for scripting and automation" },
        { skill: "Data Science", confidence: 70, inference: "Python is the dominant data science language" },
    ],

    // ── LLMs & Generative AI ──
    // OpenAI / GPT family
    "openai": [
        { skill: "Artificial Intelligence", confidence: 95, inference: "OpenAI is the leading AI lab" },
        { skill: "Large Language Models", confidence: 95, inference: "OpenAI builds LLMs (GPT-3, GPT-4, etc.)" },
        { skill: "Generative AI", confidence: 90, inference: "OpenAI's models are generative AI" },
        { skill: "Machine Learning", confidence: 80, inference: "Working with OpenAI requires ML understanding" },
        { skill: "Natural Language Processing", confidence: 85, inference: "OpenAI's models are NLP-based" },
        { skill: "API Integration", confidence: 80, inference: "OpenAI is typically used via API" },
    ],
    "gpt": [
        { skill: "Large Language Models", confidence: 95, inference: "GPT is a large language model" },
        { skill: "Generative AI", confidence: 95, inference: "GPT is a generative pre-trained transformer" },
        { skill: "Natural Language Processing", confidence: 90, inference: "GPT is used for NLP tasks" },
        { skill: "Artificial Intelligence", confidence: 90, inference: "GPT is an AI model" },
    ],
    "gpt-3": [
        { skill: "Large Language Models", confidence: 95, inference: "GPT-3 is a large language model" },
        { skill: "Generative AI", confidence: 95, inference: "GPT-3 is a generative AI model" },
        { skill: "Natural Language Processing", confidence: 90, inference: "GPT-3 is used for NLP tasks" },
    ],
    "gpt-4": [
        { skill: "Large Language Models", confidence: 95, inference: "GPT-4 is a large language model" },
        { skill: "Generative AI", confidence: 95, inference: "GPT-4 is a generative AI model" },
        { skill: "Natural Language Processing", confidence: 90, inference: "GPT-4 is used for NLP tasks" },
    ],
    "chatgpt": [
        { skill: "Large Language Models", confidence: 90, inference: "ChatGPT is built on GPT-4" },
        { skill: "Generative AI", confidence: 90, inference: "ChatGPT is a generative AI tool" },
        { skill: "Natural Language Processing", confidence: 85, inference: "ChatGPT handles NLP tasks" },
    ],
    "llm": [
        { skill: "Large Language Models", confidence: 95, inference: "LLM = Large Language Model" },
        { skill: "Generative AI", confidence: 90, inference: "LLMs are generative AI models" },
        { skill: "Natural Language Processing", confidence: 90, inference: "LLMs are used for NLP tasks" },
        { skill: "Artificial Intelligence", confidence: 85, inference: "LLMs are a subset of AI" },
    ],
    "llms": [
        { skill: "Large Language Models", confidence: 95, inference: "LLMs = Large Language Models" },
        { skill: "Generative AI", confidence: 90, inference: "LLMs are generative AI models" },
        { skill: "Natural Language Processing", confidence: 90, inference: "LLMs are used for NLP tasks" },
        { skill: "Artificial Intelligence", confidence: 85, inference: "LLMs are a subset of AI" },
    ],
    // Anthropic Claude
    "claude": [
        { skill: "Large Language Models", confidence: 90, inference: "Claude is Anthropic's LLM" },
        { skill: "Generative AI", confidence: 90, inference: "Claude is a generative AI model" },
        { skill: "Natural Language Processing", confidence: 85, inference: "Claude handles NLP tasks" },
    ],
    "anthropic": [
        { skill: "Large Language Models", confidence: 90, inference: "Anthropic builds Claude LLMs" },
        { skill: "Generative AI", confidence: 90, inference: "Anthropic is a generative AI company" },
        { skill: "Artificial Intelligence", confidence: 85, inference: "Anthropic is an AI safety company" },
    ],
    // Google Gemini
    "gemini": [
        { skill: "Large Language Models", confidence: 90, inference: "Gemini is Google's LLM" },
        { skill: "Generative AI", confidence: 90, inference: "Gemini is Google's generative AI model" },
        { skill: "Natural Language Processing", confidence: 85, inference: "Gemini is used for NLP tasks" },
    ],
    // Meta LLaMA
    "llama": [
        { skill: "Large Language Models", confidence: 90, inference: "LLaMA is Meta's open-source LLM" },
        { skill: "Generative AI", confidence: 85, inference: "LLaMA is a generative AI model" },
        { skill: "Natural Language Processing", confidence: 85, inference: "LLaMA handles NLP tasks" },
    ],
    "llama2": [
        { skill: "Large Language Models", confidence: 90, inference: "LLaMA 2 is Meta's open-source LLM" },
        { skill: "Generative AI", confidence: 85, inference: "LLaMA 2 is a generative AI model" },
    ],
    "ollama": [
        { skill: "Large Language Models", confidence: 85, inference: "Ollama is used for running local LLMs" },
        { skill: "Generative AI", confidence: 80, inference: "Ollama enables local generative AI" },
        { skill: "Machine Learning", confidence: 75, inference: "Ollama is an ML inference tool" },
    ],
    // Orchestration frameworks
    "langchain": [
        { skill: "Large Language Models", confidence: 95, inference: "LangChain is an LLM application framework" },
        { skill: "Generative AI", confidence: 95, inference: "LangChain is used to build GenAI apps" },
        { skill: "Natural Language Processing", confidence: 90, inference: "LangChain enables NLP pipelines" },
        { skill: "Artificial Intelligence", confidence: 85, inference: "LangChain orchestrates AI models" },
        { skill: "Python", confidence: 80, inference: "LangChain is primarily a Python library" },
    ],
    "llamaindex": [
        { skill: "Large Language Models", confidence: 95, inference: "LlamaIndex is an LLM data framework" },
        { skill: "Generative AI", confidence: 95, inference: "LlamaIndex powers GenAI RAG apps" },
        { skill: "Natural Language Processing", confidence: 85, inference: "LlamaIndex enables NLP retrieval" },
    ],
    "llama index": [
        { skill: "Large Language Models", confidence: 95, inference: "LlamaIndex is an LLM data framework" },
        { skill: "Generative AI", confidence: 95, inference: "LlamaIndex powers GenAI RAG apps" },
    ],
    "hugging face": [
        { skill: "Machine Learning", confidence: 90, inference: "Hugging Face is an ML model hub" },
        { skill: "Large Language Models", confidence: 90, inference: "Hugging Face hosts LLMs and transformers" },
        { skill: "Natural Language Processing", confidence: 90, inference: "Hugging Face is focused on NLP" },
        { skill: "Deep Learning", confidence: 80, inference: "Hugging Face models use deep learning" },
        { skill: "Python", confidence: 80, inference: "Hugging Face is a Python library" },
    ],
    "huggingface": [
        { skill: "Machine Learning", confidence: 90, inference: "Hugging Face is an ML model hub" },
        { skill: "Large Language Models", confidence: 90, inference: "Hugging Face hosts LLMs and transformers" },
        { skill: "Natural Language Processing", confidence: 90, inference: "Hugging Face is focused on NLP" },
    ],
    // Transformers
    "transformers": [
        { skill: "Large Language Models", confidence: 90, inference: "Transformers are the architecture behind LLMs" },
        { skill: "Natural Language Processing", confidence: 90, inference: "Transformers are the dominant NLP architecture" },
        { skill: "Deep Learning", confidence: 85, inference: "Transformers are a deep learning architecture" },
        { skill: "Machine Learning", confidence: 80, inference: "Transformers are a machine learning architecture" },
    ],
    // RAG & retrieval
    "rag": [
        { skill: "Large Language Models", confidence: 90, inference: "RAG (Retrieval-Augmented Generation) is an LLM technique" },
        { skill: "Generative AI", confidence: 90, inference: "RAG augments generative AI with retrieval" },
        { skill: "Natural Language Processing", confidence: 80, inference: "RAG is used in NLP applications" },
    ],
    "retrieval augmented generation": [
        { skill: "Large Language Models", confidence: 95, inference: "RAG is an LLM application pattern" },
        { skill: "Generative AI", confidence: 95, inference: "RAG is a key GenAI architecture pattern" },
    ],
    // Vector databases — key for LLM apps
    "pinecone": [
        { skill: "Large Language Models", confidence: 80, inference: "Pinecone is a vector DB commonly used with LLMs" },
        { skill: "Generative AI", confidence: 80, inference: "Pinecone powers RAG pipelines" },
        { skill: "Machine Learning", confidence: 75, inference: "Pinecone stores ML embeddings" },
    ],
    "chromadb": [
        { skill: "Large Language Models", confidence: 80, inference: "ChromaDB is a vector DB for LLM apps" },
        { skill: "Generative AI", confidence: 80, inference: "ChromaDB is used in RAG pipelines" },
    ],
    "weaviate": [
        { skill: "Large Language Models", confidence: 80, inference: "Weaviate is a vector database for AI apps" },
        { skill: "Generative AI", confidence: 75, inference: "Weaviate supports GenAI search" },
    ],
    "faiss": [
        { skill: "Machine Learning", confidence: 80, inference: "FAISS is Facebook's similarity search library" },
        { skill: "Large Language Models", confidence: 75, inference: "FAISS is used for LLM embedding search" },
    ],
    "vector database": [
        { skill: "Large Language Models", confidence: 85, inference: "Vector DBs are core infrastructure for LLM apps" },
        { skill: "Generative AI", confidence: 80, inference: "Vector DBs power RAG and semantic search" },
    ],
    // Prompt engineering & fine-tuning
    "prompt engineering": [
        { skill: "Large Language Models", confidence: 95, inference: "Prompt engineering is an LLM skill" },
        { skill: "Generative AI", confidence: 95, inference: "Prompt engineering is used with generative AI" },
        { skill: "Natural Language Processing", confidence: 80, inference: "Prompt engineering is an NLP technique" },
    ],
    "fine-tuning": [
        { skill: "Machine Learning", confidence: 90, inference: "Fine-tuning is an ML training technique" },
        { skill: "Large Language Models", confidence: 90, inference: "Fine-tuning is applied to pre-trained LLMs" },
        { skill: "Deep Learning", confidence: 85, inference: "Fine-tuning uses deep learning" },
    ],
    "fine tuning": [
        { skill: "Machine Learning", confidence: 90, inference: "Fine-tuning is an ML training technique" },
        { skill: "Large Language Models", confidence: 90, inference: "Fine-tuning is applied to pre-trained LLMs" },
    ],
    // OpenAI API specifically
    "openai api": [
        { skill: "Large Language Models", confidence: 95, inference: "OpenAI API is used to build LLM apps" },
        { skill: "Generative AI", confidence: 95, inference: "OpenAI API powers GenAI applications" },
        { skill: "API Integration", confidence: 90, inference: "OpenAI API is an external API integration" },
        { skill: "Python", confidence: 70, inference: "OpenAI API is most commonly used via Python" },
    ],
    // Generative AI as a phrase
    "generative ai": [
        { skill: "Large Language Models", confidence: 90, inference: "Generative AI includes LLMs" },
        { skill: "Artificial Intelligence", confidence: 95, inference: "Generative AI is a branch of AI" },
        { skill: "Machine Learning", confidence: 85, inference: "Generative AI is built on ML" },
    ],
    "gen ai": [
        { skill: "Large Language Models", confidence: 90, inference: "Gen AI includes LLMs" },
        { skill: "Artificial Intelligence", confidence: 90, inference: "Gen AI is short for Generative AI" },
    ],
    // Embeddings
    "embeddings": [
        { skill: "Machine Learning", confidence: 85, inference: "Embeddings are an ML technique" },
        { skill: "Large Language Models", confidence: 85, inference: "Embeddings are central to LLM applications" },
        { skill: "Natural Language Processing", confidence: 80, inference: "Word/sentence embeddings are an NLP technique" },
    ],
    "word embeddings": [
        { skill: "Natural Language Processing", confidence: 90, inference: "Word embeddings (e.g. Word2Vec) are an NLP technique" },
        { skill: "Machine Learning", confidence: 80, inference: "Word embeddings are an ML representation" },
    ],
    // Computer vision / image gen
    "stable diffusion": [
        { skill: "Generative AI", confidence: 95, inference: "Stable Diffusion is an image generative AI model" },
        { skill: "Machine Learning", confidence: 85, inference: "Stable Diffusion uses diffusion model ML" },
        { skill: "Deep Learning", confidence: 85, inference: "Stable Diffusion uses deep learning" },
    ],
    "diffusion models": [
        { skill: "Generative AI", confidence: 90, inference: "Diffusion models are a type of generative AI" },
        { skill: "Deep Learning", confidence: 90, inference: "Diffusion models are deep learning architectures" },
    ],
    // Agents
    "ai agents": [
        { skill: "Large Language Models", confidence: 90, inference: "AI agents are built on top of LLMs" },
        { skill: "Generative AI", confidence: 90, inference: "AI agents use generative AI" },
        { skill: "Artificial Intelligence", confidence: 90, inference: "AI agents are autonomous AI systems" },
    ],
    "autonomous agents": [
        { skill: "Large Language Models", confidence: 85, inference: "Autonomous agents often use LLMs" },
        { skill: "Generative AI", confidence: 85, inference: "Autonomous agents leverage generative AI" },
    ],

    // ── Automation / No-Code ──
    "make.com": [
        { skill: "workflow automation", confidence: 95, inference: "Make.com is a visual workflow automation platform" },
        { skill: "no-code tools", confidence: 95, inference: "Make.com is a no-code integration tool" },
        { skill: "API integrations", confidence: 85, inference: "Make.com connects apps via APIs" },
        { skill: "process automation", confidence: 90, inference: "Make.com automates business processes" },
    ],
    "make": [
        { skill: "workflow automation", confidence: 90, inference: "Make (formerly Integromat) is an automation platform" },
        { skill: "no-code tools", confidence: 90, inference: "Make is a no-code tool" },
        { skill: "API integrations", confidence: 80, inference: "Make connects apps via APIs" },
    ],
    "zapier": [
        { skill: "workflow automation", confidence: 95, inference: "Zapier automates workflows between apps" },
        { skill: "no-code tools", confidence: 95, inference: "Zapier is a leading no-code automation tool" },
        { skill: "API integrations", confidence: 80, inference: "Zapier connects apps via APIs" },
    ],
    "n8n": [
        { skill: "workflow automation", confidence: 90, inference: "n8n is an open-source workflow automation tool" },
        { skill: "no-code tools", confidence: 85, inference: "n8n is a low-code automation platform" },
        { skill: "API integrations", confidence: 85, inference: "n8n integrates APIs" },
    ],

    // ── LLM / AI Engineering (additional capability mappings) ──
    "llm inference": [
        { skill: "LLM Engineering", confidence: 95, inference: "LLM inference is core LLM engineering work" },
        { skill: "AI pipeline", confidence: 90, inference: "LLM inference is a production AI pipeline component" },
    ],
    "whisper": [
        { skill: "Speech Recognition", confidence: 95, inference: "Whisper is OpenAI's ASR (speech-to-text) model" },
        { skill: "AI pipeline", confidence: 85, inference: "Using Whisper implies building AI processing pipelines" },
        { skill: "Python", confidence: 80, inference: "Whisper is primarily a Python library" },
    ],
    "ocr": [
        { skill: "document parsing", confidence: 95, inference: "OCR is used for extracting text from documents/images" },
        { skill: "AI pipeline", confidence: 75, inference: "OCR is a core component of AI document pipelines" },
        { skill: "data extraction", confidence: 85, inference: "OCR extracts structured data from unstructured sources" },
    ],
    "gemini api": [
        { skill: "LLM Engineering", confidence: 90, inference: "Gemini API is a large language model API" },
        { skill: "prompt engineering", confidence: 80, inference: "Using Gemini requires prompt design" },
        { skill: "API integrations", confidence: 80, inference: "Gemini is accessed via API" },
    ],

    // ── LinkedIn / Marketing Automation ──
    "linkedin": [
        { skill: "LinkedIn automation", confidence: 80, inference: "LinkedIn mentions in automation context imply LinkedIn tooling" },
    ],
    "email campaign": [
        { skill: "email marketing", confidence: 90, inference: "Email campaigns are email marketing work" },
        { skill: "lead generation", confidence: 70, inference: "Email campaigns are commonly used for lead generation" },
    ],
    "email outreach": [
        { skill: "email marketing", confidence: 85, inference: "Email outreach is email marketing" },
        { skill: "lead generation", confidence: 75, inference: "Outreach implies prospecting/lead gen" },
    ],
};

// ============================================================================
// TECH STACK BUNDLES
// ============================================================================
// Named stacks that imply multiple derived skills.

const TECH_STACK_BUNDLES: Record<string, CapabilityMapping[]> = {
    "mern stack": [
        { skill: "Full-stack Development", confidence: 90, inference: "MERN = full-stack (MongoDB + Express + React + Node.js)" },
        { skill: "Web Development", confidence: 95, inference: "MERN is a web development stack" },
        { skill: "Backend Development", confidence: 85, inference: "Express + Node.js = backend" },
        { skill: "Frontend Development", confidence: 85, inference: "React = frontend" },
        { skill: "NoSQL databases", confidence: 90, inference: "MongoDB = NoSQL" },
        { skill: "JavaScript", confidence: 95, inference: "MERN stack is JavaScript-based" },
        { skill: "RESTful API design", confidence: 80, inference: "Express is commonly used for REST APIs" },
    ],
    "mean stack": [
        { skill: "Full-stack Development", confidence: 90, inference: "MEAN = full-stack (MongoDB + Express + Angular + Node.js)" },
        { skill: "Web Development", confidence: 95, inference: "MEAN is a web development stack" },
        { skill: "Backend Development", confidence: 85, inference: "Express + Node.js = backend" },
        { skill: "Frontend Development", confidence: 85, inference: "Angular = frontend" },
        { skill: "NoSQL databases", confidence: 90, inference: "MongoDB = NoSQL" },
        { skill: "JavaScript", confidence: 90, inference: "MEAN stack is JavaScript/TypeScript-based" },
        { skill: "TypeScript", confidence: 75, inference: "Angular uses TypeScript" },
    ],
    "lamp stack": [
        { skill: "Full-stack Development", confidence: 85, inference: "LAMP = full-stack (Linux + Apache + MySQL + PHP)" },
        { skill: "Web Development", confidence: 90, inference: "LAMP is a web development stack" },
        { skill: "Backend Development", confidence: 85, inference: "Apache + PHP = backend" },
        { skill: "SQL databases", confidence: 90, inference: "MySQL = SQL database" },
        { skill: "Linux", confidence: 80, inference: "LAMP runs on Linux" },
    ],
    "jamstack": [
        { skill: "Web Development", confidence: 95, inference: "JAMstack is a web architecture" },
        { skill: "Frontend Development", confidence: 90, inference: "JAMstack focuses on frontend" },
        { skill: "JavaScript", confidence: 80, inference: "JAMstack uses JavaScript" },
    ],
};

// ============================================================================
// ACTIVITY PATTERNS
// ============================================================================
// Regex patterns extracted from project/work descriptions that infer skills.

interface ActivityPattern {
    pattern: RegExp;
    skill: string;
    confidence: number;
    inference: string;
    strength: "strong" | "moderate" | "weak";
}

const ACTIVITY_PATTERNS: ActivityPattern[] = [
    // ── Machine Learning ──
    { pattern: /\b(?:RMSE|MAE|MSE|accuracy|precision|recall|F1[- ]score|AUC[- ]ROC|confusion matrix)\b/i, skill: "Machine Learning", confidence: 90, inference: "ML metrics indicate ML work", strength: "strong" },
    { pattern: /\b(?:model training|trained model|model accuracy|model performance|model optimization)\b/i, skill: "Machine Learning", confidence: 90, inference: "Model training is ML work", strength: "strong" },
    { pattern: /\b(?:XGBoost|random forest|gradient boosting|neural network|CNN|RNN|LSTM|SVM|logistic regression|decision tree)\b/i, skill: "Machine Learning", confidence: 95, inference: "ML algorithm mentioned", strength: "strong" },
    { pattern: /\b(?:classification|regression|clustering|recommendation system|anomaly detection)\b/i, skill: "Machine Learning", confidence: 80, inference: "ML task type mentioned", strength: "moderate" },

    // ── Data Engineering ──
    { pattern: /\bETL\b/i, skill: "Data Engineering", confidence: 90, inference: "ETL is a data engineering process", strength: "strong" },
    { pattern: /\b(?:data pipeline|data ingestion|data warehouse|data lake)\b/i, skill: "Data Engineering", confidence: 90, inference: "Data infrastructure work", strength: "strong" },
    { pattern: /\b(?:batch processing|stream processing|data transformation)\b/i, skill: "Data Engineering", confidence: 85, inference: "Data processing work", strength: "strong" },

    // ── API Development ──
    { pattern: /\b(?:REST(?:ful)?\s*API|API\s*(?:endpoint|route|backend|development|design|integration))\b/i, skill: "RESTful API design", confidence: 90, inference: "Explicit API development work", strength: "strong" },
    { pattern: /\b(?:HTTP\s*(?:request|endpoint|method)|GET\/POST|JSON\s*response)\b/i, skill: "RESTful API design", confidence: 80, inference: "HTTP/REST patterns", strength: "moderate" },
    { pattern: /\bGraphQL\b/i, skill: "API Development", confidence: 90, inference: "GraphQL is an API technology", strength: "strong" },

    // ── Backend Development ──
    { pattern: /\b(?:server[- ]side|backend\s*(?:service|logic|system|development)|API\s*backend)\b/i, skill: "Backend Development", confidence: 90, inference: "Explicit backend work", strength: "strong" },
    { pattern: /\b(?:microservice|service[- ]oriented|inter[- ]service communication)\b/i, skill: "Microservices architecture", confidence: 85, inference: "Microservice architecture work", strength: "strong" },

    // ── Frontend Development ──
    { pattern: /\b(?:responsive\s*(?:design|layout|UI|frontend)|UI\/UX|user interface|single[- ]page application|SPA)\b/i, skill: "Frontend Development", confidence: 85, inference: "Frontend/UI work", strength: "strong" },
    { pattern: /\b(?:web[- ]based\s*dashboard|interactive\s*(?:dashboard|UI|interface))\b/i, skill: "Frontend Development", confidence: 85, inference: "Dashboard/UI development", strength: "strong" },

    // ── Data Visualization ──
    { pattern: /\b(?:dashboard|data\s*visualization|monitoring\s*dashboard|analytics\s*dashboard|chart|graph|plot)\b/i, skill: "Data Visualization", confidence: 80, inference: "Visualization/dashboard work", strength: "moderate" },

    // ── DevOps / Deployment ──
    { pattern: /\b(?:CI\/CD|continuous\s*(?:integration|deployment|delivery))\b/i, skill: "CI/CD", confidence: 95, inference: "CI/CD pipeline work", strength: "strong" },
    { pattern: /\b(?:deployed\s*(?:to|using|on|via)|deployment\s*pipeline|production\s*deployment)\b/i, skill: "DevOps", confidence: 80, inference: "Deployment work indicates DevOps", strength: "moderate" },
    { pattern: /\b(?:monitoring|observability|alerting|logging\s*pipeline)\b/i, skill: "Monitoring", confidence: 85, inference: "Monitoring/observability work", strength: "moderate" },

    // ── Performance Optimization ──
    { pattern: /\breduced\b.*\b(?:latency|response time|load time)\b.*\d+\s*%/i, skill: "Performance Optimization", confidence: 90, inference: "Quantified performance improvement", strength: "strong" },
    { pattern: /\b(?:performance\s*optimization|optimized\s*(?:query|queries|performance|speed)|caching\s*layer)\b/i, skill: "Performance Optimization", confidence: 85, inference: "Explicit optimization work", strength: "strong" },
    { pattern: /\breduced\b.*\b(?:time|latency|cost)\b.*\b\d+\s*%/i, skill: "Performance Optimization", confidence: 80, inference: "Quantified efficiency improvement", strength: "moderate" },

    // ── Caching ──
    { pattern: /\b(?:cache|caching|cached|CDN|Cloudflare|Memcached)\b/i, skill: "Caching strategies", confidence: 85, inference: "Caching technology or strategy mentioned", strength: "strong" },

    // ── Scalability ──
    { pattern: /\b\d+[KMB]\+?\s*(?:records|requests|users|transactions|events)(?:\s*(?:per|\/)\s*(?:day|hour|minute|second))?/i, skill: "Scalability", confidence: 80, inference: "High-volume system indicates scalability experience", strength: "moderate" },
    { pattern: /\b(?:horizontal scaling|load balancing|distributed system|high availability)\b/i, skill: "Scalability", confidence: 90, inference: "Scalability concepts mentioned", strength: "strong" },

    // ── Security ──
    { pattern: /\b(?:authentication|authorization|OAuth|JWT|RBAC|encryption|SSL\/TLS|security audit)\b/i, skill: "Security", confidence: 80, inference: "Security concepts mentioned", strength: "moderate" },

    // ── Communication / Leadership ──
    { pattern: /\b(?:led\s*(?:a\s*)?team|team\s*lead|managed\s*(?:a\s*)?team|mentored)\b/i, skill: "Leadership", confidence: 85, inference: "Leadership activity described", strength: "strong" },
    { pattern: /\b(?:cross[- ]functional|collaborated\s*with|stakeholder|presented\s*to)\b/i, skill: "Communication", confidence: 80, inference: "Cross-team collaboration described", strength: "moderate" },
    { pattern: /\b(?:workshop|training\s*session|technical\s*(?:writing|documentation|presentation))\b/i, skill: "Communication", confidence: 75, inference: "Communication/teaching activity", strength: "moderate" },

    // ── System Design ──
    { pattern: /\b(?:architected|system\s*design|designed\s*(?:the\s*)?(?:system|architecture|platform)|system\s*architecture)\b/i, skill: "System Design", confidence: 85, inference: "Architecture/design work", strength: "strong" },

    // ── Containerization (from context) ──
    { pattern: /\b(?:containerized|container\s*(?:deployment|orchestration)|docker[- ]compose)\b/i, skill: "Containerization", confidence: 90, inference: "Containerization work described", strength: "strong" },

    // ── Agile ──
    { pattern: /\b(?:agile|scrum|sprint|kanban|stand[- ]?up|retrospective)\b/i, skill: "Agile", confidence: 80, inference: "Agile methodology mentioned", strength: "moderate" },

    // ── Version Control ──
    { pattern: /\b(?:pull\s*request|code\s*review|merge\s*request|branching\s*strategy)\b/i, skill: "Version Control", confidence: 80, inference: "Version control practices described", strength: "moderate" },
];

// ============================================================================
// SKILL CATEGORY MAP (for matching high-level JD skill names)
// ============================================================================
// Maps abstract JD skill names to specific technologies/terms that prove them.

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
    "full-stack development": [
        "mern", "mean", "lamp", "full-stack", "full stack", "fullstack"
    ],
    "restful api design": [
        "rest api", "restful", "rest apis", "api design", "api development",
        "api endpoints", "api backend", "api routes", "fastapi", "express",
        "django rest", "spring rest", "api integration"
    ],
    "cloud platforms": [
        "aws", "gcp", "google cloud", "azure", "heroku", "vercel",
        "digitalocean", "cloud deployment", "cloud-hosted", "cloud run",
        "ec2", "s3", "lambda", "cloud functions", "app engine", "netlify"
    ],
    "sql databases": [
        "mysql", "postgresql", "postgres", "sql server", "oracle",
        "sqlite", "mariadb", "sql", "relational database"
    ],
    "nosql databases": [
        "mongodb", "redis", "cassandra", "dynamodb", "firebase",
        "couchdb", "document database", "key-value store", "nosql"
    ],
    "microservices architecture": [
        "microservice", "microservices", "service mesh", "api gateway",
        "containerized services", "service-oriented", "inter-service",
        "kubernetes", "k8s", "docker compose"
    ],
    "message queues": [
        "kafka", "rabbitmq", "redis pub/sub", "aws sqs", "google pub/sub",
        "activemq", "event-driven", "message broker", "async processing",
        "event streaming"
    ],
    "caching strategies": [
        "redis", "memcached", "cdn", "cloudflare", "cache", "caching",
        "cache layer", "cache invalidation", "varnish"
    ],
    "devops": [
        "docker", "kubernetes", "jenkins", "terraform", "ansible",
        "ci/cd", "gitlab ci", "github actions", "circleci",
        "deployment pipeline", "infrastructure as code", "monitoring"
    ],
    "machine learning": [
        "tensorflow", "pytorch", "scikit-learn", "sklearn", "xgboost",
        "lightgbm", "neural network", "deep learning", "model training",
        "classification", "regression", "clustering", "nlp", "computer vision",
        "random forest", "gradient boosting", "cnn", "rnn", "lstm"
    ],
    "data science": [
        "pandas", "numpy", "matplotlib", "seaborn", "jupyter",
        "data analysis", "statistical analysis", "data visualization",
        "exploratory data analysis", "eda"
    ],
    "data engineering": [
        "etl", "spark", "airflow", "hadoop", "databricks",
        "bigquery", "snowflake", "dbt", "data pipeline",
        "data warehouse", "data lake", "batch processing"
    ],
    "containerization": [
        "docker", "container", "containerized", "docker-compose", "podman"
    ],
    "ci/cd": [
        "jenkins", "gitlab ci", "github actions", "circleci", "travis ci",
        "continuous integration", "continuous deployment", "ci/cd pipeline"
    ],
    "testing": [
        "jest", "pytest", "junit", "selenium", "cypress", "mocha",
        "unit test", "integration test", "e2e test", "tdd", "test coverage"
    ],
    "web development": [
        "html", "css", "javascript", "react", "angular", "vue",
        "next.js", "web application", "website", "web app", "responsive",
        "frontend", "backend", "full-stack"
    ],
    "performance optimization": [
        "reduced latency", "improved response time", "optimized",
        "caching", "performance tuning", "load optimization",
        "query optimization", "reduced load time"
    ],
    "system design": [
        "architected", "system architecture", "designed system",
        "distributed system", "scalable architecture", "high-level design"
    ],
};

// ============================================================================
// EDUCATION → DOMAIN EXPERTISE MAP
// ============================================================================

interface EducationMapping {
    keywords: RegExp;
    skills: CapabilityMapping[];
}

const EDUCATION_DOMAIN_MAP: EducationMapping[] = [
    {
        keywords: /\b(?:artificial intelligence|AI|machine learning|ML)\b/i,
        skills: [
            { skill: "Artificial Intelligence", confidence: 85, inference: "Degree focus includes AI" },
            { skill: "Machine Learning", confidence: 85, inference: "Degree focus includes ML" },
        ],
    },
    {
        keywords: /\b(?:data science|data analytics|big data)\b/i,
        skills: [
            { skill: "Data Science", confidence: 85, inference: "Degree focus includes Data Science" },
        ],
    },
    {
        keywords: /\b(?:computer science|CS|software engineering|information technology|IT)\b/i,
        skills: [
            { skill: "Computer Science", confidence: 80, inference: "Degree in Computer Science/IT" },
        ],
    },
    {
        keywords: /\b(?:cybersecurity|information security|network security)\b/i,
        skills: [
            { skill: "Security", confidence: 85, inference: "Degree focus includes security" },
        ],
    },
];

// ============================================================================
// CORE EXTRACTION ENGINE
// ============================================================================

/**
 * Extracts all semantically inferred skills from a resume.
 * Walks through technologies, stack bundles, project descriptions,
 * work experience, and education to build a comprehensive evidence list.
 */
export function extractSemanticSkills(resume: EnhancedResume): SemanticSkillEvidence[] {
    const evidence: SemanticSkillEvidence[] = [];
    const seen = new Set<string>(); // Dedup: "skill|source|trigger"

    function addEvidence(e: SemanticSkillEvidence) {
        const key = `${e.skill.toLowerCase()}|${e.source}|${e.trigger.toLowerCase()}`;
        if (!seen.has(key)) {
            seen.add(key);
            evidence.push(e);
        }
    }

    // 1. Skills Section — Technology → Capability mapping
    for (const s of resume.skills) {
        const techKey = s.name.toLowerCase().trim();
        const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
        if (mappings) {
            for (const m of mappings) {
                addEvidence({
                    skill: m.skill,
                    confidence: m.confidence,
                    source: "Skills Section",
                    trigger: s.name,
                    inference: m.inference,
                    type: "technology_map",
                    strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                });
            }
        }
    }

    // 2. Build full-text corpus for pattern matching
    const projectTexts = resume.projects.map(p =>
        `${p.title || ""} ${p.description || ""} ${(p.tech_stack || []).join(" ")}`
    );
    const experienceTexts = resume.experience.map(e =>
        `${e.role || ""} ${e.company || ""} ${e.description || ""} ${(e.skills_used || []).join(" ")}`
    );
    const allTexts = [
        ...projectTexts.map((text, i) => ({
            text,
            source: `Project: ${resume.projects[i]?.title || "Untitled"}`,
        })),
        ...experienceTexts.map((text, i) => ({
            text,
            source: `Experience: ${resume.experience[i]?.role || "Unknown"} at ${resume.experience[i]?.company || "Unknown"}`,
        })),
    ];

    // Add professional summary
    if (resume.professional_summary) {
        allTexts.push({
            text: resume.professional_summary,
            source: "Professional Summary",
        });
    }

    // 3. Scan text sections for technology mentions → capability mapping
    for (const { text, source } of allTexts) {
        const lowerText = text.toLowerCase();

        // Check individual technology mentions
        for (const [tech, mappings] of Object.entries(TECHNOLOGY_CAPABILITY_MAP)) {
            // Word-boundary match for the technology
            const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            if (regex.test(lowerText)) {
                for (const m of mappings) {
                    addEvidence({
                        skill: m.skill,
                        confidence: m.confidence,
                        source,
                        trigger: tech,
                        inference: m.inference,
                        type: "technology_map",
                        strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                    });
                }
            }
        }

        // Check stack bundles
        for (const [stack, mappings] of Object.entries(TECH_STACK_BUNDLES)) {
            const stackEscaped = stack.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const stackRegex = new RegExp(`\\b${stackEscaped}\\b`, 'i');
            if (stackRegex.test(lowerText)) {
                for (const m of mappings) {
                    addEvidence({
                        skill: m.skill,
                        confidence: m.confidence,
                        source,
                        trigger: stack,
                        inference: m.inference,
                        type: "stack_bundle",
                        strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                    });
                }
            }
        }

        // 4. Activity pattern matching
        for (const ap of ACTIVITY_PATTERNS) {
            if (ap.pattern.test(text)) {
                const match = text.match(ap.pattern);
                addEvidence({
                    skill: ap.skill,
                    confidence: ap.confidence,
                    source,
                    trigger: match?.[0] || "pattern match",
                    inference: ap.inference,
                    type: "activity_pattern",
                    strength: ap.strength,
                });
            }
        }
    }

    // 5. Project tech stacks — direct tech → capability mapping
    for (const project of resume.projects) {
        if (project.tech_stack) {
            for (const tech of project.tech_stack) {
                const techKey = tech.toLowerCase().trim();
                const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
                if (mappings) {
                    for (const m of mappings) {
                        addEvidence({
                            skill: m.skill,
                            confidence: m.confidence,
                            source: `Project: ${project.title || "Untitled"} (tech stack)`,
                            trigger: tech,
                            inference: m.inference,
                            type: "technology_map",
                            strength: m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "moderate" : "weak",
                        });
                    }
                }
            }
        }
    }

    // 6. Experience skills_used → capability mapping
    for (const exp of resume.experience) {
        if (exp.skills_used) {
            for (const tech of exp.skills_used) {
                const techKey = tech.toLowerCase().trim();
                const mappings = TECHNOLOGY_CAPABILITY_MAP[techKey];
                if (mappings) {
                    for (const m of mappings) {
                        addEvidence({
                            skill: m.skill,
                            confidence: Math.min(m.confidence + 5, 100), // Professional usage bumps confidence
                            source: `Experience: ${exp.role || "Unknown"} at ${exp.company || "Unknown"} (skills used)`,
                            trigger: tech,
                            inference: m.inference + " (professional usage)",
                            type: "technology_map",
                            strength: "strong", // Professional usage = strong
                        });
                    }
                }
            }
        }
    }

    // 7. Education → domain expertise
    for (const edu of resume.education_history) {
        const eduText = `${edu.degree || ""} ${edu.branch || ""} ${edu.level || ""}`;
        for (const edm of EDUCATION_DOMAIN_MAP) {
            if (edm.keywords.test(eduText)) {
                for (const m of edm.skills) {
                    addEvidence({
                        skill: m.skill,
                        confidence: m.confidence,
                        source: `Education: ${edu.degree || ""} - ${edu.branch || ""}`,
                        trigger: eduText.trim(),
                        inference: m.inference,
                        type: "education",
                        strength: "moderate",
                    });
                }
            }
        }
    }

    // 8. Certifications → validate skills
    for (const cert of resume.certifications) {
        const certText = `${cert.certification_name || ""} ${cert.issuer || ""}`.toLowerCase();
        for (const [tech, mappings] of Object.entries(TECHNOLOGY_CAPABILITY_MAP)) {
            const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp(`\\b${escaped}\\b`, 'i').test(certText)) {
                for (const m of mappings) {
                    addEvidence({
                        skill: m.skill,
                        confidence: Math.min(m.confidence + 5, 100),
                        source: `Certification: ${cert.certification_name || "Unknown"}`,
                        trigger: tech,
                        inference: m.inference + " (certified)",
                        type: "technology_map",
                        strength: "strong",
                    });
                }
            }
        }
    }

    return evidence;
}

// ============================================================================
// SEMANTIC SKILL MATCHER
// ============================================================================

/**
 * Given a JD skill requirement, checks if semantic evidence supports it.
 * Returns a match result if evidence is found, null otherwise.
 *
 * Matching strategy:
 * 1. Direct match: evidence.skill matches jdSkill
 * 2. Category match: jdSkill is in SKILL_CATEGORY_MAP, and evidence.trigger is in that category
 * 3. Evidence aggregation: multiple weak evidences can combine for higher confidence
 */
export function matchSkillSemantically(
    jdSkill: string,
    allEvidence: SemanticSkillEvidence[],
): SemanticMatchResult | null {
    const normalizedJdSkill = jdSkill.toLowerCase().trim();

    // 1. Direct match: find evidence where the inferred skill matches the JD skill
    const directMatches = allEvidence.filter(
        e => e.skill.toLowerCase().trim() === normalizedJdSkill
    );

    // 2. Category match: check if any evidence triggers match the skill category
    const categoryTerms = SKILL_CATEGORY_MAP[normalizedJdSkill] || [];
    const categoryMatches: SemanticSkillEvidence[] = [];

    if (categoryTerms.length > 0) {
        for (const e of allEvidence) {
            const triggerLower = e.trigger.toLowerCase().trim();
            if (categoryTerms.some(term => {
                // Word-boundary match for the term in the trigger
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(triggerLower) || triggerLower === term;
            })) {
                // Create a derived evidence entry
                categoryMatches.push({
                    ...e,
                    skill: jdSkill, // Remap to the JD skill name
                    inference: `${e.trigger} proves ${jdSkill} (${e.inference})`,
                });
            }
        }
    }

    // 3. Also check if an evidence trigger directly matches a TECHNOLOGY_CAPABILITY_MAP
    //    entry that maps to this JD skill via SKILL_CATEGORY_MAP
    //    (already handled by categoryMatches above — the trigger IS the technology)

    const allMatches = [...directMatches, ...categoryMatches];

    if (allMatches.length === 0) {
        return null;
    }

    // Aggregate confidence: take the highest individual confidence,
    // then boost slightly for multiple corroborating evidence sources.
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

// ============================================================================
// COMBINED EVIDENCE SCORER
// ============================================================================

/**
 * Combines semantic and keyword evidence into a final match decision.
 * Semantic: 70% weight, Keyword: 30% weight.
 */
export function combineEvidence(
    semanticResult: SemanticMatchResult | null,
    keywordLevel: number, // 0-4 from calculateEvidenceLevel
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

    // Convert keyword level (0-4) to a 0-100 confidence
    const keywordConfidence = keywordLevel === 0 ? 0 :
        keywordLevel === 1 ? 60 :
            keywordLevel === 2 ? 75 :
                keywordLevel === 3 ? 90 :
                    100; // level 4

    const semanticConfidence = semanticResult?.confidence ?? 0;

    // Weighted combination: 70% semantic, 30% keyword
    const combined = hasSemantic && hasKeyword
        ? (0.7 * semanticConfidence + 0.3 * keywordConfidence)
        : hasSemantic
            ? semanticConfidence  // Only semantic, use full confidence
            : keywordConfidence;  // Only keyword, use full confidence

    const primary_evidence_type: "semantic" | "keyword" | "both" =
        hasSemantic && hasKeyword ? "both" :
            hasSemantic ? "semantic" : "keyword";

    return {
        matched: combined >= 40, // Minimum threshold
        confidence: Math.round(combined),
        primary_evidence_type,
    };
}
