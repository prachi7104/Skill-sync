"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type SeasonRow = {
  id: string;
  name: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

function toIsoDate(dateInput: string): string | null {
  if (!dateInput) return null;
  return new Date(`${dateInput}T00:00:00.000Z`).toISOString();
}

export default function AdminSeasonsPage() {
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadRows() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seasons", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message ?? "Failed to load seasons");
        return;
      }
      setRows((json.seasons ?? []) as SeasonRow[]);
    } catch {
      setMessage("Failed to load seasons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function createSeason() {
    if (!name.trim()) {
      setMessage("Season name is required");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          startsAt: toIsoDate(startsAt),
          endsAt: toIsoDate(endsAt),
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message ?? "Failed to create season");
        return;
      }

      setName("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(true);
      setMessage("Season created");
      await loadRows();
    } catch {
      setMessage("Failed to create season");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSeason(row: SeasonRow, nextActive: boolean) {
    setMessage(null);
    const res = await fetch(`/api/admin/seasons/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.message ?? "Failed to update season");
      return;
    }

    setMessage(nextActive ? "Season activated" : "Season deactivated");
    await loadRows();
  }

  async function deleteSeason(row: SeasonRow) {
    const confirmed = window.confirm(`Delete season \"${row.name}\"?`);
    if (!confirmed) return;

    setMessage(null);
    const res = await fetch(`/api/admin/seasons/${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.message ?? "Failed to delete season");
      return;
    }

    setMessage("Season deleted");
    await loadRows();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Season Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create recruiting seasons and control which one is active for your college.</p>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-card p-3 text-sm text-foreground">
          {message}
        </div>
      ) : null}

      <section className="rounded-md border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Create Season</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Placement 2026" className="border-border bg-background text-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Starts At</Label>
            <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="border-border bg-background text-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Ends At</Label>
            <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="border-border bg-background text-foreground" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4"
          />
          Set as active season
        </label>
        <Button onClick={createSeason} disabled={saving} className="bg-primary hover:bg-primary">
          {saving ? "Creating..." : "Create Season"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Existing Seasons</h2>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState 
            message="No seasons created yet" 
            description="Create your first academic or recruitment season to start managing drives."
          />
        ) : null}
        {!loading ? rows.map((row) => (
          <article key={row.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{row.name}</h3>
                  {row.isActive ? <Badge className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">ACTIVE</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "No start date"}
                  {" - "}
                  {row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "No end date"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.isActive ? (
                  <Button variant="outline" className="border-border bg-background text-foreground hover:bg-secondary" onClick={() => toggleSeason(row, false)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button className="bg-primary hover:bg-primary" onClick={() => toggleSeason(row, true)}>
                    Activate
                  </Button>
                )}
                {!row.isActive ? (
                  <Button variant="outline" className="border-rose-500/40 bg-rose-900/20 text-rose-300 hover:bg-rose-900/30" onClick={() => deleteSeason(row)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        )) : null}
      </section>
    </div>
  );
}
