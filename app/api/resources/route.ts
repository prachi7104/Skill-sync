import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { requireAuth, requireRole, hasComponent } from "@/lib/auth/helpers";
import { uploadRawFileToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { formatCategoryLabel } from "@/lib/phase8-10";

const resourceSchema = z.object({
  section: z.enum(["technical", "softskills"]),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  body: z.string().max(6000).optional().nullable(),
  bodyFormat: z.enum(["markdown", "text"]).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  companyName: z.string().max(255).optional().nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const whereParts = [
      sql`r.college_id = ${user.collegeId}`,
      sql`r.is_published = true`,
    ];

    if (section) whereParts.push(sql`r.section = ${section}`);
    if (category) whereParts.push(sql`r.category = ${category}`);
    if (search) {
      whereParts.push(sql`(r.title ILIKE ${`%${search}%`} OR ${search} = ANY(r.tags))`);
    }

    const resources = await db.execute(sql`
      SELECT
        r.id,
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
        r.view_count,
        r.helpful_count,
        r.created_at,
        r.updated_at,
        u.name AS author_name
      FROM resources r
      JOIN users u ON u.id = r.author_id
      WHERE ${sql.join(whereParts, sql` AND `)}
      ORDER BY r.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as Array<Record<string, unknown>>;

    const canCreate = user.role === "admin"
      ? true
      : await hasComponent(section === "softskills" ? "softskills_content" : "technical_content");

    return NextResponse.json({ resources, canCreate, categoryLabels: Object.fromEntries(resources.map((resource) => [resource.category as string, formatCategoryLabel(String(resource.category))])) });
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
        bodyFormat: formData.get("bodyFormat") ?? "markdown",
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        companyName: formData.get("companyName"),
      });

      const file = formData.get("file") as File | null;
      if (file) {
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: "Only PDF and DOCX attachments are supported" }, { status: 400 });
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

    if (!parsedBody.body && !attachmentUrl) {
      return NextResponse.json({ error: "Either content body or file attachment is required" }, { status: 400 });
    }

    const [resource] = await db.execute(sql`
      INSERT INTO resources (
        college_id, author_id, section, category, title,
        body, body_format, attachment_url, attachment_name, attachment_mime, attachment_size_kb,
        tags, company_name
      ) VALUES (
        ${user.collegeId}, ${user.id}, ${parsedBody.section}, ${parsedBody.category}, ${parsedBody.title},
        ${parsedBody.body ?? null}, ${parsedBody.bodyFormat ?? "markdown"}, ${attachmentUrl}, ${attachmentName}, ${attachmentMime}, ${attachmentSizeKb},
        ${parsedBody.tags ?? []}::text[], ${parsedBody.companyName ?? null}
      ) RETURNING id
    `) as unknown as Array<{ id: string }>;

    return NextResponse.json({ success: true, id: resource.id }, { status: 201 });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}