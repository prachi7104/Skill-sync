
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
    },
    // Enable debug in development to trace OAuth failures
    debug: process.env.NODE_ENV === "development",
    callbacks: {
        async signIn({ user, account }: { user: import("next-auth").User, account: import("next-auth").Account | null }) {
            if (!user.email) {
                console.error("[auth] signIn denied — no email in user object");
                return false;
            }

            const email = user.email.toLowerCase();
            console.log(`[auth] 🟢 Starting sign-in flow for: ${email}`);

            // 🔴 FORCE FRESH CONNECTION (User Request)
            const postgres = require("postgres");
            const { drizzle } = require("drizzle-orm/postgres-js");
            const schema = require("@/lib/db/schema");
            const { eq, sql } = require("drizzle-orm");

            let localClient;
            let localDb;

            try {
                if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing in auth context");

                console.log("[auth] 🔌 Initializing fresh DB connection for this request...");
                localClient = postgres(process.env.DATABASE_URL, {
                    prepare: false,
                    connect_timeout: 10
                });
                localDb = drizzle(localClient, { schema });

                // 1. Health check
                const start = Date.now();
                await localDb.execute(sql`SELECT 1`);
                console.log(`[auth] ⚡ DB Connected in ${Date.now() - start}ms`);

                // ── PATH 1: Check if user already exists in DB ──────────────
                console.log(`[auth] 🔍 Querying 'users' table for existing record...`);

                const existingUser = await localDb.query.users.findFirst({
                    where: eq(schema.users.email, email),
                }).catch((err: any) => {
                    throw new Error(`DB_QUERY_FAILED: ${err.message}`);
                });

                if (existingUser) {
                    console.log(`[auth] ✅ User found: ${existingUser.id} (${existingUser.role})`);

                    // Link Microsoft ID if not yet linked
                    if (!existingUser.microsoftId && account?.providerAccountId) {
                        try {
                            console.log(`[auth] 🔗 Linking Microsoft ID to existing user...`);
                            await localDb
                                .update(schema.users)
                                .set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
                                .where(eq(schema.users.id, existingUser.id));
                            console.log(`[auth] ✅ Microsoft ID linked successfully.`);
                        } catch (linkError) {
                            console.error("[auth] ⚠️ Failed to link Microsoft ID (non-fatal):", linkError);
                        }
                    }
                    return true;
                }

                console.log(`[auth] ℹ️ User not found in DB.`);

                // ── PATH 2: Student domain → auto-create ─────────────────────
                if (isStudentEmail(email)) {
                    console.log(`[auth] 🆕 Valid student domain detected. Attempting auto-creation...`);

                    try {
                        const [newUser] = await localDb
                            .insert(schema.users)
                            .values({
                                email: email,
                                name: user.name || "Unknown",
                                role: "student",
                                microsoftId: account?.providerAccountId,
                            })
                            .returning();

                        console.log(`[auth] ✅ Created user record: ${newUser.id}`);

                        // Create the student profile row (1:1 extension)
                        await localDb.insert(schema.students).values({
                            id: newUser.id,
                        });
                        console.log(`[auth] ✅ Created student profile structure.`);

                        return true;
                    } catch (createError: any) {
                        throw new Error(`CREATION_FAILED: ${createError.message}`);
                    }
                }

                // ── PATH 3: Not a student domain & not in DB → deny ──────────
                console.warn(`[auth] ⛔ Access denied: ${email} is not a student and has no account.`);
                return "/login?error=NotAuthorized";

            } catch (error: any) {
                console.error("[auth] 🔴 CRITICAL SIGN-IN ERROR:", {
                    email: email,
                    message: error.message,
                    stack: error.stack,
                });

                if (error.message && (
                    error.message.includes("connect") ||
                    error.message.includes("ECONNREFUSED") ||
                    error.message.includes("terminating connection")
                )) {
                    console.error("[auth] 🚨 Database appears to be DOWN or unreachable.");
                    return "/login?error=ServiceUnavailable";
                }

                return "/login?error=DatabaseError";
            } finally {
                if (localClient) {
                    // console.log("[auth] 🧹 Closing local DB connection...");
                    // localClient.end(); 
                    // Note: In serverless, we might leave it open, but for "fresh connection" guarantee request,
                    // we should probably close it... but postgres-js handles pool. 
                    // Let's NOT close it aggressively to avoid 'connection closed' errors if asyncs are pending.
                }
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
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
