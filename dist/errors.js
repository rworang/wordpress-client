/**
 * Error classes for WordPress API failures.
 *
 * - WordpressError: Base error for any API failure
 * - WordpressNotFoundError: Thrown when a resource doesn't exist (404)
 * - WordpressAuthError: Thrown when authentication fails (401/403)
 * - WordpressValidationError: Thrown for invalid parameters (400)
 * - WordpressSchemaError: Thrown when API response doesn't match expected schema
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
export class WordpressError extends Error {
    statusCode;
    code;
    constructor(message, 
    /** HTTP status code from the API response */
    statusCode, 
    /** WordPress error code (e.g., 'rest_post_invalid_id') */
    code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'WordpressError';
    }
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
export class WordpressNotFoundError extends WordpressError {
    constructor(resource, identifier) {
        super(`${resource} not found: ${identifier}`, 404, 'not_found');
        this.name = 'WordpressNotFoundError';
    }
}
/**
 * Thrown when authentication fails or is required (401/403).
 *
 * This typically happens when accessing private posts or
 * endpoints that require authentication.
 */
export class WordpressAuthError extends WordpressError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'unauthorized');
        this.name = 'WordpressAuthError';
    }
}
/**
 * Thrown when request parameters are invalid (400).
 *
 * The `details` property contains field-specific validation errors.
 */
export class WordpressValidationError extends WordpressError {
    details;
    constructor(message, 
    /** Map of field names to their validation error messages */
    details) {
        super(message, 400, 'validation_error');
        this.details = details;
        this.name = 'WordpressValidationError';
    }
}
/**
 * Thrown when an API response doesn't match the expected schema.
 *
 * The `issues` property contains field-level validation errors from Zod.
 */
export class WordpressSchemaError extends WordpressError {
    issues;
    constructor(resource, 
    /** Zod validation issues */
    issues) {
        super(`Invalid ${resource} response from API: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
        this.issues = issues;
        this.name = 'WordpressSchemaError';
    }
}
//# sourceMappingURL=errors.js.map