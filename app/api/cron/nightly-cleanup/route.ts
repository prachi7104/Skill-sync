import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, students } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { validateCronAuth } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!validateCronAuth(req.headers.get("authorization"))) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Recover jobs stuck in processing >1 hour
    const stuck = await db.update(jobs)
      .set({ status: "failed", error: "Stuck — recovered nightly", updatedAt: new Date() })
      .where(and(eq(jobs.status, "processing"), lt(jobs.updatedAt, new Date(Date.now() - 3600_000))))
      .returning({ id: jobs.id });

    // Delete completed jobs older than 7 days
    const deleted = await db.delete(jobs)
      .where(and(eq(jobs.status, "completed"), lt(jobs.updatedAt, new Date(Date.now() - 7 * 86400_000))))
      .returning({ id: jobs.id });

    // Hard reset sandbox daily counters
    const today = new Date().toISOString().slice(0, 10);
    await db.update(students)
      .set({ sandboxUsageToday: 0, sandboxResetDate: today })
      .where(sql`sandbox_reset_date < ${today}`);

    // Clean up stale AI rate limit windows (older than 24h)
    await db.execute(sql`DELETE FROM ai_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours'`);

    // Clean up completed/failed jobs older than 7 days
    await db.execute(sql`DELETE FROM jobs WHERE status IN ('completed','failed') AND updated_at < NOW() - INTERVAL '7 days'`);

    // Auto-deactivate drives past their deadline
    const expired = await db.execute(sql`
      UPDATE drives
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true
        AND deadline IS NOT NULL
        AND deadline < NOW()
      RETURNING id
    `);

    return NextResponse.json({ 
      stuck: stuck.length, 
      deleted: deleted.length,
      deactivatedDrives: (expired as unknown as Array<{ id: string }>).length,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Cron:NightlyCleanup] Worker failed:", err);
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: "cron_worker_failure",
      worker: "nightly-cleanup"
    }, { status: 500 });
  }
}
