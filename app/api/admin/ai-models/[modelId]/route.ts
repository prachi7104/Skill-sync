import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { AntigravityModelCache } from "@/lib/antigravity/model-cache";

export async function PUT(
  req: Request,
  { params }: { params: { modelId: string } },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    is_active,
    is_deprecated,
    priority,
    rpm_limit,
    rpd_limit,
    tpm_limit,
    notes,
  } = body;

  await db.execute(sql`
    UPDATE ai_models SET
      is_active = COALESCE(${is_active}, is_active),
      is_deprecated = COALESCE(${is_deprecated}, is_deprecated),
      priority = COALESCE(${priority}, priority),
      rpm_limit = COALESCE(${rpm_limit}, rpm_limit),
      rpd_limit = COALESCE(${rpd_limit}, rpd_limit),
      tpm_limit = COALESCE(${tpm_limit}, tpm_limit),
      notes = COALESCE(${notes}, notes),
      updated_at = now()
    WHERE id = ${params.modelId}
  `);

  AntigravityModelCache.invalidate();
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { modelId: string } },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.execute(sql`
    DELETE FROM ai_models WHERE id = ${params.modelId}
  `);

  AntigravityModelCache.invalidate();
  return NextResponse.json({ success: true });
}
