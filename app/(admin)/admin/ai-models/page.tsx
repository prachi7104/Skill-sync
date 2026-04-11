"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Trash2,
} from "lucide-react";

type AIModel = {
  id: string;
  model_key: string;
  display_name: string;
  provider: "google" | "groq";
  task_types: string[];
  rpm_limit: number;
  rpd_limit: number | null;
  tpm_limit: number | null;
  priority: number;
  is_active: boolean;
  is_deprecated: boolean;
  last_ping_at: string | null;
  last_ping_ok: boolean | null;
  last_ping_ms: number | null;
  notes: string | null;
  current_rpm_usage: number;
};

const TASK_TYPE_LABELS: Record<string, string> = {
  enhance_jd: "JD Enhance",
  parse_resume_full: "Resume Parse",
  generate_questions: "Questions",
  parse_jd_advanced: "JD Parse",
  embed_profile: "Profile Embedding",
  embed_jd: "JD Embedding",
};

const PROVIDER_COLORS = {
  google: "bg-primary/15 text-primary border-primary/20",
  groq: "bg-warning/15 text-warning border-warning/20",
};

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  const [newModel, setNewModel] = useState({
    model_key: "",
    display_name: "",
    provider: "google" as "google" | "groq",
    task_types: "enhance_jd,parse_resume_full",
    rpm_limit: "15",
    rpd_limit: "1500",
    tpm_limit: "",
    priority: "99",
    notes: "",
  });

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, 30_000);
    return () => clearInterval(interval);
  }, [fetchModels]);

  async function createModel(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newModel,
          task_types: newModel.task_types
            .split(",")
            .map((task) => task.trim())
            .filter(Boolean),
          rpm_limit: Number(newModel.rpm_limit),
          rpd_limit: newModel.rpd_limit ? Number(newModel.rpd_limit) : null,
          tpm_limit: newModel.tpm_limit ? Number(newModel.tpm_limit) : null,
          priority: Number(newModel.priority),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Failed to create model (${res.status})`);
        return;
      }
      setShowAddForm(false);
      setNewModel({
        model_key: "",
        display_name: "",
        provider: "google",
        task_types: "enhance_jd,parse_resume_full",
        rpm_limit: "15",
        rpd_limit: "1500",
        tpm_limit: "",
        priority: "99",
        notes: "",
      });
      fetchModels();
    } catch {
      alert("Network error — could not create model");
    }
  }

  async function updateModel(model: AIModel, patch: Record<string, unknown>) {
    setSavingModelId(model.id);
    try {
      const res = await fetch(`/api/admin/ai-models/${model.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Failed to update model (${res.status})`);
      }
    } catch {
      alert("Network error — could not update model");
    } finally {
      setSavingModelId(null);
      fetchModels();
    }
  }

  async function pingModel(model: AIModel) {
    setPinging(model.id);
    try {
      const res = await fetch(`/api/admin/ai-models/${model.id}/ping`, { method: "POST" });
      if (!res.ok) {
        alert(`Ping failed (${res.status})`);
      }
    } catch {
      alert("Network error — could not ping model");
    } finally {
      setPinging(null);
      fetchModels();
    }
  }

  async function deleteModel(model: AIModel) {
    if (!confirm(`Delete model "${model.display_name}"? This cannot be undone.`)) return;
    setDeletingModelId(model.id);
    try {
      const res = await fetch(`/api/admin/ai-models/${model.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Failed to delete model (${res.status})`);
      }
    } catch {
      alert("Network error — could not delete model");
    } finally {
      setDeletingModelId(null);
      fetchModels();
    }
  }

  const activeCount = models.filter((m) => m.is_active && !m.is_deprecated).length;
  const deprecatedCount = models.filter((m) => m.is_deprecated).length;
  const unhealthyCount = models.filter((m) => m.last_ping_ok === false).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">AI Model Registry</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {activeCount} active · {deprecatedCount} deprecated · {unhealthyCount} unhealthy
            </p>
          </div>
          <div className="flex gap-3 self-start">
            <button
              onClick={fetchModels}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-muted/40"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setShowAddForm((s) => !s)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>
        </div>
      </header>

      {showAddForm && (
        <form onSubmit={createModel} className="bg-card rounded-md border border-border p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            required
            value={newModel.model_key}
            onChange={(e) => setNewModel((p) => ({ ...p, model_key: e.target.value }))}
            placeholder="model_key"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            required
            value={newModel.display_name}
            onChange={(e) => setNewModel((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="display_name"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <select
            value={newModel.provider}
            onChange={(e) => setNewModel((p) => ({ ...p, provider: e.target.value as "google" | "groq" }))}
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            <option value="google">google</option>
            <option value="groq">groq</option>
          </select>
          <input
            value={newModel.task_types}
            onChange={(e) => setNewModel((p) => ({ ...p, task_types: e.target.value }))}
            placeholder="task1,task2"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            value={newModel.rpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpm_limit: e.target.value }))}
            placeholder="rpm_limit"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            value={newModel.rpd_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpd_limit: e.target.value }))}
            placeholder="rpd_limit"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            value={newModel.tpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, tpm_limit: e.target.value }))}
            placeholder="tpm_limit (optional)"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            value={newModel.priority}
            onChange={(e) => setNewModel((p) => ({ ...p, priority: e.target.value }))}
            placeholder="priority"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <input
            value={newModel.notes}
            onChange={(e) => setNewModel((p) => ({ ...p, notes: e.target.value }))}
            placeholder="notes"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-md text-sm font-bold text-muted-foreground bg-card hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-bold text-foreground bg-primary hover:bg-primary/90">
              Save Model
            </button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-md border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[
                "Status",
                "Model",
                "Provider",
                "Tasks",
                "Limits",
                "Usage/Min",
                "Last Ping",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : models.map((model) => {
              const usagePct = model.rpm_limit > 0 ? (model.current_rpm_usage / model.rpm_limit) * 100 : 0;
              const isExhausted = model.current_rpm_usage >= model.rpm_limit;
              return (
                <tr
                  key={model.id}
                  className={`hover:bg-muted transition-colors ${model.is_deprecated ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        model.is_deprecated
                          ? "bg-muted"
                          : !model.is_active
                            ? "bg-muted"
                            : isExhausted
                              ? "bg-warning/10"
                              : model.last_ping_ok === false
                                ? "bg-destructive/10"
                                : "bg-success/10"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-foreground font-bold">{model.model_key}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">P{model.priority} · {model.display_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${PROVIDER_COLORS[model.provider]}`}>
                      {model.provider.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {model.task_types.map((task) => (
                        <span key={task} className="text-[9px] font-bold px-1.5 py-0.5 bg-card text-muted-foreground rounded">
                          {TASK_TYPE_LABELS[task] ?? task}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <p className="text-xs text-muted-foreground">{model.rpm_limit} RPM</p>
                    <p className="text-[10px] text-muted-foreground">{model.rpd_limit ? `${model.rpd_limit.toLocaleString()} RPD` : "-"}</p>
                    <div className="flex gap-1">
                      <input
                        defaultValue={model.priority}
                        className="w-14 bg-card border border-border rounded px-2 py-1 text-[10px] text-foreground"
                        onBlur={(e) => updateModel(model, { priority: Number(e.target.value) })}
                      />
                      <input
                        defaultValue={model.rpm_limit}
                        className="w-16 bg-card border border-border rounded px-2 py-1 text-[10px] text-foreground"
                        onBlur={(e) => updateModel(model, { rpm_limit: Number(e.target.value) })}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-card rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isExhausted ? "bg-warning/10" : "bg-success/10"}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${isExhausted ? "text-warning" : "text-muted-foreground"}`}>
                        {model.current_rpm_usage}/{model.rpm_limit}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {model.last_ping_at ? (
                      <div className="flex items-center gap-1.5">
                        {model.last_ping_ok ? (
                          <CheckCircle className="w-3 h-3 text-success" />
                        ) : (
                          <XCircle className="w-3 h-3 text-destructive" />
                        )}
                        <span className="text-[10px] text-muted-foreground">{model.last_ping_ms}ms</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => pingModel(model)}
                        disabled={pinging === model.id}
                        className="text-[10px] font-bold px-2 py-1 bg-card hover:bg-muted rounded text-muted-foreground transition-all disabled:opacity-50"
                      >
                        {pinging === model.id ? <Activity className="w-3 h-3 animate-pulse" /> : "Ping"}
                      </button>
                      <button
                        onClick={() => updateModel(model, { is_active: !model.is_active })}
                        disabled={savingModelId === model.id}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                          model.is_active
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : "bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {model.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => updateModel(model, { is_deprecated: !model.is_deprecated })}
                        disabled={savingModelId === model.id}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                          model.is_deprecated
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {model.is_deprecated ? "Deprecated" : "Deprecate"}
                      </button>
                      <button
                        onClick={() => deleteModel(model)}
                        disabled={deletingModelId === model.id}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
