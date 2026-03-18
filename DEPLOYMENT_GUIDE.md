# SkillSync Deployment Guide

This guide details how to deploy SkillSync to Vercel.

## Prerequisites

- **Vercel Account**: [Sign up here](https://vercel.com/signup).
- **Supabase Project**: Database for PostgreSQL.
- **Google Cloud Project**: For Gemini API.
- **Groq Account**: For Llama 3 API.

## Environment Variables

Configure the following environment variables in your Vercel Project Settings:

### Database
- `DATABASE_URL`: Connection string from Supabase (Transaction mode recommended for serverless).

### AI Providers
- `GOOGLE_GENERATIVE_AI_API_KEY`: API key for Gemini models.
- `GROQ_API_KEY`: API key for Groq models.

### Authentication (NextAuth)
- `NEXTAUTH_URL`: Your production URL (e.g., `https://skillsync.vercel.app`).
- `NEXTAUTH_SECRET`: A random string (generate with `openssl rand -base64 32`).

### Storage (Cloudinary)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Your API key.
- `CLOUDINARY_API_SECRET`: Your API secret.

### 4. Database Setup
You have two options to set up the production database:

**Option A: One-Click SQL Script (Recommended for initial setup)**
Run the included `setup_production_db.sql` in the Supabase SQL Editor. This handles:
- Extensions (`vector`, `pgcrypto`)
- Full Schema (Tables, Enums)
- RLS Policies (Security)
- Performance Indexes (HNSW for vectors)

**Option B: Drizzle Push (For updates)**
If you are updating an existing schema:
```bash
npm run drizzle:push
```
*Note: This might not apply complex custom indexes or specific RLS policies defined in raw SQL.*

## 5. Deployment Steps

1.  **Push to GitHub**: Ensure your latest code is pushed to your repository.
2.  **Import to Vercel**:
    - Go to Vercel Dashboard -> Add New -> Project.
    - Import your `skillsync` repository.
3.  **Configure Project**:
    - **Framework Preset**: Next.js
    - **Root Directory**: `./`
    - **Environment Variables**: Add the keys listed above.
4.  **Deploy**: Click "Deploy". Vercel will build and start your application.

## Post-Deployment

1.  **Run Migrations**: 
    - You typically need to run migrations against your production database.
    - Setup the build command to include `npm run drizzle:push` OR run it manually from your local machine pointing to the production DB URL.
    - *Recommended*: Run `npm run drizzle:push` locally with `DATABASE_URL` set to production before deploying breaking schema changes.

## Pre-Deploy Checklist

Before deploying to production, verify the following:

### Code Quality
- [ ] **TypeScript**: `npx tsc --noEmit` → 0 errors
- [ ] **Linting**: `npm run lint` → 0 errors
- [ ] **Tests**: `npm run test` → all tests pass

### Environment & Secrets
- [ ] **Cloudinary API Key**: Verify `CLOUDINARY_API_KEY` in Vercel env vars (no "your-" prefix)
- [ ] **CRON_SECRET**: Set in Vercel env vars and GitHub Actions secrets
- [ ] **VERCEL_APP_URL**: Set in GitHub Actions secrets for cron authentication
- [ ] **NextAuth Secret**: Generated with `openssl rand -base64 32` and set in Vercel

### Database & Security
- [ ] **RLS Policies**: Run `npx tsx scripts/verify-rls.ts` → all policies applied
- [ ] **Indexes**: Run `npx tsx scripts/apply-indexes.ts` → all indexes exist
- [ ] **Vector Extension**: Enabled in Supabase (`CREATE EXTENSION IF NOT EXISTS vector`)

### Feature Testing
- [ ] **Faculty Flow**: Create faculty → login → create drive → verify rankings page loads
- [ ] **Student Flow**: Create student → complete onboarding → upload resume → verify rankings
- [ ] **Sandbox**: Student submits code → scoring completes within 45s
- [ ] **Cron Jobs**: All workers execute without errors in Vercel logs

### Monitoring Setup
- [ ] **Health Endpoint**: Run `npx tsx scripts/health-check.ts` to verify system health
- [ ] **Stuck Jobs**: Check Supabase jobs table for any "processing" status >1 hour
- [ ] **Student Profiles**: No students without college_id in Supabase

### Post-Deploy Validation
- [ ] **Smoke Test**: Log in as student/faculty, navigate main flows
- [ ] **API Logs**: Check Vercel Function logs for errors/warnings
- [ ] **Database**: Verify no alerts in Supabase dashboard

## Troubleshooting

- **Build Errors**: Check the Vercel logs. Common issues include type errors or missing env vars during build (if using `check-types` in build).
- **Timeouts**: The Sandbox Analysis can take up to 45 seconds. We have configured `vercel.json` to allow 60s for these routes.
- **Cron Failures**: Check the structured error response in Vercel Logs. Errors include `timestamp`, `type: "cron_worker_failure"`, and `worker` name.
