import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { isRedirectError } from "next/dist/client/components/redirect";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/admin/trigger-cron
 *
 * Admin-only manual trigger for cron jobs.
 * Internally calls the corresponding cron route with the CRON_SECRET header.
 *
 * Body:
 * {
 *   type: "resumes" | "embeddings" | "jd-enhancement" | "rankings"
 * }
 *
 * Returns the cron route's response.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);

    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { type } = body;

    if (!type || !["resumes", "embeddings", "jd-enhancement", "rankings"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid cron type. Must be one of: resumes, embeddings, jd-enhancement, rankings" },
        { status: 400 },
      );
    }

    // Map type to cron route
    const cronRouteMap: Record<string, string> = {
      resumes: "/api/cron/process-resumes",
      embeddings: "/api/cron/process-embeddings",
      "jd-enhancement": "/api/cron/process-jd-enhancement",
      rankings: "/api/cron/process-rankings",
    };

    const cronRoute = cronRouteMap[type];
    const cronUrl = new URL(cronRoute, BASE_URL);

    // Call the cron route with the secret header
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

    try {
      const response = await fetch(cronUrl.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[Cron trigger] ${type} failed:`, errorData);
        return NextResponse.json(
          { error: `Cron job failed: ${errorData}` },
          { status: response.status },
        );
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Cron job timeout (55 seconds exceeded)" },
          { status: 504 },
        );
      }
      throw error;
    }
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    const message = err?.message ?? "Internal server error";

    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[POST /api/admin/trigger-cron]", err);
    return NextResponse.json(
      { error: "Failed to trigger cron job" },
      { status: 500 },
    );
  }
}
