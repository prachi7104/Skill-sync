import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { requireAuth, requireRole, hasComponent } from "@/lib/auth/helpers";
import { uploadRawFileToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { formatCategoryLabel, SOFTSKILLS_RESOURCE_CATEGORIES, TECHNICAL_RESOURCE_CATEGORIES } from "@/lib/phase8-10";

const resourceSchema = z.object({
  section: z.enum(["technical", "softskills"]),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  body: z.string().max(6000).optional().nullable(),
  bodyFormat: z.enum(["markdown", "text"]).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  companyName: z.string().max(255).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const CATEGORY_BY_SECTION = {
  technical: new Set(TECHNICAL_RESOURCE_CATEGORIES),
  softskills: new Set(SOFTSKILLS_RESOURCE_CATEGORIES),
} as const;

function isValidCategoryForSection(section: "technical" | "softskills", category: string) {
  return CATEGORY_BY_SECTION[section].has(category as never);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sqlTextArray(arr: string[]) {
  if (arr.length === 0) return sql`ARRAY[]::text[]`;
  return sql`ARRAY[${sql.join(arr.map((t) => sql`${t}`), sql`, `)}]::text[]`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const url = new URL(req.url);
    const section = url.searchParams.get("section");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("q");
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const whereParts = [
      sql`r.college_id = ${user.collegeId}`,
    ];

    if (user.role === "student") {
      whereParts.push(sql`r.status = 'published'`);
    } else if (user.role === "faculty") {
      if (status === "draft") {
        whereParts.push(sql`r.status = 'draft'`);
        whereParts.push(sql`r.author_id = ${user.id}`);
      } else if (status === "archived") {
        whereParts.push(sql`r.status = 'archived'`);
        whereParts.push(sql`r.author_id = ${user.id}`);
      } else if (status === "published") {
        whereParts.push(sql`r.status = 'published'`);
      } else {
        whereParts.push(sql`(r.status = 'published' OR r.author_id = ${user.id})`);
      }
    } else if (status === "draft" || status === "published" || status === "archived") {
      whereParts.push(sql`r.status = ${status}`);
    }

    if (section) whereParts.push(sql`r.section = ${section}`);
    if (category) whereParts.push(sql`r.category = ${category}`);
    if (search) {
      whereParts.push(sql`(r.title ILIKE ${`%${search}%`} OR ${search} = ANY(r.tags))`);
    }

    const resources = await db.execute(sql`
      SELECT
        r.id,
        r.author_id,
        r.section,
        r.category,
        r.title,
        r.body,
        r.body_format,
        r.attachment_url,
        r.attachment_name,
        r.attachment_size_kb,
        r.tags,
        r.company_name,
        r.status,
        r.view_count,
        r.helpful_count,
        r.created_at,
        r.updated_at,
        u.name AS author_name,
        COUNT(*) OVER()::int AS total_count
      FROM resources r
      JOIN users u ON u.id = r.author_id
      WHERE ${sql.join(whereParts, sql` AND `)}
      ORDER BY r.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as Array<Record<string, unknown>>;

    const totalCount = Number(resources[0]?.total_count ?? 0);

    const canCreate = user.role === "admin"
      ? true
      : await hasComponent(section === "softskills" ? "softskills_content" : "technical_content");

    return NextResponse.json({
      resources,
      totalCount,
      canCreate,
      viewerRole: user.role,
      viewerId: user.id,
      categoryLabels: Object.fromEntries(resources.map((resource) => [resource.category as string, formatCategoryLabel(String(resource.category))])),
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let parsedBody: z.infer<typeof resourceSchema>;
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentMime: string | null = null;
    let attachmentSizeKb: number | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      parsedBody = resourceSchema.parse({
        section: formData.get("section"),
        category: formData.get("category"),
        title: formData.get("title"),
        body: formData.get("body"),
        bodyFormat: formData.get("bodyFormat") || "markdown",
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        companyName: formData.get("companyName") || null,
        status: formData.get("status") || undefined,
      });

      const file = formData.get("file") as File | null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }

        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: "Only PDF and DOCX attachments are supported" }, { status: 400 });
        }

        // Verify magic bytes match declared MIME type.
        const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        const isPdfMagic =
          headerBytes[0] === 0x25 &&
          headerBytes[1] === 0x50 &&
          headerBytes[2] === 0x44 &&
          headerBytes[3] === 0x46; // %PDF
        const isZipMagic =
          headerBytes[0] === 0x50 &&
          headerBytes[1] === 0x4b &&
          headerBytes[2] === 0x03 &&
          headerBytes[3] === 0x04; // PK.. (DOCX is a ZIP)

        if (file.type === "application/pdf" && !isPdfMagic) {
          return NextResponse.json({ error: "File content does not match PDF type" }, { status: 400 });
        }
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && !isZipMagic) {
          return NextResponse.json({ error: "File content does not match DOCX type" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadRawFileToCloudinary({
          buffer,
          folder: "skillsync-resources",
          publicId: `${user.id}_${Date.now()}`,
          format: file.type === "application/pdf" ? "pdf" : "docx",
        });
        attachmentUrl = uploaded.secureUrl;
        attachmentName = file.name;
        attachmentMime = file.type;
        attachmentSizeKb = Math.max(1, Math.round(file.size / 1024));
      }
    } else {
      parsedBody = resourceSchema.parse(await req.json());
    }

    const requiredComponent = parsedBody.section === "technical" ? "technical_content" : "softskills_content";
    if (user.role !== "admin") {
      const allowed = await hasComponent(requiredComponent);
      if (!allowed) {
        return NextResponse.json({ error: `Requires ${requiredComponent} permission` }, { status: 403 });
      }
    }

    if (!isValidCategoryForSection(parsedBody.section, parsedBody.category)) {
      return NextResponse.json({ error: "Invalid resource category for the selected section" }, { status: 400 });
    }

    const normalizedBody = parsedBody.body?.trim() ? parsedBody.body : null;
    const normalizedCompanyName = parsedBody.companyName?.trim() ? parsedBody.companyName : null;

    if (!normalizedBody && !attachmentUrl) {
      return NextResponse.json({ error: "Either content body or file attachment is required" }, { status: 400 });
    }

    const [resource] = await db.execute(sql`
      INSERT INTO resources (
        college_id, author_id, section, category, title,
        body, body_format, attachment_url, attachment_name, attachment_mime, attachment_size_kb,
        tags, company_name, status
      ) VALUES (
        ${user.collegeId}, ${user.id}, ${parsedBody.section}, ${parsedBody.category}, ${parsedBody.title},
        ${normalizedBody}, ${parsedBody.bodyFormat ?? "markdown"}, ${attachmentUrl}, ${attachmentName}, ${attachmentMime}, ${attachmentSizeKb},
        ${sqlTextArray(parsedBody.tags ?? [])}, ${normalizedCompanyName},
        ${user.role === "faculty" && parsedBody.status === "draft" ? "draft" : "published"}
      ) RETURNING id
    `) as unknown as Array<{ id: string }>;

    return NextResponse.json({ success: true, id: resource.id }, { status: 201 });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[POST /api/resources]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create resource" }, { status: 500 });
  }
}
