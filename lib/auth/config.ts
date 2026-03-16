import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  STUDENT_EMAIL_DOMAIN,
} from "@/lib/env";

export function isStudentEmail(email: string): boolean {
  return email.toLowerCase().split("@")[1] === STUDENT_EMAIL_DOMAIN;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Provider 1: Microsoft OAuth (students only) ─────────────────────
    AzureADProvider({
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      tenantId: "common",
      authorization: {
        params: { scope: "openid profile email", prompt: "select_account" },
      },
    }),

    // ── Provider 2: Email + Password (faculty and admin only) ───────────
    CredentialsProvider({
      id: "staff-credentials",
      name: "Staff Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
          columns: {
            id: true, email: true, name: true,
            role: true, passwordHash: true,
          },
        });

        if (!user) return null;

        // Only allow faculty and admin via this provider
        if (user.role !== "faculty" && user.role !== "admin") {
          return null;
        }

        // Must have a password set
        // Note: property in Drizzle query is password_hash instead of passwordHash mapping if not using alias,
        // Wait, schema defines `passwordHash: varchar("password_hash")`. 
        // In Drizzle, the typescript property is `passwordHash`, NOT `password_hash` unless raw is used.
        // Let's use user.passwordHash.
        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login timestamp
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))
          .catch(() => {}); // non-fatal

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  debug: false,

  callbacks: {
    async signIn({ user, account }) {
      // Staff Credentials provider — user already validated in authorize()
      if (account?.provider === "staff-credentials") return true;

      // Microsoft OAuth flow
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      try {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (existing) {
          // Link Microsoft ID if not already linked
          if (!existing.microsoftId && account?.providerAccountId) {
            await db
              .update(users)
              .set({ microsoftId: account.providerAccountId, updatedAt: new Date() })
              .where(eq(users.id, existing.id))
              .catch(() => {});
          }
          return true;
        }

        // New user — resolve college from email domain
        const domain = email.split("@")[1];
        const [college] = await db.execute(sql`
          SELECT id FROM colleges WHERE student_domain = ${domain} LIMIT 1
        `) as unknown as Array<{ id: string }>;

        if (!college) {
          // Unknown domain not in DB — deny sign-in
          return "/login?error=NotAuthorized";
        }

        // Auto-create student account with college linkage
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: user.name || email.split("@")[0],
            role: "student",
            microsoftId: account?.providerAccountId,
            collegeId: college.id,
          })
          .returning();

        await db.insert(students).values({ id: newUser.id, collegeId: college.id });
        return true;
      } catch (error) {
        console.error("[auth] signIn error:", error);
        return "/login?error=DatabaseError";
      }
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
          columns: { id: true, role: true, name: true, email: true, collegeId: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.collegeId = dbUser.collegeId ?? "";
          token.roleCheckedAt = Date.now();
        }
      }

      // Re-fetch role + collegeId once per hour
      const ROLE_REFRESH_MS = 60 * 60 * 1000;
      const lastChecked = (token.roleCheckedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - lastChecked > ROLE_REFRESH_MS) {
        try {
          const fresh = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: { role: true, collegeId: true },
          });
          if (fresh) {
            token.role = fresh.role;
            token.collegeId = fresh.collegeId ?? token.collegeId;
            token.roleCheckedAt = Date.now();
          }
        } catch {}
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "student" | "faculty" | "admin";
        session.user.name = token.name as string;
        session.user.collegeId = token.collegeId as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: { signIn: "/login", error: "/login" },
};
