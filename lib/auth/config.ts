
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, students, magicLinkTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
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
export function isStudentEmail(email: string): boolean {
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
        CredentialsProvider({
            id: "magic-link",
            name: "Magic Link",
            credentials: {
                token: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                const token = credentials?.token;
                if (!token) return null;

                // Find valid, unused, non-expired token joined with user
                const [row] = await db
                    .select({
                        tokenId: magicLinkTokens.id,
                        userId: users.id,
                        email: users.email,
                        name: users.name,
                        role: users.role,
                    })
                    .from(magicLinkTokens)
                    .innerJoin(users, eq(magicLinkTokens.userId, users.id))
                    .where(
                        and(
                            eq(magicLinkTokens.token, token),
                            eq(magicLinkTokens.used, false),
                            gt(magicLinkTokens.expiresAt, new Date()),
                        )
                    )
                    .limit(1);

                if (!row) return null;

                // Only allow faculty or admin
                if (row.role !== "faculty" && row.role !== "admin") return null;

                // Mark token as used
                await db
                    .update(magicLinkTokens)
                    .set({ used: true })
                    .where(eq(magicLinkTokens.id, row.tokenId));

                return {
                    id: row.userId,
                    email: row.email,
                    name: row.name,
                    role: row.role,
                };
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
            if (!user.email) return false;
            const email = user.email.toLowerCase();
            try {
                const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
                if (existingUser) {
                    if (!existingUser.microsoftId && account?.providerAccountId) {
                        await db.update(users).set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
                            .where(eq(users.id, existingUser.id))
                            .catch((err: unknown) => console.warn("[auth] MS ID link failed:", err));
                    }
                    return true;
                }
                if (isStudentEmail(email)) {
                    const [newUser] = await db.insert(users).values({
                        email, name: user.name || "Student", role: "student",
                        microsoftId: account?.providerAccountId,
                    }).returning();
                    await db.insert(students).values({ id: newUser.id });
                    return true;
                }
                return "/login?error=NotAuthorized";
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("[auth] Sign-in error:", msg);
                return "/login?error=DatabaseError";
            }
        },
        async jwt({ token, user }) {
            if (user) {
                // First sign-in: fetch from DB and embed in token
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email!),
                    columns: { id: true, role: true, name: true, email: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as "student" | "faculty" | "admin";
                session.user.name = token.name as string;
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
