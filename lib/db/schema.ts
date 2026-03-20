/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Canonical Database Schema
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This file is the SINGLE SOURCE OF TRUTH for all tables, enums, relations,
 * and JSON types in the SkillSync platform.
 *
 * Stack:            Drizzle ORM 0.30 + PostgreSQL + pgvector
 * Embedding model:  gemini-embedding-001 → 768-dimensional vectors (prefix-truncated from 3072)
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
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// pgvector custom type
// ─────────────────────────────────────────────────────────────────────────────
// Requires `CREATE EXTENSION IF NOT EXISTS vector;` in the target database.
// Dimension 768 matches the output of `gemini-embedding-001` (Google Gemini, MRL-truncated from 3072).
// WARNING: Do not change models without re-generating ALL embeddings.
//          Mixed-model embeddings produce unreliable cosine similarity scores.
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

/** Staff component permissions — faculty/admin capabilities granted per user. */
export const staffComponentEnum = pgEnum("staff_component", [
  "drive_management",
  "amcat_management",
  "technical_content",
  "softskills_content",
  "company_experiences",
  "student_feedback_posting",
  "sandbox_access",
  "student_management",
  "analytics_view",
]);

/** Placement drive recruitment type. */
export const placementTypeEnum = pgEnum("placement_type", ["placement", "internship", "ppo", "other"]);

// ─────────────────────────────────────────────────────────────────────────────
// Table: colleges
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Institution registry. One row per registered college.
// Phase 2: Added for multi-college support — Drizzle type inference only.
// DO NOT drizzle-push; the table is already provisioned in the database.

export const colleges = pgTable("colleges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  studentDomain: varchar("student_domain", { length: 100 }).notNull(),
  staffDomain: varchar("staff_domain", { length: 100 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 50 }).notNull().default("India"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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

  /** College this user belongs to. Nullable for legacy/seeded admin accounts. */
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),

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
// Table: staff_profiles
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Faculty/admin capabilities and profile information.
// 1:N relationship — a faculty/admin user has exactly one staff_profiles row.
// Stores department, designation, and component permissions (capabilities).

export const staffProfiles = pgTable("staff_profiles", {
  /** PK and FK → users.id. One staff profile per staff user. */
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  /** College this staff member belongs to (denormalised from users for fast queries). */
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),

  /** Department or team (e.g., "Human Resources", "Technical Team"). */
  department: varchar("department", { length: 255 }),

  /** Job title or role (e.g., "Placement Coordinator", "Technical Lead"). */
  designation: varchar("designation", { length: 255 }),

  /** Employee ID from HR systems. */
  employeeId: varchar("employee_id", { length: 50 }),

  /** Contact phone number. */
  phone: varchar("phone", { length: 20 }),

  /** Array of granted component permissions. See: staffComponentEnum */
  grantedComponents: text("granted_components")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),

  /** Whether this staff profile is currently active. */
  isActive: boolean("is_active").notNull().default(true),

  /** Admin who created this staff profile. */
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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

  /** College this student belongs to (denormalised from users for fast queries). */
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),

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
   * Generated by gemini-embedding-001 via Google Gemini.
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
}, (table) => ({
  embeddingHnsw: index("idx_students_embedding_hnsw").on(table.embedding),
}));

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

  /** Placement season this drive belongs to. Null for legacy drives. */
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),

  /** College this drive belongs to. NOT NULL — set at creation from creator's college. */
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),

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
   * Generated by the generate_embedding job using gemini-embedding-001.
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

  /** Whether students can view drive rankings/details for this drive. */
  rankingsVisible: boolean("rankings_visible").notNull().default(false),

  /** Recruitment type used for filtering and reporting. */
  placementType: placementTypeEnum("placement_type").notNull().default("placement"),

  /** Application/ranking deadline. Null = no deadline. */
  deadline: timestamp("deadline", { withTimezone: true }),

  /** Status of the ranking pipeline for this drive. */
  ranking_status: varchar("ranking_status", { length: 20 }).notNull().default("pending"),

  // ── Timestamps ────────────────────────────────────────────────────────────

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  jdEmbeddingHnsw: index("idx_drives_jd_embedding_hnsw").on(table.jdEmbedding),
}));

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

  /** College this ranking belongs to. Matches drive.collegeId. */
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),

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

  /** Whether the student met drive eligibility criteria at ranking time. */
  isEligible: boolean("is_eligible").notNull().default(true),

  /** Human-readable reason for ineligibility. */
  ineligibilityReason: text("ineligibility_reason"),

  /** Snapshot of profile completeness score when ranking was computed. */
  profileCompletenessAtRank: integer("profile_completeness_at_rank"),

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

  /** Cached resume impact analysis JSON generated from drive-specific prompt. */
  resumeDiffJson: jsonb("resume_diff_json").$type<Record<string, unknown> | null>(),

  /** Cached interview preparation question-set generated for this drive. */
  interviewQuestionsJson: jsonb("interview_questions_json")
    .$type<Record<string, unknown> | null>(),

  /** Timestamp of latest generated analysis payloads for this ranking. */
  analysisGeneratedAt: timestamp("analysis_generated_at", { withTimezone: true }),

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
}, (table) => ({
  driveStudentUnq: unique("idx_rankings_drive_student_unique").on(table.driveId, table.studentId),
}));

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
}, (table) => ({
  jobsRankDedupIdx: index("idx_jobs_rank_dedup")
    .on(sql`(${table.payload}->>'driveId')`)
    .where(sql`${table.type} = 'rank_students' AND ${table.status} IN ('pending', 'processing')`),
}));

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
// Table: seasons
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: College-scoped placement seasons used for filtering dashboards and
// assigning drives to a specific recruiting cycle.

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sandboxConfig = pgTable("sandbox_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),
  studentDailyLimit: integer("student_daily_limit").notNull().default(3),
  studentMonthlyLimit: integer("student_monthly_limit").notNull().default(20),
  facultyDailyLimit: integer("faculty_daily_limit").notNull().default(10),
  facultyMonthlyLimit: integer("faculty_monthly_limit").notNull().default(100),
  studentDetailedDaily: integer("student_detailed_daily").notNull().default(2),
  studentDetailedMonthly: integer("student_detailed_monthly").notNull().default(10),
  facultyDetailedDaily: integer("faculty_detailed_daily").notNull().default(5),
  facultyDetailedMonthly: integer("faculty_detailed_monthly").notNull().default(30),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companyExperiences = pgTable("company_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyNormalized: varchar("company_normalized", { length: 255 }).notNull(),
  roleTitle: varchar("role_title", { length: 255 }),
  driveType: varchar("drive_type", { length: 30 }).default("placement"),
  outcome: varchar("outcome", { length: 30 }).notNull().default("not_disclosed"),
  interviewProcess: text("interview_process"),
  tips: text("tips"),
  difficulty: integer("difficulty").notNull().default(3),
  wouldRecommend: boolean("would_recommend"),
  showName: boolean("show_name").notNull().default(false),
  isAdminPosted: boolean("is_admin_posted").notNull().default(false),
  studentName: varchar("student_name", { length: 255 }),
  studentEmail: varchar("student_email", { length: 320 }),
  batchYear: integer("batch_year"),
  category: batchCategoryEnum("category_snapshot"),
  aiScreenScore: real("ai_screen_score").notNull().default(1),
  aiScreenPassed: boolean("ai_screen_passed").notNull().default(true),
  aiScreenReason: text("ai_screen_reason"),
  aiScreenedAt: timestamp("ai_screened_at", { withTimezone: true }),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companyExperienceVotes = pgTable(
  "company_experience_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => companyExperiences.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    experienceVoteUnique: unique("idx_company_experience_votes_unique").on(table.experienceId, table.userId),
  }),
);

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id")
    .notNull()
    .references(() => colleges.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  section: varchar("section", { length: 20 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  bodyFormat: varchar("body_format", { length: 20 }).notNull().default("markdown"),
  attachmentUrl: text("attachment_url"),
  attachmentName: varchar("attachment_name", { length: 255 }),
  attachmentMime: varchar("attachment_mime", { length: 120 }),
  attachmentSizeKb: integer("attachment_size_kb"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  companyName: varchar("company_name", { length: 255 }),
  viewCount: integer("view_count").notNull().default(0),
  helpfulCount: integer("helpful_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: amcat_sessions
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Store AMCAT test sessions created by colleges for batch assessments.

export const amcatSessions = pgTable("amcat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }),
  weights: jsonb("weights").notNull().default({}),
  thresholds: jsonb("thresholds").notNull().default({}),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Table: amcat_results
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Store AMCAT test results for students, linked to sessions.

export const amcatResults = pgTable("amcat_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => amcatSessions.id, { onDelete: "cascade" }),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  sapId: varchar("sap_id", { length: 20 }).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  csScore: real("cs_score"),
  cpScore: real("cp_score"),
  automataScore: real("automata_score"),
  automataFixScore: real("automata_fix_score"),
  quantScore: real("quant_score"),
  totalScore: real("total_score"),
  category: batchCategoryEnum("category"),
  rankInSession: integer("rank_in_session"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sessionSapUnq: unique().on(t.sessionId, t.sapId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Table: student_roster
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Import and track student roster data from CSV uploads.

export const studentRoster = pgTable("student_roster", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  sapId: varchar("sap_id", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  course: varchar("course", { length: 100 }),
  branch: varchar("branch", { length: 100 }),
  batchYear: integer("batch_year"),
  rollNo: varchar("roll_no", { length: 20 }),
  programmeName: varchar("programme_name", { length: 150 }),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  linkedAt: timestamp("linked_at", { withTimezone: true }),
  importedFrom: varchar("imported_from", { length: 50 }).notNull().default("roster_csv"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  collegeRosterUnq: unique().on(t.collegeId, t.sapId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Table: placement_outcomes
// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Track final placement outcomes for students across drives.

export const placementOutcomes = pgTable("placement_outcomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  driveId: uuid("drive_id").notNull().references(() => drives.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  finalStatus: text("final_status").notNull(),
  offerAmount: varchar("offer_amount", { length: 100 }),
  joiningDate: timestamp("joining_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
}));

export const collegesRelations = relations(colleges, ({ many, one }) => ({
  users: many(users),
  seasons: many(seasons),
  sandboxConfig: one(sandboxConfig, {
    fields: [colleges.id],
    references: [sandboxConfig.collegeId],
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
  /** College this drive belongs to. */
  college: one(colleges, {
    fields: [drives.collegeId],
    references: [colleges.id],
  }),
  /** Optional placement season for this drive. */
  season: one(seasons, {
    fields: [drives.seasonId],
    references: [seasons.id],
  }),
  /** All ranking results generated for this drive. */
  rankings: many(rankings),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  college: one(colleges, {
    fields: [seasons.collegeId],
    references: [colleges.id],
  }),
  drives: many(drives),
}));

export const sandboxConfigRelations = relations(sandboxConfig, ({ one }) => ({
  college: one(colleges, {
    fields: [sandboxConfig.collegeId],
    references: [colleges.id],
  }),
}));

export const companyExperiencesRelations = relations(companyExperiences, ({ one }) => ({
  college: one(colleges, {
    fields: [companyExperiences.collegeId],
    references: [colleges.id],
  }),
  author: one(users, {
    fields: [companyExperiences.authorId],
    references: [users.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  college: one(colleges, {
    fields: [resources.collegeId],
    references: [colleges.id],
  }),
  author: one(users, {
    fields: [resources.authorId],
    references: [users.id],
  }),
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
