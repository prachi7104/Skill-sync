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

import { describe, it, expect, vi, beforeEach } from "vitest";

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

interface ModelEntry {
    id: string;
    provider: "google" | "groq";
}

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

async function simulateExecute(
    taskDef: TaskDef | null,
    prompt: string,
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
});
