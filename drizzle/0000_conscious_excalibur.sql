CREATE TYPE "public"."batch_category" AS ENUM('alpha', 'beta', 'gamma');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('parse_resume', 'generate_embedding', 'enhance_jd', 'rank_students');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'faculty', 'admin');--> statement-breakpoint
CREATE TABLE "drives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"company" varchar(255) NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"location" varchar(255),
	"package_offered" varchar(100),
	"raw_jd" text NOT NULL,
	"enhanced_jd" text,
	"parsed_jd" jsonb,
	"jd_embedding" vector(384),
	"min_cgpa" real,
	"eligible_branches" jsonb,
	"eligible_batch_years" jsonb,
	"eligible_categories" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"model_used" varchar(100),
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"match_score" real NOT NULL,
	"semantic_score" real NOT NULL,
	"structured_score" real NOT NULL,
	"matched_skills" jsonb NOT NULL,
	"missing_skills" jsonb NOT NULL,
	"short_explanation" text NOT NULL,
	"detailed_explanation" text NOT NULL,
	"rank_position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_jds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"jd_text" text NOT NULL,
	"is_deletable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sap_id" varchar(20),
	"roll_no" varchar(30),
	"phone" varchar(20),
	"linkedin" varchar(500),
	"tenth_percentage" real,
	"twelfth_percentage" real,
	"cgpa" real,
	"semester" integer,
	"branch" varchar(100),
	"batch_year" integer,
	"category" "batch_category",
	"projects" jsonb DEFAULT '[]'::jsonb,
	"work_experience" jsonb DEFAULT '[]'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"coding_profiles" jsonb DEFAULT '[]'::jsonb,
	"research_papers" jsonb DEFAULT '[]'::jsonb,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"soft_skills" jsonb DEFAULT '[]'::jsonb,
	"resume_url" text,
	"resume_text" text,
	"resume_parsed_at" timestamp with time zone,
	"embedding" vector(384),
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"sandbox_usage_today" integer DEFAULT 0 NOT NULL,
	"sandbox_reset_date" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_sap_id_unique" UNIQUE("sap_id"),
	CONSTRAINT "students_roll_no_unique" UNIQUE("roll_no")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"microsoft_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_microsoft_id_unique" UNIQUE("microsoft_id")
);
--> statement-breakpoint
ALTER TABLE "drives" ADD CONSTRAINT "drives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_drive_id_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;