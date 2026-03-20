import "server-only";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { CRON_SECRET } from "@/lib/env";
import { isRedirectError } from "next/dist/client/components/redirect";

const CRON_ROUTES: Record<string, string> = {
  resumes: "/api/cron/process-resumes",
  embeddings: "/api/cron/process-embeddings",
  "jd-enhancement": "/api/cron/process-jd-enhancement",
  rankings: "/api/cron/process-rankings",
  cleanup: "/api/cron/nightly-cleanup",
};

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await req.json() as { type?: string };
    const path = body.type ? CRON_ROUTES[body.type] : null;

    if (!path) {
      return NextResponse.json(
        { error: `Unknown cron type: "${body.type}". Valid: ${Object.keys(CRON_ROUTES).join(", ")}` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(55000),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ success: response.ok, status: response.status, data });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
