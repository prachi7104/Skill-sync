# MVP Development: 40 Subphases Breakdown
**Target:** 5K students | Free Tier Only | Student → Faculty Priority  
**Timeline:** Weeks 1-4 (adjust per velocity)  
**Testing:** 50 students at MVP completion

---

## PHASE 1: FOUNDATION SETUP (Subphases 1-5)

### Subphase 1.1: Project Initialization
**Layer:** DevOps  
**Duration:** 2 hours  
**Deliverable:** Running Next.js 14 app on localhost

**Tasks:**
```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest placement-copilot --typescript --tailwind --app --no-src-dir

# Install core dependencies
npm install zustand drizzle-orm drizzle-kit postgres
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @types/node @types/react @types/react-dom

# Install AI SDKs
npm install @ai-sdk/google @ai-sdk/groq @ai-sdk/mistral
npm install @xenova/transformers # Local embeddings
npm install pdf-parse mammoth # Resume parsing

# Install utilities
npm install date-fns nanoid bcryptjs
npm install -D @types/bcryptjs
```

**Project Structure:**
```
placement-copilot/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (student)/
│   │   ├── profile/
│   │   └── sandbox/
│   ├── (faculty)/
│   │   ├── dashboard/
│   │   └── drives/
│   └── api/
├── lib/
│   ├── db/
│   ├── models/
│   ├── auth/
│   └── utils/
├── components/
│   ├── ui/
│   ├── student/
│   └── faculty/
└── drizzle/
```

**Verification:**
- `npm run dev` → http://localhost:3000 loads
- No errors in console

---

### Subphase 1.2: Environment Configuration
**Layer:** DevOps  
**Duration:** 1 hour  
**Deliverable:** `.env.local` with all API keys

**Tasks:**
1. Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Models (Free Tier)
GROQ_API_KEY=your-groq-key
MISTRAL_API_KEY=your-mistral-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Queue (if using Valkey/Redis)
REDIS_URL=redis://localhost:6379
```

2. Add to `.gitignore`:
```
.env*.local
node_modules/
.next/
```

**Verification:**
- All keys present and not committed to git

---

### Subphase 1.3: Supabase Project Setup
**Layer:** DB + Backend  
**Duration:** 1 hour  
**Deliverable:** Supabase project connected to Next.js

**Tasks:**
1. Go to https://supabase.com → Create new project
   - Project name: `placement-copilot-mvp`
   - Database password: Save securely
   - Region: Closest to your location
   - Plan: Free tier (500MB)

2. Enable required extensions in Supabase SQL Editor:
```sql
-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

3. Create Supabase client (`lib/supabase/client.ts`):
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClientComponentClient();

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

4. Create server client (`lib/supabase/server.ts`):
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createServerClient = () => {
  return createServerComponentClient({ cookies });
};
```

**Verification:**
- Run test query in API route to confirm connection

---

### Subphase 1.4: Shadcn/ui Component Library Setup
**Layer:** Frontend  
**Duration:** 1 hour  
**Deliverable:** Reusable UI components installed

**Tasks:**
1. Initialize shadcn/ui:
```bash
npx shadcn-ui@latest init
# Choose: New York style, Zinc color, CSS variables
```

2. Install essential components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

3. Create custom theme in `tailwind.config.ts`:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: { /* Your brand colors */ },
        secondary: { /* ... */ },
      },
    },
  },
};
```

**Verification:**
- Create test page with all components to verify styling

---

### Subphase 1.5: Testing Infrastructure
**Layer:** DevOps  
**Duration:** 2 hours  
**Deliverable:** `npm test` runs successfully

**Tasks:**
1. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

2. Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

3. Add test scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

4. Create sample test (`tests/example.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Verification:**
- Run `npm test` → All tests pass
- Run `npm run build` → No TypeScript errors

---

## PHASE 2: DATABASE ARCHITECTURE (Subphases 6-10)

### Subphase 2.1: Core Schema Design
**Layer:** DB  
**Duration:** 3 hours  
**Deliverable:** Complete Drizzle schema with all tables

**Tasks:**
1. Create `lib/db/schema.ts`:
```typescript
import { pgTable, uuid, text, timestamp, integer, real, jsonb, vector, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const roleEnum = pgEnum('role', ['student', 'faculty', 'admin']);
export const batchCategoryEnum = pgEnum('batch_category', ['alpha', 'beta', 'gamma']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const jobTypeEnum = pgEnum('job_type', ['parse_resume', 'generate_embedding', 'enhance_jd', 'rank_students']);

// Users table (shared across all roles)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: roleEnum('role').notNull().default('student'),
  microsoftId: text('microsoft_id').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Students table (extends users)
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Identity
  sapId: text('sap_id').unique(),
  rollNo: text('roll_no'),
  phone: text('phone'),
  linkedinUrl: text('linkedin_url'),
  address: text('address'),
  dob: timestamp('dob'),
  
  // Academic
  class10Marks: real('class10_marks'),
  class12Marks: real('class12_marks'),
  currentCGPA: real('current_cgpa'),
  semester: integer('semester'),
  branch: text('branch'),
  batchYear: integer('batch_year'),
  batchCategory: batchCategoryEnum('batch_category'),
  specialization: text('specialization'),
  
  // Profile data (JSON)
  projects: jsonb('projects').$type<Project[]>(),
  workExperience: jsonb('work_experience').$type<WorkExperience[]>(),
  skills: jsonb('skills').$type<Skill[]>(),
  certifications: jsonb('certifications').$type<Certification[]>(),
  codingProfiles: jsonb('coding_profiles').$type<CodingProfile[]>(),
  researchPapers: jsonb('research_papers').$type<ResearchPaper[]>(),
  achievements: jsonb('achievements').$type<Achievement[]>(),
  softSkills: jsonb('soft_skills').$type<string[]>(),
  
  // Resume
  resumeUrl: text('resume_url'),
  resumeParsedAt: timestamp('resume_parsed_at'),
  resumeParseAccuracy: real('resume_parse_accuracy'),
  
  // Embedding
  embedding: vector('embedding', { dimensions: 384 }), // all-MiniLM-L6-v2
  embeddingGeneratedAt: timestamp('embedding_generated_at'),
  
  // Profile metadata
  profileCompleteness: integer('profile_completeness').default(0), // 0-100
  onboardingStep: integer('onboarding_step').default(0), // 0-6
  
  // Sandbox usage
  sandboxUsageToday: integer('sandbox_usage_today').default(0),
  sandboxUsageMonth: integer('sandbox_usage_month').default(0),
  lastSandboxReset: timestamp('last_sandbox_reset'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Drives table (placement opportunities)
export const drives = pgTable('drives', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  
  // Company details
  companyName: text('company_name').notNull(),
  companyTier: text('company_tier'), // 'tier1', 'tier2', 'tier3'
  roleName: text('role_name').notNull(),
  
  // JD
  jdOriginal: text('jd_original').notNull(), // Raw pasted JD
  jdEnhanced: text('jd_enhanced'), // AI-enhanced version
  jdParsed: jsonb('jd_parsed').$type<ParsedJD>(), // Structured data
  jdEmbedding: vector('jd_embedding', { dimensions: 384 }),
  
  // Eligibility
  minCGPA: real('min_cgpa'),
  allowedBranches: jsonb('allowed_branches').$type<string[]>(),
  allowedBatches: jsonb('allowed_batches').$type<number[]>(),
  allowedCategories: jsonb('allowed_categories').$type<('alpha' | 'beta' | 'gamma')[]>(),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  deadline: timestamp('deadline'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Rankings table (student rankings per drive)
export const rankings = pgTable('rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  driveId: uuid('drive_id').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  
  // Scores
  matchScore: real('match_score').notNull(), // 0-100
  semanticScore: real('semantic_score'), // Cosine similarity
  structuredScore: real('structured_score'), // Skill/experience match
  
  // Analysis
  missingSkills: jsonb('missing_skills').$type<string[]>(),
  matchedSkills: jsonb('matched_skills').$type<string[]>(),
  explanationShort: text('explanation_short'),
  explanationDetailed: text('explanation_detailed'),
  
  rank: integer('rank'), // 1, 2, 3, ...
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Jobs queue (background processing)
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: jobTypeEnum('type').notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  
  // Payload
  payload: jsonb('payload').notNull(), // Task-specific data
  result: jsonb('result'), // Output after completion
  error: text('error'), // Error message if failed
  
  // Processing
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  priority: integer('priority').default(1), // 1=low, 2=medium, 3=high, 4=urgent
  
  // Model routing
  modelUsed: text('model_used'),
  latency: integer('latency'), // milliseconds
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// Sample JDs (pre-filled for testing)
export const sampleJDs = pgTable('sample_jds', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(), // "Google SWE Intern"
  companyName: text('company_name').notNull(),
  jdText: text('jd_text').notNull(),
  isDeletable: boolean('is_deletable').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for JSON columns
export type Project = {
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  duration?: string;
};

export type WorkExperience = {
  company: string;
  role: string;
  duration: string;
  description: string;
  technologies: string[];
};

export type Skill = {
  name: string;
  category: 'primary' | 'secondary';
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert
};

export type Certification = {
  name: string;
  issuer: string;
  verificationUrl?: string;
  dateObtained?: string;
};

export type CodingProfile = {
  platform: 'leetcode' | 'codeforces' | 'codechef' | 'github';
  username: string;
  rating?: number;
  problemsSolved?: number;
  lastSynced?: string;
};

export type ResearchPaper = {
  title: string;
  field: string;
  doi?: string;
  skillsDemonstrated: string[];
};

export type Achievement = {
  title: string;
  description: string;
  date?: string;
};

export type ParsedJD = {
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience?: number;
  responsibilities: string[];
  qualifications: string[];
};
```

**Verification:**
- No TypeScript errors in schema file

---

### Subphase 2.2: Drizzle Configuration & Migration
**Layer:** DB  
**Duration:** 1 hour  
**Deliverable:** Database tables created in Supabase

**Tasks:**
1. Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

2. Generate migration:
```bash
npx drizzle-kit generate:pg
```

3. Push to database:
```bash
npx drizzle-kit push:pg
```

4. Create db connection (`lib/db/index.ts`):
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
```

**Verification:**
- Check Supabase Table Editor → All tables visible
- Run test insert query

---

### Subphase 2.3: Row-Level Security (RLS) Policies
**Layer:** DB  
**Duration:** 2 hours  
**Deliverable:** RLS enabled with proper policies

**Tasks:**
Execute in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_jds ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- STUDENTS table policies
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Faculty can view all students"
  ON students FOR SELECT
  USING (get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert students"
  ON students FOR INSERT
  WITH CHECK (true); -- Controlled by backend logic

-- DRIVES table policies
CREATE POLICY "All authenticated users can view active drives"
  ON drives FOR SELECT
  USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Faculty can create drives"
  ON drives FOR INSERT
  WITH CHECK (get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "Faculty can update own drives"
  ON drives FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Faculty can delete own drives"
  ON drives FOR DELETE
  USING (created_by = auth.uid());

-- RANKINGS table policies
CREATE POLICY "Students can view own rankings"
  ON rankings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can view all rankings"
  ON rankings FOR SELECT
  USING (get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "Service role can insert rankings"
  ON rankings FOR INSERT
  WITH CHECK (true);

-- JOBS table policies (admin only for monitoring)
CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Service role can manage jobs"
  ON jobs FOR ALL
  USING (true);

-- SAMPLE_JDS table policies
CREATE POLICY "All users can view sample JDs"
  ON sample_jds FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sample JDs"
  ON sample_jds FOR ALL
  USING (get_user_role() = 'admin');
```

**Verification:**
- Test as student user → Can only see own data
- Test as faculty → Can see all students
- Test unauthorized access → Denied

---

### Subphase 2.4: Database Indexes & Performance
**Layer:** DB  
**Duration:** 1 hour  
**Deliverable:** Optimized query performance

**Tasks:**
Execute in Supabase SQL Editor:

```sql
-- Students table indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_sap_id ON students(sap_id);
CREATE INDEX idx_students_batch ON students(batch_year, branch);
CREATE INDEX idx_students_cgpa ON students(current_cgpa);
CREATE INDEX idx_students_completeness ON students(profile_completeness);

-- Vector search index (HNSW for fast similarity search)
CREATE INDEX idx_students_embedding ON students 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_drives_embedding ON drives
USING hnsw (jd_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Rankings indexes
CREATE INDEX idx_rankings_drive_id ON rankings(drive_id);
CREATE INDEX idx_rankings_student_id ON rankings(student_id);
CREATE INDEX idx_rankings_score ON rankings(drive_id, match_score DESC);

-- Jobs queue indexes
CREATE INDEX idx_jobs_status ON jobs(status, priority DESC, created_at ASC);
CREATE INDEX idx_jobs_type ON jobs(type, status);

-- Drives indexes
CREATE INDEX idx_drives_active ON drives(is_active, created_at DESC);
CREATE INDEX idx_drives_created_by ON drives(created_by);

-- Composite index for eligibility filtering
CREATE INDEX idx_students_eligibility ON students(
  current_cgpa, 
  branch, 
  batch_year, 
  batch_category
);
```

**Verification:**
- Run `EXPLAIN ANALYZE` on common queries
- Check index usage

---

### Subphase 2.5: Seed Data (Sample JDs)
**Layer:** DB  
**Duration:** 1 hour  
**Deliverable:** 2-3 pre-filled sample JDs in database

**Tasks:**
1. Create seed script (`scripts/seed-sample-jds.ts`):
```typescript
import { db } from '@/lib/db';
import { sampleJDs } from '@/lib/db/schema';

const sampleJDData = [
  {
    title: 'Google SWE Intern 2026',
    companyName: 'Google',
    jdText: `
Job Description: Software Engineering Intern - Summer 2026

Requirements:
- Currently pursuing BS/MS in Computer Science or related field
- Strong foundation in data structures and algorithms
- Proficiency in one or more: Java, C++, Python, Go
- Experience with distributed systems (preferred)
- Previous internship experience is a plus

Responsibilities:
- Design and implement scalable backend services
- Collaborate with cross-functional teams
- Write clean, maintainable code with comprehensive tests
- Participate in code reviews and design discussions

Minimum Qualifications:
- CGPA: 7.5+
- Strong problem-solving skills
- Excellent communication

Tech Stack: Java, Go, Kubernetes, gRPC, Protocol Buffers
    `.trim(),
    isDeletable: true,
  },
  {
    title: 'Amazon SDE Intern',
    companyName: 'Amazon',
    jdText: `
Software Development Engineer Intern - Amazon Web Services

About the Role:
Join AWS to build next-generation cloud services used by millions.

Required Skills:
- Data structures and algorithms expertise
- Object-oriented programming (Java, C++, or C#)
- Database fundamentals (SQL/NoSQL)
- Version control (Git)

Preferred:
- AWS certification
- Previous internship at tech company
- Open source contributions
- Competitive programming experience

Eligibility:
- CGPA: 7.0+
- Graduation: 2026 or 2027
- All branches except Civil

Technologies: Java, AWS (Lambda, DynamoDB, S3), Docker
    `.trim(),
    isDeletable: true,
  },
  {
    title: 'Microsoft AI Researcher',
    companyName: 'Microsoft',
    jdText: `
AI Research Intern - Microsoft Research India

Position Overview:
Work with leading AI researchers on cutting-edge NLP and vision projects.

Must Have:
- Strong math background (Linear Algebra, Probability, Calculus)
- Deep learning frameworks (PyTorch or TensorFlow)
- Research publications or projects in ML/AI
- Python expert-level proficiency

Nice to Have:
- Experience with transformers, LLMs
- Kaggle competitions participation
- Research papers in top-tier conferences (NeurIPS, ICML, ICLR)

Qualifications:
- CGPA: 8.5+
- Pursuing MS/PhD in CS/AI/ML
- Strong academic record

Tech: Python, PyTorch, Hugging Face, Azure ML
    `.trim(),
    isDeletable: true,
  },
];

async function seedSampleJDs() {
  console.log('Seeding sample JDs...');
  
  for (const jd of sampleJDData) {
    await db.insert(sampleJDs).values(jd);
    console.log(`✓ Inserted: ${jd.title}`);
  }
  
  console.log('Seed completed!');
}

seedSampleJDs().catch(console.error);
```

2. Add script to `package.json`:
```json
{
  "scripts": {
    "seed": "tsx scripts/seed-sample-jds.ts"
  }
}
```

3. Run seed:
```bash
npm install -D tsx
npm run seed
```

**Verification:**
- Query `sample_jds` table → 3 rows present
- Verify `is_deletable = true`

---

## PHASE 3: AUTHENTICATION & MIDDLEWARE (Subphases 11-15)

### Subphase 3.1: Microsoft OAuth Setup
**Layer:** Backend  
**Duration:** 2 hours  
**Deliverable:** Microsoft login working with institutional email

**Tasks:**
1. Register app in Azure AD:
   - Go to https://portal.azure.com → Azure Active Directory → App registrations
   - New registration → Name: "Placement Copilot"
   - Redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
   - Copy: Application (client) ID, Directory (tenant) ID
   - Create client secret → Copy value

2. Install NextAuth:
```bash
npm install next-auth @next-auth/drizzle-adapter
```

3. Create auth config (`lib/auth/config.ts`):
```typescript
import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { db } from '@/lib/db';
import { users, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email!;
      
      // Check if institutional email
      if (!email.endsWith('@yourcollegename.edu')) {
        return false; // Reject non-institutional emails
      }
      
      // Determine role based on email pattern
      let role: 'student' | 'faculty' | 'admin' = 'student';
      if (email.includes('faculty') || email.includes('prof')) {
        role = 'faculty';
      } else if (email.includes('admin')) {
        role = 'admin';
      }
      
      // Create or update user
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (!existingUser) {
        const [newUser] = await db.insert(users).values({
          email,
          name: user.name || '',
          role,
          microsoftId: account?.providerAccountId,
        }).returning();
        
        // Create student profile if role is student
        if (role === 'student') {
          await db.insert(students).values({
            userId: newUser.id,
          });
        }
      }
      
      return true;
    },
    
    async session({ session, token }) {
      if (token.sub) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, session.user.email!),
        });
        
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
        }
      }
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  
  pages: {
    signIn: '/',
    error: '/',
  },
  
  session: {
    strategy: 'jwt',
  },
};
```

4. Create auth API route (`app/api/auth/[...nextauth]/route.ts`):
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

5. Create login page (`app/page.tsx`):
```typescript
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Placement Copilot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
            className="w-full"
            size="lg"
          >
            Sign in with Microsoft
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Use your institutional email (@yourcollegename.edu)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Verification:**
- Login with test Microsoft account
- Check `users` table for new entry
- Session persists across page reloads

---

### Subphase 3.2: Auth Middleware & Route Protection
**Layer:** Backend  
**Duration:** 1 hour  
**Deliverable:** Protected routes enforce authentication

**Tasks:**
1. Create middleware (`middleware.ts`):
```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Redirect to root auth page if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Role-based access control
    const role = token.role as string;
    
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (path.startsWith('/faculty') && !['faculty', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (path.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/student/:path*',
    '/faculty/:path*',
    '/admin/:path*',
    '/api/profiles/:path*',
    '/api/drives/:path*',
  ],
};
```

2. Create session provider wrapper (`app/providers.tsx`):
```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

3. Update root layout (`app/layout.tsx`):
```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Verification:**
- Accessing `/student` without login → Redirects to `/`
- Faculty user accessing `/student` → Redirects to `/unauthorized`

---

### Subphase 3.3: User Session Helpers
**Layer:** Backend  
**Duration:** 1 hour  
**Deliverable:** Reusable auth helper functions

**Tasks:**
Create `lib/auth/helpers.ts`:
```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { db } from '@/lib/db';
import { users, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });
  
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireRole(allowedRoles: ('student' | 'faculty' | 'admin')[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

export async function getStudentProfile(userId: string) {
  const profile = await db.query.students.findFirst({
    where: eq(students.userId, userId),
  });
  
  return profile;
}

export async function requireStudentProfile() {
  const user = await requireRole(['student']);
  const profile = await getStudentProfile(user.id);
  
  if (!profile) {
    throw new Error('Student profile not found');
  }
  
  return { user, profile };
}
```

**Verification:**
- Call `requireAuth()` in API route → Returns user or throws
- Call `requireRole(['faculty'])` as student → Throws error

---

### Subphase 3.4: Client-Side Auth Hooks
**Layer:** Frontend  
**Duration:** 1 hour  
**Deliverable:** React hooks for auth state

**Tasks:**
Create `lib/auth/hooks.ts`:
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    role: session?.user?.role,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  return { isLoading };
}

export function useRequireRole(allowedRoles: string[]) {
  const { role, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.push('/unauthorized');
    }
  }, [isLoading, role, allowedRoles, router]);
  
  return { isLoading };
}
```

**Verification:**
- Use `useAuth()` in component → Returns correct user data
- Use `useRequireRole(['faculty'])` as student → Redirects

---

### Subphase 3.5: Role-Based Layout Wrapper
**Layer:** Frontend  
**Duration:** 1 hour  
**Deliverable:** Shared layout with role-based navigation

**Tasks:**
1. Create student layout (`app/(student)/layout.tsx`):
```typescript
'use client';

import { useRequireRole } from '@/lib/auth/hooks';
import { SidebarNav } from '@/components/student/sidebar-nav';
import { Header } from '@/components/shared/header';

export default function StudentLayout({ children }) {
  const { isLoading } = useRequireRole(['student']);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

2. Create faculty layout (`app/(faculty)/layout.tsx`):
```typescript
'use client';

import { useRequireRole } from '@/lib/auth/hooks';
import { SidebarNav } from '@/components/faculty/sidebar-nav';
import { Header } from '@/components/shared/header';

export default function FacultyLayout({ children }) {
  const { isLoading } = useRequireRole(['faculty', 'admin']);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

3. Create shared header component (`components/shared/header.tsx`):
```typescript
'use client';

import { useAuth } from '@/lib/auth/hooks';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user } = useAuth();
  
  return (
    <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Placement Copilot</h1>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut()}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

**Verification:**
- Login as student → See student navigation
- Login as faculty → See faculty navigation
- Logout button works

---

## PHASE 4: STUDENT PROFILE SYSTEM (Subphases 16-20)

### Subphase 4.1: Profile State Management
**Layer:** Frontend  
**Duration:** 2 hours  
**Deliverable:** Zustand store for profile data

**Tasks:**
Create `lib/stores/profile-store.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, WorkExperience, Skill, Certification, CodingProfile, ResearchPaper, Achievement } from '@/lib/db/schema';

interface ProfileState {
  // Step 0: Resume
  resumeUrl: string | null;
  resumeFile: File | null;
  
  // Step 1: Identity
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  address: string;
  dob: Date | null;
  sapId: string;
  rollNo: string;
  
  // Step 2: Academic
  class10Marks: number | null;
  class12Marks: number | null;
  currentCGPA: number | null;
  semester: number | null;
  branch: string;
  batchYear: number | null;
  batchCategory: 'alpha' | 'beta' | 'gamma' | null;
  specialization: string;
  
  // Step 3: Proof
  projects: Project[];
  workExperience: WorkExperience[];
  certifications: Certification[];
  researchPapers: ResearchPaper[];
  
  // Step 4: Coding
  codingProfiles: CodingProfile[];
  
  // Step 5: Soft Skills
  softSkills: string[];
  achievements: Achievement[];
  
  // Step 6: Skills
  skills: Skill[];
  
  // Navigation
  currentStep: number;
  
  // Actions
  setResumeFile: (file: File | null) => void;
  setResumeUrl: (url: string | null) => void;
  updateIdentity: (data: Partial<ProfileState>) => void;
  updateAcademic: (data: Partial<ProfileState>) => void;
  addProject: (project: Project) => void;
  removeProject: (index: number) => void;
  addWorkExperience: (exp: WorkExperience) => void;
  removeWorkExperience: (index: number) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (index: number) => void;
  addCodingProfile: (profile: CodingProfile) => void;
  removeCodingProfile: (index: number) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (index: number) => void;
  setSoftSkills: (skills: string[]) => void;
  addAchievement: (achievement: Achievement) => void;
  removeAchievement: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  loadFromDB: (data: any) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      resumeUrl: null,
      resumeFile: null,
      name: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      address: '',
      dob: null,
      sapId: '',
      rollNo: '',
      class10Marks: null,
      class12Marks: null,
      currentCGPA: null,
      semester: null,
      branch: '',
      batchYear: null,
      batchCategory: null,
      specialization: '',
      projects: [],
      workExperience: [],
      certifications: [],
      researchPapers: [],
      codingProfiles: [],
      softSkills: [],
      achievements: [],
      skills: [],
      currentStep: 0,
      
      // Actions
      setResumeFile: (file) => set({ resumeFile: file }),
      setResumeUrl: (url) => set({ resumeUrl: url }),
      
      updateIdentity: (data) => set({ ...data }),
      updateAcademic: (data) => set({ ...data }),
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project],
      })),
      removeProject: (index) => set((state) => ({
        projects: state.projects.filter((_, i) => i !== index),
      })),
      
      addWorkExperience: (exp) => set((state) => ({
        workExperience: [...state.workExperience, exp],
      })),
      removeWorkExperience: (index) => set((state) => ({
        workExperience: state.workExperience.filter((_, i) => i !== index),
      })),
      
      addCertification: (cert) => set((state) => ({
        certifications: [...state.certifications, cert],
      })),
      removeCertification: (index) => set((state) => ({
        certifications: state.certifications.filter((_, i) => i !== index),
      })),
      
      addCodingProfile: (profile) => set((state) => ({
        codingProfiles: [...state.codingProfiles, profile],
      })),
      removeCodingProfile: (index) => set((state) => ({
        codingProfiles: state.codingProfiles.filter((_, i) => i !== index),
      })),
      
      addSkill: (skill) => set((state) => ({
        skills: [...state.skills, skill],
      })),
      removeSkill: (index) => set((state) => ({
        skills: state.skills.filter((_, i) => i !== index),
      })),
      
      setSoftSkills: (skills) => set({ softSkills: skills }),
      
      addAchievement: (achievement) => set((state) => ({
        achievements: [...state.achievements, achievement],
      })),
      removeAchievement: (index) => set((state) => ({
        achievements: state.achievements.filter((_, i) => i !== index),
      })),
      
      nextStep: () => set((state) => ({
        currentStep: Math.min(state.currentStep + 1, 6),
      })),
      prevStep: () => set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 0),
      })),
      goToStep: (step) => set({ currentStep: step }),
      
      reset: () => set({
        resumeUrl: null,
        resumeFile: null,
        name: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        address: '',
        dob: null,
        sapId: '',
        rollNo: '',
        class10Marks: null,
        class12Marks: null,
        currentCGPA: null,
        semester: null,
        branch: '',
        batchYear: null,
        batchCategory: null,
        specialization: '',
        projects: [],
        workExperience: [],
        certifications: [],
        researchPapers: [],
        codingProfiles: [],
        softSkills: [],
        achievements: [],
        skills: [],
        currentStep: 0,
      }),
      
      loadFromDB: (data) => set({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        linkedinUrl: data.linkedinUrl || '',
        address: data.address || '',
        dob: data.dob ? new Date(data.dob) : null,
        sapId: data.sapId || '',
        rollNo: data.rollNo || '',
        class10Marks: data.class10Marks,
        class12Marks: data.class12Marks,
        currentCGPA: data.currentCGPA,
        semester: data.semester,
        branch: data.branch || '',
        batchYear: data.batchYear,
        batchCategory: data.batchCategory,
        specialization: data.specialization || '',
        projects: data.projects || [],
        workExperience: data.workExperience || [],
        certifications: data.certifications || [],
        researchPapers: data.researchPapers || [],
        codingProfiles: data.codingProfiles || [],
        softSkills: data.softSkills || [],
        achievements: data.achievements || [],
        skills: data.skills || [],
        resumeUrl: data.resumeUrl,
        currentStep: data.onboardingStep || 0,
      }),
    }),
    {
      name: 'profile-storage',
    }
  )
);
```

**Verification:**
- Import store in component → No TypeScript errors
- Update state → Persists across page refresh

---

### Subphase 4.2: 6-Step Onboarding UI (Steps 0-2)
**Layer:** Frontend  
**Duration:** 4 hours  
**Deliverable:** Steps 0-2 UI with form validation

**Tasks:**
1. Create onboarding shell (`app/(student)/profile/page.tsx`):
```typescript
'use client';

import { useProfileStore } from '@/lib/stores/profile-store';
import { StepIndicator } from '@/components/student/step-indicator';
import { Step0Resume } from '@/components/student/steps/step0-resume';
import { Step1Identity } from '@/components/student/steps/step1-identity';
import { Step2Academic } from '@/components/student/steps/step2-academic';

const steps = [
  { number: 0, title: 'Resume Upload' },
  { number: 1, title: 'Identity' },
  { number: 2, title: 'Academic Roots' },
  { number: 3, title: 'Proof Layer' },
  { number: 4, title: 'Coder Identity' },
  { number: 5, title: 'Soft Skills' },
  { number: 6, title: 'Master Resume' },
];

export default function ProfilePage() {
  const { currentStep } = useProfileStore();
  
  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={steps} currentStep={currentStep} />
      
      <div className="mt-8">
        {currentStep === 0 && <Step0Resume />}
        {currentStep === 1 && <Step1Identity />}
        {currentStep === 2 && <Step2Academic />}
        {/* Steps 3-6 will be added in next subphase */}
      </div>
    </div>
  );
}
```

2. Create step indicator (`components/student/step-indicator.tsx`):
```typescript
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                step.number < currentStep && 'bg-green-500 border-green-500 text-white',
                step.number === currentStep && 'bg-blue-500 border-blue-500 text-white',
                step.number > currentStep && 'bg-gray-100 border-gray-300 text-gray-400'
              )}
            >
              {step.number < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-center font-medium">{step.title}</p>
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2',
                step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

3. Create Step 0 - Resume Upload (`components/student/steps/step0-resume.tsx`):
```typescript
'use client';

import { useState } from 'react';
import { useProfileStore } from '@/lib/stores/profile-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Step0Resume() {
  const { setResumeFile, nextStep } = useProfileStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
      toast.error('Only PDF and DOCX files are allowed');
      return;
    }
    
    // Validate file size (100KB)
    if (selectedFile.size > 100 * 1024) {
      toast.warning('File size exceeds 100KB. Parsing may be slower.');
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload to Cloudinary via API route
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      setResumeFile(file);
      toast.success('Resume uploaded! Parsing in progress...');
      
      // Move to next step
      nextStep();
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your resume (PDF or DOCX). We'll auto-extract your information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="resume-upload"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF or DOCX (max 100KB recommended)
            </p>
          </label>
        </div>
        
        {file && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-gray-500 ml-auto">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setFile(null)} disabled={!file}>
            Clear
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {uploading ? 'Uploading...' : 'Upload & Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

4. Create Step 1 - Identity (`components/student/steps/step1-identity.tsx`):
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfileStore } from '@/lib/stores/profile-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const identitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits'),
  sapId: z.string().min(1, 'SAP ID is required'),
  rollNo: z.string().min(1, 'Roll number is required'),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  dob: z.string().optional(),
});

type IdentityForm = z.infer<typeof identitySchema>;

export function Step1Identity() {
  const { name, email, phone, sapId, rollNo, linkedinUrl, address, dob, updateIdentity, nextStep, prevStep } = useProfileStore();
  
  const form = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name,
      email,
      phone,
      sapId,
      rollNo,
      linkedinUrl,
      address,
      dob: dob ? dob.toISOString().split('T')[0] : '',
    },
  });
  
  const onSubmit = (data: IdentityForm) => {
    updateIdentity({
      ...data,
      dob: data.dob ? new Date(data.dob) : null,
    });
    nextStep();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Review and confirm your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="john@college.edu" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sapId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SAP ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="70001234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rollNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="R220001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="9876543210" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://linkedin.com/in/johndoe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St, City" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

5. Create Step 2 - Academic (`components/student/steps/step2-academic.tsx`):
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfileStore } from '@/lib/stores/profile-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const academicSchema = z.object({
  class10Marks: z.number().min(0).max(100),
  class12Marks: z.number().min(0).max(100),
  currentCGPA: z.number().min(0).max(10),
  semester: z.number().min(1).max(8),
  branch: z.string().min(1, 'Branch is required'),
  batchYear: z.number().min(2020).max(2030),
  batchCategory: z.enum(['alpha', 'beta', 'gamma']),
  specialization: z.string().optional(),
});

type AcademicForm = z.infer<typeof academicSchema>;

export function Step2Academic() {
  const store = useProfileStore();
  
  const form = useForm<AcademicForm>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      class10Marks: store.class10Marks || undefined,
      class12Marks: store.class12Marks || undefined,
      currentCGPA: store.currentCGPA || undefined,
      semester: store.semester || undefined,
      branch: store.branch || '',
      batchYear: store.batchYear || new Date().getFullYear(),
      batchCategory: store.batchCategory || 'alpha',
      specialization: store.specialization || '',
    },
  });
  
  const onSubmit = (data: AcademicForm) => {
    store.updateAcademic(data);
    store.nextStep();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Roots</CardTitle>
        <CardDescription>
          Tell us about your educational background
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class10Marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class 10 Marks (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="class12Marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class 12 Marks (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentCGPA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current CGPA</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Semester</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CSE">Computer Science</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="ECE">Electronics & Communication</SelectItem>
                      <SelectItem value="EEE">Electrical</SelectItem>
                      <SelectItem value="MECH">Mechanical</SelectItem>
                      <SelectItem value="CIVIL">Civil</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batchYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Year</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="batchCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="alpha">Alpha</SelectItem>
                        <SelectItem value="beta">Beta</SelectItem>
                        <SelectItem value="gamma">Gamma</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Machine Learning, Cloud Computing" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={store.prevStep}>
                Back
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Verification:**
- Navigate through steps 0-2
- Form validation works
- Data persists in Zustand store

---

### Subphase 4.3: 6-Step Onboarding UI (Steps 3-6)
**Layer:** Frontend  
**Duration:** 6 hours  
**Deliverable:** Complete 6-step onboarding flow

**Tasks:**
1. Create Step 3 - Proof Layer (similar structure to Step 2, with dynamic array fields for projects, work experience, certifications, research papers)

2. Create Step 4 - Coder Identity (coding profiles)

3. Create Step 5 - Soft Skills (top 3 soft skills + achievements)

4. Create Step 6 - Master Resume (confirmation of uploaded resume)

*(Due to length constraints, I'm providing the structure. Each step follows the same pattern as Step 1-2 with appropriate form fields and Zustand integration.)*

**Verification:**
- Complete all 6 steps
- Data saves to Zustand
- Can navigate back/forward between steps

---

### Subphase 4.4: Profile Submission API
**Layer:** Backend  
**Duration:** 2 hours  
**Deliverable:** API endpoint to save profile to database

**Tasks:**
Create `app/api/profiles/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireStudentProfile } from '@/lib/auth/helpers';
import { db } from '@/lib/db';
import { students, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const profileSchema = z.object({
  // Identity
  name: z.string(),
  phone: z.string(),
  linkedinUrl: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  sapId: z.string(),
  rollNo: z.string(),
  
  // Academic
  class10Marks: z.number(),
  class12Marks: z.number(),
  currentCGPA: z.number(),
  semester: z.number(),
  branch: z.string(),
  batchYear: z.number(),
  batchCategory: z.enum(['alpha', 'beta', 'gamma']),
  specialization: z.string().optional(),
  
  // Proof
  projects: z.array(z.any()),
  workExperience: z.array(z.any()),
  certifications: z.array(z.any()),
  researchPapers: z.array(z.any()),
  
  // Coding
  codingProfiles: z.array(z.any()),
  
  // Skills
  skills: z.array(z.any()),
  softSkills: z.array(z.string()),
  achievements: z.array(z.any()),
  
  // Resume
  resumeUrl: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireStudentProfile();
    const body = await request.json();
    
    // Validate input
    const validatedData = profileSchema.parse(body);
    
    // Calculate profile completeness
    let completeness = 0;
    if (validatedData.name) completeness += 10;
    if (validatedData.phone) completeness += 5;
    if (validatedData.sapId) completeness += 5;
    if (validatedData.currentCGPA) completeness += 10;
    if (validatedData.branch) completeness += 5;
    if (validatedData.resumeUrl) completeness += 15;
    if (validatedData.projects.length > 0) completeness += 15;
    if (validatedData.skills.length > 0) completeness += 15;
    if (validatedData.workExperience.length > 0) completeness += 10;
    if (validatedData.codingProfiles.length > 0) completeness += 10;
    
    // Update student profile
    await db.update(students)
      .set({
        name: validatedData.name,
        phone: validatedData.phone,
        linkedinUrl: validatedData.linkedinUrl,
        address: validatedData.address,
        dob: validatedData.dob ? new Date(validatedData.dob) : null,
        sapId: validatedData.sapId,
        rollNo: validatedData.rollNo,
        class10Marks: validatedData.class10Marks,
        class12Marks: validatedData.class12Marks,
        currentCGPA: validatedData.currentCGPA,
        semester: validatedData.semester,
        branch: validatedData.branch,
        batchYear: validatedData.batchYear,
        batchCategory: validatedData.batchCategory,
        specialization: validatedData.specialization,
        projects: validatedData.projects,
        workExperience: validatedData.workExperience,
        certifications: validatedData.certifications,
        researchPapers: validatedData.researchPapers,
        codingProfiles: validatedData.codingProfiles,
        skills: validatedData.skills,
        softSkills: validatedData.softSkills,
        achievements: validatedData.achievements,
        resumeUrl: validatedData.resumeUrl,
        profileCompleteness: completeness,
        onboardingStep: 6,
        updatedAt: new Date(),
      })
      .where(eq(students.id, profile.id));
    
    // Queue embedding generation job
    await db.insert(jobs).values({
      type: 'generate_embedding',
      status: 'pending',
      priority: 2,
      payload: {
        studentId: profile.id,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      completeness,
    });
  } catch (error) {
    console.error('Profile submission error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
```

**Verification:**
- Submit complete profile → Database updated
- Check `jobs` table → Embedding generation job queued

---

### Subphase 4.5: Profile Completeness Calculator
**Layer:** Frontend + Backend  
**Duration:** 1 hour  
**Deliverable:** Real-time profile completeness indicator

**Tasks:**
1. Create completeness widget (`components/student/profile-completeness.tsx`):
```typescript
'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  completeness: number;
  suggestions: string[];
}

export function ProfileCompleteness({ completeness, suggestions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile Completeness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-semibold">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
        
        {completeness < 100 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggestions to improve:</p>
            <ul className="space-y-1">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {completeness === 100 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Profile complete!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Verification:**
- Completeness updates as profile is filled
- Suggestions appear for missing sections

---

## PHASE 5: RESUME PROCESSING PIPELINE (Subphases 21-25)

### Subphase 5.1: Cloudinary Upload API
**Layer:** Backend  
**Duration:** 2 hours  
**Deliverable:** Resume upload to Cloudinary working

**Tasks:**
1. Install Cloudinary SDK:
```bash
npm install cloudinary
```

2. Create Cloudinary config (`lib/cloudinary/config.ts`):
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

3. Create upload API route (`app/api/upload-resume/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireStudentProfile } from '@/lib/auth/helpers';
import { cloudinary } from '@/lib/cloudinary/config';
import { db } from '@/lib/db';
import { students, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireStudentProfile();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          public_id: `${profile.id}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    const resumeUrl = (uploadResponse as any).secure_url;
    
    // Update student record
    await db.update(students)
      .set({
        resumeUrl,
        updatedAt: new Date(),
      })
      .where(eq(students.id, profile.id));
    
    // Queue parsing job
    await db.insert(jobs).values({
      type: 'parse_resume',
      status: 'pending',
      priority: 3, // High priority
      payload: {
        studentId: profile.id,
        resumeUrl,
        fileName: file.name,
      },
    });
    
    return NextResponse.json({
      success: true,
      resumeUrl,
      message: 'Resume uploaded and queued for parsing',
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

**Verification:**
- Upload test resume → File appears in Cloudinary dashboard
- Database updated with resume URL
- Parsing job created in `jobs` table

---

### Subphase 5.2: PDF/DOCX Text Extraction
**Layer:** Backend  
**Duration:** 2 hours  
**Deliverable:** Text extraction from PDF and DOCX files

**Tasks:**
1. Install dependencies:
```bash
npm install pdf-parse mammoth
```

2. Create text extractor (`lib/resume/text-extractor.ts`):
```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function extractTextFromResume(fileUrl: string): Promise<string> {
  try {
    // Download file
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    
    // Determine file type from URL
    const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
    const isDOCX = fileUrl.toLowerCase().endsWith('.docx');
    
    if (isPDF) {
      const data = await pdfParse(Buffer.from(buffer));
      return data.text;
    } else if (isDOCX) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return result.value;
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}

// Clean and normalize extracted text
export function cleanResumeText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
    .trim();
}
```

**Verification:**
- Test with sample PDF → Returns text
- Test with sample DOCX → Returns text
- Special characters handled correctly

---

### Subphase 5.3: AI Model Router (Core)
**Layer:** Backend  
**Duration:** 3 hours  
**Deliverable:** Intelligent model selection system

**Tasks:**
Create `lib/models/router.ts`:
```typescript
import { modelUsageTracker } from './usage-tracker';

export enum TaskComplexity {
  TRIVIAL = 1,
  SIMPLE = 2,
  MODERATE = 3,
  COMPLEX = 4,
  CRITICAL = 5,
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export type TaskType = 
  | 'resume_parse'
  | 'jd_enhance'
  | 'skill_extract'
  | 'explanation'
  | 'embedding';

interface ModelRoute {
  primary: string[];
  fallback: string[];
}

const MODEL_ROUTES: Record<TaskType, ModelRoute> = {
  resume_parse: {
    primary: ['mistral-large-latest', 'groq-llama-3.3-70b'],
    fallback: ['groq-llama-3.1-8b', 'gemini-3-flash'],
  },
  jd_enhance: {
    primary: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'],
    fallback: ['groq-llama-3.1-8b'],
  },
  skill_extract: {
    primary: ['groq-llama-3.1-8b', 'gemini-2.5-flash-lite'],
    fallback: ['mistral-small-latest'],
  },
  explanation: {
    primary: ['gemini-2.5-flash', 'groq-llama-3.3-70b'],
    fallback: ['groq-llama-3.1-8b'],
  },
  embedding: {
    primary: ['all-minilm-l6-v2'],
    fallback: ['gemini-embedding-1', 'mistral-embed'],
  },
};

export class ModelRouter {
  async selectModel(
    taskType: TaskType,
    complexity: TaskComplexity,
    priority: TaskPriority
  ): Promise<string> {
    const route = MODEL_ROUTES[taskType];
    
    // Try primary models first
    for (const modelId of route.primary) {
      const hasQuota = await modelUsageTracker.hasQuota(modelId);
      if (hasQuota) {
        return modelId;
      }
    }
    
    // Fallback to secondary models
    for (const modelId of route.fallback) {
      const hasQuota = await modelUsageTracker.hasQuota(modelId);
      if (hasQuota) {
        return modelId;
      }
    }
    
    // If all models exhausted, wait or return error
    throw new Error(`No available model for task: ${taskType}`);
  }
  
  async executeTask(
    taskType: TaskType,
    complexity: TaskComplexity,
    priority: TaskPriority,
    payload: any
  ): Promise<any> {
    const modelId = await this.selectModel(taskType, complexity, priority);
    
    const startTime = Date.now();
    
    try {
      // Execute task with selected model
      let result;
      
      if (taskType === 'resume_parse') {
        result = await this.callLLM(modelId, payload.prompt, payload.schema);
      } else if (taskType === 'embedding') {
        result = await this.callEmbedding(modelId, payload.text);
      }
      // ... other task types
      
      const latency = Date.now() - startTime;
      
      // Track usage
      await modelUsageTracker.increment(modelId);
      
      return {
        result,
        modelUsed: modelId,
        latency,
      };
    } catch (error) {
      console.error(`Model ${modelId} failed:`, error);
      throw error;
    }
  }
  
  private async callLLM(modelId: string, prompt: string, schema?: any): Promise<any> {
    // Implementation depends on model provider
    // Will be completed in next subphase
    return {};
  }
  
  private async callEmbedding(modelId: string, text: string): Promise<number[]> {
    // Implementation for embeddings
    return [];
  }
}

export const modelRouter = new ModelRouter();
```

**Verification:**
- Call `selectModel()` → Returns available model
- Quota tracking works
- Fallback mechanism activates when primary exhausted

---

### Subphase 5.4: LLM Integration (Gemini, Mistral, Groq)
**Layer:** Backend  
**Duration:** 4 hours  
**Deliverable:** All 3 LLM providers integrated

**Tasks:**
Create `lib/models/llm-client.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function callGemini(
  modelId: string,
  prompt: string,
  schema?: any
): Promise<any> {
  const modelName = modelId.replace('gemini-', 'gemini-');
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  if (schema) {
    // Parse JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  }
  
  return text;
}

// Mistral
export async function callMistral(
  modelId: string,
  prompt: string,
  schema?: any
): Promise<any> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      response_format: schema ? { type: 'json_object' } : undefined,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return schema ? JSON.parse(content) : content;
}

// Groq
export async function callGroq(
  modelId: string,
  prompt: string,
  schema?: any
): Promise<any> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      response_format: schema ? { type: 'json_object' } : undefined,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return schema ? JSON.parse(content) : content;
}

// Unified caller
export async function callLLM(
  modelId: string,
  prompt: string,
  schema?: any
): Promise<any> {
  if (modelId.startsWith('gemini')) {
    return callGemini(modelId, prompt, schema);
  } else if (modelId.startsWith('mistral')) {
    return callMistral(modelId, prompt, schema);
  } else if (modelId.startsWith('groq')) {
    return callGroq(modelId, prompt, schema);
  } else {
    throw new Error(`Unknown model: ${modelId}`);
  }
}
```

**Verification:**
- Test Gemini API → Returns response
- Test Mistral API → Returns response
- Test Groq API → Returns response
- JSON schema parsing works

---

### Subphase 5.5: Resume Parsing with LLM
**Layer:** Backend  
**Duration:** 3 hours  
**Deliverable:** Resume text → Structured JSON

**Tasks:**
Create `lib/resume/parser.ts`:
```typescript
import { modelRouter, TaskComplexity, TaskPriority } from '@/lib/models/router';

const RESUME_PARSE_PROMPT = `
You are an expert resume parser. Extract the following information from the resume text below and return it as valid JSON.

**Schema:**
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedinUrl": "string (optional)",
  "skills": ["string"],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "techStack": ["string"],
      "githubUrl": "string (optional)"
    }
  ],
  "workExperience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "verificationUrl": "string (optional)"
    }
  ],
  "education": {
    "class10Marks": number,
    "class12Marks": number,
    "currentCGPA": number,
    "branch": "string",
    "university": "string"
  }
}

**Resume Text:**
{{RESUME_TEXT}}

Return ONLY the JSON object, no markdown formatting, no explanation.
`;

export async function parseResumeWithLLM(resumeText: string): Promise<any> {
  const prompt = RESUME_PARSE_PROMPT.replace('{{RESUME_TEXT}}', resumeText);
  
  const result = await modelRouter.executeTask(
    'resume_parse',
    TaskComplexity.MODERATE,
    TaskPriority.HIGH,
    { prompt, schema: true }
  );
  
  return result.result;
}

export function validateParsedResume(data: any): {
  isValid: boolean;
  accuracy: number;
  errors: string[];
} {
  const errors: string[] = [];
  let filledFields = 0;
  const totalFields = 10; // Adjust based on schema
  
  if (data.name) filledFields++;
  else errors.push('Missing name');
  
  if (data.email) filledFields++;
  else errors.push('Missing email');
  
  if (data.phone) filledFields++;
  
  if (data.skills && data.skills.length > 0) filledFields++;
  
  if (data.projects && data.projects.length > 0) filledFields++;
  
  if (data.workExperience) filledFields++;
  
  if (data.certifications) filledFields++;
  
  if (data.education) filledFields += 3;
  
  const accuracy = (filledFields / totalFields) * 100;
  
  return {
    isValid: filledFields >= 3, // At least name, email, phone
    accuracy,
    errors,
  };
}
```

**Verification:**
- Parse sample resume → Returns structured JSON
- Accuracy calculation correct
- Validation catches missing fields

---

## PHASE 6: JOB QUEUE & BACKGROUND PROCESSING (Subphases 26-30)

### Subphase 6.1: Job Queue Worker (Cron)
**Layer:** Backend  
**Duration:** 3 hours  
**Deliverable:** Vercel Cron job processing queue

**Tasks:**
1. Create cron API route (`app/api/cron/process-jobs/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, students } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { extractTextFromResume, cleanResumeText } from '@/lib/resume/text-extractor';
import { parseResumeWithLLM, validateParsedResume } from '@/lib/resume/parser';
import { generateEmbedding } from '@/lib/embeddings/generator';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Fetch pending jobs (limit 10 per run)
    const pendingJobs = await db.query.jobs.findMany({
      where: eq(jobs.status, 'pending'),
      orderBy: (jobs, { desc, asc }) => [desc(jobs.priority), asc(jobs.createdAt)],
      limit: 10,
    });
    
    console.log(`Processing ${pendingJobs.length} jobs...`);
    
    const results = [];
    
    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await db.update(jobs)
          .set({
            status: 'processing',
            startedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));
        
        let result;
        
        switch (job.type) {
          case 'parse_resume':
            result = await processResumeParseJob(job);
            break;
          
          case 'generate_embedding':
            result = await processEmbeddingJob(job);
            break;
          
          case 'enhance_jd':
            result = await processJDEnhancementJob(job);
            break;
          
          case 'rank_students':
            result = await processStudentRankingJob(job);
            break;
          
          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }
        
        // Mark as completed
        await db.update(jobs)
          .set({
            status: 'completed',
            result,
            completedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));
        
        results.push({ jobId: job.id, status: 'completed' });
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        // Increment attempts
        const newAttempts = (job.attempts || 0) + 1;
        
        if (newAttempts >= (job.maxAttempts || 3)) {
          // Mark as failed
          await db.update(jobs)
            .set({
              status: 'failed',
              error: (error as Error).message,
              attempts: newAttempts,
            })
            .where(eq(jobs.id, job.id));
          
          results.push({ jobId: job.id, status: 'failed' });
        } else {
          // Retry
          await db.update(jobs)
            .set({
              status: 'pending',
              attempts: newAttempts,
              error: (error as Error).message,
            })
            .where(eq(jobs.id, job.id));
          
          results.push({ jobId: job.id, status: 'retry' });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

async function processResumeParseJob(job: any) {
  const { studentId, resumeUrl } = job.payload;
  
  // Extract text
  const rawText = await extractTextFromResume(resumeUrl);
  const cleanText = cleanResumeText(rawText);
  
  // Parse with LLM
  const parsedData = await parseResumeWithLLM(cleanText);
  
  // Validate
  const validation = validateParsedResume(parsedData);
  
  // Update student profile
  await db.update(students)
    .set({
      name: parsedData.name || undefined,
      phone: parsedData.phone || undefined,
      linkedinUrl: parsedData.linkedinUrl || undefined,
      skills: parsedData.skills || undefined,
      projects: parsedData.projects || undefined,
      workExperience: parsedData.workExperience || undefined,
      certifications: parsedData.certifications || undefined,
      class10Marks: parsedData.education?.class10Marks || undefined,
      class12Marks: parsedData.education?.class12Marks || undefined,
      currentCGPA: parsedData.education?.currentCGPA || undefined,
      branch: parsedData.education?.branch || undefined,
      resumeParsedAt: new Date(),
      resumeParseAccuracy: validation.accuracy,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId));
  
  return {
    accuracy: validation.accuracy,
    errors: validation.errors,
  };
}

async function processEmbeddingJob(job: any) {
  const { studentId } = job.payload;
  
  // Fetch student profile
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Build profile text
  const profileText = buildProfileText(student);
  
  // Generate embedding
  const embedding = await generateEmbedding(profileText);
  
  // Save to database
  await db.update(students)
    .set({
      embedding: JSON.stringify(embedding), // pgvector format
      embeddingGeneratedAt: new Date(),
    })
    .where(eq(students.id, studentId));
  
  return { embeddingGenerated: true };
}

function buildProfileText(student: any): string {
  const parts = [];
  
  if (student.name) parts.push(`Name: ${student.name}`);
  if (student.branch) parts.push(`Branch: ${student.branch}`);
  if (student.specialization) parts.push(`Specialization: ${student.specialization}`);
  
  if (student.skills) {
    const skillNames = student.skills.map((s: any) => s.name).join(', ');
    parts.push(`Skills: ${skillNames}`);
  }
  
  if (student.projects) {
    student.projects.forEach((p: any, i: number) => {
      parts.push(`Project ${i + 1}: ${p.title}. ${p.description}. Tech: ${p.techStack.join(', ')}`);
    });
  }
  
  if (student.workExperience) {
    student.workExperience.forEach((exp: any, i: number) => {
      parts.push(`Experience ${i + 1}: ${exp.role} at ${exp.company}. ${exp.description}`);
    });
  }
  
  if (student.certifications) {
    const certNames = student.certifications.map((c: any) => c.name).join(', ');
    parts.push(`Certifications: ${certNames}`);
  }
  
  return parts.join('. ');
}

// Placeholder for other job processors
async function processJDEnhancementJob(job: any) {
  // To be implemented in Faculty phase
  return {};
}

async function processStudentRankingJob(job: any) {
  // To be implemented in Faculty phase
  return {};
}
```

2. Configure Vercel Cron in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-jobs",
      "schedule": "* * * * *"
    }
  ]
}
```

3. Add cron secret to `.env.local`:
```
CRON_SECRET=your-random-secret-here
```

**Verification:**
- Create test job manually in database
- Wait 1 minute → Check job status changed to 'completed'
- Check student profile updated

---

### Subphase 6.2: Concurrency Control (Queue Management)
**Layer:** Backend  
**Duration:** 2 hours  
**Deliverable:** Handle multiple simultaneous requests

**Tasks:**
Create `lib/queue/concurrency-limiter.ts`:
```typescript
class ConcurrencyLimiter {
  private processing = new Set<string>();
  private maxConcurrent = 10; // Process max 10 jobs concurrently
  
  async acquire(jobId: string): Promise<boolean> {
    if (this.processing.size >= this.maxConcurrent) {
      return false; // Queue full
    }
    
    if (this.processing.has(jobId)) {
      return false; // Already processing
    }
    
    this.processing.add(jobId);
    return true;
  }
  
  release(jobId: string) {
    this.processing.delete(jobId);
  }
  
  getQueueSize(): number {
    return this.processing.size;
  }
  
  isFull(): boolean {
    return this.processing.size >= this.maxConcurrent;
  }
}

export const concurrencyLimiter = new ConcurrencyLimiter();
```

Update cron job to use limiter:
```typescript
// In process-jobs/route.ts
import { concurrencyLimiter } from '@/lib/queue/concurrency-limiter';

// Before processing each job:
const canProcess = await concurrencyLimiter.acquire(job.id);
if (!canProcess) {
  console.log(`Queue full, skipping job ${job.id}`);
  continue;
}

try {
  // ... process job
} finally {
  concurrencyLimiter.release(job.id);
}
```

**Verification:**
- Submit 20 jobs simultaneously
- Only 10 process at a time
- No job processed twice

---

### Subphase 6.3: Embedding Generation (Local Transformers.js)
**Layer:** Backend  
**Duration:** 3 hours  
**Deliverable:** Generate embeddings using all-MiniLM-L6-v2

**Tasks:**
Create `lib/embeddings/generator.ts`:
```typescript
import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    
    // Generate embedding
    const output = await pipe(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Extract float array
    const embedding = Array.from(output.data);
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    
    // Fallback to API-based embedding
    return await generateEmbeddingFallback(text);
  }
}

async function generateEmbeddingFallback(text: string): Promise<number[]> {
  // Use Gemini Embedding API as fallback
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/embedding-001',
        content: { parts: [{ text }] },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Fallback embedding failed');
  }
  
  const data = await response.json();
  return data.embedding.values;
}

export async function cosineSimilarity(vec1: number[], vec2: number[]): Promise<number> {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}
```

**Verification:**
- Generate embedding for test text → Returns 384-dimensional vector
- Cosine similarity calculation correct
- Fallback works when primary fails

---

*(Continuing with remaining subphases...)*

Due to space constraints, I'll complete the remaining 10 subphases in a streamlined format:

### Subphases 31-35: Faculty Dashboard & Drives
**31. Faculty Dashboard UI** (Frontend, 3h) - Command center with stats  
**32. Student Search & Filters** (Frontend + Backend, 3h) - Search API + UI  
**33. Drive Creation Form** (Frontend, 2h) - JD upload/paste interface  
**34. JD Enhancement Pipeline** (Backend, 3h) - Parse & enhance JD  
**35. Student Ranking Engine** (Backend, 4h) - Semantic + structured matching  

### Subphases 36-40: Testing, Optimization & Deployment
**36. Sandbox V1 Implementation** (Frontend + Backend, 4h) - Match score API  
**37. Unit Tests (Critical Paths)** (Testing, 3h) - Auth, parsing, ranking  
**38. Performance Optimization** (Backend, 2h) - Index tuning, caching  
**39. Production Deployment** (DevOps, 2h) - Vercel deploy + env setup  
**40. End-to-End Testing** (Testing, 4h) - 50 students onboarding test  

Would you like me to expand any specific subphases (31-40) with full code implementations?
