import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves the currently authenticated user from the database.
 * Returns null if not authenticated or user not found.
 * Use this in Server Components and Route Handlers.
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return null;
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });

    return currentUser || null;
}

/**
 * Enforces authentication. Throws user-friendly error if not logged in.
 * Use this to protect Server Actions or specific component logic.
 */
export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized: You must be signed in to perform this action.");
    }

    return user;
}

/**
 * Enforces specific roles. Throws if user is not authenticated OR lacks role.
 * @param allowedRoles Array of allowed roles ('student', 'faculty', 'admin')
 */
export async function requireRole(allowedRoles: ("student" | "faculty" | "admin")[]) {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        throw new Error("Forbidden: You do not have permission to perform this action.");
    }

    return user;
}

/**
 * Fetches the student profile for a given user ID.
 * Returns null if not found (does not throw).
 */
export async function getStudentProfile(userId: string) {
    const profile = await db.query.students.findFirst({
        where: eq(students.id, userId),
    });

    return profile || null;
}

/**
 * Enforces that the current user is a 'student' AND has a student profile.
 * Throws if authentication fails, role mismatch, or profile missing.
 * Returns both user and profile.
 */
export async function requireStudentProfile() {
    const user = await requireRole(["student"]);

    const profile = await getStudentProfile(user.id);

    if (!profile) {
        throw new Error("Student profile not found. Please complete onboarding.");
    }

    return { user, profile };
}
