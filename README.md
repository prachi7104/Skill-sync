# SkillSync — AI-Powered Placement Copilot

SkillSync is an intelligent placement management platform that bridges the gap between students and recruitment drives. It features the **Antigravity Router**, a multi-model AI orchestration engine that optimizes for cost, speed, and accuracy across Google Gemini, Groq, and local models.

## 🚀 Key Features

- **Antigravity Router**: Intelligent fallback system routing tasks to Gemini 1.5 Flash (Tier 1), Groq Llama 3 (Tier 3), or Local Embeddings (Tier 0) based on real-time rate limits and task complexity.
- **AI Resume Parsing**: Extracts structured data (skills, projects, education) from PDF/DOCX resumes with high fidelity.
- **Smart Ranking Engine**: Matches students to JDs using a hybrid score (70% Semantic Vector Search + 30% Structured Skill Overlap).
- **Sandbox v2**: Detailed Resume vs. JD analysis. Upload a custom resume to see how well it targets a specific role, with semantic scoring and "Missed Opportunities" insights.
- **Smart Resume Upload**: Optimized upload flow that preserves existing parsing data for fully onboarded students.
- **Automated Mock Interviews**: AI-driven voice/text interviews with real-time feedback.
- **Role-Based Access**: Granular permissions for Students, Faculty, and Admins.

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **AI Orchestration**: Custom "Antigravity" module
- **Auth**: NextAuth.js v4 (Middleware protected)

## 🏁 Quick Start

1.  **Clone & Install**
    ```bash
    git clone https://github.com/your-org/skillsync.git
    cd skillsync
    npm install
    ```

2.  **Environment Setup**
    Create a `.env.local` file with the following keys:
    ```env
    # Database (Supabase)
    DATABASE_URL="postgres://user:pass@host:5432/db"

    # AI Providers
    GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."
    GROQ_API_KEY="gsk_..."

    # Auth
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-secret-key"
    ```

3.  **Run Migrations**
    ```bash
    npm run drizzle:push
    ```

4.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000)

## 🧠 Antigravity Architecture

The `AntigravityRouter` (`lib/antigravity/router.ts`) allows SkillSync to operate resiliently on free-tier quotas:

| Tier | Provider | Models | Best For |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Google | Gemini 2.5 Flash | Long-context Resume/JD Parsing |
| **Tier 2** | Google | Gemini 2.5 Pro | Complex reasoning & explanations |
| **Tier 3** | Groq | Llama 3 70B/8B | High-throughput Chat & Ranking |
| **Tier 4** | Groq | Llama Prompt Guard | Input Sanitization & Safety |
| **Tier 0** | Local | Xenova/all-MiniLM-L6-v2 | Zero-latency Embeddings (384d) |

## 📊 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed Vercel setup.

## 📄 Documentation

- **MVP Technical Report**: [MVP_TECHNICAL_REPORT.md](MVP_TECHNICAL_REPORT.md) - Detailed analysis of limits, metrics, and logic.
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - System design & RLS policies.
