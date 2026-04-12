"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/page-header";

export default function FacultySettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function validatePasswordStrengthClient(password: string): string | null {
    if (password.length < 8) return "Minimum 8 characters required";
    if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Must contain at least one number";
    return null;
  }

  const passwordStrengthMessage = newPassword ? validatePasswordStrengthClient(newPassword) : null;

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match");
      return;
    }

    const strengthError = validatePasswordStrengthClient(newPassword);
    if (strengthError) {
      setStatus("error");
      setMessage(strengthError);
      return;
    }

    setStatus("loading");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    setStatus("error");
    setMessage(data.error || "Failed to change password");
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="Account Settings"
        description="Manage your account details and password."
      />

      <section className="bg-card rounded-xl border border-border p-6 space-y-3">
        <h2 className="font-bold text-foreground">Account Info</h2>
        <p className="text-sm text-muted-foreground">Name: {session?.user?.name || "-"}</p>
        <p className="text-sm text-muted-foreground">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-muted-foreground capitalize">Role: <span className="font-semibold text-foreground">{session?.user?.role || "-"}</span></p>
      </section>

      <form onSubmit={handleChangePassword} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-bold text-foreground">Change Password</h2>

        {status === "success" && (
          <div className="bg-success/10 border border-success/20 rounded-md p-3 text-success text-sm">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm">
            {message}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="current-password"
            className="text-sm font-semibold text-foreground"
          >
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full bg-muted border border-border text-foreground rounded-md px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="text-sm font-semibold text-foreground"
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full bg-muted border border-border text-foreground rounded-md px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
        {passwordStrengthMessage ? (
          <p className="text-xs text-warning">{passwordStrengthMessage}</p>
        ) : newPassword ? (
          <p className="text-xs text-success">Strong password format looks good.</p>
        ) : null}
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="text-sm font-semibold text-foreground"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-muted border border-border text-foreground rounded-md px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Changing…
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </form>
    </div>
  );
}
