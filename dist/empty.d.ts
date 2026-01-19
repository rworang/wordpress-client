/**
 * Error classes for WordPress API failures.
 *
 * - WordpressError: Base error for any API failure
 * - WordpressNotFoundError: Thrown when a resource doesn't exist (404)
 * - WordpressAuthError: Thrown when authentication fails (401/403)
 * - WordpressValidationError: Thrown for invalid parameters (400)
 *
 * @example
 * import { WordpressNotFoundError, WordpressAuthError } from '@worang/wordpress-client'
 *
 * try {
 *   const post = await client.postById(99999)
 * } catch (err) {
 *   if (err instanceof WordpressNotFoundError) {
 *     console.log('Post not found')
 *   }
 * }
 */
/**
 * Base error for WordPress API failures.
 *
 * Use `instanceof` checks for specific error types, or catch this
 * to handle all WordPress API errors.
 */
export declare class WordpressError extends Error {
    /** HTTP status code from the API response */
    readonly statusCode?: number | undefined;
    /** WordPress error code (e.g., 'rest_post_invalid_id') */
    readonly code?: string | undefined;
    constructor(message: string, 
    /** HTTP status code from the API response */
    statusCode?: number | undefined, 
    /** WordPress error code (e.g., 'rest_post_invalid_id') */
    code?: string | undefined);
}
/**
 * Thrown when a requested resource doesn't exist (404).
 *
 * @example
 * try {
 *   await client.postById(99999)
 * } catch (err) {
 *   if (err instanceof WordpressNotFoundError) {
 *     // Handle missing post
 *   }
 * }
 */
export declare class WordpressNotFoundError extends WordpressError {
    constructor(resource: string, identifier: string | number);
}
/**
 * Thrown when authentication fails or is required (401/403).
 *
 * This typically happens when accessing private posts or
 * endpoints that require authentication.
 */
export declare class WordpressAuthError extends WordpressError {
    constructor(message?: string);
}
/**
 * Thrown when request parameters are invalid (400).
 *
 * The `details` property contains field-specific validation errors.
 */
export declare class WordpressValidationError extends WordpressError {
    /** Map of field names to their validation error messages */
    readonly details?: Record<string, string[]> | undefined;
    constructor(message: string, 
    /** Map of field names to their validation error messages */
    details?: Record<string, string[]> | undefined);
}
//# sourceMappingURL=empty.d.ts.map