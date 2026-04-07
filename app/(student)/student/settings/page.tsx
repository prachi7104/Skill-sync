"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function StudentSettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  function handleSave(e: FormEvent) {
    e.preventDefault();
    // Name editing UI only in this phase. Persistence is intentionally deferred.
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information.</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Account Info</h2>
        <div className="p-4 bg-card border border-border rounded-md space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email</p>
            <p className="text-sm text-foreground font-medium mt-0.5">{session?.user?.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Role</p>
            <p className="text-sm text-foreground font-medium capitalize mt-0.5">{session?.user?.role || "-"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">Profile Preferences</h2>
        
        <form onSubmit={handleSave} className="p-4 bg-card border border-border rounded-md space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your display name"
              required
            />
            <p className="text-xs text-muted-foreground">
              Name edit persistence will be enabled in a later phase.
            </p>
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Save Name
          </Button>

          {status === "saved" && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              Name updated in UI.
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
