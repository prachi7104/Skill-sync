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
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account information.</p>
      </div>

      <section className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-2">
        <h2 className="font-bold text-white">Account Info</h2>
        <p className="text-sm text-slate-300">Email: {session?.user?.email || "-"}</p>
        <p className="text-sm text-indigo-300 capitalize">Role: {session?.user?.role || "-"}</p>
      </section>

      <form onSubmit={handleSave} className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 space-y-4">
        <h2 className="font-bold text-white">Display Name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name"
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          required
        />

        <p className="text-xs text-slate-500">
          Name edit persistence will be enabled in a later phase.
        </p>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
        >
          Save Name
        </button>

        {status === "saved" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm">
            Name updated in UI.
          </div>
        )}
      </form>
    </div>
  );
}
