/**
 * Fictional guest-mode data. Every person, company and opening here is invented.
 * Embeddings for these profiles are precomputed (fixture-embeddings.json, built by
 * scripts/demo/build-embeddings.ts) so provisioning a workspace makes no AI calls.
 */
import type { ParsedJD } from "@/lib/db/schema";
import type { ParsedResumeData } from "@/lib/resume/ai-parser";

export interface FixtureOpening {
  key: string;
  company: string;
  title: string;
  location: string;
  packageOffered: string;
  minCgpa: number | null;
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  qualifications: string[];
}

export interface FixturePerson {
  key: string;
  name: string;
  headline: string;
  cgpa: number;
  branch: string;
  institution: string;
  graduation: string;
  skills: string[];
  projects: Array<{ title: string; description: string; techStack: string[] }>;
  experience: Array<{ company: string; role: string; duration: string; description: string }>;
  certifications: string[];
  achievements: string[];
}

export const FIXTURE_OPENINGS: FixtureOpening[] = [
  {
    key: "frontend",
    company: "Cedar Labs (fictional)",
    title: "Frontend Engineer",
    location: "Bengaluru · Hybrid",
    packageOffered: "₹14 LPA",
    minCgpa: 7,
    summary: "Build the customer-facing analytics dashboard used by thousands of small businesses.",
    responsibilities: [
      "Build accessible, responsive React interfaces from Figma designs",
      "Own client-side state, data fetching and performance budgets",
      "Write component and end-to-end tests",
      "Collaborate with backend engineers on API contracts",
    ],
    requiredSkills: ["React", "TypeScript", "JavaScript", "CSS", "HTML"],
    preferredSkills: ["Next.js", "Tailwind CSS", "Testing Library", "Playwright", "Figma"],
    qualifications: ["B.Tech/B.E. in CS or related field", "A portfolio of shipped web projects"],
  },
  {
    key: "backend",
    company: "Flint Systems (fictional)",
    title: "Backend Engineer",
    location: "Pune · On-site",
    packageOffered: "₹16 LPA",
    minCgpa: 7,
    summary: "Design and run the payment-reconciliation services behind a B2B invoicing platform.",
    responsibilities: [
      "Design REST APIs and background workers in Node.js",
      "Model relational data and write efficient PostgreSQL queries",
      "Containerise and deploy services, own their monitoring",
      "Review code and write integration tests",
    ],
    requiredSkills: ["Node.js", "PostgreSQL", "REST API", "SQL", "Docker"],
    preferredSkills: ["TypeScript", "Redis", "AWS", "Kafka", "System Design"],
    qualifications: ["B.Tech/B.E. in CS or related field", "Understanding of databases and networking"],
  },
  {
    key: "data",
    company: "Juniper Data (fictional)",
    title: "Data Analyst",
    location: "Remote · India",
    packageOffered: "₹10 LPA",
    minCgpa: 6.5,
    summary: "Turn product and sales data into dashboards and decisions for a retail analytics team.",
    responsibilities: [
      "Write SQL to clean, join and aggregate large datasets",
      "Build dashboards and present findings to stakeholders",
      "Design and analyse A/B tests",
      "Automate recurring reports with Python",
    ],
    requiredSkills: ["SQL", "Python", "Statistics", "Excel", "Data Visualization"],
    preferredSkills: ["Pandas", "Power BI", "Tableau", "A/B Testing"],
    qualifications: ["Any quantitative degree", "Comfort explaining numbers to non-technical teams"],
  },
  {
    key: "ml",
    company: "Quill AI (fictional)",
    title: "Machine Learning Engineer",
    location: "Hyderabad · Hybrid",
    packageOffered: "₹18 LPA",
    minCgpa: 7.5,
    summary: "Ship retrieval and ranking models for a document-search product.",
    responsibilities: [
      "Train, evaluate and deploy NLP and ranking models",
      "Build embedding and vector-search pipelines",
      "Design offline metrics and run experiments",
      "Serve models behind low-latency APIs",
    ],
    requiredSkills: ["Python", "Machine Learning", "PyTorch", "NLP", "SQL"],
    preferredSkills: ["Vector Databases", "Docker", "FastAPI", "Hugging Face", "MLOps"],
    qualifications: ["B.Tech/M.Tech in CS, AI or related field", "Projects or research in ML"],
  },
];

/** Profile pre-loaded for the guest student before they upload anything. */
export const SAMPLE_STUDENT: FixturePerson = {
  key: "sample-student",
  name: "Jordan Lee (sample)",
  headline: "Final-year CS student focused on full-stack web development",
  cgpa: 8.1,
  branch: "Computer Science",
  institution: "Northbridge Institute of Technology (fictional)",
  graduation: "2027",
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "HTML", "CSS", "Git", "Python", "SQL"],
  projects: [
    { title: "CampusCart", description: "Marketplace web app for students to buy and sell used textbooks, with search and chat.", techStack: ["React", "Node.js", "Express", "MongoDB"] },
    { title: "Study Planner", description: "Next.js app that schedules revision sessions from exam dates and tracks progress.", techStack: ["Next.js", "TypeScript", "Tailwind CSS"] },
    { title: "Weather Insights", description: "Python script and dashboard that visualises five years of city weather data.", techStack: ["Python", "Pandas", "Matplotlib"] },
  ],
  experience: [
    { company: "Brightline Software (fictional)", role: "Web Development Intern", duration: "May 2026 - Jul 2026", description: "Built React components for an internal admin console and fixed accessibility issues." },
  ],
  certifications: ["Responsive Web Design (fictional certificate)"],
  achievements: ["Finalist, Northbridge Hackathon 2025 (fictional)"],
};

export const FIXTURE_CANDIDATES: FixturePerson[] = [
  { key: "c1", name: "Aditi Rao", headline: "Frontend developer who loves design systems", cgpa: 8.7, branch: "Computer Science", institution: "Westfield University (fictional)", graduation: "2027",
    skills: ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Next.js", "Tailwind CSS", "Figma", "Playwright"],
    projects: [{ title: "Pixel UI Kit", description: "Accessible React component library with Storybook docs and visual tests.", techStack: ["React", "TypeScript", "Storybook", "Playwright"] },
      { title: "Portfolio Builder", description: "Next.js site generator for student portfolios.", techStack: ["Next.js", "Tailwind CSS"] }],
    experience: [{ company: "Orbit Studio (fictional)", role: "Frontend Intern", duration: "Jun 2026 - Aug 2026", description: "Shipped dashboard pages in React and cut bundle size by 30%." }],
    certifications: ["Web Accessibility Basics (fictional)"], achievements: ["Winner, UI Sprint 2026 (fictional)"] },
  { key: "c2", name: "Kabir Menon", headline: "Backend engineer focused on APIs and databases", cgpa: 8.2, branch: "Computer Science", institution: "Westfield University (fictional)", graduation: "2027",
    skills: ["Node.js", "TypeScript", "PostgreSQL", "SQL", "REST API", "Docker", "Redis", "AWS"],
    projects: [{ title: "LedgerLite", description: "Double-entry accounting API with PostgreSQL, idempotent payments and audit logs.", techStack: ["Node.js", "PostgreSQL", "Docker"] },
      { title: "RateGate", description: "Redis-backed rate limiter middleware published as an npm package.", techStack: ["TypeScript", "Redis"] }],
    experience: [{ company: "Harbor Pay (fictional)", role: "Backend Intern", duration: "May 2026 - Jul 2026", description: "Built reconciliation jobs and REST endpoints for invoice settlement." }],
    certifications: ["AWS Cloud Fundamentals (fictional)"], achievements: [] },
  { key: "c3", name: "Meera Iyer", headline: "Data analyst who turns messy data into decisions", cgpa: 8.9, branch: "Mathematics and Computing", institution: "Lakeside College (fictional)", graduation: "2027",
    skills: ["SQL", "Python", "Pandas", "Statistics", "Excel", "Power BI", "Data Visualization", "A/B Testing"],
    projects: [{ title: "Retail Basket Analysis", description: "Market-basket analysis on 2M transactions with SQL and Python; dashboard in Power BI.", techStack: ["SQL", "Python", "Power BI"] },
      { title: "Experiment Toolkit", description: "Notebook templates for A/B test power analysis and significance testing.", techStack: ["Python", "Statistics"] }],
    experience: [{ company: "Northstar Retail (fictional)", role: "Analytics Intern", duration: "May 2026 - Jul 2026", description: "Automated weekly sales reports and built a churn dashboard." }],
    certifications: ["Data Analysis with SQL (fictional)"], achievements: ["2nd place, Datathon 2025 (fictional)"] },
  { key: "c4", name: "Rohan Gupta", headline: "ML engineer building retrieval systems", cgpa: 8.4, branch: "Artificial Intelligence", institution: "Lakeside College (fictional)", graduation: "2027",
    skills: ["Python", "Machine Learning", "PyTorch", "NLP", "Hugging Face", "Vector Databases", "SQL", "FastAPI", "Docker"],
    projects: [{ title: "DocSeek", description: "Semantic search over research papers using sentence embeddings and a vector index.", techStack: ["Python", "PyTorch", "FAISS", "FastAPI"] },
      { title: "Toxicity Classifier", description: "Fine-tuned transformer for comment moderation with a model card.", techStack: ["Hugging Face", "PyTorch"] }],
    experience: [{ company: "Lumen Research Lab (fictional)", role: "Research Intern", duration: "Jan 2026 - Jun 2026", description: "Evaluated ranking models and built offline relevance metrics." }],
    certifications: [], achievements: ["Paper accepted at a student NLP workshop (fictional)"] },
  { key: "c5", name: "Sana Qureshi", headline: "Full-stack developer, React and Node.js", cgpa: 7.9, branch: "Information Technology", institution: "Westfield University (fictional)", graduation: "2027",
    skills: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "HTML", "CSS", "Git"],
    projects: [{ title: "EventHub", description: "Event booking platform with seat maps and email confirmations.", techStack: ["React", "Node.js", "MongoDB"] }],
    experience: [], certifications: [], achievements: [] },
  { key: "c6", name: "Vikram Joshi", headline: "Systems-minded backend developer", cgpa: 7.4, branch: "Computer Science", institution: "Hillcrest Institute (fictional)", graduation: "2027",
    skills: ["Java", "Spring Boot", "SQL", "MySQL", "REST API", "Kafka", "System Design"],
    projects: [{ title: "Order Pipeline", description: "Event-driven order processing with Kafka consumers and retries.", techStack: ["Java", "Kafka", "MySQL"] }],
    experience: [{ company: "Copperline Logistics (fictional)", role: "Software Intern", duration: "Jun 2026 - Aug 2026", description: "Wrote Spring Boot services for shipment tracking." }],
    certifications: [], achievements: [] },
  { key: "c7", name: "Ananya Das", headline: "Analytics and visualisation enthusiast", cgpa: 7.1, branch: "Economics", institution: "Hillcrest Institute (fictional)", graduation: "2027",
    skills: ["Excel", "SQL", "Tableau", "Statistics", "Data Visualization"],
    projects: [{ title: "City Budget Explorer", description: "Interactive Tableau dashboard of municipal spending.", techStack: ["Tableau", "Excel"] }],
    experience: [], certifications: ["Tableau Essentials (fictional)"], achievements: [] },
  { key: "c8", name: "Arjun Nair", headline: "Deep-learning practitioner", cgpa: 7.8, branch: "Electronics", institution: "Lakeside College (fictional)", graduation: "2027",
    skills: ["Python", "Machine Learning", "TensorFlow", "Computer Vision", "NumPy", "Pandas"],
    projects: [{ title: "Crop Disease Detector", description: "CNN that classifies leaf images; deployed as a mobile-friendly web demo.", techStack: ["TensorFlow", "Python"] }],
    experience: [], certifications: [], achievements: ["Top 10%, image-classification challenge (fictional)"] },
  { key: "c9", name: "Priya Shah", headline: "Frontend engineer with a testing mindset", cgpa: 7.6, branch: "Computer Science", institution: "Hillcrest Institute (fictional)", graduation: "2027",
    skills: ["JavaScript", "React", "CSS", "HTML", "Jest", "Testing Library", "Redux"],
    projects: [{ title: "Kanban Lite", description: "Drag-and-drop task board with full unit-test coverage.", techStack: ["React", "Redux", "Jest"] }],
    experience: [{ company: "Maple Apps (fictional)", role: "QA & Frontend Intern", duration: "May 2026 - Jul 2026", description: "Wrote component tests and fixed layout bugs across browsers." }],
    certifications: [], achievements: [] },
  { key: "c10", name: "Nikhil Verma", headline: "Cloud and DevOps learner", cgpa: 6.9, branch: "Information Technology", institution: "Westfield University (fictional)", graduation: "2027",
    skills: ["Docker", "Kubernetes", "AWS", "Linux", "Python", "CI/CD"],
    projects: [{ title: "Deploy Bot", description: "GitHub Actions pipeline that builds containers and deploys to a test cluster.", techStack: ["Docker", "Kubernetes", "GitHub Actions"] }],
    experience: [], certifications: ["Cloud Practitioner (fictional)"], achievements: [] },
  { key: "c11", name: "Ishita Bose", headline: "NLP and data science student", cgpa: 9.1, branch: "Artificial Intelligence", institution: "Westfield University (fictional)", graduation: "2027",
    skills: ["Python", "NLP", "Machine Learning", "Pandas", "SQL", "Statistics", "Hugging Face"],
    projects: [{ title: "Review Summariser", description: "Abstractive summaries of product reviews with a fine-tuned seq2seq model.", techStack: ["Python", "Hugging Face"] },
      { title: "Survey Insights", description: "Topic modelling on open-text survey answers with SQL-backed storage.", techStack: ["Python", "SQL"] }],
    experience: [{ company: "Fernhill Analytics (fictional)", role: "Data Science Intern", duration: "May 2026 - Jul 2026", description: "Built text-classification baselines and evaluation reports." }],
    certifications: [], achievements: ["Dean's list 2025 (fictional)"] },
  { key: "c12", name: "Dev Malhotra", headline: "Generalist developer exploring the web", cgpa: 6.4, branch: "Mechanical Engineering", institution: "Hillcrest Institute (fictional)", graduation: "2027",
    skills: ["HTML", "CSS", "JavaScript", "Python"],
    projects: [{ title: "Recipe Box", description: "Static recipe site with search, built while learning JavaScript.", techStack: ["HTML", "CSS", "JavaScript"] }],
    experience: [], certifications: [], achievements: [] },
];

/** Plain-text resume for "Try Sample Resume" — parsed live by the AI pipeline. */
export const SAMPLE_RESUME_TEXT = `JORDAN LEE (FICTIONAL SAMPLE)
jordan.lee@example.invalid · github.com/example-jordan

SUMMARY
Final-year Computer Science student who builds full-stack web apps. Interested in frontend engineering and developer tooling.

EDUCATION
Northbridge Institute of Technology (fictional) — B.Tech, Computer Science, 2023–2027. CGPA 8.1/10.

EXPERIENCE
Web Development Intern, Brightline Software (fictional) — May 2026 to Jul 2026
- Built 12 React components for an internal admin console in TypeScript.
- Fixed 30+ accessibility issues found with axe and keyboard testing.
- Added Playwright smoke tests to the CI pipeline.

PROJECTS
CampusCart — React, Node.js, Express, MongoDB
- Marketplace for students to buy and sell used textbooks, with search and real-time chat.
Study Planner — Next.js, TypeScript, Tailwind CSS
- Schedules revision sessions from exam dates and tracks progress; 200 weekly users on campus.
Weather Insights — Python, Pandas, Matplotlib
- Analysed five years of city weather data and published a dashboard.

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Web: React, Next.js, Node.js, Express, HTML, CSS, Tailwind CSS
Tools: Git, Docker (basic), Playwright, Figma

ACHIEVEMENTS
Finalist, Northbridge Hackathon 2025 (fictional)
`;

const skillCategory = (name: string) =>
  /react|next|css|html|tailwind|figma|redux/i.test(name) ? "Frontend"
    : /node|express|spring|rest|kafka|postgres|mysql|mongo|redis|sql/i.test(name) ? "Backend & Data"
      : /docker|kubernetes|aws|linux|ci\/cd|git/i.test(name) ? "Tools & Cloud"
        : /learning|pytorch|tensorflow|nlp|vision|hugging|vector|mlops/i.test(name) ? "AI / ML"
          : "General";

/** Builds the ParsedResumeData shape (used by ATS analysis) from a fixture person. */
export function toParsedResume(person: FixturePerson): ParsedResumeData {
  return {
    full_name: person.name,
    email: null,
    phone: null,
    linkedin_url: null,
    professional_summary: person.headline,
    coding_profiles: [],
    education_history: [{ institution: person.institution, degree: "B.Tech", branch: person.branch, expected_graduation: person.graduation, current_cgpa: person.cgpa }],
    experience: person.experience.map((e) => ({ company: e.company, role: e.role, duration: e.duration, description: e.description, is_internship: /intern/i.test(e.role) })),
    projects: person.projects.map((p) => ({ title: p.title, description: p.description, tech_stack: p.techStack })),
    skills: person.skills.map((name) => ({ name, category: skillCategory(name) })),
    research_papers: [],
    certifications: person.certifications.map((c) => ({ certification_name: c })),
    achievements: person.achievements.map((a) => ({ title: a })),
    soft_skills: [],
  } as unknown as ParsedResumeData;
}

/** Student-table profile columns for a fixture person. */
export function toStudentProfile(person: FixturePerson) {
  return {
    cgpa: person.cgpa,
    branch: person.branch,
    skills: person.skills.map((name, i) => ({ name, proficiency: (i < 3 ? 4 : 3) as 3 | 4, category: skillCategory(name) })),
    projects: person.projects.map((p) => ({ title: p.title, description: p.description, techStack: p.techStack })),
    workExperience: person.experience.map((e) => {
      const [start, end] = e.duration.split(" - ");
      return { company: e.company, role: e.role, description: e.description, startDate: start, endDate: end };
    }),
    certifications: person.certifications.map((title) => ({ title, issuer: "Fictional issuer" })),
    achievements: person.achievements.map((title) => ({ title })),
    softSkills: [] as string[],
  };
}

/** Legacy-shape parsed JD understood by the ranking pipeline. */
export function toParsedJd(opening: FixtureOpening): ParsedJD {
  return {
    company: opening.company,
    title: opening.title,
    summary: opening.summary,
    responsibilities: opening.responsibilities,
    requiredSkills: opening.requiredSkills,
    preferredSkills: opening.preferredSkills,
    qualifications: opening.qualifications,
  };
}

export function toRawJd(opening: FixtureOpening): string {
  return [
    `${opening.title} — ${opening.company}`,
    `Location: ${opening.location}. Compensation: ${opening.packageOffered}.`,
    "", opening.summary, "",
    "Responsibilities:", ...opening.responsibilities.map((r) => `- ${r}`), "",
    `Required skills: ${opening.requiredSkills.join(", ")}.`,
    `Preferred skills: ${opening.preferredSkills.join(", ")}.`,
    `Qualifications: ${opening.qualifications.join("; ")}.`,
    opening.minCgpa ? `Minimum CGPA: ${opening.minCgpa}.` : "",
  ].join("\n");
}

/**
 * Embedding text for a guest opening. The shared composer only reads the v2
 * StructuredJD shape, so guest openings (legacy ParsedJD shape) use this.
 */
export function demoJdEmbeddingText(jd: { title: string; responsibilities: string[]; requiredSkills: string[]; preferredSkills: string[]; qualifications: string[] }): string {
  return [
    `Role: ${jd.title}`,
    jd.responsibilities.length ? `Responsibilities: ${jd.responsibilities.join("; ")}` : "",
    jd.requiredSkills.length ? `Required Skills: ${jd.requiredSkills.join(", ")}` : "",
    jd.preferredSkills.length ? `Preferred Skills: ${jd.preferredSkills.join(", ")}` : "",
    jd.qualifications.length ? `Qualifications: ${jd.qualifications.join("; ")}` : "",
  ].filter(Boolean).join(". ").slice(0, 8000);
}
