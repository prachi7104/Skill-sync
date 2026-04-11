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
import { formatCategoryLabel, SOFTSKILLS_RESOURCE_CATEGORIES, TECHNICAL_RESOURCE_CATEGORIES } from "@/lib/phase8-10";
import { stripMarkdown } from "@/lib/content-utils";
import { safeFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StatusCard } from "@/components/ui/status-card";

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
  file: File | null;
  removeAttachment: boolean;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
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
    file: null,
    removeAttachment: false,
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

      const { data, error } = await safeFetch<{
        resources: ResourceRow[];
        canCreate: boolean;
        viewerRole: "student" | "faculty" | "admin" | null;
        viewerId: string | null;
      }>(`/api/resources?${params.toString()}`);

      if (error) {
        toast.error(error);
        setResources([]);
        setFetchError(error);
      } else {
        setResources(data?.resources ?? []);
        setCanCreate(Boolean(data?.canCreate));
        setViewerRole(data?.viewerRole ?? null);
        setViewerId(data?.viewerId ?? null);
        setFetchError(null);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    refreshCurrentList(true);
  }, [category, search, section, statusFilter]);

  async function openResource(resource: ResourceRow) {
    setSelected(resource);
    await safeFetch(`/api/resources/${resource.id}/view`, { method: "POST" });
    setResources((current) =>
      current.map((item) =>
        item.id === resource.id ? { ...item, view_count: item.view_count + 1 } : item
      )
    );
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
      file: null,
      removeAttachment: false,
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;

    setSavingEdit(true);
    try {
      const tags = editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = (editForm.file || editForm.removeAttachment)
        ? await (async () => {
          const body = new FormData();
          body.append("section", editForm.section);
          body.append("category", editForm.category);
          body.append("title", editForm.title);
          body.append("body", editForm.body);
          body.append("bodyFormat", "markdown");
          body.append("tags", tags.join(","));
          body.append("companyName", editForm.companyName);
          body.append("status", editForm.status);
          if (editForm.file) body.append("file", editForm.file);
          if (editForm.removeAttachment) body.append("removeAttachment", "true");

          return fetch(`/api/resources/${editing.id}`, {
            method: "PATCH",
            body,
          });
        })()
        : await fetch(`/api/resources/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: editForm.section,
            category: editForm.category,
            title: editForm.title,
            body: editForm.body || null,
            bodyFormat: "markdown",
            tags,
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Resource Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse technical and soft-skills content curated for your college.</p>
        </div>
        {canCreate ? <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> New Resource</Button> : null}
      </div>

      <Tabs value={section} onValueChange={(value) => setSection(value as "technical" | "softskills")}>
        <TabsList className="bg-card text-muted-foreground">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="softskills">Soft Skills</TabsTrigger>
        </TabsList>
        <TabsContent value={section}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-4 rounded-md border border-border bg-card p-4">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="border-border bg-muted/20 text-foreground" />
              {(viewerRole === "faculty" || viewerRole === "admin") ? (
                <div className="grid grid-cols-2 gap-2">
                {(["all", "published", "draft", "archived"] as const).map((statusKey) => {
                  const isActive = statusFilter === statusKey;
                  return (
                    <Button
                      key={statusKey}
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={isActive}
                      onClick={() => setStatusFilter(statusKey)}
                      className={cn(
                        "justify-start rounded-md px-3 py-2 text-xs font-semibold text-left",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {statusKey === "all" ? "All" : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                    </Button>
                  );
                })}
                </div>
              ) : null}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "w-full rounded-md px-4 py-3 text-left text-sm font-semibold",
                    category === "all" ? "bg-primary text-foreground" : "bg-muted/20 text-muted-foreground hover:bg-muted"
                  )}
                >
                  All Categories
                </button>
                {sideCategories.map((item) => {
                  const isActive = category === item;
                  return (
                    <Button
                      key={item}
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={isActive}
                      onClick={() => setCategory(item)}
                      className={cn(
                        "w-full justify-start rounded-md px-4 py-3 text-left text-sm font-semibold",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {formatCategoryLabel(item)}
                    </Button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-4">
               {loading ? (
                 <StatusCard
                   variant="loading"
                   title="Loading resources"
                   description="Please wait while we fetch the latest entries."
                 />
               ) : null}
               {!loading && fetchError ? (
                 <StatusCard
                   variant="error"
                   title="Unable to load resources"
                   description={fetchError}
                   actionLabel="Try again"
                   onAction={() => refreshCurrentList(true)}
                 />
               ) : null}
               {!loading && !fetchError && resources.length === 0 ? (
                 <StatusCard
                   variant="empty"
                   title="No resources found"
                   description="Try broadening your filters or keywords."
                 />
               ) : null}
              {!loading ? resources.map((resource) => (
                <article key={resource.id} className="rounded-md border border-border bg-card p-5 transition-all hover:border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className="border border-border bg-card text-foreground">{formatCategoryLabel(resource.category)}</Badge>
                        {resource.status && resource.status !== "published" ? (
                          <Badge className="border border-warning/20 bg-warning/10 text-warning">
                            {resource.status.toUpperCase()}
                          </Badge>
                        ) : null}
                        {resource.attachment_url ? <Upload className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                      </div>
                      <h3 className="text-sm font-bold leading-tight text-foreground">{resource.title}</h3>
                      {resource.body ? <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{stripMarkdown(resource.body)}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {resource.attachment_url ? (
                        <a href={resource.attachment_url} target="_blank" className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/30">
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      ) : null}
                      <Button variant="outline" className="border-border bg-muted/20 text-foreground hover:bg-muted" onClick={() => openResource(resource)}>
                        Open
                      </Button>
                      {canManageResource(resource) ? (
                        <Button variant="outline" className="gap-1 border-border bg-muted/20 text-foreground hover:bg-muted" onClick={() => startEdit(resource)}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      ) : null}
                      {canManageResource(resource) ? (
                        <Button variant="outline" className="gap-1 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20" onClick={() => deleteResource(resource)}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">By {resource.author_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(resource.created_at).toLocaleDateString()}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /> {resource.view_count}</span>
                  </div>
                </article>
              )) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[48rem] max-h-[90vh] overflow-hidden border-border bg-muted/20 text-foreground sm:w-[calc(100vw-2rem)]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{formatCategoryLabel(selected.category)} • {selected.author_name}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto space-y-4">
                {selected.body ? <MarkdownRenderer content={selected.body} /> : null}
                {selected.attachment_url ? <a href={selected.attachment_url} target="_blank" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground"><Download className="h-4 w-4" /> Download attachment</a> : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[48rem] max-h-[90vh] overflow-hidden border-border bg-muted/20 text-foreground sm:w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>Post a new {section === "technical" ? "technical" : "soft skills"} resource for your college.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 max-h-[72vh] overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                >
                  {CATEGORY_MAP[section].map((option) => (
                    <option key={option} value={option}>{formatCategoryLabel(option)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="border-border bg-card text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="border-border bg-card text-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea rows={10} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="border-border bg-card text-foreground" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="comma,separated,tags" className="border-border bg-card text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Attachment</Label>
                <Input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} className="border-border bg-card text-foreground" />
              </div>
            </div>
            {viewerRole === "faculty" ? (
              <div className="space-y-2">
                <Label>Publish Status</Label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))}
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                >
                  <option value="published">Publish now</option>
                  <option value="draft">Save as draft</option>
                </select>
              </div>
            ) : null}
            <div className="space-y-2 rounded-md border border-border bg-card p-4">
              <Label>Preview</Label>
              {form.body ? <MarkdownRenderer content={form.body} /> : <p className="text-sm text-muted-foreground">Markdown preview will appear here.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border bg-card text-foreground" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createResource} disabled={submitting} className="bg-primary hover:bg-primary/90">{submitting ? "Creating..." : "Create Resource"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) setEditing(null);
      }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[48rem] border-border bg-muted/20 text-foreground sm:w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update content, category, and publish status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 max-h-[72vh] overflow-y-auto pr-1">
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
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
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
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
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
                <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="border-border bg-card text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input value={editForm.companyName} onChange={(event) => setEditForm((current) => ({ ...current, companyName: event.target.value }))} className="border-border bg-card text-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea rows={10} value={editForm.body} onChange={(event) => setEditForm((current) => ({ ...current, body: event.target.value }))} className="border-border bg-card text-foreground" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={editForm.tags} onChange={(event) => setEditForm((current) => ({ ...current, tags: event.target.value }))} placeholder="comma,separated,tags" className="border-border bg-card text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as "draft" | "published" | "archived" }))}
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  {viewerRole === "admin" ? <option value="archived">Archived</option> : null}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Attachment (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setEditForm((current) => ({
                  ...current,
                  file: event.target.files?.[0] ?? null,
                  removeAttachment: event.target.files?.[0] ? false : current.removeAttachment,
                }))}
                className="border-border bg-card text-foreground"
              />
              {editing?.attachment_name ? (
                <p className="text-xs text-muted-foreground">Current: {editing.attachment_name}</p>
              ) : null}
              {editing?.attachment_url ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editForm.removeAttachment}
                    disabled={Boolean(editForm.file)}
                    onChange={(event) => setEditForm((current) => ({
                      ...current,
                      removeAttachment: event.target.checked,
                    }))}
                  />
                  Remove current attachment
                </label>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border bg-card text-foreground" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="bg-primary hover:bg-primary/90">{savingEdit ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
