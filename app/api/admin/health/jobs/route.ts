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

    const [byTypeRows, lastActivityRows, avgLatencyRows] = await Promise.all([
      db.execute(sql`
        SELECT type, status, count(*)::int as count
        FROM jobs
        GROUP BY type, status
        ORDER BY type, status
      `),
      db.execute(sql`
        SELECT type, status, updated_at
        FROM jobs
        ORDER BY updated_at DESC
        LIMIT 1
      `),
      db.execute(sql`
        SELECT round(avg(latency_ms))::int as avg_ms
        FROM jobs
        WHERE status = 'completed'::job_status
          AND updated_at > NOW() - INTERVAL '24 hours'
          AND latency_ms IS NOT NULL
      `),
    ]);

    // Build breakdown: { parse_resume: { pending: 2, completed: 10, failed: 1 }, ... }
    const breakdown: Record<string, Record<string, number>> = {};
    for (const row of byTypeRows as unknown as Array<{ type: string; status: string; count: number }>) {
      if (!breakdown[row.type]) breakdown[row.type] = {};
      breakdown[row.type][row.status] = row.count;
    }

    const last = (lastActivityRows as unknown as Array<{ type: string; status: string; updated_at: string }>)[0];
    const avgRow = (avgLatencyRows as unknown as Array<{ avg_ms: number | null }>)[0];

    return NextResponse.json({
      breakdown,
      lastActivity: last
        ? { type: last.type, status: last.status, updatedAt: last.updated_at }
        : null,
      avgLatencyMs: avgRow?.avg_ms ?? null,
    });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
