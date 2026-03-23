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

    const [pendingRows, processingRows, failedRows, completedRows, byTypeRows, lastActivityRows, avgLatencyRows] =
      await Promise.all([
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'pending'::job_status`),
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'processing'::job_status`),
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'failed'::job_status AND updated_at > NOW() - INTERVAL '24 hours'`),
        db.execute(sql`SELECT count(*)::int as count FROM jobs WHERE status = 'completed'::job_status AND updated_at > NOW() - INTERVAL '24 hours'`),
        db.execute(sql`
          SELECT type, count(*)::int as count
          FROM jobs
          WHERE status = 'pending'::job_status
          GROUP BY type
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

    const byTypeMap = new Map<string, number>();
    for (const row of byTypeRows as unknown as Array<{ type: string; count: number }>) {
      byTypeMap.set(row.type, row.count ?? 0);
    }

    const last = (lastActivityRows as unknown as Array<{ type: string; status: string; updated_at: string }>)[0];
    const avgRow = (avgLatencyRows as unknown as Array<{ avg_ms: number | null }>)[0];

    return NextResponse.json({
      pending: {
        total: (pendingRows as unknown as Array<{ count: number }>)[0]?.count ?? 0,
        byType: {
          parse_resume: byTypeMap.get("parse_resume") ?? 0,
          generate_embedding: byTypeMap.get("generate_embedding") ?? 0,
          enhance_jd: byTypeMap.get("enhance_jd") ?? 0,
          rank_students: byTypeMap.get("rank_students") ?? 0,
        },
      },
      processing: {
        total: (processingRows as unknown as Array<{ count: number }>)[0]?.count ?? 0,
      },
      failed24h: {
        total: (failedRows as unknown as Array<{ count: number }>)[0]?.count ?? 0,
      },
      completed24h: {
        total: (completedRows as unknown as Array<{ count: number }>)[0]?.count ?? 0,
        avgLatencyMs: avgRow?.avg_ms ?? null,
      },
      lastActivity: last
        ? { type: last.type, status: last.status, updatedAt: last.updated_at }
        : null,
    });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
