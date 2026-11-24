"use client";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; code?: string };

/** Fetch wrapper for /api/demo/*. Never throws; network failures become a result. */
export async function guestApi<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<ApiResult<T>> {
  const { json, ...rest } = init ?? {};
  try {
    const response = await fetch(`/api/demo/${path}`, {
      ...rest,
      headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
    const body = await response.json().catch(() => null) as (T & { error?: string; code?: string }) | null;
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("guest-session-expired"));
      }
      return { ok: false, status: response.status, error: body?.error ?? "Something went wrong. Try again.", code: body?.code };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: "You appear to be offline. Check your connection and try again." };
  }
}

export interface AiProvenance { source: "live-ai"; model: string; provider: string; generatedAt: string }

export interface RankingRow {
  studentId: string; name: string; isYou: boolean; rank: number;
  matchScore: number; semanticScore: number; structuredScore: number;
  matchedSkills: string[]; missingSkills: string[];
  shortExplanation: string; detailedExplanation: string;
  isEligible: boolean; ineligibilityReason: string | null;
  shortlisted: boolean | null; cgpa: number | null; branch: string | null; skills: string[];
}

export interface DriveSummary {
  id: string; title: string; company: string; location: string | null; packageOffered: string | null;
  minCgpa: number | null; summary: string; responsibilities: string[];
  requiredSkills: string[]; preferredSkills: string[]; qualifications: string[]; updatedAt: string;
}
