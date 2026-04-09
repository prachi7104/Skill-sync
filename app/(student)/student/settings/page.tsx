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
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information.</p>
      </div>

      <section className="bg-card rounded-md border border-border p-6 space-y-2">
        <h2 className="font-bold text-foreground">Account Info</h2>
        <p className="text-sm text-muted-foreground">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-primary capitalize">Role: {session?.user?.role || "-"}</p>
      </section>

      <form onSubmit={handleSave} className="bg-card rounded-md border border-border p-6 space-y-4">
        <h2 className="font-bold text-foreground">Display Name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name"
          className="w-full bg-muted/50 border border-border text-foreground rounded-md px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          required
        />

        <p className="text-xs text-muted-foreground">
          Name edit persistence will be enabled in a later phase.
        </p>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary text-foreground font-bold py-3 rounded-md text-sm transition-all"
        >
          Save Name
        </button>

        {status === "saved" && (
          <div className="bg-success/10 border border-success/20 rounded-md p-3 text-success text-sm">
            Name updated in UI.
          </div>
        )}
      </form>
    </div>
  );
}
