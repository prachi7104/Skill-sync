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
  google: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  groq: "bg-orange-500/15 text-orange-400 border-orange-500/20",
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
    <div className="max-w-7xl mx-auto p-8 pb-32 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Model Registry</h1>
          <p className="text-slate-400 mt-1">
            {activeCount} active · {deprecatedCount} deprecated · {unhealthyCount} unhealthy
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchModels}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowAddForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all"
          >
            <Plus className="w-4 h-4" /> Add Model
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={createModel} className="bg-slate-900/60 rounded-2xl border border-white/5 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            required
            value={newModel.model_key}
            onChange={(e) => setNewModel((p) => ({ ...p, model_key: e.target.value }))}
            placeholder="model_key"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            required
            value={newModel.display_name}
            onChange={(e) => setNewModel((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="display_name"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <select
            value={newModel.provider}
            onChange={(e) => setNewModel((p) => ({ ...p, provider: e.target.value as "google" | "groq" }))}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="google">google</option>
            <option value="groq">groq</option>
          </select>
          <input
            value={newModel.task_types}
            onChange={(e) => setNewModel((p) => ({ ...p, task_types: e.target.value }))}
            placeholder="task1,task2"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            value={newModel.rpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpm_limit: e.target.value }))}
            placeholder="rpm_limit"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            value={newModel.rpd_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, rpd_limit: e.target.value }))}
            placeholder="rpd_limit"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            value={newModel.tpm_limit}
            onChange={(e) => setNewModel((p) => ({ ...p, tpm_limit: e.target.value }))}
            placeholder="tpm_limit (optional)"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            value={newModel.priority}
            onChange={(e) => setNewModel((p) => ({ ...p, priority: e.target.value }))}
            placeholder="priority"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            value={newModel.notes}
            onChange={(e) => setNewModel((p) => ({ ...p, notes: e.target.value }))}
            placeholder="notes"
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500">
              Save Model
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900/60 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
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
                  className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : models.map((model) => {
              const usagePct = model.rpm_limit > 0 ? (model.current_rpm_usage / model.rpm_limit) * 100 : 0;
              const isExhausted = model.current_rpm_usage >= model.rpm_limit;
              return (
                <tr
                  key={model.id}
                  className={`hover:bg-slate-800/30 transition-colors ${model.is_deprecated ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        model.is_deprecated
                          ? "bg-slate-600"
                          : !model.is_active
                            ? "bg-slate-600"
                            : isExhausted
                              ? "bg-amber-500"
                              : model.last_ping_ok === false
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-white font-bold">{model.model_key}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">P{model.priority} · {model.display_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${PROVIDER_COLORS[model.provider]}`}>
                      {model.provider.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {model.task_types.map((task) => (
                        <span key={task} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {TASK_TYPE_LABELS[task] ?? task}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <p className="text-xs text-slate-300">{model.rpm_limit} RPM</p>
                    <p className="text-[10px] text-slate-500">{model.rpd_limit ? `${model.rpd_limit.toLocaleString()} RPD` : "-"}</p>
                    <div className="flex gap-1">
                      <input
                        defaultValue={model.priority}
                        className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-200"
                        onBlur={(e) => updateModel(model, { priority: Number(e.target.value) })}
                      />
                      <input
                        defaultValue={model.rpm_limit}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-200"
                        onBlur={(e) => updateModel(model, { rpm_limit: Number(e.target.value) })}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isExhausted ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${isExhausted ? "text-amber-400" : "text-slate-400"}`}>
                        {model.current_rpm_usage}/{model.rpm_limit}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {model.last_ping_at ? (
                      <div className="flex items-center gap-1.5">
                        {model.last_ping_ok ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span className="text-[10px] text-slate-400">{model.last_ping_ms}ms</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => pingModel(model)}
                        disabled={pinging === model.id}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-all disabled:opacity-50"
                      >
                        {pinging === model.id ? <Activity className="w-3 h-3 animate-pulse" /> : "Ping"}
                      </button>
                      <button
                        onClick={() => updateModel(model, { is_active: !model.is_active })}
                        disabled={savingModelId === model.id}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                          model.is_active
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                        }`}
                      >
                        {model.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => updateModel(model, { is_deprecated: !model.is_deprecated })}
                        disabled={savingModelId === model.id}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                          model.is_deprecated
                            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                        }`}
                      >
                        {model.is_deprecated ? "Deprecated" : "Deprecate"}
                      </button>
                      <button
                        onClick={() => deleteModel(model)}
                        disabled={deletingModelId === model.id}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
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
