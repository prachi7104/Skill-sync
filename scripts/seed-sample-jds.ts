import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import { sampleJds } from '../lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Fixed IDs for idempotency
const JD_IDS = {
    TCS: '11111111-1111-1111-1111-111111111111',
    INFOSYS: '22222222-2222-2222-2222-222222222222',
    WIPRO: '33333333-3333-3333-3333-333333333333',
    CAPGEMINI: '44444444-4444-4444-4444-444444444444',
    ACCENTURE: '55555555-5555-5555-5555-555555555555',
};

const SAMPLE_DATA = [
    {
        id: JD_IDS.TCS,
        company: 'TCS Digital',
        title: 'Software Engineer',
        jdText: `Role: Software Engineer — TCS Digital
Location: Pan India | CTC: ₹7–9 LPA

About the Role:
TCS Digital is looking for talented Software Engineers to join our Digital Engineering practice. You will design and build scalable enterprise applications, work with microservices architectures, and contribute to digital transformation projects for Fortune 500 clients.

Required Skills:
- Proficiency in Java, Python, or JavaScript/TypeScript
- Strong understanding of Data Structures and Algorithms
- Experience with REST APIs and microservices architecture
- Familiarity with SQL databases (PostgreSQL, MySQL) and NoSQL (MongoDB)
- Understanding of Git, CI/CD pipelines, and Agile methodology
- Knowledge of cloud platforms (AWS/Azure/GCP) is a plus

Eligibility Criteria:
- B.Tech CSE (all specializations) — Batch 2025/2026
- Minimum CGPA: 7.0 (no active backlogs)
- Strong problem-solving and communication skills

Responsibilities:
- Develop and maintain enterprise-grade software solutions
- Participate in design reviews and code walkthroughs
- Collaborate with cross-functional teams across geographies
- Write clean, well-tested, and production-ready code`,
        isDeletable: true,
    },
    {
        id: JD_IDS.INFOSYS,
        company: 'Infosys',
        title: 'Specialist Programmer',
        jdText: `Role: Specialist Programmer — Infosys
Location: Bengaluru / Pune / Hyderabad | CTC: ₹9–11.5 LPA

About the Role:
Join Infosys as a Specialist Programmer and work on cutting-edge technology projects involving AI/ML, full-stack development, and cloud-native solutions. This role is for high-performing graduates who demonstrate strong coding and problem-solving abilities.

Required Skills:
- Strong proficiency in Python, Java, or C++ with competitive coding experience
- Knowledge of Machine Learning fundamentals: supervised/unsupervised learning, model evaluation
- Experience with web frameworks: React, Next.js, Spring Boot, or Django
- Understanding of databases: SQL (joins, indexing) and NoSQL
- Familiarity with Docker, Kubernetes, and cloud services (AWS/Azure)
- Good understanding of OOP, Design Patterns, and System Design basics

Eligibility Criteria:
- B.Tech CSE, CSE (AI & ML), CSE (Data Science), or IT — Batch 2025/2026
- Minimum CGPA: 7.5 (no active backlogs)

Responsibilities:
- Build and deploy scalable full-stack applications
- Implement ML pipelines and data processing workflows
- Contribute to open-source and internal tools development
- Mentor junior developers and conduct tech sessions`,
        isDeletable: true,
    },
    {
        id: JD_IDS.WIPRO,
        company: 'Wipro Turbo',
        title: 'Product Engineer',
        jdText: `Role: Product Engineer — Wipro Turbo
Location: Multiple Locations | CTC: ₹6.5–8 LPA

About the Role:
Wipro Turbo seeks Product Engineers who can build, test, and ship product features in fast-paced engineering teams. You will work on SaaS products, ERP integrations, and customer-facing platforms used by millions.

Required Skills:
- Proficiency in at least one programming language: Java, Python, JavaScript, or C#
- Understanding of web technologies: HTML, CSS, React or Angular
- Knowledge of relational databases and SQL query optimization
- Familiarity with version control (Git) and Agile/Scrum processes
- Basic understanding of APIs (REST, GraphQL) and authentication (OAuth, JWT)
- Problem-solving aptitude tested through coding assessments

Eligibility Criteria:
- B.Tech CSE (all specializations) — Batch 2025/2026
- Minimum CGPA: 6.5 (no active backlogs)

Responsibilities:
- Develop and maintain web applications and backend services
- Write unit and integration tests to ensure product quality
- Participate in sprint planning, daily standups, and retrospectives
- Debug and resolve production issues within SLA timelines
- Collaborate with product managers and UX designers`,
        isDeletable: true,
    },
    {
        id: JD_IDS.CAPGEMINI,
        company: 'Capgemini',
        title: 'Data Analyst',
        jdText: `Role: Data Analyst — Capgemini
Location: Mumbai / Bengaluru / Noida | CTC: ₹7–8.5 LPA

About the Role:
Capgemini is hiring Data Analysts who can transform raw data into actionable business insights. You will work with enterprise datasets, build dashboards, and support data-driven decision-making for global clients across BFSI, retail, and healthcare sectors.

Required Skills:
- Strong proficiency in Python (Pandas, NumPy, Matplotlib) and SQL
- Experience with data visualization tools: Power BI, Tableau, or Looker
- Understanding of statistical analysis, hypothesis testing, and regression
- Knowledge of data cleaning, ETL processes, and data warehousing concepts
- Familiarity with machine learning basics: classification, clustering, feature engineering
- Experience with Jupyter notebooks and version control (Git)

Eligibility Criteria:
- B.Tech CSE (Data Science), CSE (AI & ML), or IT — Batch 2025/2026
- Minimum CGPA: 7.0 (no active backlogs)

Responsibilities:
- Analyze large datasets to uncover trends and patterns
- Build and maintain automated reporting dashboards
- Collaborate with business stakeholders to define KPIs and metrics
- Present data findings through clear visualizations and reports
- Support ML engineers with feature engineering and data preparation`,
        isDeletable: true,
    },
    {
        id: JD_IDS.ACCENTURE,
        company: 'Accenture',
        title: 'Cloud Associate',
        jdText: `Role: Cloud Associate — Accenture
Location: Pan India | CTC: ₹6.5–8 LPA

About the Role:
Accenture is seeking Cloud Associates to join our Cloud First practice. You will help clients migrate, modernize, and manage their cloud infrastructure across AWS, Azure, and GCP. This role blends infrastructure engineering with DevOps practices.

Required Skills:
- Understanding of cloud platforms: AWS (EC2, S3, Lambda, RDS) or Azure fundamentals
- Knowledge of Linux system administration and shell scripting (Bash)
- Familiarity with containerization: Docker and Kubernetes basics
- Understanding of networking: TCP/IP, DNS, load balancing, VPNs
- Experience with Infrastructure as Code: Terraform or CloudFormation
- Basic knowledge of CI/CD tools: Jenkins, GitHub Actions, or GitLab CI

Eligibility Criteria:
- B.Tech CSE (Cloud Computing), CSE, or IT — Batch 2025/2026
- Minimum CGPA: 6.5 (no active backlogs)
- AWS/Azure certifications are a plus but not mandatory

Responsibilities:
- Provision and manage cloud infrastructure for client projects
- Implement CI/CD pipelines and automated deployment workflows
- Monitor system health using CloudWatch, Prometheus, or Grafana
- Troubleshoot production infrastructure issues
- Document architecture decisions and runbooks`,
        isDeletable: true,
    },
];

async function seed() {
    console.log('🌱 Starting seed: sample_jds (UPES pilot)...');

    try {
        for (const jd of SAMPLE_DATA) {
            console.log(`   Writing: ${jd.company} — ${jd.title}`);

            await db.insert(sampleJds)
                .values(jd)
                .onConflictDoUpdate({
                    target: sampleJds.id,
                    set: jd,
                });
        }

        console.log(`✅ Successfully seeded ${SAMPLE_DATA.length} sample JDs.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
