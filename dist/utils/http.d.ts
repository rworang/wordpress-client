/**
 * @internal
 * Small fetch-based HTTP helper with retry semantics for transient failures.
 */
export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    headers: Headers;
}
export interface FetchWithRetryOptions {
    retries?: number;
    idempotent?: boolean;
    signal?: AbortSignal;
    baseBackoffMs?: number;
    timeoutMs?: number;
}
export declare function parseRetryAfterMs(headers: Headers): number | null;
export declare function parseResponseBody<T>(response: Response): Promise<T>;
export declare function fetchWithRetry<T>(url: string, init: RequestInit, options?: FetchWithRetryOptions): Promise<HttpResponse<T>>;
//# sourceMappingURL=http.d.ts.map