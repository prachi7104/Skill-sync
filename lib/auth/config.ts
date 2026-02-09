
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            authorization: {
                params: {
                    scope: "openid profile email",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    debug: false,
    callbacks: {
        async signIn({ user, account }: { user: import("next-auth").User, account: import("next-auth").Account | null }) {
            if (!user.email) return false;

            try {
                // 1. Check if user exists
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email),
                });

                if (existingUser) {
                    // Update Microsoft ID if not present (linking account)
                    if (!existingUser.microsoftId && account?.providerAccountId) {
                        await db
                            .update(users)
                            .set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
                            .where(eq(users.id, existingUser.id));
                    }
                    return true;
                }

                // 2. Determine role based on email pattern
                let role: "student" | "faculty" | "admin" = "student";
                if (user.email.includes("admin")) {
                    role = "admin"; // Check for 'admin' in email
                } else if (user.email.includes("faculty")) {
                    role = "faculty"; // Check for 'faculty' in email
                }

                // 3. Create new user
                const [newUser] = await db
                    .insert(users)
                    .values({
                        email: user.email,
                        name: user.name || "Unknown",
                        role: role,
                        microsoftId: account?.providerAccountId,
                    })
                    .returning();

                // 4. If student, create student profile
                if (role === "student") {
                    await db.insert(students).values({
                        id: newUser.id,
                    });
                }

                return true;
            } catch (error) {
                return false;
            }
        },
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                // We need to fetch the role from DB because the 'user' object here 
                // might not have the up-to-date role if we just created it.
                // Or we can query the DB to be sure.
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email!),
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
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
    },
    pages: {
        signIn: "/login",
    },
};
