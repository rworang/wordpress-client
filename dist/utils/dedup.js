/**
 * @internal
 * Request deduplication utility.
 *
 * Returns the existing in-flight promise for a given key if one exists,
 * otherwise executes the factory function and caches the promise until it settles.
 */
export function dedup(inflight, key, fn) {
    const existing = inflight.get(key);
    if (existing)
        return existing;
    const promise = fn().finally(() => {
        inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
}
//# sourceMappingURL=dedup.js.map