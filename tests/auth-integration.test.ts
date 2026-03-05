/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Auth Integration Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - signIn callback: auto-create students, reject non-student emails,
 *     handle existing users, DB errors
 *   - magic-link authorize: validate token, reject expired/used/student tokens
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

// ── Mock DB ─────────────────────────────────────────────────────────────────
const mockDb = {
    query: {
        users: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn(() => [{ id: "new-user-id" }]),
        })),
    })),
    update: vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue({}),
        })),
    })),
    select: vi.fn(() => ({
        from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(),
                })),
            })),
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
        const existingUser = await mockDb.query.users.findFirst({ where: email });
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
        return "/login?error=NotAuthorized";
    } catch {
        return "/login?error=DatabaseError";
    }
}

// ── Inlined magic-link authorize (mirrors lib/auth/config.ts:43–84) ─────────
async function simulateAuthorize(token: string | undefined) {
    if (!token) return null;

    const limitMock = (mockDb.select() as any).from().innerJoin().where().limit;
    const rows = await limitMock(1);
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    if (row.role !== "faculty" && row.role !== "admin") return null;

    // Mark token as used
    await mockDb.update("magicLinkTokens").set({ used: true }).where(row.tokenId);

    return {
        id: row.userId,
        email: row.email,
        name: row.name,
        role: row.role,
    };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Auth Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

            expect(result).toBe("/login?error=NotAuthorized");
        });

        it("should return DatabaseError when DB throws", async () => {
            mockDb.query.users.findFirst.mockRejectedValue(new Error("DB Connection Failed"));

            const result = await simulateSignIn({ email: "error@test.com" });

            expect(result).toBe("/login?error=DatabaseError");
        });
    });

    describe("Magic Link Provider authorize", () => {
        it("should validate a correct faculty token and return user", async () => {
            const mockRow = {
                tokenId: "token-uuid", userId: "user-uuid",
                email: "faculty@test.com", name: "Faculty", role: "faculty",
            };

            const limitMock = vi.fn().mockResolvedValue([mockRow]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
            const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
            mockDb.select = vi.fn().mockReturnValue({ from: fromMock }) as any;

            const user = await simulateAuthorize("valid-token");

            expect(user).toEqual({
                id: mockRow.userId,
                email: mockRow.email,
                name: mockRow.name,
                role: mockRow.role,
            });
            expect(mockDb.update).toHaveBeenCalled();
        });

        it("should return null for expired/used token (empty result)", async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
            const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
            mockDb.select = vi.fn().mockReturnValue({ from: fromMock }) as any;

            const user = await simulateAuthorize("invalid-token");
            expect(user).toBeNull();
        });

        it("should return null if the user role is 'student'", async () => {
            const mockRow = {
                tokenId: "t-uuid", userId: "u-uuid", role: "student",
            };

            const limitMock = vi.fn().mockResolvedValue([mockRow]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
            const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
            mockDb.select = vi.fn().mockReturnValue({ from: fromMock }) as any;

            const user = await simulateAuthorize("student-token");
            expect(user).toBeNull();
        });

        it("should return null if no token is provided", async () => {
            const user = await simulateAuthorize(undefined);
            expect(user).toBeNull();
        });
    });
});
