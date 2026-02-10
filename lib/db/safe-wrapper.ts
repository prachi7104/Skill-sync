import { PostgresError } from "postgres";

export class DatabaseError extends Error {
    constructor(message: string, public originalError: unknown) {
        super(message);
        this.name = "DatabaseError";
    }
}

export async function safeDbQuery<T>(
    queryFn: () => Promise<T>,
    errorMessage: string = "Database query failed"
): Promise<T> {
    try {
        return await queryFn();
    } catch (error) {
        // Handle Postgres errors specifically if needed
        if (error instanceof PostgresError) {
            console.error(`DB Error [${error.code}]: ${error.message}`, error);
            // You might want to throw specific errors based on error.code
            // e.g., 23505 for unique constraint violation
            if (error.code === '23505') {
                throw new DatabaseError("Duplicate entry found.", error);
            }
        }

        console.error(`${errorMessage}:`, error);
        throw new DatabaseError(errorMessage, error);
    }
}
