"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and security settings.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="rounded-md border border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-lg">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-sm">
            <p className="text-foreground"><span className="text-muted-foreground">Name:</span> {session?.user?.name || "-"}</p>
            <p className="text-foreground"><span className="text-muted-foreground">Email:</span> {session?.user?.email || "-"}</p>
            <p className="font-semibold capitalize text-primary text-xs tracking-wider uppercase mt-2 pt-2 border-t">Role: {session?.user?.role || "-"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border shadow-sm">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-lg">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {status === "success" && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-emerald-600 text-sm">
                  {message}
                </div>
              )}
              {status === "error" && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-3 text-rose-600 text-sm">
                  {message}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full"
              >
                {status === "loading" ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
