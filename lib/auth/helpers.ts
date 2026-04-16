import { cache } from "react";
import { getCachedSession } from "@/lib/auth/session-cache";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";
import {
  resolveStudentApiOnboardingPolicy,
} from "@/lib/onboarding/api-policy";

/**
 * Lightweight user object derived purely from the signed JWT cookie.
 * No database query — the JWT is refreshed every 5 minutes by the jwt callback
 * and already contains id, role, name, email, and collegeId.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "faculty" | "admin";
  collegeId: string | null;
};

export {
  STUDENT_API_ONBOARDING_POLICY_MATRIX,
  resolveStudentApiOnboardingPolicy,
} from "@/lib/onboarding/api-policy";

export class OnboardingRequiredError extends Error {
  status: number;

  constructor(message = "Complete onboarding first") {
    super(message);
    this.name = "OnboardingRequiredError";
    this.status = 403;
  }
}

export function isOnboardingRequiredError(error: unknown): error is OnboardingRequiredError {
  return error instanceof OnboardingRequiredError;
}

/**
 * Reads the current user from the JWT session without hitting the database.
 * Wrapped in React cache() so multiple calls within the same server request
 * are deduplicated (one JWT decode per request).
 *
 * PERFORMANCE: This replaces the old getCurrentUser() which queried the DB on
 * every request. The JWT is signed and trusted; role/collegeId are authoritative
 * because the jwt callback refreshes them from DB every 5 minutes.
 */
const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getCachedSession();
  if (!session?.user?.id || !session?.user?.role) return null;
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? "",
    role: session.user.role,
    collegeId: session.user.collegeId ?? null,
  };
});

/**
 * Returns the current authenticated user from the JWT.
 * Returns null if not authenticated.
 *
 * Use this in Server Components and Route Handlers.
 * No database query — all data comes from the signed cookie.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Enforces authentication. Redirects to / if not logged in.
 * Use this in Server Components (layouts, pages).
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  return user;
}

/**
 * Enforces specific roles. Redirects if user is not authenticated OR lacks role.
 * @param allowedRoles Array of allowed roles ('student', 'faculty', 'admin')
 */
export async function requireRole(
  allowedRoles: ("student" | "faculty" | "admin")[],
): Promise<SessionUser> {
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
 * Enforces student API access according to the onboarding policy matrix.
 * Uses DB-fresh profile state to avoid stale JWT gating edge-cases.
 */
export async function requireStudentApiPolicyAccess(pathname: string) {
  const { user, profile } = await requireStudentProfile();
  const policy = resolveStudentApiOnboardingPolicy(pathname);
  const { onboardingRequired, progress } = computeOnboardingProgress(profile);

  if (policy === "require-complete" && onboardingRequired) {
    throw new OnboardingRequiredError();
  }

  return {
    user,
    profile,
    onboardingRequired,
    onboardingProgress: progress,
    policy,
  };
}

/**
 * Checks if the current staff user (admin or faculty) has a specific component permission.
 * Admins always return true. Faculty must have the component in their granted_components array.
 */
export async function hasComponent(component: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "student") return false;

  const [profile] = (await db.execute(sql`
    SELECT granted_components FROM staff_profiles WHERE user_id = ${user.id}
  `)) as unknown as Array<{ granted_components: string[] }>;

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

/**
 * Derives a 9-digit SAP ID from a UPES student email address.
 * Re-exported from lib/auth/derive-sap.ts for convenience.
 */
export { deriveSapFromEmailPublic } from "@/lib/auth/derive-sap";
