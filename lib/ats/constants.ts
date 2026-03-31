
import { SeniorityLevel } from "./types";

export const REF_DATE = new Date();

export const TECH_STACK_CLUSTERS: Record<string, string[]> = {
    "Java Enterprise": [
        "Spring Boot", "Spring MVC", "Hibernate", "JPA",
        "Maven", "Gradle", "JUnit", "Java 8+", "Tomcat", "Jakarta EE", "Microservices"
    ],
    "MERN Stack": [
        "MongoDB", "Express.js", "React.js", "Node.js",
        "JavaScript", "TypeScript", "REST APIs", "NPM", "Next.js", "Redux"
    ],
    "Python ML/AI": [
        "PyTorch", "TensorFlow", "scikit-learn", "Pandas",
        "NumPy", "Jupyter", "MLflow", "Transformers", "Keras", "OpenCV"
    ],
    "Python Web": [
        "Django", "Flask", "FastAPI", "SQLAlchemy",
        "Celery", "Redis", "PostgreSQL", "Gunicorn"
    ],
    "Android Native": [
        "Kotlin", "Android SDK", "Jetpack Compose",
        "Coroutines", "Room", "Retrofit", "Java (Android)"
    ],
    "iOS Native": [
        "Swift", "SwiftUI", "UIKit", "Combine",
        "CoreData", "XCode", "Objective-C"
    ],
    "Data Engineering": [
        "Spark", "Airflow", "Kafka", "Hadoop",
        "Databricks", "ETL", "BigQuery", "Snowflake", "dbt"
    ],
    "DevOps/SRE": [
        "Kubernetes", "Docker", "Jenkins", "Terraform",
        "AWS", "GCP", "Azure", "GitLab CI", "Prometheus", "Ansible", "Linux"
    ],
    "Research/Academic ML": [
        "PyTorch", "JAX", "Transformers", "HuggingFace",
        "LaTeX", "Research", "Publications", "arXiv"
    ],
    "Automation/No-Code": [
        "Make.com", "Zapier", "n8n", "Integromat", "Airtable", "workflow automation",
        "process automation", "no-code", "low-code", "RPA", "email automation",
        "LinkedIn automation", "lead generation", "outreach automation",
        "HubSpot", "Salesforce automation", "CRM automation", "API integrations",
        "email marketing", "drip campaigns"
    ],
    "AI/LLM Engineering": [
        "LLM", "GPT", "OpenAI", "ChatGPT API", "Anthropic API", "Gemini API",
        "LangChain", "RAG", "vector database", "prompt engineering",
        "HuggingFace", "Whisper", "OCR", "LLM inference", "embeddings",
        "fine-tuning", "RLHF", "AI pipeline", "document parsing", "LLM integration",
        "Pinecone", "Chroma", "Weaviate", "FAISS"
    ]
};

export const SENIORITY_LEVELS: Record<SeniorityLevel, { years_min: number; years_max: number; indicators: string[] }> = {
    "Intern": {
        years_min: 0,
        years_max: 1,
        indicators: ["intern", "trainee", "student", "summer analyst"]
    },
    "Entry": {
        years_min: 0,
        years_max: 2,
        indicators: ["junior", "associate", "graduate", "analyst"]
    },
    "Mid": {
        years_min: 2,
        years_max: 5,
        indicators: ["engineer", "developer", "consultant", "sde ii", "swe ii"]
    },
    "Senior": {
        years_min: 5,
        years_max: 10,
        indicators: ["senior", "lead", "staff", "sde iii", "senior sw"]
    },
    "Staff+": {
        years_min: 10,
        years_max: 100,
        indicators: ["staff", "principal", "distinguished", "fellow", "architect"]
    },
    "Unknown": {
        years_min: 0,
        years_max: 0,
        indicators: []
    }
};

export const SKILL_ALIASES: Record<string, string[]> = {
    // ── JavaScript ecosystem ──
    // Node.js variants — "nodejs", "node js" (with space), "node.js"
    "Node.js": ["Node", "NodeJS", "nodejs", "node.js", "node", "node js"],
    // React variants — React Native also implies React
    "React.js": ["React", "ReactJS", "react.js", "react", "React Native", "reactjs"],
    "Next.js": ["Next", "NextJS", "next.js", "nextjs", "next js"],
    "Express.js": ["Express", "ExpressJS", "express.js", "express", "expressjs"],
    "Vue.js": ["Vue", "VueJS", "vue.js", "vue", "vuejs"],
    "Angular": ["AngularJS", "angular.js", "Angular 2+", "angularjs"],
    // JS: plain acronym "JS" is very common; "ES6" etc. — TypeScript is a superset so also alias here
    "JavaScript": ["JS", "js", "ECMAScript", "ES6", "ES2015+", "vanilla js", "vanilla javascript", "es2015", "es2017", "es2020"],
    // TypeScript — TS infers JS knowledge
    "TypeScript": ["TS", "ts", "typescript"],
    // React Native — mobile dev with JS/React
    "React Native": ["react-native", "reactnative", "rn"],
    // Svelte, Gatsby extras
    "Svelte": ["svelte", "sveltekit"],
    "Gatsby": ["gatsby", "gatsby.js", "gatsbyjs"],
    "Redux": ["redux", "react-redux", "zustand", "jotai", "recoil"],

    // ── Java ecosystem ──
    "Spring Boot": ["Spring", "Spring Framework", "SpringBoot", "spring boot", "Spring MVC", "springboot"],
    "Java": ["java", "Java SE", "Java EE", "Jakarta EE", "Core Java", "J2EE"],
    "Hibernate": ["JPA", "Java Persistence", "hibernate"],
    "Kotlin": ["kotlin"],

    // ── Python ecosystem ──
    "Python": ["python", "Python3", "python3", "py"],
    "Django": ["django", "Django REST", "DRF", "Django REST Framework"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi", "fast api"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch", "torch"],
    "scikit-learn": ["sklearn", "scikit learn", "scikit-learn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Matplotlib": ["matplotlib", "seaborn", "plotly"],
    "Keras": ["keras"],

    // ── Databases ──
    "PostgreSQL": ["Postgres", "postgres", "psql", "pg", "postgresql"],
    "MongoDB": ["Mongo", "mongo", "mongoose", "mongodb"],
    "MySQL": ["mysql", "MariaDB", "mariadb"],
    "Redis": ["redis"],
    "SQLite": ["sqlite", "sqlite3"],
    // Plain "SQL" — matches any SQL database skill requirement
    "SQL": ["sql", "structured query language", "pl/sql", "plsql", "t-sql", "tsql"],
    "Database": ["database management", "RDBMS", "rdbms", "databases"],
    "Oracle": ["oracle", "oracle db"],

    // ── Cloud & DevOps ──
    "Amazon Web Services": ["aws", "AWS", "amazon web services", "ec2", "s3", "lambda", "ecs", "eks"],
    "Google Cloud Platform": ["gcp", "GCP", "Google Cloud", "google cloud platform", "cloud run", "bigquery"],
    "Microsoft Azure": ["azure", "Azure", "microsoft azure"],
    "Kubernetes": ["K8s", "k8s", "kubernetes"],
    "Docker": ["docker", "containerization", "containers", "dockerfile"],
    "Jenkins": ["jenkins"],
    "Terraform": ["terraform", "IaC"],
    "GitHub Actions": ["github actions", "github-actions", "gh actions"],
    "GitLab CI": ["gitlab ci", "gitlab-ci", "gitlabci"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment", "continuous delivery", "pipeline"],
    "Linux": ["linux", "Unix", "ubuntu", "centos", "debian", "bash", "shell", "shell scripting"],
    "Nginx": ["nginx", "apache"],

    // ── Mobile ──
    "Android": ["android", "android development", "android sdk", "android studio"],
    "iOS": ["ios", "ios development", "xcode"],
    "Swift": ["swift"],
    "Flutter": ["flutter", "dart"],

    // ── General / CS ──
    "Machine Learning": ["ML", "ml", "machine-learning", "machine learning"],
    "Deep Learning": ["DL", "dl", "deep-learning", "deep learning"],
    "Artificial Intelligence": ["AI", "ai", "artificial intelligence"],
    "Natural Language Processing": ["NLP", "nlp", "natural language processing"],
    "Computer Vision": ["CV", "cv", "computer vision", "image processing", "image recognition"],
    "Data Structures": ["DSA", "dsa", "data structures", "algorithms", "data structures and algorithms", "CS fundamentals", "OOPS", "OOP", "object-oriented", "object oriented programming"],
    "Git": ["GitHub", "GitLab", "version control", "git", "bitbucket", "vcs"],
    "C++": ["cpp", "c plus plus", "C/C++", "c/c++"],
    "C#": ["csharp", "c sharp", ".NET", ".net", "dotnet", "asp.net"],
    "Go": ["golang", "Golang"],
    "Rust": ["rust"],
    "REST API": ["REST", "rest", "RESTful", "REST APIs", "RESTful API", "RESTful services", "restful apis", "rest api", "api development", "api design"],
    "GraphQL": ["graphql", "graph ql"],
    "Agile": ["agile", "Scrum", "scrum", "Kanban", "kanban", "jira", "sprint"],
    "Testing": ["unit testing", "integration testing", "JUnit", "Jest", "pytest", "TDD", "e2e testing", "qa", "test-driven development"],
    "System Design": ["system design", "high level design", "HLD", "LLD", "low level design", "distributed systems", "scalability"],
    "Networking": ["tcp/ip", "http", "https", "networking", "socket programming", "websocket", "grpc"],
    "C": ["c programming", "c language"],
    "PHP": ["php", "laravel", "wordpress", "codeigniter"],
    "R": ["r programming", "r language"],

    // ── Automation & No-Code ──
    "Make.com": ["make", "integromat", "Make (formerly Integromat)", "make.com", "make automation"],
    "Zapier": ["zapier"],
    "n8n": ["n8n", "n8n.io"],
    "workflow automation": ["automation", "automated workflows", "process automation", "workflow", "automating tasks", "automate", "automation workflows", "business automation"],
    "LinkedIn automation": ["linkedin outreach", "linkedin automation", "linkedin campaigns", "linkedin marketing", "linkedin api"],
    "no-code tools": ["no-code", "low-code", "nocode", "lowcode", "no code", "low code", "no-code/low-code", "zero-code", "citizen developer"],
    "email marketing": ["email campaigns", "email outreach", "drip campaigns", "email automation", "cold email", "email sequences", "email marketing campaigns", "email blast"],
    "lead generation": ["lead gen", "lead generation", "outbound leads", "prospect automation", "lead nurturing", "pipeline generation"],
    "API integrations": ["api integration", "third-party api", "webhook", "webhooks", "api connections", "external api", "integrate apis"],

    // ── AI/LLM Engineering ──
    "LLM": ["large language model", "language model", "llm inference", "llm integration", "foundation model", "generative ai", "genai", "gen ai"],
    "prompt engineering": ["prompt design", "prompting", "system prompt", "prompt writing", "prompt optimization", "prompt tuning", "prompt crafting"],
    "OCR": ["optical character recognition", "document parsing", "tesseract", "document extraction", "document ocr", "pdf extraction"],
    "Whisper": ["whisper asr", "speech recognition", "audio transcription", "openai whisper", "whisper model", "asr model"],
    "LangChain": ["langchain", "lang chain", "langchain.js"],
    "RAG": ["retrieval augmented generation", "rag pipeline", "vector search", "knowledge retrieval"],
    "OpenAI API": ["openai", "chatgpt api", "gpt api", "gpt-4", "gpt-3.5", "openai integration"],
    "Gemini API": ["gemini", "google gemini", "bard api", "gemini pro"],
    "vector database": ["pinecone", "weaviate", "qdrant", "chroma", "milvus", "faiss", "vector store", "embedding store"],
    "HuggingFace": ["hugging face", "huggingface", "transformers library", "hf models"],
    "XGBoost": ["xgboost", "xgb", "gradient boosting", "gbm"],
    "self-learning": ["self-learn", "self-taught", "independent learning", "self-driven", "autodidact"],
};

export const IMPLICIT_SKILLS = {
    "Git": {
        strong_signals: ["git", "GitHub", "GitLab", "pull request", "PR", "merge", "branch", "version control"],
        weak_signals: ["github.com"],
        credit: { strong: 0.7, weak: 0.4 }
    },
    "REST API": {
        strong_signals: ["built api", "api development", "backend service", "endpoints", "restful"],
        weak_signals: [],
        credit: { strong: 0.6, weak: 0.0 }
    },
    "Debugging": {
        strong_signals: ["troubleshooting", "bug fixes", "issue resolution", "root cause analysis"],
        weak_signals: [],
        credit: { strong: 0.5, weak: 0.0 }
    },
    "Testing": {
        strong_signals: ["junit", "jest", "pytest", "unit test", "integration test", "e2e", "qa", "test coverage"],
        weak_signals: [],
        credit: { strong: 0.6, weak: 0.0 }
    }
};

export const RESEARCH_INDICATORS = {
    strong: [
        "published paper", "conference", "neurips", "icml", "iclr", "cvpr", "acl",
        "arxiv", "thesis", "dissertation", "first author", "research scientist"
    ],
    moderate: [
        "research intern", "research assistant", "undergraduate research",
        "lab work", "academic project", "research associate"
    ],
    weak: [
        "course project", "literature review", "capstone"
    ]
};
