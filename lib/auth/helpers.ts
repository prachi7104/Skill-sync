/**
 * Auth helpers — two variants:
 *
 * PAGE GUARDS (Server Components, Layouts):
 *   - requireAuth()
 *   - requireRole()
 *   - requireStudentProfile()
 *   Use redirect() — throws NEXT_REDIRECT, caught by Next.js framework
 *
 * API GUARDS (Route Handlers):
 *   - requireAuthApi()
 *   - requireRoleApi()
 *   - requireStudentProfileApi()
 *   Throw ApiError with status code — caught by route handler try/catch
 */

import { getCachedSession } from "@/lib/auth/session-cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// ── Custom API Error ──────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "student" | "faculty" | "admin";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    microsoftId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ── Shared DB lookup ──────────────────────────────────────────────────────────

async function getUserFromEmail(email: string): Promise<AuthUser | null> {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
    });
    return (user as AuthUser | undefined) || null;
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE GUARDS — for Server Components and Layouts
// These use redirect() and should NEVER be used in API Route Handlers
// ════════════════════════════════════════════════════════════════════════════

/** Get current user. Returns null if not authenticated. */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const session = await getCachedSession();
    if (!session?.user?.email) return null;
    return getUserFromEmail(session.user.email);
}

/** Enforce authentication. Redirects to /login if not logged in. */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return user;
}

/** Enforce role for page access. Redirects to /unauthorized if wrong role. */
export async function requireRole(
    allowedRoles: UserRole[],
): Promise<AuthUser> {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) redirect("/unauthorized");
    return user;
}

/** Enforce student with complete profile. Redirects to onboarding if missing. */
export async function requireStudentProfile(): Promise<{
    user: AuthUser;
    profile: NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;
}> {
    const user = await requireRole(["student"]);
    const profile = await getStudentProfile(user.id);
    if (!profile) redirect("/student/onboarding/welcome");
    return { user, profile };
}

// ════════════════════════════════════════════════════════════════════════════
// API GUARDS — for Route Handlers (/api/*)
// These throw ApiError — NEVER use redirect() here
// ════════════════════════════════════════════════════════════════════════════

/** Get current user from session. Returns null if not authenticated. */
export async function getCurrentUserApi(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;
    return getUserFromEmail(session.user.email);
}

/** Enforce authentication in API route. Throws 401 if not authenticated. */
export async function requireAuthApi(): Promise<AuthUser> {
    const user = await getCurrentUserApi();
    if (!user) throw new ApiError(401, "Unauthorized: Please sign in");
    return user;
}

/** Enforce role in API route. Throws 401/403 with JSON-serializable error. */
export async function requireRoleApi(
    allowedRoles: UserRole[],
): Promise<AuthUser> {
    const user = await requireAuthApi();
    if (!allowedRoles.includes(user.role)) {
        throw new ApiError(403, `Forbidden: requires role ${allowedRoles.join(" or ")}`);
    }
    return user;
}

/** Enforce student with profile in API route. Throws 401/403/404. */
export async function requireStudentProfileApi(): Promise<{
    user: AuthUser;
    profile: NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;
}> {
    const user = await requireRoleApi(["student"]);
    const profile = await getStudentProfile(user.id);
    if (!profile) {
        throw new ApiError(404, "Student profile not found. Please complete onboarding.");
    }
    return { user, profile };
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentProfile(userId: string) {
    const profile = await db.query.students.findFirst({
        where: eq(students.id, userId),
    });
    return profile || null;
}
