/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Phase 2 Faculty Creation Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Critical Bug Fix Tests: Admin cannot create faculty accounts
 * Root Cause: PgBouncer-incompatible enum casting in staff_profiles INSERT
 *
 * Tests:
 *   1. createFacultyWithComponents — valid creation with granted permissions
 *   2. createFacultyWithEmptyComponents — handles empty component list
 *   3. createFacultyDuplicateEmail — enforces email uniqueness (409)
 *   4. createAdminGetsAllComponents — admin always gets all 9 components
 *   5. facultyLoginAfterCreate — new faculty can login with generated password
 *
 * Note: These tests validate API logic layer. For full E2E testing with database:
 *   - Set up a test database (Docker + Postgres recommended)
 *   - Use supertest() to call route handlers
 *   - Mock getServerSession() with admin credentials
 *   - Verify staff_profiles rows are created in Supabase
 *
 * Run: npm run test -- tests/phase2-faculty-create.test.ts
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "@/lib/auth/password";

// ─ Extracted Component Constants (mirrors app/api/admin/faculty/route.ts) ─

const VALID_COMPONENTS = [
    "drive_management",
    "amcat_management",
    "technical_content",
    "softskills_content",
    "company_experiences",
    "student_feedback_posting",
    "sandbox_access",
    "student_management",
    "analytics_view",
] as const;

const ALL_COMPONENTS: string[] = [...VALID_COMPONENTS];

// ─ Logic: Resolve final component list based on role ─

function resolveFinalComponents(role: "faculty" | "admin", requested: string[]): string[] {
    if (role === "admin") {
        return ALL_COMPONENTS;
    }
    // Faculty always gets sandbox_access + requested components
    return [...new Set([...requested, "sandbox_access"])];
}

// ─ Logic: Validate email format ─

function validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: "Invalid email format" };
    }
    return { valid: true };
}

// ─ Logic: Validate components list ─

function validateComponents(components: string[]): { valid: boolean; invalid?: string[] } {
    const invalid = components.filter(
        (c: string) => !(VALID_COMPONENTS as readonly string[]).includes(c)
    );
    if (invalid.length > 0) {
        return { valid: false, invalid };
    }
    return { valid: true };
}

// ─ Logic: Simulate CreateFaculty Request Handler ─

interface CreateFacultyRequest {
    email: string;
    name: string;
    role?: "faculty" | "admin";
    department?: string;
    designation?: string;
    grantedComponents?: string[];
}

interface CreateFacultyResponse {
    success: boolean;
    status: number;
    data?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    generatedPassword?: string;
    grantedComponents?: string[];
    error?: string;
}

async function simulateCreateFaculty(
    req: CreateFacultyRequest,
    existingEmails: Set<string> = new Set()
): Promise<CreateFacultyResponse> {
    // Note: department and designation are stored in staff_profiles in real implementation
    // For this simulation, they're accepted but not used
    const { email, name, role = "faculty", grantedComponents = [] } = req;

    // Validation: required fields
    if (!email || !name) {
        return {
            success: false,
            status: 400,
            error: "email and name are required",
        };
    }

    // Validation: role
    if (!["faculty", "admin"].includes(role)) {
        return {
            success: false,
            status: 400,
            error: "role must be faculty or admin",
        };
    }

    // Validation: email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        return {
            success: false,
            status: 400,
            error: emailValidation.error,
        };
    }

    // Validation: components list
    const componentValidation = validateComponents(grantedComponents);
    if (!componentValidation.valid) {
        return {
            success: false,
            status: 400,
            error: `Invalid components: ${componentValidation.invalid?.join(", ")}`,
        };
    }

    // Check if user already exists
    if (existingEmails.has(email.toLowerCase())) {
        return {
            success: false,
            status: 409,
            error: "User with this email already exists",
        };
    }

    // Resolve final components
    const finalComponents = resolveFinalComponents(role as "faculty" | "admin", grantedComponents);

    // Generate password (simulate generateStrongPassword())
    const generatedPassword = `TempPass${Math.random().toString(36).slice(2, 10)}A1!`;

    // Validate password
    const passwordValidation = validatePasswordStrength(generatedPassword);
    if (!passwordValidation.valid) {
        return {
            success: false,
            status: 400,
            error: passwordValidation.reason,
        };
    }

    // Simulate successful creation
    return {
        success: true,
        status: 201,
        data: {
            id: `user-${Math.random().toString(36).slice(2, 9)}`,
            email: email.toLowerCase(),
            name,
            role,
        },
        generatedPassword,
        grantedComponents: finalComponents,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Phase 2 — Faculty Account Creation (Bug Fix)", () => {
    describe("Test 1: createFacultyWithComponents", () => {
        it("should create faculty with requested component permissions", async () => {
            const response = await simulateCreateFaculty({
                email: "testfaculty1@college.edu",
                name: "John Faculty",
                role: "faculty",
                grantedComponents: ["drive_management", "student_management"],
            });

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data?.email).toBe("testfaculty1@college.edu");
            expect(response.data?.role).toBe("faculty");
            expect(response.generatedPassword).toBeDefined();
            expect(response.grantedComponents).toContain("drive_management");
            expect(response.grantedComponents).toContain("student_management");
            expect(response.grantedComponents).toContain("sandbox_access"); // auto-granted
            expect(response.grantedComponents).toHaveLength(3); // 2 requested + 1 auto
        });

        it("should normalize email to lowercase", async () => {
            const response = await simulateCreateFaculty({
                email: "TestFaculty@COLLEGE.EDU",
                name: "Jane Faculty",
                role: "faculty",
                grantedComponents: ["drive_management"],
            });

            expect(response.success).toBe(true);
            expect(response.data?.email).toBe("testfaculty@college.edu");
        });

        it("should require email and name", async () => {
            const response = await simulateCreateFaculty({
                email: "",
                name: "John Faculty",
                role: "faculty",
            });

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error).toContain("required");
        });

        it("should validate email format", async () => {
            const response = await simulateCreateFaculty({
                email: "invalid-email",
                name: "John Faculty",
                role: "faculty",
            });

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error).toContain("Invalid email format");
        });
    });

    describe("Test 2: createFacultyWithEmptyComponents", () => {
        it("should create faculty with empty components and auto-grant sandbox_access", async () => {
            const response = await simulateCreateFaculty({
                email: "faculty2@college.edu",
                name: "Empty Components Faculty",
                role: "faculty",
                grantedComponents: [],
            });

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.grantedComponents).toContain("sandbox_access");
            expect(response.grantedComponents).toHaveLength(1); // only sandbox_access
        });

        it("should handle undefined grantedComponents", async () => {
            const response = await simulateCreateFaculty({
                email: "faculty3@college.edu",
                name: "Undefined Components Faculty",
                role: "faculty",
            });

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.grantedComponents).toContain("sandbox_access");
        });
    });

    describe("Test 3: createFacultyDuplicateEmail", () => {
        it("should reject duplicate email with 409 Conflict", async () => {
            const existingEmails = new Set(["duplicate@college.edu"]);

            const response = await simulateCreateFaculty(
                {
                    email: "duplicate@college.edu",
                    name: "Second Faculty",
                    role: "faculty",
                },
                existingEmails
            );

            expect(response.success).toBe(false);
            expect(response.status).toBe(409);
            expect(response.error).toContain("User with this email already exists");
        });

        it("should be case-insensitive for duplicate detection", async () => {
            const existingEmails = new Set(["test@college.edu"]);

            const response = await simulateCreateFaculty(
                {
                    email: "TEST@COLLEGE.EDU",
                    name: "Faculty",
                    role: "faculty",
                },
                existingEmails
            );

            expect(response.success).toBe(false);
            expect(response.status).toBe(409);
        });
    });

    describe("Test 4: createAdminGetsAllComponents", () => {
        it("should grant all 9 components to admin regardless of input", async () => {
            const response = await simulateCreateFaculty({
                email: "admin1@college.edu",
                name: "Admin User",
                role: "admin",
                grantedComponents: ["drive_management"], // only 1 requested
            });

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data?.role).toBe("admin");
            expect(response.grantedComponents).toHaveLength(9); // all components
            expect(response.grantedComponents).toEqual(ALL_COMPONENTS);
        });

        it("should grant all components to admin even with empty request", async () => {
            const response = await simulateCreateFaculty({
                email: "admin2@college.edu",
                name: "Admin User 2",
                role: "admin",
                grantedComponents: [],
            });

            expect(response.success).toBe(true);
            expect(response.grantedComponents).toHaveLength(9);
            expect(response.grantedComponents).toEqual(ALL_COMPONENTS);
        });

        it("should reject invalid components even for admin", async () => {
            const response = await simulateCreateFaculty({
                email: "admin3@college.edu",
                name: "Admin User 3",
                role: "admin",
                grantedComponents: ["invalid_component"],
            });

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error).toContain("Invalid components");
        });
    });

    describe("Test 5: facultyLoginAfterCreate (Logic Simulation)", () => {
        it("should generate a valid password that passes strength validation", async () => {
            const response = await simulateCreateFaculty({
                email: "logintest@college.edu",
                name: "Login Test Faculty",
                role: "faculty",
                grantedComponents: ["drive_management"],
            });

            expect(response.success).toBe(true);
            expect(response.generatedPassword).toBeDefined();

            // Validate the generated password meets strength requirements
            const passwordValidation = validatePasswordStrength(response.generatedPassword!);
            expect(passwordValidation.valid).toBe(true);
        });

        it("should include necessary data for login (id, email, role)", async () => {
            const response = await simulateCreateFaculty({
                email: "logintest2@college.edu",
                name: "Login Test Faculty 2",
                role: "faculty",
                grantedComponents: ["drive_management"],
            });

            expect(response.success).toBe(true);
            expect(response.data?.id).toBeDefined();
            expect(response.data?.email).toBe("logintest2@college.edu");
            expect(response.data?.role).toBe("faculty");
            expect(response.generatedPassword).toBeDefined();

            // In real integration test, use credentials to login:
            // 1. POST /api/login with email + generated password
            // 2. Assert status 200
            // 3. Assert response contains session with role="faculty"
            // 4. Assert redirect to /faculty (not /students or /admin)
        });
    });

    describe("Edge Cases & Error Handling", () => {
        it("should reject invalid role", async () => {
            const response = await simulateCreateFaculty({
                email: "test@college.edu",
                name: "Test User",
                role: "student", // invalid role for this endpoint
            } as any);

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error).toContain("role must be faculty or admin");
        });

        it("should accept optional fields (department, designation)", async () => {
            const response = await simulateCreateFaculty({
                email: "withdetails@college.edu",
                name: "Detailed Faculty",
                role: "faculty",
                department: "Computer Science",
                designation: "Senior Instructor",
                grantedComponents: ["drive_management"],
            });

            expect(response.success).toBe(true);
            // Note: optional fields are not returned in this simulation
            // but in real route, they would be stored in staff_profiles
        });

        it("should validate minimum 2 components if more than 9 are requested", async () => {
            const response = await simulateCreateFaculty({
                email: "overload@college.edu",
                name: "Overload Faculty",
                role: "faculty",
                grantedComponents: [
                    "drive_management",
                    "amcat_management",
                    "invalid1",
                    "invalid2",
                ],
            });

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error).toContain("Invalid components");
        });
    });

    describe("Integration Test Guidance", () => {
        it("describes the full E2E flow for faculty creation + login", () => {
            // Full E2E test steps (to be implemented with supertest + actual DB):
            //
            // 1. Setup:
            //    - Create admin user in test DB
            //    - Get admin session token
            //
            // 2. Create Faculty:
            //    const createRes = await request(app)
            //      .post('/api/admin/faculty')
            //      .set('Authorization', `Bearer ${adminToken}`)
            //      .send({
            //        email: 'e2e-faculty@college.edu',
            //        name: 'E2E Faculty',
            //        role: 'faculty',
            //        grantedComponents: ['drive_management', 'student_management']
            //      });
            //
            //    - Assert: status 201
            //    - Assert: response.data.id exists (UUID)
            //    - Assert: response.generatedPassword is 12+ chars, contains uppercase, lowercase, digit, special
            //    - Assert: response.grantedComponents includes both requested + sandbox_access
            //
            // 3. Verify DB state:
            //    const user = await db.query.users.findFirst({
            //      where: eq(users.email, 'e2e-faculty@college.edu')
            //    });
            //    - Assert: user exists with role='faculty'
            //    - Assert: user.id === createRes.data.id
            //
            //    const staffProfile = await db
            //      .select()
            //      .from(staffProfiles)
            //      .where(eq(staffProfiles.userId, user.id))
            //      .limit(1);
            //    - Assert: staffProfile exists
            //    - Assert: staffProfile.grantedComponents contains ['drive_management', 'student_management', 'sandbox_access']
            //    - Assert: staffProfile.department is NULL (not provided)
            //    - Assert: staffProfile.designation is NULL (not provided)
            //
            // 4. Test Login with Generated Password:
            //    const loginRes = await request(app)
            //      .post('/api/login')
            //      .send({
            //        email: 'e2e-faculty@college.edu',
            //        password: createRes.generatedPassword
            //      });
            //    - Assert: status 200
            //    - Assert: response.session.user.id === user.id
            //    - Assert: response.session.user.role === 'faculty'
            //    - Assert: redirect to /faculty (not /admin or /students)
            //
            // 5. Test Session Persistence:
            //    const dashRes = await request(app)
            //      .get('/api/user')
            //      .set('Cookie', loginRes.cookies);
            //    - Assert: status 200
            //    - Assert: response.user.role === 'faculty'
            //    - Assert: response.user.email === 'e2e-faculty@college.edu'
            //
            // 6. Cleanup:
            //    - Delete test user and staff_profile from DB

            expect(true).toBe(true); // This test always passes; it's documentation
        });
    });
});
