import { createHash } from "crypto";

interface CacheEntry {
    data: unknown;
    timestamp: number;
    hash: string;
}

class JDCache {
    private cache: Map<string, CacheEntry> = new Map();
    private ttl: number = 24 * 60 * 60 * 1000; // 24 hours

    hash(jdText: string): string {
        return createHash("md5").update(jdText.trim()).digest("hex");
    }

    get(jdText: string): unknown | null {
        const hash = this.hash(jdText);
        const entry = this.cache.get(hash);

        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > this.ttl;
        if (isExpired) {
            this.cache.delete(hash);
            return null;
        }

        console.log(`[JD Cache] ✅ Hit for hash ${hash.substring(0, 8)}`);
        return entry.data;
    }

    set(jdText: string, data: unknown): void {
        const hash = this.hash(jdText);
        this.cache.set(hash, {
            data,
            timestamp: Date.now(),
            hash,
        });
        console.log(`[JD Cache] 💾 Stored hash ${hash.substring(0, 8)}`);
    }

    clear(): void {
        this.cache.clear();
    }

    cleanup(): void {
        const now = Date.now();
        for (const [hash, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(hash);
            }
        }
    }

    getStats(): { size: number; oldestEntry: number } {
        let oldest = Date.now();
        for (const entry of this.cache.values()) {
            if (entry.timestamp < oldest) oldest = entry.timestamp;
        }
        return {
            size: this.cache.size,
            oldestEntry: oldest,
        };
    }
}

export const jdCache = new JDCache();

// Run cleanup every hour
setInterval(() => jdCache.cleanup(), 60 * 60 * 1000);
