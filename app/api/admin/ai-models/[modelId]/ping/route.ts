import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Groq from "groq-sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

type PingModelRow = {
  model_key: string;
  provider: "google" | "groq";
};

export async function POST(
  _req: Request,
  { params }: { params: { modelId: string } },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await db.execute(sql`
    SELECT model_key, provider
    FROM ai_models
    WHERE id = ${params.modelId}
  `)) as unknown as PingModelRow[];

  const model = rows[0];
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const start = Date.now();
  let ok = false;
  let error: string | null = null;

  try {
    if (model.provider === "google") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.model_key}?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""}`,
        { method: "GET", cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(`Google model metadata check failed: ${response.status}`);
      }
      ok = true;
    } else if (model.provider === "groq") {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
      const models = await groq.models.list();
      const found = models.data.some((item) => item.id === model.model_key);
      if (!found) {
        throw new Error("Groq model not available");
      }
      ok = true;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const latencyMs = Date.now() - start;

  await db.execute(sql`
    UPDATE ai_models
    SET last_ping_at = now(), last_ping_ok = ${ok}, last_ping_ms = ${latencyMs}, updated_at = now()
    WHERE id = ${params.modelId}
  `);

  return NextResponse.json({ ok, latencyMs, error });
}
