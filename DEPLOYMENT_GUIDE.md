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

## Troubleshooting

- **Build Errors**: Check the Vercel logs. Common issues include type errors or missing env vars during build (if using `check-types` in build).
- **Timeouts**: The Sandbox Analysis can take up to 45 seconds. We have configured `vercel.json` to allow 60s for these routes.
