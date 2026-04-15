import "server-only";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { getDbStats } from "@/lib/db";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";

/**
 * Admin-only DB stats endpoint.
 * Returns connection pool and query statistics.
 */
export async function GET() {
    try {
        await requireRole(["admin"]);
        const stats = await getDbStats();
        return NextResponse.json(stats);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch DB stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch DB stats" },
            { status: 500 }
        );
    }
}
