"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { formatCategoryLabel, SOFTSKILLS_RESOURCE_CATEGORIES, TECHNICAL_RESOURCE_CATEGORIES } from "@/lib/phase8-10";
import { stripMarkdown } from "@/lib/content-utils";
import { cn } from "@/lib/utils";

const CATEGORY_MAP = {
  technical: TECHNICAL_RESOURCE_CATEGORIES,
  softskills: SOFTSKILLS_RESOURCE_CATEGORIES,
} as const;

type ResourceRow = {
  id: string;
  author_id: string;
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

type CreateResourceForm = {
  category: string;
  title: string;
  body: string;
  tags: string;
  companyName: string;
  status: "draft" | "published";
  file: File | null;
};

type EditResourceForm = {
  section: "technical" | "softskills";
  category: string;
  title: string;
  body: string;
  tags: string;
  companyName: string;
  status: "draft" | "published" | "archived";
};

export default function ResourceLibrary() {
  const [section, setSection] = useState<"technical" | "softskills">("technical");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [viewerRole, setViewerRole] = useState<"student" | "faculty" | "admin" | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState<CreateResourceForm>({
    category: TECHNICAL_RESOURCE_CATEGORIES[0],
    title: "",
    body: "",
    tags: "",
    companyName: "",
    status: "published" as "draft" | "published",
    file: null as File | null,
  });
  const [editForm, setEditForm] = useState<EditResourceForm>({
    section: "technical" as "technical" | "softskills",
    category: TECHNICAL_RESOURCE_CATEGORIES[0],
    title: "",
    body: "",
    tags: "",
    companyName: "",
    status: "published" as "draft" | "published" | "archived",
  });

  useEffect(() => {
    setCategory("all");
    setForm((current) => ({
      ...current,
      category: CATEGORY_MAP[section][0],
    }));
  }, [section]);

  async function refreshCurrentList(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({ section });
      if (category !== "all") params.set("category", category);
      if (search) params.set("q", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/resources?${params.toString()}`);
      const json = await res.json();

      setResources(json.resources ?? []);
      setCanCreate(Boolean(json.canCreate));
      setViewerRole((json.viewerRole ?? null) as "student" | "faculty" | "admin" | null);
      setViewerId((json.viewerId as string | null) ?? null);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    refreshCurrentList(true).catch(() => setLoading(false));
  }, [category, search, section, statusFilter]);

  async function openResource(resource: ResourceRow) {
    setSelected(resource);
    await fetch(`/api/resources/${resource.id}/view`, { method: "POST" }).catch(() => undefined);
    setResources((current) => current.map((item) => item.id === resource.id ? { ...item, view_count: item.view_count + 1 } : item));
  }

  async function createResource() {
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("section", section);
      body.append("category", form.category);
      body.append("title", form.title);
      body.append("body", form.body);
      body.append("bodyFormat", "markdown");
      body.append("tags", form.tags);
      body.append("companyName", form.companyName);
      body.append("status", form.status);
      if (form.file) body.append("file", form.file);

      const res = await fetch("/api/resources", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to create resource");
        return;
      }

      toast.success(form.status === "draft" ? "Resource saved as draft" : "Resource created");
      setCreateOpen(false);
      setForm({
        category: CATEGORY_MAP[section][0],
        title: "",
        body: "",
        tags: "",
        companyName: "",
        status: "published",
        file: null,
      });
      await refreshCurrentList();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(resource: ResourceRow) {
    setEditing(resource);
    setEditForm({
      section: resource.section,
      category: resource.category,
      title: resource.title,
      body: resource.body ?? "",
      tags: (resource.tags ?? []).join(","),
      companyName: resource.company_name ?? "",
      status: resource.status ?? "published",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/resources/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: editForm.section,
          category: editForm.category,
          title: editForm.title,
          body: editForm.body || null,
          bodyFormat: "markdown",
          tags: editForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          companyName: editForm.companyName || null,
          status: editForm.status,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update resource");
        return;
      }

      toast.success("Resource updated");
      setEditOpen(false);
      setEditing(null);
      await refreshCurrentList();
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteResource(resource: ResourceRow) {
    const confirmed = window.confirm("Delete this resource permanently?");
    if (!confirmed) return;

    const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to delete resource");
      return;
    }

    toast.success("Resource deleted");
    await refreshCurrentList();
  }

  function canManageResource(resource: ResourceRow) {
    if (viewerRole === "admin") return true;
    if (viewerRole !== "faculty") return false;
    return Boolean(viewerId && resource.author_id === viewerId);
  }

  const sideCategories = useMemo(() => CATEGORY_MAP[section], [section]);
  const editCategoryOptions = useMemo(() => CATEGORY_MAP[editForm.section], [editForm.section]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Resource Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse technical and soft-skills content curated for your college.</p>
        </div>
        {canCreate ? <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 shrink-0"><Plus className="h-4 w-4" /> New Resource</Button> : null}
      </div>

      <Separator />

      <Tabs value={section} onValueChange={(value) => setSection(value as "technical" | "softskills")} className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="softskills">Soft Skills</TabsTrigger>
        </TabsList>
        <TabsContent value={section} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-4">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="bg-transparent" />
              {(viewerRole === "faculty" || viewerRole === "admin") ? (
                <div className="flex flex-wrap gap-2">
                  {(["all", "published", "draft", "archived"] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setStatusFilter(statusKey)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                        statusFilter === statusKey
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {statusKey === "all" ? "All" : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors",
                    category === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  All Categories
                </button>
                {sideCategories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={cn("w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors", category === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>{formatCategoryLabel(item)}</button>
                ))}
              </div>
            </aside>

            <div className="space-y-4">
              {loading ? <div className="rounded-md border border-border bg-card p-8 text-center text-sm font-medium text-muted-foreground animate-pulse">Loading resources...</div> : null}
              {!loading && resources.length === 0 ? <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm font-medium text-muted-foreground">No resources found for this filter yet.</div> : null}
              {!loading ? resources.map((resource) => (
                <article key={resource.id} className="rounded-md border border-border bg-card p-5 hover:bg-accent/50 transition-colors flex flex-col group">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[11px] uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/10 border-none">{formatCategoryLabel(resource.category)}</Badge>
                        {resource.status && resource.status !== "published" ? (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] uppercase tracking-wider">
                            {resource.status}
                          </Badge>
                        ) : null}
                        {resource.attachment_url ? <Upload className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                      </div>
                      <h3 className="text-base font-semibold leading-tight text-foreground">{resource.title}</h3>
                      {resource.body ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{stripMarkdown(resource.body)}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {resource.attachment_url ? (
                        <a href={resource.attachment_url} target="_blank" className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80">
                          <Download className="h-3.5 w-3.5" /> PDF
                        </a>
                      ) : null}
                      <Button variant="outline" size="sm" onClick={() => openResource(resource)}>
                        Open
                      </Button>
                      {canManageResource(resource) ? (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => startEdit(resource)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      ) : null}
                      {canManageResource(resource) ? (
                        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-border" onClick={() => deleteResource(resource)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span>By {resource.author_name}</span>
                    <span>·</span>
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="flex flex-1 justify-end items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {resource.view_count} views</span>
                  </div>
                </article>
              )) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">{selected.title}</DialogTitle>
                <DialogDescription>{formatCategoryLabel(selected.category)} • {selected.author_name}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
                {selected.body ? <div className="prose prose-sm dark:prose-invert max-w-none"><MarkdownRenderer content={selected.body} /></div> : null}
                {selected.attachment_url ? <a href={selected.attachment_url} target="_blank" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4" /> Download attachment</a> : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>Post a new {section === "technical" ? "technical" : "soft skills"} resource for your college.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {CATEGORY_MAP[section].map((option) => (
                    <option key={option} value={option}>{formatCategoryLabel(option)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="bg-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea rows={8} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="bg-transparent resize-y" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="comma,separated,tags" className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label>Attachment</Label>
                <Input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} className="bg-transparent cursor-pointer" />
              </div>
            </div>
            {viewerRole === "faculty" || viewerRole === "admin" ? (
              <div className="space-y-2">
                <Label>Publish Status</Label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="published">Publish now</option>
                  <option value="draft">Save as draft</option>
                </select>
              </div>
            ) : null}
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-4">
              <Label className="text-muted-foreground uppercase tracking-widest text-[10px]">Preview</Label>
              {form.body ? <div className="prose prose-sm dark:prose-invert max-w-none"><MarkdownRenderer content={form.body} /></div> : <p className="text-sm text-muted-foreground mt-2">Markdown preview will appear here.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createResource} disabled={submitting}>{submitting ? "Creating..." : "Create Resource"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) setEditing(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update content, category, and publish status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Section</Label>
                <select
                  value={editForm.section}
                  onChange={(event) => setEditForm((current) => ({
                    ...current,
                    section: event.target.value as "technical" | "softskills",
                    category: CATEGORY_MAP[event.target.value as "technical" | "softskills"][0],
                  }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="technical">Technical</option>
                  <option value="softskills">Soft Skills</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={editForm.category}
                  onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editCategoryOptions.map((option) => (
                    <option key={option} value={option}>{formatCategoryLabel(option)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input value={editForm.companyName} onChange={(event) => setEditForm((current) => ({ ...current, companyName: event.target.value }))} className="bg-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea rows={8} value={editForm.body} onChange={(event) => setEditForm((current) => ({ ...current, body: event.target.value }))} className="bg-transparent resize-y" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={editForm.tags} onChange={(event) => setEditForm((current) => ({ ...current, tags: event.target.value }))} placeholder="comma,separated,tags" className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as "draft" | "published" | "archived" }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  {viewerRole === "admin" ? <option value="archived">Archived</option> : null}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}