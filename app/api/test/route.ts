import "server-only";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public health-check endpoint.
 * Used by uptime monitors and deployment verification.
 * Returns minimal confirmation that the API server is reachable.
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        ts: new Date().toISOString(),
    });
}
