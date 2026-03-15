import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { AntigravityModelCache } from "@/lib/antigravity/model-cache";

type UsageRow = {
  model_key: string;
  request_count: number;
};

type ModelRow = {
  id: string;
  model_key: string;
  display_name: string;
  provider: "google" | "groq";
  task_types: string[];
  rpm_limit: number;
  rpd_limit: number | null;
  tpm_limit: number | null;
  priority: number;
  is_active: boolean;
  is_deprecated: boolean;
  last_ping_at: string | null;
  last_ping_ok: boolean | null;
  last_ping_ms: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = (await db.execute(sql`
    SELECT
      id, model_key, display_name, provider, task_types,
      rpm_limit, rpd_limit, tpm_limit, priority,
      is_active, is_deprecated,
      last_ping_at, last_ping_ok, last_ping_ms, notes,
      created_at, updated_at
    FROM ai_models
    ORDER BY is_active DESC, is_deprecated ASC, priority ASC
  `)) as unknown as ModelRow[];

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setSeconds(0, 0);

  const usageRows = (await db.execute(sql`
    SELECT model_key, request_count
    FROM ai_rate_limits
    WHERE window_start = ${windowStart.toISOString()}
  `)) as unknown as UsageRow[];

  const usageMap = Object.fromEntries(
    usageRows.map((row) => [row.model_key, Number(row.request_count)]),
  );

  return NextResponse.json({
    models: models.map((model) => ({
      ...model,
      current_rpm_usage: usageMap[model.model_key] ?? 0,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    model_key,
    display_name,
    provider,
    task_types,
    rpm_limit,
    rpd_limit,
    tpm_limit,
    priority,
    notes,
  } = body;

  if (!model_key || !display_name || !provider) {
    return NextResponse.json(
      { error: "model_key, display_name, provider required" },
      { status: 400 },
    );
  }

  await db.execute(sql`
    INSERT INTO ai_models (model_key, display_name, provider, task_types, rpm_limit, rpd_limit, tpm_limit, priority, notes)
    VALUES (
      ${model_key},
      ${display_name},
      ${provider},
      ${task_types || []},
      ${rpm_limit || 15},
      ${rpd_limit || 1500},
      ${tpm_limit || null},
      ${priority || 99},
      ${notes || null}
    )
  `);

  AntigravityModelCache.invalidate();
  return NextResponse.json({ success: true });
}
