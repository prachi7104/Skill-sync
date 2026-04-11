/**
 * SkillSync — safeFetch utility (Phase 4.1)
 *
 * A typed fetch wrapper for client-side API calls that:
 *  - Always checks res.ok
 *  - Returns a discriminated union { data, error } instead of throwing
 *  - Extracts the error message from common response shapes
 *    ({ message }, { error }, { error: { message } })
 *  - Accepts an optional onError callback for custom side-effects (e.g. toast)
 */

export type SafeFetchResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

type SafeFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Called with the resolved error string on any failure */
  onError?: (message: string) => void;
};

/** Extract a human-readable error string from common API response shapes. */
function extractErrorMessage(raw: unknown, status: number): string {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (typeof r.message === "string") return r.message;
    if (typeof r.error === "string") return r.error;
    if (r.error && typeof r.error === "object") {
      const e = r.error as Record<string, unknown>;
      if (typeof e.message === "string") return e.message;
    }
  }
  return `Request failed (${status})`;
}

/**
 * Type-safe fetch wrapper for client components.
 *
 * @example
 * const { data, error } = await safeFetch<Drive[]>("/api/drives");
 * if (error) { toast.error(error); return; }
 * setDrives(data);
 */
export async function safeFetch<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const { body, onError, ...rest } = options;

  const init: RequestInit = { ...rest };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = {
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    };
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    const message =
      networkErr instanceof Error ? networkErr.message : "Network error";
    onError?.(message);
    return { data: null, error: message };
  }

  // Parse JSON regardless of status so we can read error messages from 4xx/5xx
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = extractErrorMessage(json, res.status);
    onError?.(message);
    return { data: null, error: message };
  }

  return { data: json as T, error: null };
}

/**
 * POST shorthand.
 *
 * @example
 * const { data, error } = await postJSON<{ drive: Drive }>("/api/drives", payload);
 */
export function postJSON<T = unknown>(
  url: string,
  body: unknown,
  options?: Omit<SafeFetchOptions, "method" | "body">
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, { ...options, method: "POST", body });
}

/**
 * PATCH shorthand.
 */
export function patchJSON<T = unknown>(
  url: string,
  body: unknown,
  options?: Omit<SafeFetchOptions, "method" | "body">
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, { ...options, method: "PATCH", body });
}

/**
 * DELETE shorthand.
 */
export function deleteJSON<T = unknown>(
  url: string,
  options?: Omit<SafeFetchOptions, "method">
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, { ...options, method: "DELETE" });
}
