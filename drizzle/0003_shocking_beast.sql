CREATE TABLE "faculty_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by" uuid,
	"upload_type" varchar(100) NOT NULL,
	"rows_processed" integer DEFAULT 0 NOT NULL,
	"rows_failed" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_state" (
	"model_key" varchar(100) NOT NULL,
	"date" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_state_model_key_date_pk" PRIMARY KEY("model_key","date")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drives" ALTER COLUMN "jd_embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "rankings" ADD COLUMN "shortlisted" boolean;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "detailed_analysis_usage_today" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "detailed_analysis_reset_date" varchar(10);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "detailed_analysis_usage_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "detailed_analysis_month_reset_date" varchar(7);--> statement-breakpoint
ALTER TABLE "faculty_uploads" ADD CONSTRAINT "faculty_uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;