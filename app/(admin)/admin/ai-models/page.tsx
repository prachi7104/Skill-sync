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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const PROVIDER_VARIANTS: Record<string, "blue" | "yellow"> = {
  google: "blue",
  groq: "yellow",
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
    await fetch("/api/admin/ai-models", {
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
  }

  async function updateModel(model: AIModel, patch: Record<string, unknown>) {
    setSavingModelId(model.id);
    await fetch(`/api/admin/ai-models/${model.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingModelId(null);
    fetchModels();
  }

  async function pingModel(model: AIModel) {
    setPinging(model.id);
    await fetch(`/api/admin/ai-models/${model.id}/ping`, { method: "POST" });
    setPinging(null);
    fetchModels();
  }

  async function deleteModel(model: AIModel) {
    setDeletingModelId(model.id);
    await fetch(`/api/admin/ai-models/${model.id}`, { method: "DELETE" });
    setDeletingModelId(null);
    fetchModels();
  }

  const activeCount = models.filter((m) => m.is_active && !m.is_deprecated).length;
  const deprecatedCount = models.filter((m) => m.is_deprecated).length;
  const unhealthyCount = models.filter((m) => m.last_ping_ok === false).length;

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Model Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} active · {deprecatedCount} deprecated · {unhealthyCount} unhealthy
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchModels}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm((s) => !s)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Model
          </Button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={createModel} className="bg-card rounded-md border border-border shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            required
            value={newModel.model_key}
            onChange={(e) => setNewModel((p) => ({ ...p, model_key: e.target.value }))}
            placeholder="model_key"
          />
          <Input
            required
            value={newModel.display_name}
            onChange={(e) => setNewModel((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="display_name"
          />
          <select
            value={newModel.provider}
            onChange={(e) => setNewModel((p) => ({ ...p, provider: e.target.value as "google" | "groq" }))}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="google">google</option>
            <option value="groq">groq</option>
          </select>
          <Input
            value={newModel.task_types}
            onChange={(e) => setNewModel((p) => ({ ...p, task_types: e.target.value }))}
            placeholder="task1,task2"
          />
          <Input
            value={newModel.rpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpm_limit: e.target.value }))}
            placeholder="rpm_limit"
          />
          <Input
            value={newModel.rpd_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpd_limit: e.target.value }))}
            placeholder="rpd_limit"
          />
          <Input
            value={newModel.tpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, tpm_limit: e.target.value }))}
            placeholder="tpm_limit (optional)"
          />
          <Input
            value={newModel.priority}
            onChange={(e) => setNewModel((p) => ({ ...p, priority: e.target.value }))}
            placeholder="priority"
          />
          <Input
            value={newModel.notes}
            onChange={(e) => setNewModel((p) => ({ ...p, notes: e.target.value }))}
            placeholder="notes"
          />
          <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Model
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-card">
            <TableRow>
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
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : models.map((model, idx) => {
              const usagePct = model.rpm_limit > 0 ? (model.current_rpm_usage / model.rpm_limit) * 100 : 0;
              const isExhausted = model.current_rpm_usage >= model.rpm_limit;
              return (
                <TableRow
                  key={model.id}
                  className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                >
                  <TableCell className="align-middle">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto ${
                        model.is_deprecated
                          ? "bg-muted-foreground"
                          : !model.is_active
                            ? "bg-muted-foreground"
                            : isExhausted
                              ? "bg-amber-500"
                              : model.last_ping_ok === false
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                      }`}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="font-mono text-xs font-semibold">{model.model_key}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">P{model.priority} · {model.display_name}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={PROVIDER_VARIANTS[model.provider]}>
                      {model.provider.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {model.task_types.map((task) => (
                        <Badge key={task} variant="secondary" className="font-normal text-[10px] px-1.5 py-0 whitespace-nowrap">
                          {TASK_TYPE_LABELS[task] ?? task}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top space-y-1">
                    <p className="text-xs text-foreground font-medium">{model.rpm_limit} RPM</p>
                    <p className="text-xs text-muted-foreground">{model.rpd_limit ? `${model.rpd_limit.toLocaleString()} RPD` : "-"}</p>
                    <div className="flex gap-1 pt-1">
                      <Input
                        defaultValue={model.priority}
                        className="h-6 w-14 text-xs px-2"
                        onBlur={(e) => updateModel(model, { priority: Number(e.target.value) })}
                      />
                      <Input
                        defaultValue={model.rpm_limit}
                        className="h-6 w-16 text-xs px-2"
                        onBlur={(e) => updateModel(model, { rpm_limit: Number(e.target.value) })}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isExhausted ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
                      </div>
                      <span className={`text-xs ${isExhausted ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}>
                        {model.current_rpm_usage}/{model.rpm_limit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {model.last_ping_at ? (
                      <div className="flex items-center gap-1.5">
                        {model.last_ping_ok ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-muted-foreground">{model.last_ping_ms}ms</span>
                      </div>
                    ) : (
                       <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pingModel(model)}
                        disabled={pinging === model.id}
                        className="h-6 text-[10px] px-2 gap-1"
                      >
                        {pinging === model.id && <Activity className="w-3 h-3 animate-pulse" />} Ping
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateModel(model, { is_active: !model.is_active })}
                        disabled={savingModelId === model.id}
                        className={`h-6 text-[10px] px-2 ${model.is_active ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {model.is_active ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateModel(model, { is_deprecated: !model.is_deprecated })}
                        disabled={savingModelId === model.id}
                        className={`h-6 text-[10px] px-2 ${model.is_deprecated ? "text-rose-600" : "text-muted-foreground"}`}
                      >
                        {model.is_deprecated ? "Deprecated" : "Deprecate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteModel(model)}
                        disabled={deletingModelId === model.id}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
