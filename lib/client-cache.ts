/**
 * Module-level TTL cache for client-side data fetching.
 *
 * Survives React route changes within the same browser tab because module
 * scope persists as long as the JS bundle is loaded. Does NOT persist across
 * hard page reloads or across different tabs.
 *
 * Usage:
 *   const cached = getCache<MyType>("my-key");
 *   if (cached) { use(cached); return; }
 *   const data = await fetchData();
 *   setCache("my-key", data, 30_000); // 30s TTL
 *
 *   // On mutation — bust the cache so next read is fresh:
 *   invalidateCache("my-key");
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Entry<T = any> = { data: T; expires: number };

const store = new Map<string, Entry>();

/**
 * Returns cached data for `key` if present and not expired.
 * Returns null if the key is missing or stale (and removes the stale entry).
 */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Stores `data` under `key` with a time-to-live of `ttlMs` milliseconds.
 * Default TTL is 60 seconds.
 */
export function setCache<T>(key: string, data: T, ttlMs = 60_000): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

/**
 * Immediately removes a single cache entry.
 */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/**
 * Removes all cache entries whose key starts with `prefix`.
 * Useful for clearing a family of related keys, e.g. invalidatePrefix("resources:").
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
