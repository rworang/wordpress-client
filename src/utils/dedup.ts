/**
 * @internal
 * Request deduplication utility.
 *
 * Returns the existing in-flight promise for a given key if one exists,
 * otherwise executes the factory function and caches the promise until it settles.
 */

const inflight = new Map<string, Promise<unknown>>()

export function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fn().finally(() => {
    inflight.delete(key)
  })

  inflight.set(key, promise)
  return promise
}
