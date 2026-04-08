"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ModerationRow = {
  id: string;
  company_name: string;
  role_title: string | null;
  student_name: string | null;
  student_email: string | null;
  is_admin_posted: boolean;
  interview_process: string | null;
  tips: string | null;
  status: string;
  ai_screen_score: number | null;
  ai_screen_reason: string | null;
  created_at: string;
  updated_at: string;
  author_real_name: string | null;
  author_email: string | null;
  reviewed_by_name: string | null;
};

export default function AdminExperiencesPage() {
  const [rows, setRows] = useState<ModerationRow[]>([]);
  const [tab, setTab] = useState("queue");
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ companyName: "", roleTitle: "", driveType: "placement", outcome: "not_disclosed", interviewProcess: "", tips: "", difficulty: 3, batchYear: "", category: "" });

  async function loadRows() {
    const queue = tab === "published" ? "published" : "pending";
    const res = await fetch(`/api/admin/experiences?queue=${queue}`);
    const json = await res.json();
    setRows(json.experiences ?? []);
  }

  useEffect(() => {
    if (tab === "queue" || tab === "published") {
      loadRows().catch(() => undefined);
    }
  }, [tab]);

  async function moderate(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/experiences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectionReason: rejectionReason[id] ?? "" }),
    });
    if (!res.ok) {
      toast.error("Moderation update failed");
      return;
    }
    toast.success(action === "approve" ? "Experience published" : "Experience rejected");
    loadRows().catch(() => undefined);
  }

  async function createAdminPost() {
    const res = await fetch("/api/admin/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        batchYear: form.batchYear ? Number(form.batchYear) : null,
        category: form.category || null,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create admin post");
      return;
    }
    toast.success("Admin-posted experience published");
    setForm({ companyName: "", roleTitle: "", driveType: "placement", outcome: "not_disclosed", interviewProcess: "", tips: "", difficulty: 3, batchYear: "", category: "" });
    setTab("published");
    loadRows().catch(() => undefined);
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Company Experiences</h1>
        <p className="mt-1 text-sm text-slate-400">Moderate student submissions and post admin-curated experience reports.</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-900/60">
          <TabsTrigger value="queue">Pending Queue</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="admin-post">Admin Post</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className={cn("space-y-4 rounded-2xl border p-6", row.status === "ai_flagged" ? "border-amber-500/30 bg-amber-500/5" : "border-white/5 bg-slate-900/60")}>
              {row.status === "ai_flagged" ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-300">AI flagged: {row.ai_screen_reason}</span>
                  <span className="ml-auto text-xs text-amber-400">AI Score: {Math.round((Number(row.ai_screen_score) || 0) * 100)}%</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{row.student_name ?? "Unknown student"}</p>
                  <p className="text-xs text-slate-400">{row.student_email ?? "No email stored"}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Author: {row.author_real_name ?? "System"} {row.author_email ? `(${row.author_email})` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{row.company_name}</p>
                  <p className="text-xs text-slate-400">{row.role_title ?? "Unknown role"}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Created: {new Date(row.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              {row.interview_process ? <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Interview Process</p><p className="line-clamp-4 text-sm text-slate-300">{row.interview_process}</p></div> : null}
              {row.tips ? <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Tips</p><p className="line-clamp-4 text-sm text-slate-300">{row.tips}</p></div> : null}
              <div className="space-y-2">
                <Label>Rejection Reason (optional)</Label>
                <Input value={rejectionReason[row.id] ?? ""} onChange={(event) => setRejectionReason((current) => ({ ...current, [row.id]: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => moderate(row.id, "approve")} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-500">✓ Approve & Publish</button>
                <button type="button" onClick={() => moderate(row.id, "reject")} className="flex-1 rounded-xl bg-slate-700 py-2 text-sm font-bold text-white hover:bg-slate-600">✗ Reject</button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">No experiences in the moderation queue.</div> : null}
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          {rows.map((row) => (
            <Card key={row.id} className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-white">{row.company_name} — {row.role_title ?? "Unknown role"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <p>{row.is_admin_posted ? "Admin Posted" : row.student_name ?? "Anonymous"}</p>
                  {row.is_admin_posted ? (
                    <span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                      Admin Posted
                    </span>
                  ) : null}
                </div>
                {!row.is_admin_posted && row.student_email ? (
                  <p className="mt-1 text-xs text-slate-500">{row.student_email}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">Author: {row.author_real_name ?? "System"} {row.author_email ? `(${row.author_email})` : ""}</p>
                <p className="mt-1 text-xs text-slate-500">Created: {new Date(row.created_at).toLocaleString("en-IN")}</p>
                <p className="mt-1 text-xs text-slate-500">Updated: {new Date(row.updated_at).toLocaleString("en-IN")}</p>
                {row.reviewed_by_name ? <p className="mt-1 text-xs text-slate-500">Reviewed by: {row.reviewed_by_name}</p> : null}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="admin-post">
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white">Post on behalf of students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Company Name</Label><Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
                <div className="space-y-2"><Label>Role Title</Label><Input value={form.roleTitle} onChange={(event) => setForm((current) => ({ ...current, roleTitle: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Drive Type</Label><select value={form.driveType} onChange={(event) => setForm((current) => ({ ...current, driveType: event.target.value }))} className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-slate-100"><option value="placement">Placement</option><option value="internship">Internship</option><option value="ppo">PPO</option></select></div>
                <div className="space-y-2"><Label>Outcome</Label><select value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-slate-100"><option value="selected">Selected</option><option value="rejected">Rejected</option><option value="not_disclosed">Prefer not to say</option></select></div>
                <div className="space-y-2"><Label>Difficulty</Label><Input type="number" min={1} max={5} value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: Number(event.target.value) }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Batch Year</Label><Input value={form.batchYear} onChange={(event) => setForm((current) => ({ ...current, batchYear: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
                <div className="space-y-2"><Label>Category</Label><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-slate-100"><option value="">Unknown</option><option value="alpha">Alpha</option><option value="beta">Beta</option><option value="gamma">Gamma</option></select></div>
              </div>
              <div className="space-y-2"><Label>Interview Process</Label><Textarea rows={6} value={form.interviewProcess} onChange={(event) => setForm((current) => ({ ...current, interviewProcess: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
              <div className="space-y-2"><Label>Tips</Label><Textarea rows={5} value={form.tips} onChange={(event) => setForm((current) => ({ ...current, tips: event.target.value }))} className="border-white/10 bg-slate-950 text-slate-100" /></div>
              <Button onClick={createAdminPost} className="bg-indigo-600 hover:bg-indigo-500">Publish Admin Experience</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}