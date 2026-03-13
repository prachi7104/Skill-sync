"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  name: string;
  role: "student" | "faculty" | "admin";
  createdAt: string;
};

type LoginLinkResult = {
  loginUrl: string;
  expiresAt: string;
};

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  faculty: {
    label: "Faculty",
    icon: UserPlus,
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  student: {
    label: "Student",
    icon: GraduationCap,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Create faculty form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Login link state per user email
  const [linkState, setLinkState] = useState<
    Record<string, { loading: boolean; result: LoginLinkResult | null; error: string | null; copied: boolean }>
  >({});

  async function fetchUsers() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/faculty");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      // GET /api/admin/faculty returns only faculty — also fetch all users
      const allRes = await fetch("/api/admin/users");
      if (allRes.ok) {
        const allData = await allRes.json();
        setUsers(allData.data ?? []);
      } else {
        // Fall back to faculty list if /api/admin/users doesn't exist
        setUsers(data.data ?? []);
      }
    } catch (e: any) {
      // Fallback: just show faculty list
      try {
        const res = await fetch("/api/admin/faculty");
        const data = await res.json();
        setUsers(data.data ?? []);
      } catch {
        setFetchError("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch("/api/admin/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create faculty");
      } else {
        setCreateSuccess(`Faculty account created for ${data.data.email}`);
        setNewName("");
        setNewEmail("");
        fetchUsers();
      }
    } catch {
      setCreateError("An unexpected error occurred");
    } finally {
      setCreating(false);
    }
  }

  async function handleGetLoginLink(email: string) {
    setLinkState((prev) => ({
      ...prev,
      [email]: { loading: true, result: null, error: null, copied: false },
    }));
    try {
      const res = await fetch("/api/admin/faculty/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkState((prev) => ({
          ...prev,
          [email]: { loading: false, result: null, error: data.error ?? "Failed", copied: false },
        }));
      } else {
        setLinkState((prev) => ({
          ...prev,
          [email]: { loading: false, result: data.data, error: null, copied: false },
        }));
      }
    } catch {
      setLinkState((prev) => ({
        ...prev,
        [email]: { loading: false, result: null, error: "Network error", copied: false },
      }));
    }
  }

  async function handleCopy(email: string, url: string) {
    await navigator.clipboard.writeText(url);
    setLinkState((prev) => ({
      ...prev,
      [email]: { ...prev[email], copied: true },
    }));
    setTimeout(() => {
      setLinkState((prev) => ({
        ...prev,
        [email]: { ...prev[email], copied: false },
      }));
    }, 2500);
  }

  const grouped = {
    admin: users.filter((u) => u.role === "admin"),
    faculty: users.filter((u) => u.role === "faculty"),
    student: users.filter((u) => u.role === "student"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} total users · {grouped.faculty.length} faculty · {grouped.admin.length}{" "}
            admins · {grouped.student.length} students
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Create Faculty Card */}
      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Create Faculty Account
          </CardTitle>
          <CardDescription>
            Creates a new faculty user in the database. After creation, generate a login link to
            send them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFaculty} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="fac-name">Full Name</Label>
              <Input
                id="fac-name"
                placeholder="e.g. Dr. Priya Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="fac-email">Email Address</Label>
              <Input
                id="fac-email"
                type="email"
                placeholder="e.g. faculty@upes.ac.in"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={creating || !newName.trim() || !newEmail.trim()}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
              >
                {creating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {creating ? "Creating..." : "Create Faculty"}
              </Button>
            </div>
          </form>

          {createError && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {createError}
            </div>
          )}
          {createSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> {createSuccess}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User List */}
      {fetchError ? (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {fetchError}
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Loading users…</div>
      ) : (
        <div className="space-y-6">
          {(["admin", "faculty", "student"] as const).map((role) => {
            const group = grouped[role];
            if (group.length === 0) return null;
            const cfg = ROLE_CONFIG[role];
            const Icon = cfg.icon;

            return (
              <Card key={role}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {cfg.label}s
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {group.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {group.map((user) => {
                      const ls = linkState[user.email];
                      return (
                        <div
                          key={user.id}
                          className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                            <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wide px-2", cfg.badge)}>
                              {cfg.label.toUpperCase()}
                            </Badge>

                            {/* Login link — only for faculty/admin */}
                            {(role === "faculty" || role === "admin") && (
                              <div className="space-y-1.5 w-full sm:w-auto">
                                {!ls?.result ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={ls?.loading}
                                    onClick={() => handleGetLoginLink(user.email)}
                                    className="gap-1.5 text-xs h-7 px-3"
                                  >
                                    {ls?.loading ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <LinkIcon className="h-3 w-3" />
                                    )}
                                    {ls?.loading ? "Generating…" : "Generate Login Link"}
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <code className="text-[10px] bg-gray-100 rounded px-2 py-1 max-w-[200px] truncate block">
                                      {ls.result.loginUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 shrink-0"
                                      onClick={() => handleCopy(user.email, ls.result!.loginUrl)}
                                      title="Copy link"
                                    >
                                      {ls.copied ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                                {ls?.error && (
                                  <p className="text-[10px] text-rose-600">{ls.error}</p>
                                )}
                                {ls?.result && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Expires{" "}
                                    {new Date(ls.result.expiresAt).toLocaleString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
