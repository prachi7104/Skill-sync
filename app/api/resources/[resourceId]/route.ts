import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { hasComponent, requireRole } from "@/lib/auth/helpers";
import { deleteCloudinaryRawByUrl, uploadRawFileToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { SOFTSKILLS_RESOURCE_CATEGORIES, TECHNICAL_RESOURCE_CATEGORIES } from "@/lib/phase8-10";

const updateResourceSchema = z.object({
  section: z.enum(["technical", "softskills"]).optional(),
  category: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().max(6000).nullable().optional(),
  bodyFormat: z.enum(["markdown", "text"]).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  companyName: z.string().max(255).nullable().optional(),
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

type ResourceAccessRow = {
  id: string;
  author_id: string;
  college_id: string;
  section: "technical" | "softskills";
  category: string;
  title: string;
  body: string | null;
  body_format: "markdown" | "text" | null;
  tags: string[];
  company_name: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size_kb: number | null;
  status: "draft" | "published" | "archived";
};

async function getScopedResource(resourceId: string, collegeId: string) {
  const [resource] = await db.execute(sql`
    SELECT
      id,
      author_id,
      college_id,
      section,
      category,
      title,
      body,
      body_format,
      tags,
      company_name,
      attachment_url,
      attachment_name,
      attachment_mime,
      attachment_size_kb,
      status
    FROM resources
    WHERE id = ${resourceId}
      AND college_id = ${collegeId}
    LIMIT 1
  `) as unknown as ResourceAccessRow[];

  return resource ?? null;
}

function getRequiredComponent(section: "technical" | "softskills") {
  return section === "technical" ? "technical_content" : "softskills_content";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { resourceId: string } },
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let payload: z.infer<typeof updateResourceSchema> = {};
    let file: File | null = null;
    let removeAttachment = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      file = formData.get("file") as File | null;
      removeAttachment = String(formData.get("removeAttachment") ?? "").toLowerCase() === "true";

      payload = updateResourceSchema.parse({
        section: formData.get("section") || undefined,
        category: formData.get("category") || undefined,
        title: formData.get("title") || undefined,
        body: formData.has("body") ? String(formData.get("body") ?? "") : undefined,
        bodyFormat: formData.get("bodyFormat") || undefined,
        tags: formData.has("tags")
          ? String(formData.get("tags") ?? "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
          : undefined,
        companyName: formData.has("companyName")
          ? (String(formData.get("companyName") ?? "").trim() || null)
          : undefined,
        status: formData.get("status") || undefined,
      });
    } else {
      payload = updateResourceSchema.parse(await req.json());
    }

    if (Object.keys(payload).length === 0 && !file && !removeAttachment) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const resource = await getScopedResource(params.resourceId, user.collegeId);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (user.role === "faculty" && resource.author_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own resources" }, { status: 403 });
    }

    if (file && removeAttachment) {
      return NextResponse.json({ error: "Cannot upload and remove attachment in the same request" }, { status: 400 });
    }

    const nextSection = payload.section ?? resource.section;
    if (payload.category && !isValidCategoryForSection(nextSection, payload.category)) {
      return NextResponse.json({ error: "Invalid resource category for the selected section" }, { status: 400 });
    }
    if (user.role !== "admin") {
      const allowed = await hasComponent(getRequiredComponent(nextSection));
      if (!allowed) {
        return NextResponse.json({ error: `Requires ${getRequiredComponent(nextSection)} permission` }, { status: 403 });
      }
      if (payload.status === "archived") {
        return NextResponse.json({ error: "Only admins can archive resources" }, { status: 403 });
      }
    }

    let nextAttachmentUrl = resource.attachment_url;
    let nextAttachmentName = resource.attachment_name;
    let nextAttachmentMime = resource.attachment_mime;
    let nextAttachmentSizeKb = resource.attachment_size_kb;
    let oldAttachmentUrlToDelete: string | null = null;

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

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadRawFileToCloudinary({
        buffer,
        folder: "skillsync-resources",
        publicId: `${user.id}_${Date.now()}`,
        format: file.type === "application/pdf" ? "pdf" : "docx",
      });

      nextAttachmentUrl = uploaded.secureUrl;
      nextAttachmentName = file.name;
      nextAttachmentMime = file.type;
      nextAttachmentSizeKb = Math.max(1, Math.round(file.size / 1024));
      oldAttachmentUrlToDelete = resource.attachment_url;
    } else if (removeAttachment) {
      nextAttachmentUrl = null;
      nextAttachmentName = null;
      nextAttachmentMime = null;
      nextAttachmentSizeKb = null;
      oldAttachmentUrlToDelete = resource.attachment_url;
    }

    const nextBody = payload.body !== undefined
      ? (payload.body?.trim() ? payload.body : null)
      : resource.body;

    if (!nextBody && !nextAttachmentUrl) {
      return NextResponse.json({ error: "Either content body or file attachment is required" }, { status: 400 });
    }

    const nextStatus = payload.status ?? resource.status;
    const nextTags = payload.tags === undefined
      ? resource.tags
      : (payload.tags ?? []);
    const nextCompanyName = payload.companyName === undefined
      ? resource.company_name
      : (payload.companyName?.trim() ? payload.companyName : null);

    await db.execute(sql`
      UPDATE resources
      SET section = ${nextSection},
          category = ${payload.category ?? resource.category},
          title = ${payload.title ?? resource.title},
          body = ${nextBody},
          body_format = ${payload.bodyFormat ?? resource.body_format ?? "markdown"},
          attachment_url = ${nextAttachmentUrl},
          attachment_name = ${nextAttachmentName},
          attachment_mime = ${nextAttachmentMime},
          attachment_size_kb = ${nextAttachmentSizeKb},
            tags = ${sqlTextArray(nextTags)},
          company_name = ${nextCompanyName},
          status = ${nextStatus},
          updated_at = NOW()
      WHERE id = ${params.resourceId}
        AND college_id = ${user.collegeId}
    `);

    if (
      oldAttachmentUrlToDelete &&
      oldAttachmentUrlToDelete !== nextAttachmentUrl
    ) {
      try {
        await deleteCloudinaryRawByUrl(oldAttachmentUrlToDelete);
      } catch (err) {
        console.error("[PATCH /api/resources/[resourceId]] Cloudinary cleanup failed:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { resourceId: string } },
) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (!user.collegeId) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }

    const resource = await getScopedResource(params.resourceId, user.collegeId);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (user.role === "faculty" && resource.author_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own resources" }, { status: 403 });
    }

    await db.execute(sql`
      DELETE FROM resources
      WHERE id = ${params.resourceId}
        AND college_id = ${user.collegeId}
    `);

    if (resource.attachment_url) {
      try {
        await deleteCloudinaryRawByUrl(resource.attachment_url);
      } catch (err) {
        console.error("[DELETE /api/resources] Cloudinary cleanup failed:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
