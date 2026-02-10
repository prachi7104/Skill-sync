import { PostgresError } from "postgres";

export type ActionState<T> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

/**
 * Wraps a database operation with standardized error handling and logging.
 *
 * @param action - The async database operation to execute
 * @param context - Description of the operation for logging
 * @returns Standardized ActionState object
 */
export async function safeDbAction<T>(
    action: () => Promise<T>,
    context: string
): Promise<ActionState<T>> {
    try {
        const data = await action();
        return { success: true, data };
    } catch (error) {
        console.error(`DB Error [${context}]:`, error);

        if (error instanceof PostgresError) {
            // Log critical connection issues
            if (
                error.code === "57014" || // query_canceled
                error.code === "57P01" || // admin_shutdown
                error.code === "57P02" || // crash_shutdown
                error.code === "57P03"    // cannot_connect_now
            ) {
                console.error("Critical DB Connection Error:", error.code);
            }

            return {
                success: false,
                error: "Database operation failed",
                code: error.code,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
