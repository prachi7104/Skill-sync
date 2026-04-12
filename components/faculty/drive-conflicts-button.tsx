"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { safeFetch } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Conflict = {
  drive1: { id: string; company: string; roleTitle: string };
  drive2: { id: string; company: string; roleTitle: string };
  overlapPercent: number;
  overlapCount: number;
};

export function DriveConflictsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  async function loadConflicts() {
    setLoading(true);
    setOpen(true);
    const { data, error } = await safeFetch<{ conflicts: Conflict[] }>(
      "/api/faculty/drives/conflicts"
    );
    if (error) {
      toast.error(error);
      setConflicts([]);
    } else {
      setConflicts(data?.conflicts ?? []);
    }
    setLoading(false);
  }

  return (
    <>
      <Button variant="outline" className="border-border bg-background text-foreground hover:bg-muted/40" onClick={loadConflicts}>
        Check Conflicts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Drive Conflicts</DialogTitle>
            <DialogDescription>Detect overlapping eligible student pools within the next 7 days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Checking conflicts...</p> : null}
            {!loading && conflicts.length === 0 ? <p className="text-sm text-muted-foreground">No significant conflicts found.</p> : null}
            {!loading ? conflicts.map((conflict) => (
              <div key={`${conflict.drive1.id}-${conflict.drive2.id}`} className="rounded-md border border-warning/20 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                  <div>
                    <p className="font-semibold text-foreground">{conflict.drive1.company} — {conflict.drive1.roleTitle}</p>
                    <p className="font-semibold text-foreground">{conflict.drive2.company} — {conflict.drive2.roleTitle}</p>
                    <p className="mt-2 text-sm text-warning">{conflict.overlapCount} students overlap ({conflict.overlapPercent}% of the eligible pool).</p>
                  </div>
                </div>
              </div>
            )) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}