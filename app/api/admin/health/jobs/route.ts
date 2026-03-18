import "server-only";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

/**
 * GET /api/admin/health/jobs
 *
 * Admin-only job queue health snapshot.
 * Returns pending/processing/failed/completed counts by type and overall stats.
 *
 * Returns:
 * {
 *   pending: {
 *     total: number,
 *     byType: { parse_resume, generate_embedding, enhance_jd, rank_students }
 *   },
 *   processing: { total: number },
 *   failed24h: { total: number },
 *   completed24h: { total: number, avgLatencyMs: number | null },
 *   lastActivity: { type, status, updatedAt } | null
 * }
 */
export async function GET() {
  try {
    await requireRole(["admin"]);

    // Query 1: Count jobs by type and status
    const countsByTypeAndStatus = await db
      .select({
        type: jobs.type,
        status: jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .groupBy(jobs.type, jobs.status);

    // Query 2: Count completed jobs in last 24h with avg latency
    const completed24h = await db
      .select({
        count: sql<number>`count(*)::int`,
        avgLatencyMs: sql<number | null>`avg(${jobs.latencyMs})::int`,
      })
      .from(jobs)
      .where(
        sql`${jobs.status} = 'completed' AND ${jobs.updatedAt} > NOW() - INTERVAL '24 hours'`,
      );

    // Query 3: Get last activity
    const lastActivity = await db
      .select({
        type: jobs.type,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .orderBy(sql`${jobs.updatedAt} DESC`)
      .limit(1);

    // Parse the data
    const pending = {
      parse_resume: 0,
      generate_embedding: 0,
      enhance_jd: 0,
      rank_students: 0,
    };

    let processingTotal = 0;
    let failedTotal = 0;

    // Count pending by type
    for (const row of countsByTypeAndStatus) {
      if (row.status === "pending") {
        pending[row.type as keyof typeof pending] = row.count;
      } else if (row.status === "processing") {
        processingTotal += row.count;
      } else if (row.status === "failed") {
        failedTotal += row.count;
      }
    }

    const pendingTotal = (
      Object.values(pending) as number[]
    ).reduce((a, b) => a + b, 0);

    // Count failed in last 24h
    const failed24hCount = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(
        sql`${jobs.status} = 'failed' AND ${jobs.updatedAt} > NOW() - INTERVAL '24 hours'`,
      );

    return NextResponse.json(
      {
        pending: {
          total: pendingTotal,
          byType: pending,
        },
        processing: {
          total: processingTotal,
        },
        failed24h: {
          total: failed24hCount[0]?.count ?? 0,
        },
        completed24h: {
          total: completed24h[0]?.count ?? 0,
          avgLatencyMs: completed24h[0]?.avgLatencyMs ?? null,
        },
        lastActivity: lastActivity[0]
          ? {
              type: lastActivity[0].type,
              status: lastActivity[0].status,
              updatedAt: lastActivity[0].updatedAt?.toISOString() ?? null,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    const message = err?.message ?? "Internal server error";

    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[GET /api/admin/health/jobs]", err);
    return NextResponse.json(
      { error: "Failed to retrieve job queue health" },
      { status: 500 },
    );
  }
}
