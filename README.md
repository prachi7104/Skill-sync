# SkillSync — AI-Powered Placement Copilot

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SkillSync** is an intelligent, high-performance placement management platform designed to bridge the gap between students and recruitment drives. By leveraging a multi-model AI orchestration engine, SkillSync provides resilient, cost-effective, and highly accurate career tools for students and faculty alike.

---

## ✨ Core Features

### 🧠 Antigravity Router (Multi-tier AI)
SkillSync’s backbone is the **Antigravity Router**, an intelligent fallback system that optimizes for cost, speed, and accuracy across multiple providers (Google Gemini, Groq, and Local).
- **Tier 1 (Reliable)**: Google Gemini 1.5/2.0 Flash for complex resume/JD parsing.
- **Tier 2 (Pro)**: Google Gemini 2.0 Pro for advanced reasoning.
- **Tier 3 (Speed)**: Groq Llama 3 (70B/8B) for ultra-fast chat and ranking.
- **Tier 0 (Local)**: Local Transformers for zero-latency, private embeddings.

### 📄 Intelligent Resume Processing
- **AI-Driven Parsing**: High-fidelity extraction of skills, projects, and education from PDF/DOCX.
- **Smart Upload**: Optimized flow that preserves existing data for returning students.
- **Structure Score**: Evaluates resume quality based on semantic depth and industry standards.

### 🎯 Smart Ranking & Matching
- **Hybrid Scoring Engine**: Matches students to Job Descriptions (JDs) using a weighted algorithm (70% Semantic Vector Search + 30% Structured Skill Overlap).
- **Missed Opportunities**: Provides granular feedback on which skills are missing for a specific role.

### 🧪 Recruitment Sandbox v2
- **Simulation Environment**: Test "what-if" scenarios by uploading custom resumes against specific JDs.
- **Real-time Feedback**: Instant semantic scoring and improvement suggestions.

---

## 🛠️ Technological Foundation

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Database** | PostgreSQL (Supabase) + Drizzle ORM |
| **AI Orchestration** | Custom *Antigravity* Module |
| **Auth** | NextAuth.js (Microsoft OAuth + Role-based access) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand (Lightweight & Reactive) |
| **Validation** | Zod + React Hook Form |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20.x
- A Supabase project (PostgreSQL)
- API Keys for Google Gemini and Groq

### 2. Installation
```bash
git clone https://github.com/prachi7104/Skill-sync.git
cd Skill-sync
npm install
```

### 3. Environment Configuration
Create a `.env.local` file:
```env
# Database
DATABASE_URL="postgres://user:pass@host:5432/db"

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY="your-key"
GROQ_API_KEY="your-key"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"
```

### 4. Database Setup
SkillSync uses a manual schema management approach for production safety:
```bash
# Push schema changes (blocked by default, use with caution)
npm run drizzle:push 

# Apply indexes for vector search
npm run db:index
```

### 5. Running the App
```bash
npm run dev
```
Visit `http://localhost:3000`

---

## 📂 Project Structure

```text
├── app/               # Next.js App Router (Admin, Faculty, Student routes)
├── components/        # Shared UI components (shadcn/ui + custom)
├── lib/               # Core business logic (Antigravity engine, DB, AI)
├── drizzle/           # Schema definitions and migrations
├── scripts/           # Management utilities (RLS tests, ranking, seeding)
└── types/             # Shared TypeScript interfaces
```

---

## 🛡️ Architecture & Security
- **Row-Level Security (RLS)**: Enforced via Supabase for granular data protection between Students and Faculty.
- **Multi-Tenant Isolation**: Ensures sensitive student data is only accessible to authorized personnel.
- **Resilient AI**: Automatic provider fallback ensures 99.9% availability even on free-tier quotas.

---

## 📄 Documentation
- [Architecture Deep Dive](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [MVP Development Progress](MVP_40_SUBPHASES.md)

---

## ✅ Pre-Deploy Checklist
- □ `npx tsc --noEmit` → 0 errors
- □ `npm run test` → all pass
- □ `npm run lint` → 0 warnings
- □ Supabase: verify RLS policies (`scripts/verify-rls.ts`)
- □ Supabase: verify indexes (`pg_indexes`)
- □ Test student login: no `college_id null` errors in Vercel logs
- □ Test drive creation: verify `public.drives.college_id` is set
- □ Test ranking trigger: wait for cron, verify rankings appear
- □ Test sandbox: submit JD, verify scores and card feedback appear

---

## 🤝 Contributing
Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.