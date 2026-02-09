# SkillSync - Production-Grade MVP

A free-tier friendly, AI-powered placement preparation and interview assistant built with Next.js 14, TypeScript, and modern cloud infrastructure.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Navigate to http://localhost:3000
```

## Architecture & Design Decisions

### Why App Router (Next.js 14)

- **Streaming & Server Components**: Enables real-time AI responses without client-side overhead
- **Built-in Optimization**: Automatic code splitting, tree-shaking, and dynamic imports
- **File-based Routing**: Intuitive `app/` directory structure with route groups `(auth)`, `(student)`, `(faculty)`
- **API Routes**: Seamless backend integration without external server
- **Future-Proof**: Latest React 18 features, concurrent rendering, and continued investment

### Folder Structure

```
skillsync/
├── app/                  # Next.js 14 App Router
│   ├── (auth)/          # Authentication flows (login, signup, reset)
│   ├── (student)/       # Student-facing features
│   ├── (faculty)/       # Faculty/admin features
│   ├── api/             # API routes (/api/*)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles + Tailwind
├── lib/
│   ├── db/              # Drizzle ORM schemas & queries
│   ├── auth/            # Authentication utilities (Supabase)
│   ├── models/          # TypeScript interfaces & types
│   └── utils/           # Helpers (validation, formatting, etc.)
├── components/
│   ├── ui/              # Reusable UI components (buttons, forms, cards)
│   ├── student/         # Student-specific components
│   └── faculty/         # Faculty-specific components
├── drizzle/             # Database migrations & config
├── public/              # Static assets
├── package.json         # Dependencies & scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── next.config.js       # Next.js optimizations
└── postcss.config.js    # CSS processing pipeline
```

### Dependency Groups & Purpose

#### State Management & ORM
- **zustand**: Lightweight alternative to Redux (no boilerplate, 2KB)
- **drizzle-orm**: Type-safe SQL queries, excellent TypeScript support
- **drizzle-kit**: Database migration manager
- **postgres**: Native PostgreSQL client

#### Authentication & Security
- **@supabase/supabase-js**: Free-tier Supabase for auth, real-time, and serverless functions
- **@supabase/auth-helpers-nextjs**: Seamless Supabase + Next.js 14 integration
- **bcryptjs**: Password hashing (backup for custom implementations)

#### Forms & Validation
- **react-hook-form**: Minimal, performant form state management
- **zod**: Runtime type validation with TypeScript inference
- **@hookform/resolvers**: Bridge between react-hook-form and zod

#### UI & Styling
- **tailwindcss**: Utility-first CSS (production builds are tiny)
- **lucide-react**: Lightweight icon library (600+ icons, tree-shakeable)
- **class-variance-authority**: Composable component styling patterns
- **clsx**: Conditional className utility
- **tailwind-merge**: Merge Tailwind classes intelligently

#### AI & NLP (Free-tier Optimized)
- **@ai-sdk/google**: Vercel's SDK for Google Gemini API (free tier available)
- **@ai-sdk/groq**: Groq's free Llama 2/3 inference (extremely fast)
- **@ai-sdk/mistral**: Mistral's free tier for Mistral 7B
- **@xenova/transformers**: ONNX models (runs locally, no API calls needed)
- **pdf-parse**: Extract text from PDF resumes
- **mammoth**: Extract text from DOCX files

#### Utilities
- **date-fns**: Lightweight date manipulation (no timezone bloat like Moment.js)
- **nanoid**: Tiny ID generator (5x smaller than UUID)
- **bcryptjs**: Secure password hashing

#### Development & Testing
- **vitest**: Unit testing (Vite-native, faster than Jest)
- **@testing-library/react**: Component testing best practices
- **@testing-library/jest-dom**: DOM assertions
- **jsdom**: Headless browser for testing
- **TypeScript**: Type safety across entire codebase

### Free-Tier Safety Considerations

1. **No Large Dependencies**
   - Zustand instead of Redux (2KB vs 50KB)
   - Vitest instead of Jest for testing
   - date-fns for utilities (1KB vs Moment's 70KB)

2. **API Call Optimization**
   - Vercel's AI SDK with streaming (no buffer overflow)
   - Multiple AI providers with fallbacks
   - Local inference with @xenova/transformers (no external calls)
   - Batch requests to reduce API calls

3. **Database Efficiency**
   - Drizzle ORM generates optimal SQL
   - Supabase serverless functions (auto-scaling, free tier: 600k requests/month)
   - Connection pooling via Supabase

4. **Deployment Ready**
   - Next.js optimized for Vercel (free tier: $0/month)
   - Sourcemap exclusion in production
   - Automatic compression & minification
   - Zero runtime dependencies besides Node.js

5. **Database & Auth**
   - Supabase PostgreSQL (free tier: 500MB storage, unlimited auth users)
   - Drizzle for type-safe migrations

### Next Steps

1. **Set up Supabase**
   ```bash
   # Create account at https://supabase.com
   # Copy credentials to .env.local
   ```

2. **Configure AI Services**
   ```bash
   # Choose free-tier providers:
   # - Google Gemini: https://ai.google.dev
   # - Groq: https://console.groq.com
   # - Mistral: https://console.mistral.ai
   ```

3. **Database Setup**
   - Define schemas in `lib/db/schema.ts`
   - Generate migrations with `npx drizzle-kit generate:pg`
   - Run migrations via Supabase dashboard or CLI

4. **Feature Development**
   - Add routes in `app/(student)/`, `app/(student)/`, `app/(faculty)/`
   - Create components in `components/`
   - Implement API routes in `app/api/`

### Production Optimization Assumptions

- ✅ Automatic image optimization via Next.js Image component
- ✅ CSS minification & purging via Tailwind
- ✅ JavaScript code splitting per route
- ✅ Server-side rendering for SEO
- ✅ Incremental Static Regeneration (ISR) for static pages
- ✅ API compression enabled
- ✅ Security headers configured
- ✅ Environment variable injection in build time

### Free-Tier Deployment

**Recommended**: Vercel (Next.js creator)
- Auto-scaling, HTTPS, edge functions
- Free tier: unlimited deployments, bandwidth
- GitHub integration: deploy on push

**Alternative**: Netlify or Railway
- Similar free-tier benefits
- Easy environment variable management

### Scripts

```bash
npm run dev         # Start dev server with hot reload
npm run build       # Production build
npm run start       # Start production server
npm run type-check  # TypeScript validation
npm run test        # Run tests with Vitest
npm run test:ui     # Interactive test UI
npm run lint        # ESLint validation

# RLS (Row-Level Security)
npm run apply-rls   # Apply all 23 RLS policies to database
npm run verify-rls  # Verify policies exist and RLS is enabled
npm run test-rls    # Run automated RLS access tests
npm run rls:setup   # Apply + verify in one step
```

### Row-Level Security (RLS)

All database access is secured at the PostgreSQL level via Supabase RLS.

**Three user roles**: `student`, `faculty`, `admin`

| Table | Students | Faculty | Admin |
| --- | --- | --- | --- |
| users | Own row only | Own row only | All |
| students | Own record | — | All |
| drives | Active only (read) | Own drives (CRUD) | All |
| rankings | Own rankings | Own-drive rankings | All |
| jobs | — | Create/read/update | All |
| sample_jds | Read all | Full CRUD | All |

**Setup:**
```bash
npm run rls:setup  # Apply policies + verify
```

**Key files:**
- `scripts/setup-rls.sql` — All 23 policies + helper function + indexes
- `scripts/apply-rls.ts` — Executes SQL against database
- `scripts/verify-rls.ts` — Verifies all policies exist
- `scripts/test-rls.ts` — Automated access control tests
- `scripts/ARCHITECTURE.md` — Full RLS design documentation
- `scripts/QUICK_REFERENCE.md` — Role matrix & API patterns
- `scripts/SECURITY_CHECKLIST.md` — Pre-deployment audit

### Environment Variables

The project uses environment variables for configuration. For local development, create a `.env.local` file at the root.

#### Why `.env.local`?
- **Security**: `.env.local` is ignored by Git, preventing secrets from being committed.
- **Environment-Specific**: It allows each developer to have their own local settings.
- **Next.js Support**: Next.js automatically loads variables from `.env.local` into `process.env`.

#### Variable Naming Conventions
- **`NEXT_PUBLIC_*`**: Variables prefixed with `NEXT_PUBLIC_` are accessible in the browser. Use these **strictly** for client-side keys (e.g., Supabase anon key, Cloudinary cloud name).
- **Sensitive Keys**: Variables without the `NEXT_PUBLIC_` prefix (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`) are **only accessible on the server**. Never expose these to the client.

#### Required Variables (Placeholder Example)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Authentication
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here
MICROSOFT_TENANT_ID=your-microsoft-tenant-id-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name-here
CLOUDINARY_API_KEY=your-cloudinary-api-key-here
CLOUDINARY_API_SECRET=your-cloudinary-api-secret-here

# AI Providers
GROQ_API_KEY=your-groq-api-key-here
MISTRAL_API_KEY=your-mistral-api-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db-name

# Cache
REDIS_URL=redis://localhost:6379
```

---

**Status**: ✓ Environment configuration established  
**Next**: Implement authentication and core features
