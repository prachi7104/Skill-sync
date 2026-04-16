import { z } from "zod";

// ── Date format regex ────────────────────────────────────────────────────────
// Matches "YYYY-MM" (e.g., "2025-01") for start/end dates
const dateMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

// ── Academic fields (Prompt 3.3) ─────────────────────────────────────────────

// ── Academic fields (Prompt 3.3) ─────────────────────────────────────────────

export const academicsSchema = z.object({
    tenthPercentage: z
        .number({ required_error: "10th Percentage is required" })
        .min(0, "10th percentage must be ≥ 0")
        .max(100, "10th percentage must be ≤ 100")
        .nullable().optional(),
    twelfthPercentage: z
        .number({ required_error: "12th Percentage is required" })
        .min(0, "12th percentage must be ≥ 0")
        .max(100, "12th percentage must be ≤ 100")
        .nullable().optional(),
    cgpa: z
        .number({ required_error: "CGPA is required" })
        .min(0, "CGPA must be ≥ 0")
        .max(10, "CGPA must be ≤ 10")
        .nullable().optional(),
    semester: z
        .number({ required_error: "Semester is required" })
        .int("Semester must be an integer")
        .min(1, "Semester must be ≥ 1")
        .max(10, "Semester must be ≤ 10")
        .nullable().optional(),
    branch: z.string({ required_error: "Branch is required" }).min(1, "Branch is required").max(100).nullable().optional(),
    batchYear: z
        .number({ required_error: "Batch Year is required" })
        .int()
        .min(2000)
        .max(2100)
        .nullable().optional(),
});

export type AcademicsInput = z.infer<typeof academicsSchema>;

// ── Item schemas (with array limits & date validation — Prompt 3.8) ──────────

export const skillSchema = z.object({
    name: z.string().min(1, "Skill name is required").max(100),
    proficiency: z.number().min(1).max(5).optional(),
    category: z.string().max(50).optional(),
});

export const projectSchema = z.object({
    title: z.string().min(1, "Project title is required").max(200),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
    techStack: z.array(z.string().max(50)).max(15).optional(),
    url: z.string().optional().or(z.literal("")).nullable(),
    startDate: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")).nullable(),
    endDate: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")).nullable(),
});

export const codingProfileSchema = z.object({
    platform: z.string().min(1, "Platform name is required").max(50),
    username: z.string().min(1, "Username is required").max(100),
    url: z.string().url("Coding profile URL must be a valid URL").optional().or(z.literal("")).nullable(),
    rating: z.number().int().min(0).optional(),
    problemsSolved: z.number().int().min(0).optional(),
});

export const workExperienceSchema = z.object({
    company: z.string().min(1, "Company is required").max(200),
    role: z.string().min(1, "Role is required").max(200),
    description: z.string().max(1000).optional().or(z.literal("")),
    startDate: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")),
    endDate: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")),
    location: z.string().max(200).optional(),
});

export const certificationSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    issuer: z.string().min(1, "Issuer is required").max(200),
    dateIssued: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")),
    url: z.string().optional().or(z.literal("")),
});

export const achievementSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(500).optional(),
    date: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")),
    issuer: z.string().max(200).optional(),
});

export const researchPaperSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    abstract: z.string().max(1000).optional(),
    url: z.string().optional().or(z.literal("")),
    datePublished: z.string().regex(dateMonthRegex, "Use YYYY-MM format").optional().or(z.literal("")),
});

// ── Composite profile schema with array limits ──────────────────────────────

export const studentProfileSchema = z.object({
    // Identity fields (Compulsory)
    // Roll No: e.g. R2142233333 (R + 10 digits)
    rollNo: z.string()
        .regex(/^R\d{10}$/, "Roll Number must be format 'R' followed by 10 digits (e.g., R2142233333)")
        .optional()
        .nullable(),

    // SAP ID: e.g. 500126666 (9 digits)
    sapId: z.string()
        .regex(/^\d{9}$/, "SAP ID must be exactly 9 digits (e.g., 500126666)")
        .optional()
        .nullable(),

    // Contact fields
    phone: z.string()
        .max(20, "Phone must be ≤ 20 characters")
        .regex(/^\+?[\d\s\-()]+$/, "Phone must contain only digits, spaces, hyphens, parentheses, and optional leading +")
        .optional()
        .nullable(),

    linkedin: z.string()
        .max(500, "LinkedIn URL must be ≤ 500 characters")
        .url("Must be a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),

    // Academic fields (Optional)
    tenthPercentage: z
        .number({ required_error: "10th Percentage is required" })
        .min(0, "10th percentage must be ≥ 0")
        .max(100, "10th percentage must be ≤ 100")
        .nullable().optional(),
    twelfthPercentage: z
        .number({ required_error: "12th Percentage is required" })
        .min(0, "12th percentage must be ≥ 0")
        .max(100, "12th percentage must be ≤ 100")
        .nullable().optional(),
    cgpa: z
        .number({ required_error: "CGPA is required" })
        .min(0, "CGPA must be ≥ 0")
        .max(10, "CGPA must be ≤ 10")
        .nullable().optional(),
    semester: z
        .number({ required_error: "Semester is required" })
        .int("Semester must be an integer")
        .min(1, "Semester must be ≥ 1")
        .max(10, "Semester must be ≤ 10")
        .nullable().optional(),
    branch: z.string({ required_error: "Branch is required" }).min(1, "Branch is required").max(100).nullable().optional(),
    batchYear: z
        .number({ required_error: "Batch Year is required" })
        .int()
        .min(2000)
        .max(2100)
        .nullable().optional(),

    // Array fields (Optional lists, but items must be valid if present)
    skills: z.array(skillSchema).max(50, "Maximum 50 skills allowed").optional(),
    projects: z.array(projectSchema).max(20, "Maximum 20 projects allowed").optional(),
    codingProfiles: z.array(codingProfileSchema).max(10).optional(),
    workExperience: z.array(workExperienceSchema).max(10, "Maximum 10 work experiences allowed").optional(),
    certifications: z.array(certificationSchema).max(20).optional(),
    achievements: z.array(achievementSchema).max(20).optional(),
    researchPapers: z.array(researchPaperSchema).max(20).optional(),
    softSkills: z.array(z.string().max(50)).max(20).optional(),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
