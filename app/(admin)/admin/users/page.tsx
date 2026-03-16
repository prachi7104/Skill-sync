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
  Settings2,
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

// ── Component permission definitions ────────────────────────────────────────
const COMPONENTS: Array<{ key: string; label: string; desc: string; locked?: boolean }> = [
  { key: "drive_management",         label: "Drive Management",         desc: "Create, edit, and manage placement drives" },
  { key: "amcat_management",         label: "AMCAT Management",         desc: "Upload and publish AMCAT results" },
  { key: "technical_content",        label: "Technical Content",        desc: "Post technical resources and questions" },
  { key: "softskills_content",       label: "Soft Skills Content",      desc: "Post communication and aptitude content" },
  { key: "company_experiences",      label: "Company Experiences",      desc: "Post and moderate company reviews" },
  { key: "student_feedback_posting", label: "Student Feedback Posting", desc: "Post anonymous feedback from forms" },
  { key: "student_management",       label: "Student Management",       desc: "View and manage student profiles" },
  { key: "analytics_view",           label: "Analytics View",           desc: "Access placement analytics reports" },
  { key: "sandbox_access",           label: "Sandbox Access",           desc: "Always granted", locked: true },
];

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

  // Create staff form state
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

  // Extended creation fields
  const [newRole, setNewRole] = useState<"faculty" | "admin">("faculty");
  const [newDepartment, setNewDepartment] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newGrantedComponents, setNewGrantedComponents] = useState<string[]>([]);

  // Edit permissions state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editComponents, setEditComponents] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

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

  function toggleNewComponent(key: string) {
    setNewGrantedComponents((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }

  async function handleCreateStaff(e: React.FormEvent) {
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
          role: newRole,
          password: autoGeneratePassword ? undefined : newPassword,
          department: newDepartment.trim() || undefined,
          designation: newDesignation.trim() || undefined,
          grantedComponents: newRole === "admin" ? [] : newGrantedComponents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create staff account");
      } else {
        setCreateSuccess(`Account created for ${data.data?.email || newEmail.trim()}`);
        if (typeof data.generatedPassword === "string" && data.generatedPassword.length > 0) {
          setGeneratedPassword(data.generatedPassword);
          setShowGeneratedPasswordModal(true);
          setCopied(false);
        }
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewDepartment("");
        setNewDesignation("");
        setNewGrantedComponents([]);
        setNewRole("faculty");
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

  async function handleOpenEditPermissions(user: User) {
    setEditUser(user);
    setEditError(null);
    setEditSuccess(false);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${user.id}/permissions`);
      if (res.ok) {
        const data = await res.json();
        setEditComponents(data.data?.granted_components ?? []);
      } else {
        setEditComponents([]);
      }
    } catch {
      setEditComponents([]);
    } finally {
      setEditLoading(false);
    }
  }

  function toggleEditComponent(key: string) {
    setEditComponents((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }

  async function handleSavePermissions() {
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const res = await fetch(`/api/admin/staff/${editUser.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantedComponents: editComponents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Failed to update permissions");
      } else {
        setEditSuccess(true);
        setEditComponents(data.grantedComponents ?? editComponents);
        setTimeout(() => setEditUser(null), 1200);
      }
    } catch {
      setEditError("Network error");
    } finally {
      setEditLoading(false);
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
        setTimeout(() => {
          setResetState((prev: typeof resetState) => ({
            ...prev,
            [email]: { ...prev[email], success: false },
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
          <p className="text-sm text-muted-foreground mt-1">{totalCount} total users</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Create Staff Account Card */}
      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Create Staff Account
          </CardTitle>
          <CardDescription>
            Creates a new faculty or admin account. Component permissions control which features the user can access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStaff} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <div className="flex gap-4">
                {(["faculty", "admin"] as const).map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="newRole"
                      value={r}
                      checked={newRole === r}
                      onChange={() => { setNewRole(r); setNewGrantedComponents([]); }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{r === "faculty" ? "Faculty" : "Admin (Co-Admin)"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Core identity fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fac-name">Full Name</Label>
                <Input id="fac-name" placeholder="Dr. Priya Sharma" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fac-email">Email Address</Label>
                <Input id="fac-email" type="email" placeholder="faculty@upes.ac.in" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fac-dept">Department <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="fac-dept" placeholder="Computer Science" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fac-desig">Designation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="fac-desig" placeholder="Placement Coordinator" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="fac-password">Password</Label>
              <Input
                id="fac-password"
                type="password"
                placeholder={autoGeneratePassword ? "Auto-generated strong password" : "Min 8 chars, 1 uppercase, 1 number"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={autoGeneratePassword}
              />
              <div className="flex items-center gap-2 pt-1">
                <input id="auto-gen-pw" type="checkbox" checked={autoGeneratePassword} onChange={(e) => setAutoGeneratePassword(e.target.checked)} className="h-4 w-4 rounded" />
                <Label htmlFor="auto-gen-pw" className="text-xs text-muted-foreground cursor-pointer">Auto-generate password</Label>
              </div>
            </div>

            {/* Component permissions grid — faculty only */}
            {newRole === "faculty" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Component Permissions</Label>
                <p className="text-xs text-muted-foreground">Select which features this faculty member can access.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {COMPONENTS.map(({ key, label, desc, locked }) => (
                    <label
                      key={key}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors",
                        locked ? "opacity-60 cursor-not-allowed bg-muted" : "hover:bg-muted/50",
                        (locked || newGrantedComponents.includes(key)) ? "border-indigo-300 bg-indigo-50/40" : ""
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={locked || newGrantedComponents.includes(key)}
                        disabled={!!locked}
                        onChange={() => !locked && toggleNewComponent(key)}
                        className="h-4 w-4 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={creating || !newName.trim() || !newEmail.trim() || (!autoGeneratePassword && newPassword.length < 8)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {creating ? "Creating..." : `Create ${newRole === "admin" ? "Admin" : "Faculty"}`}
            </Button>
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

      {/* Generated Password Modal */}
      <Dialog open={showGeneratedPasswordModal} onOpenChange={setShowGeneratedPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generated Password</DialogTitle>
            <DialogDescription>
              This password is shown <strong>ONCE</strong>. Copy it now and send to the user securely.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-slate-950 text-slate-100 px-4 py-3 my-2">
            <p className="font-mono text-sm break-all">{generatedPassword || "—"}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowGeneratedPasswordModal(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleCopyGeneratedPassword} className="gap-2">
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy to clipboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Permissions — {editUser?.name}</DialogTitle>
            <DialogDescription>
              Select which features this faculty member can access. Sandbox Access is always granted.
            </DialogDescription>
          </DialogHeader>
          {editLoading && !editComponents.length ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading permissions…</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 py-2">
              {COMPONENTS.map(({ key, label, desc, locked }) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors",
                    locked ? "opacity-60 cursor-not-allowed bg-muted" : "hover:bg-muted/50",
                    (locked || editComponents.includes(key)) ? "border-indigo-300 bg-indigo-50/40" : ""
                  )}
                >
                  <input
                    type="checkbox"
                    checked={locked || editComponents.includes(key)}
                    disabled={!!locked}
                    onChange={() => !locked && toggleEditComponent(key)}
                    className="h-4 w-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {editError && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {editError}
            </div>
          )}
          {editSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> Permissions saved!
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleSavePermissions} disabled={editLoading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {editLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editLoading ? "Saving…" : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setResetState((prev: typeof resetState) => ({
                                        ...prev,
                                        [user.email]: { ...prev[user.email], resetPassword: e.target.value },
                                      }))
                                    }
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
                                {rs?.error && <p className="text-[10px] text-rose-600">{rs.error}</p>}
                              </div>
                            )}

                            {/* Edit Permissions — faculty only */}
                            {role === "faculty" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs h-7 px-3"
                                onClick={() => handleOpenEditPermissions(user)}
                              >
                                <Settings2 className="h-3 w-3" />
                                Edit Permissions
                              </Button>
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
