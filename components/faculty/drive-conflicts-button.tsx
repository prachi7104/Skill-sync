"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

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
    const res = await fetch("/api/faculty/drives/conflicts");
    const json = await res.json();
    setConflicts(json.conflicts ?? []);
    setLoading(false);
  }

  return (
    <>
      <Button variant="outline" className="border-white/10 bg-slate-900/60 text-slate-100 hover:bg-slate-800" onClick={loadConflicts}>
        Check Conflicts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle>Drive Conflicts</DialogTitle>
            <DialogDescription>Detect overlapping eligible student pools within the next 7 days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {loading ? <p className="text-sm text-slate-400">Checking conflicts...</p> : null}
            {!loading && conflicts.length === 0 ? <p className="text-sm text-slate-400">No significant conflicts found.</p> : null}
            {!loading ? conflicts.map((conflict) => (
              <div key={`${conflict.drive1.id}-${conflict.drive2.id}`} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">{conflict.drive1.company} — {conflict.drive1.roleTitle}</p>
                    <p className="font-semibold text-white">{conflict.drive2.company} — {conflict.drive2.roleTitle}</p>
                    <p className="mt-2 text-sm text-amber-200">{conflict.overlapCount} students overlap ({conflict.overlapPercent}% of the eligible pool).</p>
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