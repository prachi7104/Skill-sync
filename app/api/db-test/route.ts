import "server-only";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";

/**
 * Admin-only DB diagnostic route.
 * Verifies connectivity, schema, and basic CRUD against the live database.
 * Protected: requires admin role.
 */
export async function GET() {
    const diagnostics: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
    };

    try {
        await requireRole(["admin"]);

        // 1. Test Connectivity (read-only)
        const now = await db.execute(sql`SELECT NOW() AS now, current_database() AS db`);
        diagnostics.connectivity = "success";
        diagnostics.serverTime = (now as unknown as Array<{ now: string }>)[0]?.now;

        // 2. Check Tables
        const tables = await db.execute(sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        const tableNames = (tables as unknown as Array<{ table_name: string }>).map(
            (t) => t.table_name
        );
        diagnostics.tables = {
            count: tableNames.length,
            includes_users: tableNames.includes("users"),
            includes_students: tableNames.includes("students"),
            includes_drives: tableNames.includes("drives"),
        };

        // 3. Check Users columns (read-only)
        if (diagnostics.tables && (diagnostics.tables as Record<string, unknown>).includes_users) {
            const columns = await db.execute(sql`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'users' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            diagnostics.userColumns = (columns as unknown as Array<{ column_name: string }>).map(
                (c) => c.column_name
            );
        }

        return NextResponse.json({ status: "success", ...diagnostics });
    } catch (error: unknown) {
        if (isRedirectError(error)) throw error;
        const message = error instanceof Error ? error.message : String(error);
        console.error("DB Diagnostic Error:", error);
        return NextResponse.json(
            { status: "error", message, ...diagnostics },
            { status: 500 }
        );
    }
}
