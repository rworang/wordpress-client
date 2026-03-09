/**
 * @internal
 * TTL-based in-memory cache with optional max entry limit.
 *
 * Entries expire after the configured TTL. When maxEntries is set,
 * the oldest entry is evicted on insert to prevent unbounded growth.
 */
export interface CacheOptions {
    /** Time-to-live in milliseconds — defaults to 60_000 (60s) */
    ttl?: number;
    /** Maximum number of cached entries — defaults to 100 */
    maxEntries?: number;
}
export declare class TTLCache<T> {
    private readonly entries;
    private readonly ttl;
    private readonly maxEntries;
    constructor(options?: CacheOptions);
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
}
//# sourceMappingURL=cache.d.ts.map