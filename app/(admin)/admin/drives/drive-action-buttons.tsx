"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power, Loader2 } from "lucide-react";

export function DriveActionButtons({ driveId, isActive }: { driveId: string; isActive: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to PERMANENTLY delete this drive? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/drives/${driveId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        alert(`Delete failed: ${d.error}`);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive() {
    setToggling(true);
    try {
      const res = await fetch(`/api/drives/${driveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggleActive}
        disabled={toggling}
        title={isActive ? "Deactivate drive" : "Activate drive"}
        className={`p-2 rounded-lg text-xs font-bold transition-all ${
          isActive
            ? "bg-warning/10 text-warning hover:bg-warning/10"
            : "bg-card text-muted-foreground hover:bg-card"
        }`}
      >
        {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Permanently delete drive"
        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/10 transition-all"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
