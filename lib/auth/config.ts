
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID,
    STUDENT_EMAIL_DOMAIN,
} from "@/lib/env";

/**
 * Check if the email belongs to the student domain.
 * Students are auto-created; faculty/admin must be pre-added in DB.
 */
function isStudentEmail(email: string): boolean {
    const domain = email.toLowerCase().split("@")[1];
    return domain === STUDENT_EMAIL_DOMAIN;
}

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: MICROSOFT_CLIENT_ID,
            clientSecret: MICROSOFT_CLIENT_SECRET,
            tenantId: MICROSOFT_TENANT_ID,
            authorization: {
                params: {
                    scope: "openid profile email",
                    prompt: "select_account",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Disable debug to prevent [next-auth][warn][DEBUG_ENABLED] spam
    debug: false,
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) {
                console.error("[auth] signIn denied — no email");
                return false;
            }

            const email = user.email.toLowerCase();

            try {
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (existingUser) {
                    // Link Microsoft ID if not yet linked
                    if (!existingUser.microsoftId && account?.providerAccountId) {
                        await db
                            .update(users)
                            .set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
                            .where(eq(users.id, existingUser.id))
                            .catch((err: unknown) =>
                                console.warn("[auth] Microsoft ID link failed (non-fatal):", err)
                            );
                    }
                    return true;
                }

                // Student domain → auto-create user + profile
                if (isStudentEmail(email)) {
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            email,
                            name: user.name || "Student",
                            role: "student",
                            microsoftId: account?.providerAccountId,
                        })
                        .returning();

                    await db.insert(students).values({ id: newUser.id });
                    console.log(`[auth] Created new student: ${newUser.id}`);
                    return true;
                }

                // Not a student domain, not in DB → deny
                console.warn(`[auth] Access denied: ${email} not in DB and not student domain`);
                return "/login?error=NotAuthorized";

            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("[auth] Sign-in error:", msg);

                if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("terminating")) {
                    return "/login?error=ServiceUnavailable";
                }
                return "/login?error=DatabaseError";
            }
        },
        async jwt({ token, user }) {
            // Initial sign in
            if (user && user.email) {
                try {
                    const dbUser = await db.query.users.findFirst({
                        where: eq(users.email, user.email),
                    });

                    if (dbUser) {
                        token.id = dbUser.id;
                        token.role = dbUser.role;
                    }
                } catch (e) {
                    console.error("[auth] ⚠️ JWT role fetch failed (using defaults):", e);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "student" | "faculty" | "admin";
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // ── Role-based post-login redirect ──────────────────────────
            // After sign-in, NextAuth calls this with the callbackUrl.
            // Problem: if callbackUrl was "/faculty/dashboard" but user is a
            // student, they get stuck. So we override based on role.

            // If this is a sign-out redirect, just go to the target
            if (url.startsWith(baseUrl + "/login") || url === baseUrl + "/") {
                return url;
            }

            // For any other URL, check if it's an internal URL and if the
            // role matches. We need to fetch the session/token to know.
            // However, redirect callback doesn't have token access directly,
            // so we just ensure the URL goes to "/" which does role routing.

            // If the callbackUrl points to a role-specific path, redirect to
            // root "/" instead — the root page.tsx will route correctly.
            const path = url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url;

            // If it's going to a role-specific area, let the root page handle routing
            if (path.startsWith("/faculty") || path.startsWith("/admin") || path.startsWith("/student")) {
                return baseUrl + "/";
            }

            // For relative URLs, ensure they stay on the same origin
            if (url.startsWith("/")) {
                return baseUrl + url;
            }

            // For same-origin URLs, allow
            if (url.startsWith(baseUrl)) {
                return url;
            }

            // Default: go to base URL (root page handles role routing)
            return baseUrl;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
