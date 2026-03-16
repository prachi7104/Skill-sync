import { describe, it, expect } from "vitest";

describe("User search", () => {
  function filterUsers(
    users: Array<{ name: string; email: string; role: string }>,
    search: string,
    role: string
  ) {
    return users.filter((u) => {
      const matchSearch = !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !role || u.role === role;
      return matchSearch && matchRole;
    });
  }

  const users = [
    { name: "Aniruddh Vijay", email: "aniruddhvijay2k7@gmail.com", role: "admin" },
    { name: "Prachi Agarwalla", email: "agarwallaprachi351@gmail.com", role: "faculty" },
    { name: "Test Student", email: "test@stu.upes.ac.in", role: "student" },
  ];

  it("searches by name", () => {
    expect(filterUsers(users, "prachi", "")).toHaveLength(1);
    expect(filterUsers(users, "prachi", "")[0].name).toBe("Prachi Agarwalla");
  });

  it("searches by email", () => {
    expect(filterUsers(users, "stu.upes", "")).toHaveLength(1);
  });

  it("filters by role", () => {
    expect(filterUsers(users, "", "faculty")).toHaveLength(1);
    expect(filterUsers(users, "", "admin")).toHaveLength(1);
  });

  it("combined search + role filter", () => {
    expect(filterUsers(users, "aniruddh", "admin")).toHaveLength(1);
    expect(filterUsers(users, "aniruddh", "faculty")).toHaveLength(0);
  });
});

describe("Faculty post edit permissions", () => {
  function canEdit(post: { status: string; author_id: string }, actorId: string, actorRole: string): boolean {
    if (actorRole === "admin") return true;
    if (post.author_id !== actorId) return false;
    return post.status !== "published";
  }

  it("faculty can edit their own draft", () => {
    expect(canEdit({ status: "pending", author_id: "u1" }, "u1", "faculty")).toBe(true);
  });

  it("faculty cannot edit another's post", () => {
    expect(canEdit({ status: "pending", author_id: "u2" }, "u1", "faculty")).toBe(false);
  });

  it("faculty cannot edit their own published post", () => {
    expect(canEdit({ status: "published", author_id: "u1" }, "u1", "faculty")).toBe(false);
  });

  it("admin can edit any post regardless of status", () => {
    expect(canEdit({ status: "published", author_id: "u2" }, "admin1", "admin")).toBe(true);
  });
});

describe("Password copy", () => {
  it("generated password is 16 chars", () => {
    const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    function generate(): string {
      return Array.from({ length: 16 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("");
    }
    const pw = generate();
    expect(pw.length).toBe(16);
  });

  it("generated passwords are unique", () => {
    const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const pws = new Set(Array.from({ length: 1000 }, () =>
      Array.from({ length: 16 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("")
    ));
    expect(pws.size).toBe(1000);
  });
});
