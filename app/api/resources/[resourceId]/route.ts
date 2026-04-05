import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { hasComponent, requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const payload = updateResourceSchema.parse(await req.json());
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const resource = await getScopedResource(params.resourceId, user.collegeId);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (user.role === "faculty" && resource.author_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own resources" }, { status: 403 });
    }

    const nextSection = payload.section ?? resource.section;
    if (user.role !== "admin") {
      const allowed = await hasComponent(getRequiredComponent(nextSection));
      if (!allowed) {
        return NextResponse.json({ error: `Requires ${getRequiredComponent(nextSection)} permission` }, { status: 403 });
      }
      if (payload.status === "archived") {
        return NextResponse.json({ error: "Only admins can archive resources" }, { status: 403 });
      }
    }

    const nextBody = payload.body !== undefined ? payload.body : resource.body;
    const hasAttachment = Boolean(resource.attachment_url);
    if (!nextBody && !hasAttachment) {
      return NextResponse.json({ error: "Either content body or file attachment is required" }, { status: 400 });
    }

    const nextStatus = payload.status ?? resource.status;
    const nextTags = payload.tags === undefined
      ? resource.tags
      : (payload.tags ?? []);

    await db.execute(sql`
      UPDATE resources
      SET section = ${nextSection},
          category = ${payload.category ?? resource.category},
          title = ${payload.title ?? resource.title},
          body = ${nextBody},
          body_format = ${payload.bodyFormat ?? resource.body_format ?? "markdown"},
          tags = ${nextTags}::text[],
          company_name = ${payload.companyName === undefined ? resource.company_name : payload.companyName},
          status = ${nextStatus},
          updated_at = NOW()
      WHERE id = ${params.resourceId}
        AND college_id = ${user.collegeId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
