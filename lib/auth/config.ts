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
    ADMIN_EMAIL,
} from "@/lib/env";

function isStudentEmail(email: string): boolean {
    return email.toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN.toLowerCase()}`);
}

function isAdminEmail(email: string): boolean {
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: MICROSOFT_CLIENT_ID,
            clientSecret: MICROSOFT_CLIENT_SECRET,
            tenantId: MICROSOFT_TENANT_ID, // "common" for multi-tenant/personal testing
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
    debug: false,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return "/login?error=NoEmail";
            const email = user.email.toLowerCase();

            try {
                // Check if user already exists in DB
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (existingUser) {
                    // Update Microsoft ID if not linked yet
                    if (!existingUser.microsoftId && account?.providerAccountId) {
                        await db
                            .update(users)
                            .set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
                            .where(eq(users.id, existingUser.id))
                            .catch((err: unknown) => console.warn("[auth] MS ID link failed:", err));
                    }
                    // Ensure admin email always has admin role
                    if (isAdminEmail(email) && existingUser.role !== "admin") {
                        await db
                            .update(users)
                            .set({ role: "admin", updatedAt: new Date() })
                            .where(eq(users.id, existingUser.id));
                    }
                    return true;
                }

                // New user — determine role
                if (isAdminEmail(email)) {
                    // Auto-create admin
                    await db.insert(users).values({
                        email,
                        name: user.name || "Admin",
                        role: "admin",
                        microsoftId: account?.providerAccountId,
                    });
                    return true;
                }

                if (isStudentEmail(email)) {
                    // Auto-create student + student profile row
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            email,
                            name: user.name || email.split("@")[0],
                            role: "student",
                            microsoftId: account?.providerAccountId,
                        })
                        .returning();
                    await db.insert(students).values({ id: newUser.id });
                    return true;
                }

                // Not a student domain, not admin, not pre-seeded faculty → reject
                return "/login?error=WrongEmail";
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("[auth] Sign-in error:", msg);
                return "/login?error=DatabaseError";
            }
        },

        async jwt({ token, user, trigger, session }) {
            // First sign-in: load DB user data into token
            if (user?.email) {
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email.toLowerCase()),
                    columns: { id: true, role: true, name: true, email: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                }
            }
            // Session update trigger (for role changes)
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as "student" | "faculty" | "admin";
                session.user.name = token.name as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
};
