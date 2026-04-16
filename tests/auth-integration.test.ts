/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Auth Integration Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - signIn callback: auto-create students, reject non-student emails,
 *     handle existing users, DB errors
 *   - staff-credentials authorize: validate password login for faculty/admin,
 *     reject missing credentials, students, and invalid passwords
 *
 * Uses inlined logic (mirrors lib/auth/config.ts) to avoid importing
 * modules that depend on server-only / postgres.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Domain constant (mirrors lib/env.ts) ────────────────────────────────────
const STUDENT_EMAIL_DOMAIN = "stu.upes.ac.in";

function isStudentEmail(email: string): boolean {
    const domain = email.toLowerCase().split("@")[1];
    return domain === STUDENT_EMAIL_DOMAIN;
}

const mockCompare = vi.fn();

// ── Mock DB ─────────────────────────────────────────────────────────────────
const mockDb = {
    query: {
        users: { findFirst: vi.fn() },
    },
    insert: vi.fn((_table?: string) => ({
        values: vi.fn((_vals?: Record<string, unknown>) => ({
            returning: vi.fn(() => [{ id: "new-user-id" }]),
        })),
    })),
    update: vi.fn((_table?: string) => ({
        set: vi.fn((_vals?: Record<string, unknown>) => ({
            where: vi.fn().mockResolvedValue({}),
        })),
    })),
};

// ── Inlined signIn callback (mirrors lib/auth/config.ts:94–121) ─────────────
async function simulateSignIn(
    user: { email?: string; name?: string },
    account?: { providerAccountId?: string },
) {
    if (!user.email) return false;
    const email = user.email.toLowerCase();
    try {
        const existingUser = await mockDb.query.users.findFirst({ where: email } as any);
        if (existingUser) {
            if (!(existingUser as any).microsoftId && account?.providerAccountId) {
                await mockDb.update("users")
                    .set({ microsoftId: account.providerAccountId })
                    .where(existingUser.id)
                    .catch(() => { /* silent */ });
            }
            return true;
        }
        if (isStudentEmail(email)) {
            const [newUser] = await mockDb.insert("users").values({
                email, name: user.name || "Student", role: "student",
                microsoftId: account?.providerAccountId,
            }).returning();
            await mockDb.insert("students").values({ id: newUser.id });
            return true;
        }
        return "/?error=NotAuthorized";
    } catch {
        return "/?error=DatabaseError";
    }
}

// ── Inlined staff authorize (mirrors lib/auth/config.ts:31–74) ──────────────
async function simulateAuthorize(credentials: { email?: string; password?: string } | undefined) {
    if (!credentials?.email || !credentials?.password) return null;

    const email = credentials.email.toLowerCase().trim();
    const password = credentials.password;

    const user = await mockDb.query.users.findFirst({ where: email } as any);
    if (!user) return null;

    if (user.role !== "faculty" && user.role !== "admin") return null;
    if (!user.passwordHash) return null;

    const isValid = await mockCompare(password, user.passwordHash);
    if (!isValid) return null;

    await mockDb.update("users")
        .set({ lastLoginAt: new Date() })
        .where(user.id)
        .catch(() => { /* non-fatal */ });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Auth Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCompare.mockReset();
        // Re-wire insert to return new-user-id
        mockDb.insert = vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: "new-user-id" }]),
            })),
        })) as any;
    });

    describe("signIn Callback", () => {
        it("should auto-create user + student row for a new student email", async () => {
            mockDb.query.users.findFirst.mockResolvedValue(null);

            const result = await simulateSignIn(
                { email: "newstudent@stu.upes.ac.in", name: "New Student" },
                { providerAccountId: "ms-id" },
            );

            expect(result).toBe(true);
            expect(mockDb.insert).toHaveBeenCalledTimes(2); // users + students
        });

        it("should return true for an existing user without inserting", async () => {
            mockDb.query.users.findFirst.mockResolvedValue({
                id: "123", email: "existing@test.com", microsoftId: "ms-123",
            });

            const result = await simulateSignIn({ email: "existing@test.com" });

            expect(result).toBe(true);
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it("should return NotAuthorized for non-student email not in DB", async () => {
            mockDb.query.users.findFirst.mockResolvedValue(null);

            const result = await simulateSignIn({ email: "external@gmail.com" });

            expect(result).toBe("/?error=NotAuthorized");
        });

        it("should return DatabaseError when DB throws", async () => {
            mockDb.query.users.findFirst.mockRejectedValue(new Error("DB Connection Failed"));

            const result = await simulateSignIn({ email: "error@test.com" });

            expect(result).toBe("/?error=DatabaseError");
        });
    });

    describe("Staff Credentials Provider authorize", () => {
        it("should validate a correct faculty password and return user", async () => {
            const mockUser = {
                id: "user-uuid",
                email: "faculty@test.com",
                name: "Faculty",
                role: "faculty",
                passwordHash: "hashed-password",
            };
            mockDb.query.users.findFirst.mockResolvedValue(mockUser);
            mockCompare.mockResolvedValue(true);

            const user = await simulateAuthorize({
                email: "faculty@test.com",
                password: "correct-password",
            });

            expect(user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
            });
            expect(mockCompare).toHaveBeenCalledWith("correct-password", "hashed-password");
            expect(mockDb.update).toHaveBeenCalled();
        });

        it("should return null when the user does not exist", async () => {
            mockDb.query.users.findFirst.mockResolvedValue(null);

            const user = await simulateAuthorize({
                email: "missing@test.com",
                password: "whatever",
            });

            expect(user).toBeNull();
        });

        it("should return null if the user role is student", async () => {
            mockDb.query.users.findFirst.mockResolvedValue({
                id: "student-id",
                email: "student@test.com",
                name: "Student",
                role: "student",
                passwordHash: "hashed-password",
            });

            const user = await simulateAuthorize({
                email: "student@test.com",
                password: "irrelevant",
            });

            expect(user).toBeNull();
            expect(mockCompare).not.toHaveBeenCalled();
        });

        it("should return null when the password is invalid", async () => {
            mockDb.query.users.findFirst.mockResolvedValue({
                id: "admin-id",
                email: "admin@test.com",
                name: "Admin",
                role: "admin",
                passwordHash: "hashed-password",
            });
            mockCompare.mockResolvedValue(false);

            const user = await simulateAuthorize({
                email: "admin@test.com",
                password: "wrong-password",
            });

            expect(user).toBeNull();
        });

        it("should return null if credentials are missing", async () => {
            expect(await simulateAuthorize(undefined)).toBeNull();
            expect(await simulateAuthorize({ email: "faculty@test.com" })).toBeNull();
            expect(await simulateAuthorize({ password: "secret" })).toBeNull();
        });
    });
});
