
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
    "Node.js": ["Node", "NodeJS", "node.js", "node"],
    "React.js": ["React", "ReactJS", "react.js", "react", "React Native"],
    "Next.js": ["Next", "NextJS", "next.js", "nextjs"],
    "Express.js": ["Express", "ExpressJS", "express.js", "express"],
    "Vue.js": ["Vue", "VueJS", "vue.js", "vue"],
    "Angular": ["AngularJS", "angular.js", "Angular 2+"],
    "JavaScript": ["JS", "ECMAScript", "ES6", "ES2015+", "vanilla js"],
    "TypeScript": ["TS", "typescript"],

    // ── Java ecosystem ──
    "Spring Boot": ["Spring", "Spring Framework", "SpringBoot", "spring boot", "Spring MVC"],
    "Java": ["java", "Java SE", "Java EE", "Jakarta EE", "Core Java", "J2EE"],
    "Hibernate": ["JPA", "Java Persistence", "hibernate"],

    // ── Python ecosystem ──
    "Python": ["python", "Python3", "python3", "py"],
    "Django": ["django", "Django REST", "DRF", "Django REST Framework"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi", "fast api"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch", "torch"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],

    // ── Databases ──
    "PostgreSQL": ["Postgres", "postgres", "psql", "pg"],
    "MongoDB": ["Mongo", "mongo", "mongoose"],
    "MySQL": ["mysql", "MariaDB", "mariadb"],
    "Redis": ["redis"],
    "SQLite": ["sqlite", "sqlite3"],

    // ── Cloud & DevOps ──
    "Amazon Web Services": ["aws", "AWS"],
    "Google Cloud Platform": ["gcp", "GCP", "Google Cloud"],
    "Microsoft Azure": ["azure", "Azure"],
    "Kubernetes": ["K8s", "k8s", "kubernetes"],
    "Docker": ["docker", "containerization", "containers"],
    "Jenkins": ["jenkins"],
    "Terraform": ["terraform", "IaC"],

    // ── General ──
    "Machine Learning": ["ML", "machine-learning", "machine learning"],
    "Deep Learning": ["DL", "deep-learning", "deep learning"],
    "Artificial Intelligence": ["AI", "artificial intelligence"],
    "Natural Language Processing": ["NLP", "nlp"],
    "Computer Vision": ["CV", "computer vision", "image processing"],
    "Git": ["GitHub", "GitLab", "version control", "git", "bitbucket"],
    "C++": ["cpp", "c plus plus", "C/C++"],
    "C#": ["csharp", "c sharp", ".NET", ".net", "dotnet"],
    "Go": ["golang", "Golang"],
    "Rust": ["rust"],
    "REST API": ["REST", "RESTful", "REST APIs", "RESTful API", "RESTful services"],
    "GraphQL": ["graphql", "graph ql"],
    "Linux": ["linux", "Unix", "ubuntu", "centos", "debian"],
    "Agile": ["agile", "Scrum", "scrum", "Kanban"],
    "Testing": ["unit testing", "integration testing", "JUnit", "Jest", "pytest", "TDD"],
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
