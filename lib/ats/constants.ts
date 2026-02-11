
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
    "Node.js": ["Node", "NodeJS", "node.js", "node"],
    "React.js": ["React", "ReactJS", "react.js", "react"],
    "PostgreSQL": ["Postgres", "postgres", "psql"],
    "Kubernetes": ["K8s", "k8s"],
    "Machine Learning": ["ML", "machine-learning"],
    "Deep Learning": ["DL", "deep-learning"],
    "Git": ["GitHub", "GitLab", "version control", "git", "bitbucket"],
    "C++": ["cpp", "c plus plus"],
    "C#": ["csharp", "c sharp", ".net"],
    "Go": ["golang"],
    "Amazon Web Services": ["aws"],
    "Google Cloud Platform": ["gcp"],
    "Microsoft Azure": ["azure"]
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
