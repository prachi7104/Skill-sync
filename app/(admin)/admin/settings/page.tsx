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
        <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and security settings.</p>
      </div>

      <section className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-3">
        <h2 className="font-bold text-white">Account Info</h2>
        <p className="text-sm text-slate-300">Name: {session?.user?.name || "-"}</p>
        <p className="text-sm text-slate-300">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-rose-300 capitalize">Role: {session?.user?.role || "-"}</p>
      </section>

      <form onSubmit={handleChangePassword} className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-4">
        <h2 className="font-bold text-white">Change Password</h2>

        {status === "success" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-sm">
            {message}
          </div>
        )}

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
        >
          {status === "loading" ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
