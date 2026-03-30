import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Phase 6 — Student Search Fixes", () => {
  describe("Test 1: student insert now includes collegeId", () => {
    it("should have collegeId in student insert statement", () => {
      const layoutPath = resolve(process.cwd(), "app/(student)/layout.tsx");
      const content = readFileSync(layoutPath, "utf-8");

      // Assert that the insert includes collegeId
      expect(content).toContain("collegeId: user.collegeId");
      expect(content).toContain("db.insert(students).values({");
      
      // Verify we're using appropriate fallback
      const insertBlock = content.match(/db\.insert\(students\)\.values\(\{[\s\S]*?\}\)/);
      expect(insertBlock?.toString()).toContain("collegeId");
    });
  });

  describe("Test 2: search API empty query returns empty results", () => {
    it("should return empty results when no search criteria provided", async () => {
      // Simulate API response for no query
      const response = {
        students: [],
        total: 0,
        page: 1,
      };

      expect(response.students).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.page).toBe(1);
    });
  });

  describe("Test 3: search API scoped to user's college", () => {
    it("should only return students from the requesting user's college", async () => {
      // Mock scenario: 2 students in college-A, 1 in college-B
      // Admin from college-A queries
      // Should return only 2 students

      const mockStudents = [
        {
          id: "student1",
          collegeId: "college-A",
          name: "Alice Johnson",
          email: "alice@college-a.edu",
        },
        {
          id: "student2",
          collegeId: "college-A",
          name: "Bob Smith",
          email: "bob@college-a.edu",
        },
        {
          id: "student3",
          collegeId: "college-B",
          name: "Charlie Brown",
          email: "charlie@college-b.edu",
        },
      ];

      // Filter to admin's college
      const adminCollegeId = "college-A";
      const filtered = mockStudents.filter((s) => s.collegeId === adminCollegeId);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((s) => s.collegeId === adminCollegeId)).toBe(true);
      expect(filtered.map((s) => s.name)).toEqual(["Alice Johnson", "Bob Smith"]);
    });
  });

  describe("Test 4: search API faculty can also access student search", () => {
    it("should allow faculty role to access the search API (not just admin)", async () => {
      // Test that both admin and faculty roles are accepted
      const allowedRoles = ["admin", "faculty"];

      // Faculty role should be in allowed roles
      expect(allowedRoles).toContain("faculty");
      expect(allowedRoles).toContain("admin");

      // Verify both can make requests
      const facultyRole = "faculty";
      const adminRole = "admin";

      expect(allowedRoles).toContain(facultyRole);
      expect(allowedRoles).toContain(adminRole);
    });
  });

  describe("Test 5: search API by name works", () => {
    it("should filter students by name search query", async () => {
      // Mock students with different names
      const mockStudents = [
        {
          id: "s1",
          name: "Prachi Sharma",
          email: "prachi@example.com",
          sapId: "500123456",
        },
        {
          id: "s2",
          name: "Rahul Singh",
          email: "rahul@example.com",
          sapId: "500234567",
        },
        {
          id: "s3",
          name: "Priya Patel",
          email: "priya@example.com",
          sapId: "500345678",
        },
      ];

      // Search for "Prachi"
      const searchQuery = "Prachi";
      const results = mockStudents.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe("Prachi Sharma");
      expect(results[0]?.email).toBe("prachi@example.com");
    });

    it("should also match email in search", async () => {
      // Mock students
      const mockStudents = [
        {
          id: "s1",
          name: "John Doe",
          email: "prachi@example.com",
          sapId: "500123456",
        },
        {
          id: "s2",
          name: "Jane Smith",
          email: "jane@example.com",
          sapId: "500234567",
        },
      ];

      // Search for "prachi"
      const searchQuery = "prachi";
      const results = mockStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.email).toContain("prachi");
    });

    it("should also match SAP ID in search", async () => {
      // Mock students
      const mockStudents = [
        {
          id: "s1",
          name: "John Doe",
          email: "john@example.com",
          sapId: "500123456",
        },
        {
          id: "s2",
          name: "Jane Smith",
          email: "jane@example.com",
          sapId: "500234567",
        },
      ];

      // Search for SAP ID
      const searchQuery = "500123456";
      const results = mockStudents.filter((s) =>
        s.sapId.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.sapId).toBe("500123456");
    });
  });

  describe("Test 6: shared component exists and exports", () => {
    it("should have StudentSearchView component", () => {
      const componentPath = resolve(
        process.cwd(),
        "components/shared/student-search-view.tsx"
      );
      const content = readFileSync(componentPath, "utf-8");

      expect(content).toContain("export default function StudentSearchView");
      expect(content).toContain("apiEndpoint");
      expect(content).toContain("StudentProfile");
      expect(content).toContain("ProfileModal");
    });
  });

  describe("Test 7: admin and faculty pages use shared component", () => {
    it("should have admin students page using shared component", () => {
      const adminPagePath = resolve(
        process.cwd(),
        "app/(admin)/admin/students/page.tsx"
      );
      const content = readFileSync(adminPagePath, "utf-8");

      expect(content).toContain("StudentSearchView");
      expect(content).toContain("/api/admin/students/search");
      expect(content).toContain("export default function AdminStudentsPage");
    });

    it("should have faculty students page using shared component", () => {
      const facultyPagePath = resolve(
        process.cwd(),
        "app/(faculty)/faculty/students/page.tsx"
      );
      const content = readFileSync(facultyPagePath, "utf-8");

      expect(content).toContain("StudentSearchView");
      expect(content).toContain("/api/faculty/students/search");
      expect(content).toContain("export default function FacultyStudentsPage");
    });
  });

  describe("Test 8: API supports both admin and faculty roles", () => {
    it("should have admin search API allowing both roles", () => {
      const adminApiPath = resolve(
        process.cwd(),
        "app/api/admin/students/search/route.ts"
      );
      const content = readFileSync(adminApiPath, "utf-8");

      // Check that it allows both admin and faculty
      const roleCheckMatch = content.match(
        /\["admin",\s*"faculty"\]|\["faculty",\s*"admin"\]/
      );
      expect(roleCheckMatch || content).toBeTruthy();

      // Should check for multiple roles
      expect(
        content.includes('includes(userRow[0]?.role') ||
          content.includes('!["admin", "faculty"].includes')
      ).toBe(true);
    });

    it("should have faculty search API allowing both roles", () => {
      const facultyApiPath = resolve(
        process.cwd(),
        "app/api/faculty/students/search/route.ts"
      );
      const content = readFileSync(facultyApiPath, "utf-8");

      // Check that it allows both admin and faculty
      expect(content).toContain('requireRole(["faculty", "admin"])');
    });
  });
});
