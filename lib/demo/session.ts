import "server-only";

import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { guestAccessEnabled } from "./config";
import { getLiveWorkspace, guestEmail } from "./workspace";

export const demoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server-side guest check used by every guest page and API. The JWT alone is not
 * trusted: the workspace must still exist, be unexpired, and the user's id, role
 * and email must match the identity that workspace issued.
 */
export async function requireDemoGuest() {
  if (!guestAccessEnabled()) return null;
  const session = await getServerSession(authOptions);
  const guest = session?.user;
  if (!guest?.isGuest || !guest.id || !guest.collegeId || !demoUuid.test(guest.id) || !demoUuid.test(guest.collegeId)) return null;
  if (guest.role !== "student" && guest.role !== "faculty") return null;

  const workspace = await getLiveWorkspace(guest.collegeId);
  if (!workspace) return null;
  const kind = guest.role === "faculty" ? "recruiter" : "student";
  const expectedId = kind === "recruiter" ? workspace.recruiterUserId : workspace.studentUserId;
  if (guest.id !== expectedId) return null;

  const [user] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, guest.id), eq(users.collegeId, guest.collegeId), eq(users.role, guest.role),
      eq(users.email, guestEmail(kind, guest.collegeId)))).limit(1);
  if (!user) return null;

  return {
    id: guest.id,
    collegeId: guest.collegeId,
    role: guest.role as "student" | "faculty",
    kind: kind as "student" | "recruiter",
    studentUserId: workspace.studentUserId,
    recruiterUserId: workspace.recruiterUserId,
    expiresAt: workspace.expiresAt.getTime(),
  };
}

export type DemoGuest = NonNullable<Awaited<ReturnType<typeof requireDemoGuest>>>;
