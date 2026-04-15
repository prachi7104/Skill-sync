import "server-only";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";

export const dynamic = "force-dynamic";

/**
 * Admin-only DB diagnostic route.
 * Verifies connectivity, schema, and basic CRUD against the live database.
 * Protected: requires admin role.
 */
export async function GET() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnostics: any = {
        connectivity: "pending",
        tables: {},
        columns: {},
        crud: "pending",
        timestamp: new Date().toISOString(),
    };

    try {
        await requireRole(["admin"]);

        // 1. Test Connectivity
        const now = await db.execute(sql`SELECT NOW()`);
        diagnostics.connectivity = "success";
        diagnostics.serverTime = now[0]?.now;

        // 2. Check Tables
        const tables = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableNames = tables.map((t: any) => t.table_name);
        diagnostics.tables.exists = tableNames.includes("users");
        diagnostics.tables.list = tableNames;

        // 3. Check Users Columns
        if (diagnostics.tables.exists) {
            const columns = await db.execute(sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
            `);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const columnNames = columns.map((c: any) => c.column_name);
            const requiredColumns = ["id", "email", "name", "role", "microsoft_id", "created_at", "updated_at"];

            const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));

            diagnostics.columns = {
                found: columnNames,
                missing: missingColumns,
                status: missingColumns.length === 0 ? "ok" : "missing_columns"
            };
        }

        // 4. Test Insert/Delete
        const testEmail = `db-test-${Date.now()}@example.com`;

        const [inserted] = await db.insert(users).values({
            email: testEmail,
            name: "DB Diagnostic Test User",
            role: "student"
        }).returning();

        if (inserted && inserted.id) {
            diagnostics.crud = "insert_success";

            const fetched = await db.select().from(users).where(eq(users.id, inserted.id));
            if (fetched.length > 0) {
                diagnostics.crud = "read_success";
                await db.delete(users).where(eq(users.id, inserted.id));
                diagnostics.crud = "delete_success (full cycle)";
            } else {
                diagnostics.crud = "read_failed";
            }
        } else {
            diagnostics.crud = "insert_failed";
        }

        return NextResponse.json({
            status: "success",
            ...diagnostics
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("DB Diagnostic Error:", error);
        return NextResponse.json({
            status: "error",
            message: error.message,
            ...diagnostics
        }, { status: 500 });
    }
}
