/**
 * @internal
 * Request deduplication utility.
 *
 * Returns the existing in-flight promise for a given key if one exists,
 * otherwise executes the factory function and caches the promise until it settles.
 */
export declare function dedup<T>(inflight: Map<string, Promise<unknown>>, key: string, fn: () => Promise<T>): Promise<T>;
//# sourceMappingURL=dedup.d.ts.map