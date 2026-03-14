/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Canonical Database Schema
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This file is the SINGLE SOURCE OF TRUTH for all tables, enums, relations,
 * and JSON types in the SkillSync platform.
 *
 * Stack:            Drizzle ORM 0.30 + PostgreSQL + pgvector
 * Embedding model:  text-embedding-004 → 768-dimensional vectors
 * Deployment:       Supabase PostgreSQL (free tier: 500 MB)
 *
 * Rules:
 *  - One file, all tables. Split later when > 500 lines.
 *  - Every column has an explicit `notNull()` or documented nullable reason.
 *  - JSONB columns have a matching TypeScript type at the bottom of this file.
 *  - No SQL, no migrations, no seeds, no RLS, no indexes in this phase.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  customType,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// pgvector custom type
// ─────────────────────────────────────────────────────────────────────────────
// Requires `CREATE EXTENSION IF NOT EXISTS vector;` in the target database.
// Dimension 768 matches the output of `text-embedding-004` (Google Gemini).
// The vector is stored as a PostgreSQL `vector(768)` column.

const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    // Postgres returns "[0.1,0.2,...]" — parse to number[]
    const str = String(value);
    return str
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

/** Platform roles. Every user has exactly one. */
export const roleEnum = pgEnum("role", ["student", "faculty", "admin"]);

/**
 * Student performance tiers used for eligibility filtering.
 *  alpha  — top performers (e.g., CGPA ≥ 8.5)
 *  beta   — mid performers (e.g., CGPA 7.0–8.4)
 *  gamma  — developing performers (e.g., CGPA < 7.0)
 */
export const batchCategoryEnum = pgEnum("batch_category", [
  "alpha",
  "beta",
  "gamma",
]);

/** Background job lifecycle. Transitions: pending → processing → completed|failed */
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

/** Types of async jobs the system can enqueue (DB-as-queue pattern). */
export const jobTypeEnum = pgEnum("job_type", [
  "parse_resume",
  "generate_embedding",
  "enhance_jd",
  "rank_students",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Table: users
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Authentication identity + role assignment.
// Every person on the platform has exactly one row here.
// Students have a 1:1 extension row in `students`.
// Faculty/admin have no extension table (role is sufficient).

export const users = pgTable("users", {
  /** Primary key — UUID v4 generated at insert time. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** Institutional email. Used as login identifier. */
  email: varchar("email", { length: 320 }).notNull().unique(),

  /** Display name (first + last). */
  name: varchar("name", { length: 255 }).notNull(),

  /** Platform role. Defaults to student on signup. */
  role: roleEnum("role").notNull().default("student"),

  /**
   * Microsoft Entra ID (Azure AD) subject identifier.
   * Populated after first Microsoft SSO login.
   * Nullable: user may sign up before linking Microsoft account.
   */
  microsoftId: varchar("microsoft_id", { length: 255 }).unique(),

  // NEW: for staff email+password login
  passwordHash: varchar("password_hash", { length: 255 }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: magic_link_tokens
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: One-time login tokens for faculty/admin users who can't use
// Azure AD OAuth (e.g., @outlook/@hotmail emails outside the UPES tenant).
// Admin generates a token → sends link → faculty clicks → CredentialsProvider
// validates → JWT session created. Token is single-use with 24h expiry.

export const magicLinkTokens = pgTable("magic_link_tokens", {
  /** Primary key — UUID v4 generated at insert time. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** The user this token is for. FK → users.id. */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** 64-character hex token (randomBytes(32).toString("hex")). */
  token: varchar("token", { length: 64 }).notNull().unique(),

  /** When this token expires. Typically now + 24 hours. */
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  /** Whether the token has already been consumed. */
  used: boolean("used").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: students
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Extended student profile — the primary input for ranking.
// 1:1 with users (only for role = "student").
//
// Design decisions:
//  - JSONB for variable-length profile sections (projects, skills, etc.)
//    because the shape varies per student and evolves over time.
//  - Flat columns for fixed academic data (CGPA, percentages) because
//    these are used directly in eligibility filters and sorting.
//  - Embedding stored alongside profile for fast cosine-similarity lookups.

export const students = pgTable("students", {
  /** PK and FK → users.id. One student per user. */
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // ── Identity ──────────────────────────────────────────────────────────────

  /** University SAP ID (e.g., "500123456"). Strict 9 digits. */
  sapId: varchar("sap_id", { length: 9 }).unique(),

  /** University roll number (e.g., "R2142233333"). Strict 11 chars. */
  rollNo: varchar("roll_no", { length: 11 }).unique(),

  /** Phone with country code (e.g., "+919876543210"). */
  phone: varchar("phone", { length: 20 }),

  /** LinkedIn profile URL. */
  linkedin: varchar("linkedin", { length: 500 }),

  // ── Academics ─────────────────────────────────────────────────────────────

  /** 10th standard percentage (0.00–100.00). */
  tenthPercentage: real("tenth_percentage"),

  /** 12th standard percentage (0.00–100.00). */
  twelfthPercentage: real("twelfth_percentage"),

  /** Current CGPA on a 10-point scale (0.00–10.00). */
  cgpa: real("cgpa"),

  /** Current semester (1–8 typically). */
  semester: integer("semester"),

  /** Branch/department (e.g., "Computer Science", "Mechanical"). */
  branch: varchar("branch", { length: 100 }),

  /** Graduation batch year (e.g., 2026). */
  batchYear: integer("batch_year"),

  /** Performance tier assigned by faculty or derived from CGPA. */
  category: batchCategoryEnum("category"),

  // ── Profile Sections (JSONB) ──────────────────────────────────────────────
  // Each section is typed via the TypeScript interfaces at the bottom of
  // this file. The DB stores them as JSONB; application code validates
  // with Zod before writes.

  /** Academic and personal projects. See: Project[] */
  projects: jsonb("projects").$type<Project[]>().default([]),

  /** Internships and professional work. See: WorkExperience[] */
  workExperience: jsonb("work_experience").$type<WorkExperience[]>().default([]),

  /** Technical and domain skills with proficiency. See: Skill[] */
  skills: jsonb("skills").$type<Skill[]>().default([]),

  /** Professional certifications. See: Certification[] */
  certifications: jsonb("certifications").$type<Certification[]>().default([]),

  /** Competitive programming and coding platform profiles. See: CodingProfile[] */
  codingProfiles: jsonb("coding_profiles").$type<CodingProfile[]>().default([]),

  /** Published research papers or articles. See: ResearchPaper[] */
  researchPapers: jsonb("research_papers").$type<ResearchPaper[]>().default([]),

  /** Awards, hackathon wins, recognitions. See: Achievement[] */
  achievements: jsonb("achievements").$type<Achievement[]>().default([]),

  /** Communication, leadership, teamwork descriptors. */
  softSkills: jsonb("soft_skills").$type<string[]>().default([]),

  // ── Resume ────────────────────────────────────────────────────────────────

  /** Supabase Storage path to uploaded resume PDF. */
  resumeUrl: text("resume_url"),

  /** Original filename of the uploaded resume. */
  resumeFilename: varchar("resume_filename", { length: 255 }),

  /** MIME type of the uploaded resume (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document). */
  resumeMime: varchar("resume_mime", { length: 100 }),

  /** Timestamp when the resume was last uploaded. */
  resumeUploadedAt: timestamp("resume_uploaded_at", { withTimezone: true }),

  /** Structured data extracted from the resume. */
  parsedResumeJson: jsonb("parsed_resume_json"),

  /** Plain-text content extracted from the resume via pdf-parse. */
  resumeText: text("resume_text"),

  /** ISO 8601 timestamp of last resume parse. */
  resumeParsedAt: timestamp("resume_parsed_at", { withTimezone: true }),

  // ── Embedding ─────────────────────────────────────────────────────────────

  /**
   * 768-dimensional embedding vector of the student profile.
   * Generated by text-embedding-004 via Google Gemini.
   * Used for cosine-similarity matching against drive JD embeddings.
   * Nullable: not yet generated or profile incomplete.
   */
  embedding: vector("embedding"),

  // ── Progress Tracking ─────────────────────────────────────────────────────

  /**
   * Profile completeness score (0–100).
   * Computed by the application whenever profile sections are updated.
   * Used to nudge students toward complete profiles.
   */
  profileCompleteness: integer("profile_completeness").notNull().default(0),

  /**
   * Current onboarding wizard step (0–6).
   * 0 = not started, 6 = completed.
   * Drives the progressive disclosure UI during first login.
   */
  onboardingStep: integer("onboarding_step").notNull().default(0),

  // ── Sandbox Usage ─────────────────────────────────────────────────────────
  // Free-tier guardrails: track how many AI sandbox calls the student has used
  // today. Resets at midnight UTC. Prevents runaway API spend.

  /** Number of AI sandbox calls used today. */
  sandboxUsageToday: integer("sandbox_usage_today").notNull().default(0),

  /** Date (YYYY-MM-DD) of last daily sandbox usage reset. */
  sandboxResetDate: varchar("sandbox_reset_date", { length: 10 }),

  /** Number of AI sandbox calls used this calendar month. */
  sandboxUsageMonth: integer("sandbox_usage_month").notNull().default(0),

  /** Month (YYYY-MM) of last monthly sandbox usage reset. */
  sandboxMonthResetDate: varchar("sandbox_month_reset_date", { length: 7 }),

  // ── Detailed Analysis Usage ───────────────────────────────────────────────
  // Separate quota for "Detailed Analysis" (Custom Resume Upload) feature.
  // Limits: 100/day, 500/month.

  /** Number of detailed analysis calls used today. */
  detailedAnalysisUsageToday: integer("detailed_analysis_usage_today").notNull().default(0),

  /** Date (YYYY-MM-DD) of last daily detailed analysis usage reset. */
  detailedAnalysisResetDate: varchar("detailed_analysis_reset_date", { length: 10 }),

  /** Number of detailed analysis calls used this calendar month. */
  detailedAnalysisUsageMonth: integer("detailed_analysis_usage_month").notNull().default(0),

  /** Month (YYYY-MM) of last monthly detailed analysis usage reset. */
  detailedAnalysisMonthResetDate: varchar("detailed_analysis_month_reset_date", { length: 7 }),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: drives
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Each row is a placement drive (job opening) created by faculty/admin.
// The JD goes through a pipeline: raw → AI-enhanced → parsed → embedded.
// Eligibility filters determine which students can be ranked against it.

export const drives = pgTable("drives", {
  /** Primary key. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** Faculty or admin who created this drive. FK → users.id. */
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // ── Company & Role ────────────────────────────────────────────────────────

  /** Recruiting company name. */
  company: varchar("company", { length: 255 }).notNull(),

  /** Job title / role name (e.g., "SDE Intern", "Data Analyst"). */
  roleTitle: varchar("role_title", { length: 255 }).notNull(),

  /** Location: "Remote", "Mumbai", "Bangalore", etc. */
  location: varchar("location", { length: 255 }),

  /** Package / CTC offered (descriptive text, e.g., "₹6–8 LPA"). */
  packageOffered: varchar("package_offered", { length: 100 }),

  // ── Job Description Pipeline ──────────────────────────────────────────────

  /** Raw JD text as pasted by the creator. */
  rawJd: text("raw_jd").notNull(),

  /**
   * AI-enhanced version of the JD.
   * Generated by the enhance_jd job.
   * Nullable: not yet processed.
   */
  enhancedJd: text("enhanced_jd"),

  /**
   * Structured parse of the JD into typed JSON.
   * Generated by the enhance_jd job.
   * See: ParsedJD type at the bottom of this file.
   * Nullable: not yet processed.
   */
  parsedJd: jsonb("parsed_jd").$type<ParsedJD | null>(),

  /**
   * 768-dimensional embedding of the JD.
   * Generated by the generate_embedding job using text-embedding-004.
   * Used for cosine-similarity matching against student embeddings.
   * Nullable: not yet generated.
   */
  jdEmbedding: vector("jd_embedding"),

  // ── Eligibility Filters ───────────────────────────────────────────────────
  // These are the hard-cutoff filters faculty set. Students below these
  // thresholds are excluded from ranking entirely.

  /** Minimum CGPA required (e.g., 7.0). Null = no minimum. */
  minCgpa: real("min_cgpa"),

  /** Eligible branches (e.g., ["Computer Science", "IT"]). Null = all. */
  eligibleBranches: jsonb("eligible_branches").$type<string[] | null>(),

  /** Eligible batch years (e.g., [2026]). Null = all. */
  eligibleBatchYears: jsonb("eligible_batch_years").$type<number[] | null>(),

  /** Eligible performance categories. Null = all. */
  eligibleCategories: jsonb("eligible_categories")
    .$type<("alpha" | "beta" | "gamma")[] | null>(),

  // ── Status ────────────────────────────────────────────────────────────────

  /** Whether this drive is currently accepting rankings. */
  isActive: boolean("is_active").notNull().default(true),

  /** Application/ranking deadline. Null = no deadline. */
  deadline: timestamp("deadline", { withTimezone: true }),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: rankings
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: The explainable ranking output for each (drive, student) pair.
// Each row is an AI-generated assessment of how well a student fits a drive.
//
// Explainability is a core product requirement:
//  - matchedSkills / missingSkills → quick scan
//  - shortExplanation → 1-line summary
//  - detailedExplanation → full AI reasoning

export const rankings = pgTable("rankings", {
  /** Primary key. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** The drive this ranking is for. FK → drives.id. */
  driveId: uuid("drive_id")
    .notNull()
    .references(() => drives.id, { onDelete: "cascade" }),

  /** The student being ranked. FK → students.id → users.id. */
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),

  // ── Scores ────────────────────────────────────────────────────────────────

  /**
   * Final composite match score (0–100).
   * Weighted combination of semantic and structured scores.
   * This is the value used for sorting/ranking.
   */
  matchScore: real("match_score").notNull(),

  /**
   * Cosine similarity between student embedding and JD embedding (0–1).
   * Captures semantic/contextual fit that structured comparison misses.
   */
  semanticScore: real("semantic_score").notNull(),

  /**
   * Structured comparison score (0–100).
   * Based on explicit skill matching, CGPA thresholds, experience years, etc.
   */
  structuredScore: real("structured_score").notNull(),

  // ── Skill Analysis ────────────────────────────────────────────────────────

  /** Skills the student has that match the JD requirements. */
  matchedSkills: jsonb("matched_skills").$type<string[]>().notNull(),

  /** Skills the JD requires that the student is missing. */
  missingSkills: jsonb("missing_skills").$type<string[]>().notNull(),

  // ── Explanations ──────────────────────────────────────────────────────────

  /**
   * One-line explanation for quick display in tables/cards.
   * E.g., "Strong match: 8/10 required skills, relevant internship experience"
   */
  shortExplanation: text("short_explanation").notNull(),

  /**
   * Multi-paragraph AI-generated reasoning covering:
   * skill alignment, experience relevance, academic fit, and gaps.
   */
  detailedExplanation: text("detailed_explanation").notNull(),

  // ── Position ──────────────────────────────────────────────────────────────

  /**
   * Ordinal rank position within this drive (1 = best match).
   * Assigned after all students for a drive are scored.
   */
  rankPosition: integer("rank_position").notNull(),

  /**
   * Whether the student has been shortlisted for this drive.
   * Null = no decision, true = shortlisted, false = rejected.
   */
  shortlisted: boolean("shortlisted"),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: jobs
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Async job queue stored in PostgreSQL (DB-as-queue pattern).
//
// Why DB instead of Redis/BullMQ?
//  - Free-tier friendly: no additional service to provision or pay for.
//  - Durable by default: jobs survive process restarts.
//  - Transactional: job creation + triggering entity update in one TX.
//  - Simple: no broker wiring, no pub/sub complexity.
//  - Sufficient: expected throughput < 100 jobs/hour for an MVP.
//
// Job lifecycle:
//  1. Creator inserts row with status = "pending"
//  2. Worker polls for pending jobs (ordered by priority DESC, createdAt ASC)
//  3. Worker sets status = "processing"
//  4. On success: status = "completed", result populated
//  5. On failure: status = "failed", error populated, retryCount incremented

export const jobs = pgTable("jobs", {
  /** Primary key. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** What kind of work this job performs. */
  type: jobTypeEnum("type").notNull(),

  /** Current lifecycle state. */
  status: jobStatusEnum("status").notNull().default("pending"),

  /**
   * Input payload for the job. Shape depends on job type:
   *  - parse_resume:      { studentId: string, resumeUrl: string }
   *  - generate_embedding: { targetType: "student" | "drive", targetId: string }
   *  - enhance_jd:        { driveId: string }
   *  - rank_students:     { driveId: string }
   */
  payload: jsonb("payload").notNull(),

  /**
   * Output of a successfully completed job.
   * Shape depends on job type. Null until completed.
   */
  result: jsonb("result"),

  /** Error message if the job failed. Null unless status = "failed". */
  error: text("error"),

  // ── Retry Metadata ────────────────────────────────────────────────────────

  /** How many times this job has been retried after failure. */
  retryCount: integer("retry_count").notNull().default(0),

  /** Maximum allowed retries before giving up. */
  maxRetries: integer("max_retries").notNull().default(3),

  // ── Execution Metadata ────────────────────────────────────────────────────

  /**
   * Priority (1 = lowest, 10 = highest).
   * Workers pick higher-priority jobs first.
   */
  priority: integer("priority").notNull().default(5),

  /** Which AI model was used (e.g., "gemini-1.5-flash", "llama-3.1-8b"). */
  modelUsed: varchar("model_used", { length: 100 }),

  /** Job execution duration in milliseconds. Null until completed/failed. */
  latencyMs: integer("latency_ms"),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: sample_jds
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Pre-loaded sample job descriptions for testing, demos, and
// onboarding walkthroughs. Faculty can clone these into real drives.

export const sampleJds = pgTable("sample_jds", {
  /** Primary key. */
  id: uuid("id").primaryKey().defaultRandom(),

  /** Descriptive title (e.g., "SDE Intern — Google"). */
  title: varchar("title", { length: 255 }).notNull(),

  /** Company name for display context. */
  company: varchar("company", { length: 255 }).notNull(),

  /** Full job description text. */
  jdText: text("jd_text").notNull(),

  /**
   * Whether this sample can be deleted by users.
   * System-seeded samples are non-deletable (false).
   * User-created samples are deletable (true).
   */
  isDeletable: boolean("is_deletable").notNull().default(true),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: ai_rate_limits
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Multi-model rate limiting using the database.
//
// Free-tier tokens are shared. We use this table to track request counts
// per model per minute window to prevent 429 errors from providers.
// Keyed by (model_key, window_start).

export const aiRateLimits = pgTable(
  "ai_rate_limits",
  {
    /** Primary key. */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Model identifier (e.g., "gemini-1.5-flash", "llama-3.1-8b"). */
    modelKey: varchar("model_key", { length: 100 }).notNull(),

    /**
     * Start of the 1-minute window (ISO 8601, truncated to minute).
     * E.g., "2025-03-04T12:05:00Z".
     */
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),

    /** Number of requests made in this window across all server instances. */
    requestCount: integer("request_count").notNull().default(1),
  },
  (table) => ({
    unq: unique().on(table.modelKey, table.windowStart),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Relations (Drizzle relational query API)
// ─────────────────────────────────────────────────────────────────────────────
// These do NOT create FK constraints (those are in the table definitions above).
// They enable Drizzle's `.with()` / `.findFirst()` relational query syntax.

export const usersRelations = relations(users, ({ one, many }) => ({
  /** A user with role = "student" has exactly one student profile. */
  student: one(students, {
    fields: [users.id],
    references: [students.id],
  }),
  /** Faculty/admin users can create multiple drives. */
  drives: many(drives),
  /** Magic link tokens issued for this user. */
  magicLinkTokens: many(magicLinkTokens),
}));

export const magicLinkTokensRelations = relations(magicLinkTokens, ({ one }) => ({
  /** The user this token belongs to. */
  user: one(users, {
    fields: [magicLinkTokens.userId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  /** Back-reference to the parent user row. */
  user: one(users, {
    fields: [students.id],
    references: [users.id],
  }),
  /** A student can appear in rankings for multiple drives. */
  rankings: many(rankings),
}));

export const drivesRelations = relations(drives, ({ one, many }) => ({
  /** The faculty/admin who created this drive. */
  creator: one(users, {
    fields: [drives.createdBy],
    references: [users.id],
  }),
  /** All ranking results generated for this drive. */
  rankings: many(rankings),
}));

export const rankingsRelations = relations(rankings, ({ one }) => ({
  /** The drive this ranking belongs to. */
  drive: one(drives, {
    fields: [rankings.driveId],
    references: [drives.id],
  }),
  /** The student being ranked. */
  student: one(students, {
    fields: [rankings.studentId],
    references: [students.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript Types for JSONB Columns
// ─────────────────────────────────────────────────────────────────────────────
// These types are the contract between application code and the database.
// They must be validated with Zod schemas before insertion.
// They are used in .$type<T>() annotations on jsonb columns above.

/** A project the student has built or contributed to. */
export interface Project {
  /** Project title. */
  title: string;
  /** What the project does. */
  description: string;
  /** Technologies/frameworks used (e.g., ["React", "Node.js", "PostgreSQL"]). */
  techStack: string[];
  /** Link to live demo or repository. Optional. */
  url?: string;
  /** Start month (e.g., "2025-01"). */
  startDate?: string;
  /** End month. Omit if ongoing. */
  endDate?: string;
}

/** An internship or professional work experience entry. */
export interface WorkExperience {
  /** Company or organization name. */
  company: string;
  /** Job title / role. */
  role: string;
  /** What the student did — responsibilities, impact, tech used. */
  description: string;
  /** Start month (e.g., "2025-06"). */
  startDate: string;
  /** End month. Omit if current position. */
  endDate?: string;
  /** Where the role was based or "Remote". */
  location?: string;
}

/**
 * A skill with self-assessed proficiency.
 * Proficiency levels:
 *   1 = Beginner (aware of concept)
 *   2 = Elementary (can use with guidance)
 *   3 = Intermediate (can use independently)
 *   4 = Advanced (can mentor others)
 *   5 = Expert (deep, production-level mastery)
 */
export interface Skill {
  /** Skill name (e.g., "Python", "Docker", "System Design"). */
  name: string;
  /** Proficiency on a 1–5 scale. */
  proficiency: 1 | 2 | 3 | 4 | 5;
  /** Skill category for grouping (e.g., "Language", "Framework", "Tool"). */
  category?: string;
}

/** A professional certification the student has earned. */
export interface Certification {
  /** Certificate title (e.g., "AWS Cloud Practitioner"). */
  title: string;
  /** Issuing organization (e.g., "Amazon Web Services"). */
  issuer: string;
  /** Date issued (e.g., "2025-03"). */
  dateIssued?: string;
  /** Verification URL. Optional. */
  url?: string;
}

/** A competitive programming or coding platform profile. */
export interface CodingProfile {
  /** Platform name (e.g., "LeetCode", "Codeforces", "HackerRank"). */
  platform: string;
  /** Username or handle on the platform. */
  username: string;
  /** Platform rating if applicable (e.g., 1800 on Codeforces). */
  rating?: number;
  /** Number of problems solved. */
  problemsSolved?: number;
  /** Direct link to the profile page. */
  url?: string;
}

/** A published research paper or technical article. */
export interface ResearchPaper {
  /** Paper title. */
  title: string;
  /** Brief abstract or summary. */
  abstract?: string;
  /** Where it was published (journal, conference, arXiv). */
  venue?: string;
  /** Publication date (e.g., "2025-08"). */
  datePublished?: string;
  /** DOI or URL to the paper. */
  url?: string;
  /** Co-authors (names as strings). */
  authors?: string[];
}

/** An award, hackathon win, or other achievement. */
export interface Achievement {
  /** Achievement title (e.g., "1st Place — HackMIT 2025"). */
  title: string;
  /** What was achieved and its significance. */
  description?: string;
  /** Date of the achievement (e.g., "2025-10"). */
  date?: string;
  /** Issuing body or event name. */
  issuer?: string;
}

/**
 * Structured representation of a parsed Job Description.
 * Generated by the AI enhance_jd pipeline from raw JD text.
 */
export interface ParsedJD {
  /** Job title extracted from the JD. */
  title: string;
  /** Company name extracted from the JD. */
  company: string;
  /** Core responsibilities listed in the JD. */
  responsibilities: string[];
  /** Required skills/technologies. */
  requiredSkills: string[];
  /** Nice-to-have / preferred skills. */
  preferredSkills: string[];
  /** Required qualifications (degree, experience years, etc.). */
  qualifications: string[];
  /** Years of experience required. Null if not specified. */
  experienceYears?: number;
  /** Employment type (e.g., "Full-time", "Internship", "Contract"). */
  employmentType?: string;
  /** One-paragraph summary of the JD for display. */
  summary: string;
}
