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
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type ModerationRow = {
  id: string;
  company_name: string;
  role_title: string | null;
  student_name: string | null;
  student_email: string | null;
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
  const [loading, setLoading] = useState(true);

  async function loadRows() {
    setLoading(true);
    try {
      const queue = tab === "published" ? "published" : "pending";
      const res = await fetch(`/api/admin/experiences?queue=${queue}`);
      const json = await res.json();
      setRows(json.experiences ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Company Experiences</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate student submissions and post admin-curated experience reports.</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="queue">Pending Queue</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="admin-post">Admin Post</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState 
              message="No experiences in queue" 
              description="New student submissions will appear here for moderation."
            />
          ) : (
            rows.map((row) => (
              <div key={row.id} className={cn("space-y-4 rounded-md border p-6", row.status === "ai_flagged" ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card")}>
                {row.status === "ai_flagged" && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">AI flagged: {row.ai_screen_reason}</span>
                    <span className="ml-auto text-xs font-mono bg-amber-500/20 px-2 py-1 rounded">AI Score: {Math.round((Number(row.ai_screen_score) || 0) * 100)}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{row.student_name ?? "Unknown student"}</p>
                    <p className="text-xs text-muted-foreground">{row.student_email ?? "No email stored"}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Author: {row.author_real_name ?? "System"} {row.author_email ? `(${row.author_email})` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{row.company_name}</p>
                    <p className="text-xs text-muted-foreground">{row.role_title ?? "Unknown role"}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Created: {new Date(row.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                {row.interview_process && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Process</p>
                    <p className="line-clamp-4 text-sm text-muted-foreground leading-relaxed">{row.interview_process}</p>
                  </div>
                )}
                {row.tips && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tips</p>
                    <p className="line-clamp-4 text-sm text-muted-foreground leading-relaxed">{row.tips}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Rejection Reason (optional)</Label>
                  <Input 
                    value={rejectionReason[row.id] ?? ""} 
                    onChange={(event) => setRejectionReason((current) => ({ ...current, [row.id]: event.target.value }))} 
                    className="border-border bg-background text-foreground" 
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => moderate(row.id, "approve")} className="flex-1">✓ Approve & Publish</Button>
                  <Button variant="outline" onClick={() => moderate(row.id, "reject")} className="flex-1">✗ Reject</Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState 
              message="No published experiences" 
              description="Approved student and admin-posted experiences will be listed here."
            />
          ) : (
            rows.map((row) => (
              <Card key={row.id} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">{row.company_name} — {row.role_title ?? "Unknown role"}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{row.student_name ?? "Anonymous"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Author: {row.author_real_name ?? "System"} {row.author_email ? `(${row.author_email})` : ""}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground">Created: {new Date(row.created_at).toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-muted-foreground">Updated: {new Date(row.updated_at).toLocaleString("en-IN")}</p>
                  </div>
                  {row.reviewed_by_name && <p className="mt-2 text-[11px] text-emerald-600 font-medium">Reviewed by: {row.reviewed_by_name}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="admin-post">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Post on behalf of students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Company Name</Label><Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="border-border bg-background text-foreground" /></div>
                <div className="space-y-2"><Label>Role Title</Label><Input value={form.roleTitle} onChange={(event) => setForm((current) => ({ ...current, roleTitle: event.target.value }))} className="border-border bg-background text-foreground" /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Drive Type</Label><select value={form.driveType} onChange={(event) => setForm((current) => ({ ...current, driveType: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="placement">Placement</option><option value="internship">Internship</option><option value="ppo">PPO</option></select></div>
                <div className="space-y-2"><Label>Outcome</Label><select value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="selected">Selected</option><option value="rejected">Rejected</option><option value="not_disclosed">Prefer not to say</option></select></div>
                <div className="space-y-2"><Label>Difficulty</Label><Input type="number" min={1} max={5} value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: Number(event.target.value) }))} className="border-border bg-background text-foreground" /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Batch Year</Label><Input value={form.batchYear} onChange={(event) => setForm((current) => ({ ...current, batchYear: event.target.value }))} className="border-border bg-background text-foreground" /></div>
                <div className="space-y-2"><Label>Category</Label><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="">Unknown</option><option value="alpha">Alpha</option><option value="beta">Beta</option><option value="gamma">Gamma</option></select></div>
              </div>
              <div className="space-y-2"><Label>Interview Process</Label><Textarea rows={6} value={form.interviewProcess} onChange={(event) => setForm((current) => ({ ...current, interviewProcess: event.target.value }))} className="border-border bg-background text-foreground" /></div>
              <div className="space-y-2"><Label>Tips</Label><Textarea rows={5} value={form.tips} onChange={(event) => setForm((current) => ({ ...current, tips: event.target.value }))} className="border-border bg-background text-foreground" /></div>
              <Button onClick={createAdminPost} className="bg-primary hover:bg-primary">Publish Admin Experience</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}