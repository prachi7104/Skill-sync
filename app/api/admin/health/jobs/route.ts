import "server-only";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const [byType, lastRow, avgRow] = await Promise.all([
      db.execute(sql`SELECT type, status, count(*)::int as count FROM jobs GROUP BY type, status ORDER BY type, status`),
      db.execute(sql`SELECT type, status, updated_at FROM jobs ORDER BY updated_at DESC LIMIT 1`),
      db.execute(sql`SELECT round(avg(latency_ms))::int as avg_ms FROM jobs WHERE status = 'completed'::job_status AND updated_at > NOW() - INTERVAL '24 hours' AND latency_ms IS NOT NULL`),
    ]);
    const breakdown: Record<string, Record<string, number>> = {};
    for (const row of byType as Array<Record<string, unknown>>) {
      const type = String(row.type ?? "unknown");
      const status = String(row.status ?? "unknown");
      const count = Number(row.count ?? 0);
      if (!breakdown[type]) breakdown[type] = {};
      breakdown[type][status] = Number.isFinite(count) ? count : 0;
    }

    const lastRaw = (lastRow as Array<Record<string, unknown>>)[0];
    const last = lastRaw
      ? {
          type: String(lastRaw.type ?? "unknown"),
          status: String(lastRaw.status ?? "unknown"),
          updated_at: String(lastRaw.updated_at ?? ""),
        }
      : null;

    const avgRaw = (avgRow as Array<Record<string, unknown>>)[0];
    const avgMs = avgRaw?.avg_ms == null ? null : Number(avgRaw.avg_ms);
    return NextResponse.json({ breakdown, lastActivity: last, avgLatencyMs: avgMs });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
