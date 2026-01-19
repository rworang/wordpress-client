export declare class WordpressError extends Error {
    readonly statusCode?: number | undefined;
    readonly code?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, code?: string | undefined);
}
export declare class WordpressNotFoundError extends WordpressError {
    constructor(resource: string, identifier: string | number);
}
export declare class WordpressAuthError extends WordpressError {
    constructor(message?: string);
}
export declare class WordpressValidationError extends WordpressError {
    readonly details?: Record<string, string[]> | undefined;
    constructor(message: string, details?: Record<string, string[]> | undefined);
}
//# sourceMappingURL=errors.d.ts.map