import "server-only";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { CRON_SECRET } from "@/lib/env";
import { isRedirectError } from "next/dist/client/components/redirect";

const ROUTES: Record<string, string> = {
  resumes: "/api/cron/process-resumes",
  embeddings: "/api/cron/process-embeddings",
  "jd-enhancement": "/api/cron/process-jd-enhancement",
  rankings: "/api/cron/process-rankings",
  cleanup: "/api/cron/nightly-cleanup",
};

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const { type } = await req.json() as { type?: string };
    const path = type ? ROUTES[type] : null;
    if (!path) return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(55000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: res.ok, status: res.status, data });
  } catch (err: any) {
    if (isRedirectError(err)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
