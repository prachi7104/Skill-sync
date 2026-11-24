import "server-only";

import Groq from "groq-sdk";
import { modelChain, type AiModelSpec, type AiTask } from "./models";

export type AiFailureKind =
  | "model_not_found" | "invalid_key" | "permission" | "rate_limited" | "quota_exhausted"
  | "outage" | "timeout" | "invalid_output" | "unavailable";

export class AiError extends Error {
  constructor(public kind: AiFailureKind, message: string, public attempts: AiAttempt[] = []) {
    super(message);
  }
}

export interface AiAttempt { model: string; provider: string; ok: boolean; kind?: AiFailureKind; ms: number }
export interface AiResult<T> { value: T; model: string; provider: string; attempts: AiAttempt[] }

/** Errors that will not recover by retrying the same request on the next model. */
const STOP_KINDS = new Set<AiFailureKind>([]);

function classify(status: number, body: string): AiFailureKind {
  if (status === 404) return "model_not_found";
  if (status === 401) return "invalid_key";
  if (status === 403) return "permission";
  if (status === 429) return /quota|exhaust|billing/i.test(body) && !/per minute|rate/i.test(body) ? "quota_exhausted" : "rate_limited";
  if (status === 400 && /api key/i.test(body)) return "invalid_key";
  if (status >= 500) return "outage";
  return "unavailable";
}

interface CallOptions {
  system: string;
  user: string;
  json?: boolean;
  /** Gemini responseSchema (OpenAPI subset). Groq receives the same schema as guidance in the prompt. */
  schema?: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

async function callGemini(model: AiModelSpec, options: CallOptions): Promise<string> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new AiError("unavailable", "Gemini key not configured");
  const signal = AbortSignal.any([AbortSignal.timeout(model.timeoutMs), ...(options.signal ? [options.signal] : [])]);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents: [{ role: "user", parts: [{ text: options.user }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
        ...(options.json ? { responseMimeType: "application/json" } : {}),
        ...(options.schema ? { responseSchema: options.schema } : {}),
        ...(model.thinking ? { thinkingConfig: "budget" in model.thinking ? { thinkingBudget: model.thinking.budget } : { thinkingLevel: model.thinking.level } } : {}),
      },
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new AiError(classify(response.status, body), `Gemini ${response.status}`);
  const data = JSON.parse(body) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }> };
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  if (!text || candidate?.finishReason === "MAX_TOKENS") throw new AiError("invalid_output", "Gemini returned an empty or truncated response");
  return text;
}

async function callGroq(model: AiModelSpec, options: CallOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AiError("unavailable", "Groq key not configured");
  const client = new Groq({ apiKey: key, timeout: model.timeoutMs, maxRetries: 0 });
  try {
    const completion = await client.chat.completions.create({
      model: model.id,
      temperature: options.temperature ?? 0.2,
      max_completion_tokens: options.maxOutputTokens ?? 2048,
      ...(options.json ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: options.schema ? `${options.system}\nReturn JSON matching this schema: ${JSON.stringify(options.schema)}` : options.system },
        { role: "user", content: options.user },
      ],
    }, { signal: options.signal });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) throw new AiError("invalid_output", "Groq returned an empty response");
    return text;
  } catch (error) {
    if (error instanceof AiError) throw error;
    const status = (error as { status?: number }).status;
    throw new AiError(status ? classify(status, String((error as Error).message)) : "outage", `Groq ${status ?? "error"}`);
  }
}

function errorKind(error: unknown): AiFailureKind {
  if (error instanceof AiError) return error.kind;
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return "timeout";
  return "outage";
}

/**
 * Runs the task's model chain in order. `parse` validates output; a parse
 * failure counts as invalid_output and moves to the next model.
 */
export async function runAi<T>(task: AiTask, options: CallOptions, parse: (text: string) => T): Promise<AiResult<T>> {
  const attempts: AiAttempt[] = [];
  const chain = modelChain(task);
  if (chain.length === 0) throw new AiError("unavailable", "No AI provider is configured");
  for (const model of chain) {
    if (options.signal?.aborted) break;
    const started = Date.now();
    try {
      const text = model.provider === "google" ? await callGemini(model, options) : await callGroq(model, options);
      let value: T;
      try { value = parse(text); } catch { throw new AiError("invalid_output", "Model output failed validation"); }
      attempts.push({ model: model.id, provider: model.provider, ok: true, ms: Date.now() - started });
      return { value, model: model.id, provider: model.provider, attempts };
    } catch (error) {
      const kind = errorKind(error);
      attempts.push({ model: model.id, provider: model.provider, ok: false, kind, ms: Date.now() - started });
      console.warn("[ai] model attempt failed", { task, model: model.id, kind, ms: Date.now() - started });
      if (STOP_KINDS.has(kind)) break;
    }
  }
  const last = attempts.at(-1)?.kind ?? "unavailable";
  throw new AiError(last, "All configured AI models failed", attempts);
}

export function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected a JSON object");
  return parsed as Record<string, unknown>;
}
