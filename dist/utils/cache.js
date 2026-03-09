/**
 * @internal
 * TTL-based in-memory cache with optional max entry limit.
 *
 * Entries expire after the configured TTL. When maxEntries is set,
 * the oldest entry is evicted on insert to prevent unbounded growth.
 */
export class TTLCache {
    entries = new Map();
    ttl;
    maxEntries;
    constructor(options = {}) {
        this.ttl = options.ttl ?? 60_000;
        this.maxEntries = options.maxEntries ?? 100;
    }
    get(key) {
        const entry = this.entries.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.entries.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value) {
        // Evict oldest if at capacity (and this is a new key)
        if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
            const oldest = this.entries.keys().next().value;
            this.entries.delete(oldest);
        }
        this.entries.set(key, {
            value,
            expiresAt: Date.now() + this.ttl,
        });
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.entries.delete(key);
    }
    clear() {
        this.entries.clear();
    }
}
//# sourceMappingURL=cache.js.map