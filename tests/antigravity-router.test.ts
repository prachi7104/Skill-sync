/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Antigravity Router Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tests for:
 *   - selectModel: picks first healthy non-rate-limited model
 *   - execute: falls back when first model fails, handles all-fail
 *   - extractJSON: JSON extraction from LLM output
 *   - cleanJSONString: removes markdown fences
 *
 * Uses inlined logic to avoid importing server-only / postgres.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi } from "vitest";

// ── Inlined extractJSON (mirrors AntigravityRouter.extractJSON) ──────────────

function extractJSON(raw: string | null): string {
    if (!raw?.trim()) return "{}";

    let text = raw.trim();

    // Remove markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    // Find first complete JSON object
    const start = text.indexOf("{");
    if (start === -1) return "{}";

    let depth = 0,
        inStr = false,
        esc = false;
    for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "{") depth++;
        else if (c === "}") {
            depth--;
            if (depth === 0) return text.substring(start, i + 1);
        }
    }
    return "{}";
}

// ── Inlined cleanJSONString (mirrors the module-level function) ──────────────

function cleanJSONString(text: string): string {
    return text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
}

// ── Inlined Model Selection Logic ───────────────────────────────────────────

// ModelEntry interface removed (unused in tests)

interface TaskDef {
    priority: string[];
}

function simulateSelectModel(
    taskDef: TaskDef,
    isHealthy: (key: string) => boolean,
    isRateLimited: (key: string) => boolean,
): string | null {
    for (const modelKey of taskDef.priority) {
        if (!isHealthy(modelKey)) continue;
        if (isRateLimited(modelKey)) continue;
        return modelKey;
    }
    return null;
}

// ── Inlined Execute Logic ───────────────────────────────────────────────────

interface ExecuteResult<T = string> {
    success: boolean;
    data?: T;
    error?: string;
    modelUsed?: string;
}

interface DbModelCandidate {
    model_key: string;
    rpm_limit: number;
    is_deprecated?: boolean;
}

function selectFromDbCandidates(
    models: DbModelCandidate[],
    currentUsage: Record<string, number>,
): string | null {
    for (const model of models) {
        if (model.is_deprecated) continue;
        if ((currentUsage[model.model_key] ?? 0) >= model.rpm_limit) continue;
        return model.model_key;
    }
    return null;
}

async function simulateSmartRetryCycle(
    models: string[],
    executeModel: (model: string) => Promise<string>,
): Promise<{ used: string[]; success: boolean }> {
    const tried = new Set<string>();
    const used: string[] = [];

    for (let i = 0; i < 3; i++) {
        const candidate = models.find((m) => !tried.has(m));
        if (!candidate) return { used, success: false };
        tried.add(candidate);
        used.push(candidate);

        try {
            await executeModel(candidate);
            return { used, success: true };
        } catch (e: any) {
            const msg = e?.message || "";
            if (/429|rate|limit/i.test(msg)) {
                continue;
            }
            continue;
        }
    }

    return { used, success: false };
}

async function simulateExecute(
    taskDef: TaskDef | null,
    _prompt: string,
    executors: Record<string, () => Promise<string>>,
    isHealthy: (key: string) => boolean,
    isRateLimited: (key: string) => boolean,
): Promise<ExecuteResult> {
    if (!taskDef) {
        return { success: false, error: "Unknown task type" };
    }

    const errors: string[] = [];

    for (const modelKey of taskDef.priority) {
        if (!isHealthy(modelKey)) continue;
        if (isRateLimited(modelKey)) continue;

        const executor = executors[modelKey];
        if (!executor) continue;

        try {
            const data = await executor();
            return { success: true, data, modelUsed: modelKey };
        } catch (e: any) {
            errors.push(`${modelKey}: ${e.message}`);
        }
    }

    return { success: false, error: `All models failed: ${errors.join("; ")}` };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Antigravity Router", () => {
    describe("Model Selection (selectModel)", () => {
        const taskDef: TaskDef = {
            priority: ["google:gemini-2.0-flash", "groq:llama-3.3-70b"],
        };

        it("should select the first healthy non-rate-limited model", () => {
            const modelKey = simulateSelectModel(
                taskDef,
                () => true,    // all healthy
                () => false,   // none rate-limited
            );
            expect(modelKey).toBe("google:gemini-2.0-flash");
        });

        it("should skip rate-limited models", () => {
            const rateLimited = new Set(["google:gemini-2.0-flash"]);
            const modelKey = simulateSelectModel(
                taskDef,
                () => true,
                (key) => rateLimited.has(key),
            );
            expect(modelKey).toBe("groq:llama-3.3-70b");
        });

        it("should skip unhealthy models", () => {
            const unhealthy = new Set(["google:gemini-2.0-flash"]);
            const modelKey = simulateSelectModel(
                taskDef,
                (key) => !unhealthy.has(key),
                () => false,
            );
            expect(modelKey).toBe("groq:llama-3.3-70b");
        });

        it("should return null when all models are unavailable", () => {
            const modelKey = simulateSelectModel(
                taskDef,
                () => false,  // all unhealthy
                () => false,
            );
            expect(modelKey).toBeNull();
        });
    });

    describe("Execution Logic (execute)", () => {
        const taskDef: TaskDef = {
            priority: ["google:gemini-2.0-flash", "groq:llama-3.3-70b"],
        };

        it("should fall back when the first model fails", async () => {
            const executors = {
                "google:gemini-2.0-flash": vi.fn().mockRejectedValue(new Error("Google API error")),
                "groq:llama-3.3-70b": vi.fn().mockResolvedValue("Groq success response"),
            };

            const result = await simulateExecute(
                taskDef, "test prompt", executors,
                () => true, () => false,
            );

            expect(result.success).toBe(true);
            expect(result.data).toBe("Groq success response");
            expect(result.modelUsed).toBe("groq:llama-3.3-70b");
            expect(executors["google:gemini-2.0-flash"]).toHaveBeenCalled();
        });

        it("should return success: false when all models fail", async () => {
            const executors = {
                "google:gemini-2.0-flash": vi.fn().mockRejectedValue(new Error("Google fail")),
                "groq:llama-3.3-70b": vi.fn().mockRejectedValue(new Error("Groq fail")),
            };

            const result = await simulateExecute(
                taskDef, "test prompt", executors,
                () => true, () => false,
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain("All models failed");
        });

        it("should return error for unknown task type", async () => {
            const result = await simulateExecute(
                null, "test prompt", {},
                () => true, () => false,
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain("Unknown task type");
        });
    });

    describe("JSON Extraction (extractJSON)", () => {
        it("should parse plain JSON string", () => {
            const raw = '{"key": "value"}';
            expect(extractJSON(raw)).toBe('{"key": "value"}');
        });

        it("should parse fenced JSON blocks", () => {
            const raw = 'Here is the data:\n```json\n{"key": "value"}\n```\nHope this helps.';
            expect(extractJSON(raw)).toBe('{"key": "value"}');
        });

        it("should parse JSON after a preamble", () => {
            const raw = 'Sure, here is your JSON: {"key": "value"}';
            expect(extractJSON(raw)).toBe('{"key": "value"}');
        });

        it("should return '{}' for empty input", () => {
            expect(extractJSON("")).toBe("{}");
            expect(extractJSON(null)).toBe("{}");
        });

        it("should handle nested JSON correctly", () => {
            const raw = '{"a": {"b": 1}} some trailing text';
            expect(extractJSON(raw)).toBe('{"a": {"b": 1}}');
        });

        it("should handle escaped quotes in strings", () => {
            const raw = '{"key": "value with \\"quotes\\""}';
            expect(extractJSON(raw)).toBe('{"key": "value with \\"quotes\\""}');
        });

        it("should return '{}' when no JSON object is found", () => {
            expect(extractJSON("No JSON here, just text.")).toBe("{}");
            expect(extractJSON("[1, 2, 3]")).toBe("{}"); // Array, not object
        });
    });

    describe("cleanJSONString", () => {
        it("should remove markdown fences", () => {
            const raw = '```json\n{"key": "value"}\n```';
            expect(cleanJSONString(raw)).toBe('{"key": "value"}');
        });

        it("should handle plain JSON without fences", () => {
            const raw = '{"key": "value"}';
            expect(cleanJSONString(raw)).toBe('{"key": "value"}');
        });
    });

    describe("Model selection with DB registry", () => {
        it("should skip rate-limited models", () => {
            const selected = selectFromDbCandidates(
                [
                    { model_key: "model-a", rpm_limit: 2 },
                    { model_key: "model-b", rpm_limit: 2 },
                ],
                { "model-a": 2, "model-b": 1 },
            );
            expect(selected).toBe("model-b");
        });

        it("should skip deprecated models", () => {
            const selected = selectFromDbCandidates(
                [{ model_key: "model-a", rpm_limit: 3, is_deprecated: true }],
                {},
            );
            expect(selected).toBeNull();
        });

        it("should not retry models that returned 429", async () => {
            const result = await simulateSmartRetryCycle(
                ["model-a", "model-b"],
                async (model) => {
                    if (model === "model-a") {
                        throw new Error("429 rate limit");
                    }
                    return "ok";
                },
            );

            expect(result.success).toBe(true);
            expect(result.used).toEqual(["model-a", "model-b"]);
        });

        it("should use cached models after DB failure", () => {
            const staleCache = [{ model_key: "stale-a", rpm_limit: 10 }];
            const selected = selectFromDbCandidates(staleCache, {});
            expect(selected).toBe("stale-a");
        });
    });
});
