"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/page-header";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/components/shared/use-confirm-dialog";

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
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadRows() {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/seasons", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message ?? "Failed to load seasons");
        return;
      }
      setRows((json.seasons ?? []) as SeasonRow[]);
    } catch {
      setErrorMsg("Failed to load seasons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function createSeason() {
    if (!name.trim()) {
      setErrorMsg("Season name is required");
      setSuccessMsg(null);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
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
        setErrorMsg(json.message ?? "Failed to create season");
        return;
      }

      setName("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(true);
      setSuccessMsg("Season created");
      await loadRows();
    } catch {
      setErrorMsg("Failed to create season");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSeason(row: SeasonRow, nextActive: boolean) {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await fetch(`/api/admin/seasons/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json.message ?? "Failed to update season");
      return;
    }

    setSuccessMsg(nextActive ? "Season activated" : "Season deactivated");
    await loadRows();
  }

  async function deleteSeason(row: SeasonRow) {
    const confirmed = await confirm({
      title: `Delete season "${row.name}"?`,
      description: "This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await fetch(`/api/admin/seasons/${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json.message ?? "Failed to delete season");
      return;
    }

    setSuccessMsg("Season deleted");
    await loadRows();
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
            <PageHeader
        eyebrow="Admin"
        title="Season Management"
        description="Create recruiting seasons and control which one is active for your college."
        
      />

      {errorMsg && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
          {successMsg}
        </div>
      )}

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Create Season</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Placement 2026" className="border-border bg-muted/20 text-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Starts At</Label>
            <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="border-border bg-muted/20 text-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Ends At</Label>
            <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="border-border bg-muted/20 text-foreground" />
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
        <Button onClick={createSeason} disabled={saving} className="bg-primary hover:bg-primary/90">
          {saving ? "Creating..." : "Create Season"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Existing Seasons</h2>
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Loading seasons...</div>
        ) : null}
        {!loading && rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No seasons created yet.</div>
        ) : null}
        {!loading ? rows.map((row) => (
          <article key={row.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{row.name}</h3>
                  {row.isActive ? <Badge className="bg-success/10 text-success border border-success/20">ACTIVE</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "No start date"}
                  {" - "}
                  {row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "No end date"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.isActive ? (
                  <Button variant="outline" className="border-border bg-muted/20 text-foreground hover:bg-muted" onClick={() => toggleSeason(row, false)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => toggleSeason(row, true)}>
                    Activate
                  </Button>
                )}
                {!row.isActive ? (
                  <Button variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15" onClick={() => deleteSeason(row)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        )) : null}
      </section>
      {ConfirmDialog}
    </div>
  );
}
