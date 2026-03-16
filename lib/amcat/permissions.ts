import "server-only";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

type SessionLike = {
  user?: {
    id?: string;
    role?: "student" | "faculty" | "admin";
  };
} | null;

export async function hasAmcatManagementPermission(session: SessionLike): Promise<boolean> {
  if (!session?.user?.id || !session.user.role) return false;
  if (session.user.role === "admin") return true;
  if (session.user.role !== "faculty") return false;

  const [profile] = await db.execute(sql`
    SELECT granted_components
    FROM staff_profiles
    WHERE user_id = ${session.user.id}
    LIMIT 1
  `) as unknown as Array<{ granted_components: string[] | null }>;

  return profile?.granted_components?.includes("amcat_management") ?? false;
}
