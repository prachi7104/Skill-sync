"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/shared/use-confirm-dialog";

export function DriveActionButtons({ driveId, isActive }: { driveId: string; isActive: boolean }) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete this drive permanently?",
      description: "This cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/drives/${driveId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Delete failed");
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
    <>
      <div className="flex gap-2">
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          aria-label={isActive ? "Deactivate drive" : "Activate drive"}
          title={isActive ? "Deactivate drive" : "Activate drive"}
          className={`p-2 rounded-lg text-xs font-bold transition-all ${
            isActive
              ? "bg-warning/10 text-warning hover:bg-warning/20"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Permanently delete drive"
          title="Permanently delete drive"
          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      {ConfirmDialog}
    </>
  );
}
