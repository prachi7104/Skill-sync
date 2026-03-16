"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCategoryLabel, SOFTSKILLS_RESOURCE_CATEGORIES, TECHNICAL_RESOURCE_CATEGORIES } from "@/lib/phase8-10";
import { stripMarkdown } from "@/lib/content-utils";
import { cn } from "@/lib/utils";

const CATEGORY_MAP = {
  technical: TECHNICAL_RESOURCE_CATEGORIES,
  softskills: SOFTSKILLS_RESOURCE_CATEGORIES,
} as const;

type ResourceRow = {
  id: string;
  section: "technical" | "softskills";
  category: string;
  title: string;
  body: string | null;
  body_format: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size_kb: number | null;
  tags: string[];
  company_name: string | null;
  status?: "draft" | "published" | "archived";
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
};

export default function ResourceLibrary() {
  const [section, setSection] = useState<"technical" | "softskills">("technical");
  const [category, setCategory] = useState<string>(TECHNICAL_RESOURCE_CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [viewerRole, setViewerRole] = useState<"student" | "faculty" | "admin" | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    tags: "",
    companyName: "",
    status: "published" as "draft" | "published",
    file: null as File | null,
  });

  useEffect(() => {
    setCategory(CATEGORY_MAP[section][0]);
  }, [section]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ section, category });
      if (search) params.set("q", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/resources?${params.toString()}`);
      const json = await res.json();
      setResources(json.resources ?? []);
      setCanCreate(Boolean(json.canCreate));
      setViewerRole((json.viewerRole ?? null) as "student" | "faculty" | "admin" | null);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [category, search, section, statusFilter]);

  async function openResource(resource: ResourceRow) {
    setSelected(resource);
    await fetch(`/api/resources/${resource.id}/view`, { method: "POST" }).catch(() => undefined);
    setResources((current) => current.map((item) => item.id === resource.id ? { ...item, view_count: item.view_count + 1 } : item));
  }

  async function createResource() {
    setSubmitting(true);
    const body = new FormData();
    body.append("section", section);
    body.append("category", category);
    body.append("title", form.title);
    body.append("body", form.body);
    body.append("bodyFormat", "markdown");
    body.append("tags", form.tags);
    body.append("companyName", form.companyName);
    body.append("status", form.status);
    if (form.file) body.append("file", form.file);

    const res = await fetch("/api/resources", { method: "POST", body });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to create resource");
      return;
    }

    toast.success(form.status === "draft" ? "Resource saved as draft" : "Resource created");
    setCreateOpen(false);
    setForm({ title: "", body: "", tags: "", companyName: "", status: "published", file: null });
    const refresh = await fetch(`/api/resources?section=${section}&category=${category}`);
    const refreshed = await refresh.json();
    setResources(refreshed.resources ?? []);
  }

  const sideCategories = useMemo(() => CATEGORY_MAP[section], [section]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Resource Library</h1>
          <p className="mt-1 text-sm text-slate-400">Browse technical and soft-skills content curated for your college.</p>
        </div>
        {canCreate ? <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-500"><Plus className="h-4 w-4" /> New Resource</Button> : null}
      </div>

      <Tabs value={section} onValueChange={(value) => setSection(value as "technical" | "softskills")}>
        <TabsList className="bg-slate-900/60 text-slate-300">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="softskills">Soft Skills</TabsTrigger>
        </TabsList>
        <TabsContent value={section}>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="border-white/10 bg-slate-950 text-slate-100" />
              {(viewerRole === "faculty" || viewerRole === "admin") ? (
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "published", "draft", "archived"] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setStatusFilter(statusKey)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-semibold",
                        statusFilter === statusKey
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-950 text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      {statusKey === "all" ? "All" : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                {sideCategories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={cn("w-full rounded-xl px-4 py-3 text-left text-sm font-semibold", category === item ? "bg-indigo-600 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800")}>{formatCategoryLabel(item)}</button>
                ))}
              </div>
            </aside>

            <div className="space-y-4">
              {loading ? <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">Loading resources...</div> : null}
              {!loading && resources.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">No resources found for this category yet.</div> : null}
              {!loading ? resources.map((resource) => (
                <article key={resource.id} className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 transition-all hover:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className="border border-white/10 bg-slate-800 text-slate-200">{formatCategoryLabel(resource.category)}</Badge>
                        {resource.status && resource.status !== "published" ? (
                          <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-300">
                            {resource.status.toUpperCase()}
                          </Badge>
                        ) : null}
                        {resource.attachment_url ? <Upload className="h-3.5 w-3.5 text-slate-400" /> : null}
                      </div>
                      <h3 className="text-sm font-bold leading-tight text-white">{resource.title}</h3>
                      {resource.body ? <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{stripMarkdown(resource.body)}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {resource.attachment_url ? (
                        <a href={resource.attachment_url} target="_blank" className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600/30">
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      ) : null}
                      <Button variant="outline" className="border-white/10 bg-slate-950 text-slate-200 hover:bg-slate-800" onClick={() => openResource(resource)}>
                        Open
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
                    <span className="text-xs text-slate-500">By {resource.author_name}</span>
                    <span className="text-xs text-slate-600">{new Date(resource.created_at).toLocaleDateString()}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><Eye className="h-3 w-3" /> {resource.view_count}</span>
                  </div>
                </article>
              )) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950 text-slate-100">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{formatCategoryLabel(selected.category)} • {selected.author_name}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto space-y-4">
                {selected.body ? <MarkdownRenderer content={selected.body} /> : null}
                {selected.attachment_url ? <a href={selected.attachment_url} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Download attachment</a> : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>Post a new {section === "technical" ? "technical" : "soft skills"} resource for your college.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="border-white/10 bg-slate-900 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="border-white/10 bg-slate-900 text-slate-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea rows={10} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="border-white/10 bg-slate-900 text-slate-100" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="comma,separated,tags" className="border-white/10 bg-slate-900 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Attachment</Label>
                <Input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} className="border-white/10 bg-slate-900 text-slate-100" />
              </div>
            </div>
            {viewerRole === "faculty" ? (
              <div className="space-y-2">
                <Label>Publish Status</Label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))}
                  className="h-10 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-100"
                >
                  <option value="published">Publish now</option>
                  <option value="draft">Save as draft</option>
                </select>
              </div>
            ) : null}
            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <Label>Preview</Label>
              {form.body ? <MarkdownRenderer content={form.body} /> : <p className="text-sm text-slate-400">Markdown preview will appear here.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 bg-slate-900 text-slate-100" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createResource} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500">{submitting ? "Creating..." : "Create Resource"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}