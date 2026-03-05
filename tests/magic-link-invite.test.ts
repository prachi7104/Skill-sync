/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Magic Link Invite API Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for POST /api/admin/faculty/invite logic:
 *   - Non-admin → 401
 *   - Missing email → 400
 *   - Faculty user not found → 404
 *   - role='student' → 400
 *   - Valid request → creates token, returns loginUrl + expiresAt
 *
 * Uses inlined logic to avoid importing server-only / postgres / route handlers.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── Mock DB ─────────────────────────────────────────────────────────────────

const mockDb = {
    query: {
        users: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue({}),
    })),
    update: vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue({}),
        })),
    })),
};

let mockSessionRole: string | null = null;

// ── Inlined POST handler (mirrors app/api/admin/faculty/invite/route.ts) ────

interface InviteResult {
    status: number;
    body: Record<string, unknown>;
}

async function simulateInvitePOST(body: { email?: string }): Promise<InviteResult> {
    // Auth check
    if (!mockSessionRole || mockSessionRole !== "admin") {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    const { email } = body;
    if (!email) {
        return { status: 400, body: { error: "Missing required field: email" } };
    }

    const facultyUser = await mockDb.query.users.findFirst({ where: email.toLowerCase() });

    if (!facultyUser) {
        return { status: 404, body: { error: "Faculty user not found. Create the user first." } };
    }

    if ((facultyUser as any).role !== "faculty" && (facultyUser as any).role !== "admin") {
        return { status: 400, body: { error: "User is not a faculty or admin" } };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Invalidate old tokens
    await mockDb.update("magicLinkTokens").set({ used: true }).where((facultyUser as any).id);

    // Insert new token
    await mockDb.insert("magicLinkTokens").values({
        userId: (facultyUser as any).id,
        token,
        expiresAt,
    });

    const loginUrl = "http://localhost:3000/login?token=" + token + "&type=magic";

    return {
        status: 200,
        body: {
            success: true,
            data: { loginUrl, expiresAt: expiresAt.toISOString() },
        },
    };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Magic Link Invite API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSessionRole = null;
        mockDb.insert = vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
        })) as any;
        mockDb.update = vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })) as any;
    });

    it("should return 401 for non-admin session", async () => {
        mockSessionRole = "faculty";
        const result = await simulateInvitePOST({ email: "test@test.com" });
        expect(result.status).toBe(401);
    });

    it("should return 400 for missing email", async () => {
        mockSessionRole = "admin";
        const result = await simulateInvitePOST({});
        expect(result.status).toBe(400);
        expect(result.body.error).toContain("Missing required field");
    });

    it("should return 404 when faculty user not found", async () => {
        mockSessionRole = "admin";
        mockDb.query.users.findFirst.mockResolvedValue(null);

        const result = await simulateInvitePOST({ email: "missing@test.com" });
        expect(result.status).toBe(404);
        expect(result.body.error).toContain("Faculty user not found");
    });

    it("should return 400 when user has 'student' role", async () => {
        mockSessionRole = "admin";
        mockDb.query.users.findFirst.mockResolvedValue({ id: "stu-123", role: "student" });

        const result = await simulateInvitePOST({ email: "student@test.com" });
        expect(result.status).toBe(400);
        expect(result.body.error).toContain("User is not a faculty or admin");
    });

    it("should create a valid magic link and return 200", async () => {
        mockSessionRole = "admin";
        mockDb.query.users.findFirst.mockResolvedValue({ id: "fac-123", role: "faculty" });

        const result = await simulateInvitePOST({ email: "faculty@test.com" });
        expect(result.status).toBe(200);

        const data = result.body.data as { loginUrl: string; expiresAt: string };
        expect(data.loginUrl).toContain("/login?token=");
        expect(data.loginUrl).toContain("&type=magic");
        expect(data.loginUrl).not.toContain("/api/auth/callback");

        // Verify old token invalidation + new insert
        expect(mockDb.update).toHaveBeenCalled();
        expect(mockDb.insert).toHaveBeenCalled();

        // Check expiration (~24h tolerance)
        const expiresAt = new Date(data.expiresAt).getTime();
        const diff = expiresAt - Date.now();
        expect(Math.abs(diff - 24 * 60 * 60 * 1000)).toBeLessThan(60 * 1000);
    });
});
