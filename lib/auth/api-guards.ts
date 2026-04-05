import "server-only";

import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type Role = "student" | "faculty" | "admin";

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

export async function requireApiRole(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiAuthError("Unauthorized", 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      collegeId: true,
    },
  });

  if (!user) {
    throw new ApiAuthError("Unauthorized", 401);
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ApiAuthError("Forbidden", 403);
  }

  return user;
}
