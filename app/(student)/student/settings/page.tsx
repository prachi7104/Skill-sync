"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";

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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account information.</p>
      </div>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-bold text-foreground">Account Info</h2>
        <p className="text-sm text-muted-foreground">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-primary capitalize">Role: {session?.user?.role || "-"}</p>
      </section>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-bold text-foreground">Display Name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30"
          required
        />

        <p className="text-xs text-muted-foreground">
          Name edit persistence will be enabled in a later phase.
        </p>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Save Name
        </button>

        {status === "saved" && (
          <div className="rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success">
            Name updated in UI.
          </div>
        )}
      </form>
    </div>
  );
}
