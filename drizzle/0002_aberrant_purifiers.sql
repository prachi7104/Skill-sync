ALTER TABLE "students" ADD COLUMN "resume_filename" varchar(255);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "resume_mime" varchar(100);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "resume_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "parsed_resume_json" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "sandbox_usage_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "sandbox_month_reset_date" varchar(7);