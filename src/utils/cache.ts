/**
 * @internal
 * TTL-based in-memory cache with optional max entry limit.
 *
 * Entries expire after the configured TTL. When maxEntries is set,
 * the oldest entry is evicted on insert to prevent unbounded growth.
 */

export interface CacheOptions {
  /** Time-to-live in milliseconds — defaults to 60_000 (60s) */
  ttl?: number
  /** Maximum number of cached entries — defaults to 100 */
  maxEntries?: number
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>()
  private readonly ttl: number
  private readonly maxEntries: number

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 60_000
    this.maxEntries = options.maxEntries ?? 100
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: T): void {
    // Evict oldest if at capacity (and this is a new key)
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value!
      this.entries.delete(oldest)
    }

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): boolean {
    return this.entries.delete(key)
  }

  clear(): void {
    this.entries.clear()
  }
}
