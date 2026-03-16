import { getCachedSession } from "@/lib/auth/session-cache";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Retrieves the currently authenticated user from the database.
 * Returns null if not authenticated or user not found.
 * Use this in Server Components and Route Handlers.
 * 
 * PERFORMANCE: Uses cached session to avoid redundant NextAuth calls.
 */
export async function getCurrentUser() {

    const session = await getCachedSession();

    if (!session?.user?.email) {
        return null;
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });

    return currentUser || null;
}

/**
 * Enforces authentication. Redirects to login if not logged in.
 * Use this in Server Components (layouts, pages).
 */
export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return user;
}

/**
 * Enforces specific roles. Redirects if user is not authenticated OR lacks role.
 * @param allowedRoles Array of allowed roles ('student', 'faculty', 'admin')
 */
export async function requireRole(allowedRoles: ("student" | "faculty" | "admin")[]) {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        redirect("/unauthorized");
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
 * Redirects if authentication fails, role mismatch, or profile missing.
 * Returns both user and profile.
 */
export async function requireStudentProfile() {
    const user = await requireRole(["student"]);

    const profile = await getStudentProfile(user.id);

    if (!profile) {
        redirect("/student/onboarding");
    }

    return { user, profile };
}

/**
 * Checks if the current staff user (admin or faculty) has a specific component permission.
 * Admins always return true. Faculty must have the component in their granted_components array.
 */
export async function hasComponent(component: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "student") return false;

    const [profile] = await db.execute(sql`
        SELECT granted_components FROM staff_profiles WHERE user_id = ${user.id}
    `) as unknown as Array<{ granted_components: string[] }>;

    if (!profile) return false;
    return profile.granted_components.includes(component);
}

/**
 * Enforces that the current user has a required component permission.
 * Redirects to /unauthorized if not.
 */
export async function requireComponent(component: string) {
    const user = await requireAuth();
    if (user.role === "admin") return user; // admin bypasses

    const allowed = await hasComponent(component);
    if (!allowed) redirect("/unauthorized");

    return user;
}

/**
 * Returns the college_id for the current user.
 * Used to scope all data queries. Throws if missing (not redirect — safe for API routes too).
 */
export async function getCurrentCollegeId(): Promise<string> {
    const session = await getCachedSession();
    if (!session?.user?.collegeId) {
        throw new Error("No college associated with this account");
    }
    return session.user.collegeId;
}
