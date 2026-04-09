"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match");
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and security settings.</p>
      </div>

      <section className="bg-card rounded-md border border-border p-6 space-y-3">
        <h2 className="font-bold text-foreground">Account Info</h2>
        <p className="text-sm text-muted-foreground">Name: {session?.user?.name || "-"}</p>
        <p className="text-sm text-muted-foreground">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-destructive capitalize">Role: {session?.user?.role || "-"}</p>
      </section>

      <form onSubmit={handleChangePassword} className="bg-card rounded-md border border-border p-6 space-y-4">
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

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full bg-card border border-border text-foreground rounded-md px-4 py-3 text-sm focus:outline-none focus:border-destructive/20"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full bg-card border border-border text-foreground rounded-md px-4 py-3 text-sm focus:outline-none focus:border-destructive/20"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-card border border-border text-foreground rounded-md px-4 py-3 text-sm focus:outline-none focus:border-destructive/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-destructive/10 hover:bg-destructive/10 disabled:bg-card text-foreground font-bold py-3 rounded-md text-sm transition-all"
        >
          {status === "loading" ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
