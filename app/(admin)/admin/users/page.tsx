"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Check,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  Copy,
} from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  name: string;
  role: "student" | "faculty" | "admin";
  createdAt: string;
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
  const [totalCount, setTotalCount] = useState(0);
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = 20;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Create faculty form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showGeneratedPasswordModal, setShowGeneratedPasswordModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password reset state per user email
  const [resetState, setResetState] = useState<
    Record<string, { loading: boolean; resetPassword?: string; error: string | null; success: boolean }>
  >({});

  async function fetchUsers() {
    setLoading(true);
    setFetchError(null);
    try {
      const allRes = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setUsers(allData.data ?? []);
        setTotalCount(allData.total ?? 0);
      } else {
        // Fallback for API failure
        const res = await fetch("/api/admin/faculty");
        const data = await res.json();
        setUsers(data.data ?? []);
      }
    } catch {
      setFetchError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch("/api/admin/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim(),
          password: autoGeneratePassword ? undefined : newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create faculty");
      } else {
        setCreateSuccess(`Faculty account created for ${data.data?.email || newEmail.trim()}`);
        if (typeof data.generatedPassword === "string" && data.generatedPassword.length > 0) {
          setGeneratedPassword(data.generatedPassword);
          setShowGeneratedPasswordModal(true);
          setCopied(false);
        }
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setAutoGeneratePassword(true);
        fetchUsers();
      }
    } catch {
      setCreateError("An unexpected error occurred");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopyGeneratedPassword() {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleResetPassword(userId: string, email: string) {
    const password = resetState[email]?.resetPassword;
    if (!password || password.length < 8) {
      setResetState((prev: typeof resetState) => ({
        ...prev,
        [email]: { ...prev[email], loading: false, error: "Password must be at least 8 chars", success: false },
      }));
      return;
    }

    setResetState((prev: typeof resetState) => ({
      ...prev,
      [email]: { ...prev[email], loading: true, error: null, success: false },
    }));

    try {
      const res = await fetch(`/api/admin/faculty/${userId}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetState((prev: typeof resetState) => ({
          ...prev,
          [email]: { loading: false, error: data.error ?? "Failed to reset", success: false, resetPassword: password },
        }));
      } else {
        setResetState((prev: typeof resetState) => ({
          ...prev,
          [email]: { loading: false, error: null, success: true, resetPassword: "" },
        }));
        // Reset success state after 3s
        setTimeout(() => {
          setResetState((prev: typeof resetState) => ({
            ...prev,
            [email]: { ...prev[email], success: false }
          }));
        }, 3000);
      }
    } catch {
      setResetState((prev: typeof resetState) => ({
        ...prev,
        [email]: { loading: false, error: "Network error", success: false, resetPassword: password },
      }));
    }
  }

  const grouped = {
    admin: users.filter((u: User) => u.role === "admin"),
    faculty: users.filter((u: User) => u.role === "faculty"),
    student: users.filter((u: User) => u.role === "student"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} total users
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
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="fac-password">Password</Label>
              <Input
                id="fac-password"
                type="password"
                placeholder={autoGeneratePassword ? "Auto-generated strong password" : "Min 8 chars, 1 uppercase, 1 lowercase, 1 number"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={autoGeneratePassword}
                className="bg-slate-900 border-slate-700"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="auto-generate-password"
                  type="checkbox"
                  checked={autoGeneratePassword}
                  onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                <Label htmlFor="auto-generate-password" className="text-xs text-muted-foreground cursor-pointer">
                  Auto-generate password
                </Label>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={creating || !newName.trim() || !newEmail.trim() || (!autoGeneratePassword && newPassword.length < 8)}
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
                    {group.map((user: User) => {
                      const rs = resetState[user.email];
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

                              <Dialog open={showGeneratedPasswordModal} onOpenChange={setShowGeneratedPasswordModal}>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Generated Password</DialogTitle>
                                    <DialogDescription>
                                      This password is shown once. Send it to the faculty member securely.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="rounded-md border bg-slate-950 text-slate-100 px-4 py-3">
                                    <p className="font-mono text-sm break-all">{generatedPassword || "-"}</p>
                                  </div>

                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowGeneratedPasswordModal(false)}>
                                      Close
                                    </Button>
                                    <Button type="button" onClick={handleCopyGeneratedPassword} className="gap-2">
                                      <Copy className="h-4 w-4" />
                                      {copied ? "Copied" : "Copy to clipboard"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </p>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                            <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wide px-2", cfg.badge)}>
                              {cfg.label.toUpperCase()}
                            </Badge>

                            {/* Password Reset — only for faculty/admin */}
                            {(role === "faculty" || role === "admin") && (
                              <div className="space-y-1.5 w-full sm:w-auto flex flex-col items-end">
                                <div className="flex gap-2">
                                  <Input 
                                    type="password"
                                    placeholder="New Password"
                                    className="h-7 text-xs w-[120px]"
                                    value={rs?.resetPassword || ""}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetState((prev: typeof resetState) => ({
                                      ...prev,
                                      [user.email]: { ...prev[user.email], resetPassword: e.target.value }
                                    }))}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={rs?.loading || !rs?.resetPassword || rs.resetPassword.length < 8}
                                    onClick={() => handleResetPassword(user.id, user.email)}
                                    className="gap-1.5 text-xs h-7 px-3"
                                  >
                                    {rs?.loading ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : rs?.success ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <ShieldCheck className="h-3 w-3" />
                                    )}
                                    {rs?.loading ? "Resetting…" : rs?.success ? "Reset!" : "Reset"}
                                  </Button>
                                </div>
                                {rs?.error && (
                                  <p className="text-[10px] text-rose-600">{rs.error}</p>
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

          {totalCount > pageSize && (
            <Pagination page={page} total={totalCount} pageSize={pageSize} />
          )}
        </div>
      )}
    </div>
  );
}
