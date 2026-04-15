"use client";

import { useEffect, useState } from "react";
import { Download, Eye, LayoutGrid, List, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { getCache, setCache, invalidatePrefix } from "@/lib/client-cache";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCategoryLabel, SOFTSKILLS_RESOURCE_CATEGORIES } from "@/lib/phase8-10";
import { stripMarkdown } from "@/lib/content-utils";
import { safeFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StatusCard } from "@/components/ui/status-card";
import { useConfirmDialog } from "@/components/shared/use-confirm-dialog";

const RESOURCE_SECTION = "softskills" as const;
const CATEGORY_OPTIONS = SOFTSKILLS_RESOURCE_CATEGORIES;

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
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [viewerRole, setViewerRole] = useState<"student" | "faculty" | "admin" | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "stack">("stack");
  const [form, setForm] = useState<CreateResourceForm>({
    category: CATEGORY_OPTIONS[0],
    title: "",
    body: "",
    tags: "",
    companyName: "",
    status: "published" as "draft" | "published",
    file: null as File | null,
  });
  const [editForm, setEditForm] = useState<EditResourceForm>({
    section: RESOURCE_SECTION,
    category: CATEGORY_OPTIONS[0],
    title: "",
    body: "",
    tags: "",
    companyName: "",
    status: "published" as "draft" | "published" | "archived",
    file: null,
    removeAttachment: false,
  });

  async function refreshCurrentList(showLoading = false) {
    if (showLoading) setLoading(true);
    const cacheKey = `resources:${RESOURCE_SECTION}:${category}:${search}`;
    try {
      // Fast path: serve from cache on non-forced refreshes
      if (!showLoading) {
        const cached = getCache<{
          resources: ResourceRow[];
          canCreate: boolean;
          viewerRole: "student" | "faculty" | "admin" | null;
          viewerId: string | null;
        }>(cacheKey);
        if (cached) {
          setResources(cached.resources);
          setCanCreate(Boolean(cached.canCreate));
          setViewerRole(cached.viewerRole ?? null);
          setViewerId(cached.viewerId ?? null);
          setFetchError(null);
          return;
        }
      }

      const params = new URLSearchParams({ section: RESOURCE_SECTION });
      if (category !== "all") params.set("category", category);
      if (search) params.set("q", search);

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
        const payload = {
          resources: data?.resources ?? [],
          canCreate: Boolean(data?.canCreate),
          viewerRole: data?.viewerRole ?? null,
          viewerId: data?.viewerId ?? null,
        };
        setCache(cacheKey, payload, 60_000);
        setResources(payload.resources);
        setCanCreate(payload.canCreate);
        setViewerRole(payload.viewerRole);
        setViewerId(payload.viewerId);
        setFetchError(null);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    refreshCurrentList(true);
  }, [category, search]);

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
    invalidatePrefix("resources:");
    try {
      const body = new FormData();
      body.append("section", RESOURCE_SECTION);
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
        category: CATEGORY_OPTIONS[0],
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
      section: RESOURCE_SECTION,
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

    invalidatePrefix("resources:");
    setSavingEdit(true);
    try {
      const tags = editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = (editForm.file || editForm.removeAttachment)
        ? await (async () => {
          const body = new FormData();
          body.append("section", RESOURCE_SECTION);
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
            section: RESOURCE_SECTION,
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
    const confirmed = await confirm({
      title: "Delete resource permanently?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    invalidatePrefix("resources:");

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

  const editCategoryOptions = CATEGORY_OPTIONS;

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur sm:p-5 xl:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Resource Library</p>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Browse resources</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Search and filter soft skills resources by tag, then open or manage the content you need.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full items-center overflow-hidden rounded-md border border-border sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("stack")}
              className={cn(
                "flex-1 p-2 transition-colors sm:flex-none",
                viewMode === "stack"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              )}
              aria-label="Stack view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex-1 p-2 transition-colors sm:flex-none",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {canCreate ? (
            <Button onClick={() => setCreateOpen(true)} className="w-full gap-2 bg-primary hover:bg-primary/90 sm:w-auto">
              <Plus className="h-4 w-4" /> New Resource
            </Button>
          ) : null}
        </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5 xl:sticky xl:top-6 xl:self-start">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources"
            className="border-border bg-muted/20 text-foreground"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((item) => {
              const isActive = category === item;
              return (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={isActive}
                  onClick={() => setCategory(isActive ? "all" : item)}
                  className={cn(
                    "min-h-9 justify-start rounded-full px-4 py-2 text-left text-sm font-semibold",
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
          {!loading && resources.length > 0 ? (
            <div
              className={viewMode === "grid"
                ? "grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3"
                : "space-y-4"}
            >
              {resources.map((resource) => (
                <article key={resource.id} className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border/80">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border border-border bg-card text-foreground">{formatCategoryLabel(resource.category)}</Badge>
                      {resource.status && resource.status !== "published" ? (
                        <Badge className="border border-warning/20 bg-warning/10 text-warning">
                          {resource.status.toUpperCase()}
                        </Badge>
                      ) : null}
                      {resource.attachment_url ? <Upload className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold leading-snug text-foreground sm:text-lg">{resource.title}</h3>
                      {resource.body ? <p className="text-sm leading-6 text-muted-foreground">{stripMarkdown(resource.body)}</p> : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>By {resource.author_name}</span>
                      <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {resource.view_count}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                      <Button variant="outline" className="w-full border-border bg-muted/20 text-foreground hover:bg-muted sm:w-auto" onClick={() => openResource(resource)}>
                        Open
                      </Button>
                      {canManageResource(resource) ? (
                        <Button variant="outline" className="w-full gap-1 border-border bg-muted/20 text-foreground hover:bg-muted sm:w-auto" onClick={() => startEdit(resource)}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      ) : null}
                      {canManageResource(resource) ? (
                        <Button variant="outline" className="w-full gap-1 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 sm:w-auto" onClick={() => deleteResource(resource)}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="flex flex-col w-full max-w-full h-[100dvh] rounded-none sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl border-border bg-muted/20 text-foreground overflow-hidden">
          {selected ? (
            <>
              <DialogHeader className="shrink-0">
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{formatCategoryLabel(selected.category)} • {selected.author_name}</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {selected.body ? <MarkdownRenderer content={selected.body} /> : null}
                {selected.attachment_url ? (
                  selected.attachment_url.toLowerCase().includes(".pdf") ? (
                    <div className="space-y-3">
                      <iframe
                        src={selected.attachment_url}
                        className="w-full rounded border border-border"
                        style={{ height: "65vh" }}
                        title={selected.attachment_name ?? "Preview"}
                      />
                      <a
                        href={selected.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground"
                      >
                        <Download className="h-4 w-4" /> Download PDF
                      </a>
                    </div>
                  ) : (
                    <a
                      href={selected.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground"
                    >
                      <Download className="h-4 w-4" /> Download attachment
                    </a>
                  )
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[48rem] max-h-[90vh] overflow-hidden border-border bg-muted/20 text-foreground sm:w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>Post a new soft skills resource for your college.</DialogDescription>
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
                  {CATEGORY_OPTIONS.map((option) => (
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
            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
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
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="border-border bg-card text-foreground" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
      {ConfirmDialog}
    </div>
  );
}
