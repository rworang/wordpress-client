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
  constructor(
    message: string,
    /** HTTP status code from the API response */
    public readonly statusCode?: number,
    /** WordPress error code (e.g., 'rest_post_invalid_id') */
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'WordpressError'
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
  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found: ${identifier}`, 404, 'not_found')
    this.name = 'WordpressNotFoundError'
  }
}

/**
 * Thrown when authentication fails or is required (401/403).
 *
 * This typically happens when accessing private posts or
 * endpoints that require authentication.
 */
export class WordpressAuthError extends WordpressError {
  constructor(message = 'Authentication required', statusCode = 401) {
    super(message, statusCode, 'unauthorized')
    this.name = 'WordpressAuthError'
  }
}

/**
 * Thrown when request parameters are invalid (400).
 *
 * The `details` property contains field-specific validation errors.
 */
export class WordpressValidationError extends WordpressError {
  constructor(
    message: string,
    /** Map of field names to their validation error messages */
    public readonly details?: Record<string, string[]>,
  ) {
    super(message, 400, 'validation_error')
    this.name = 'WordpressValidationError'
  }
}

/**
 * Thrown when an API response doesn't match the expected schema.
 *
 * The `issues` property contains field-level validation errors from Zod.
 */
export class WordpressSchemaError extends WordpressError {
  constructor(
    resource: string,
    /** Zod validation issues */
    public readonly issues: Array<{ path: PropertyKey[]; message: string }>,
  ) {
    super(`Invalid ${resource} response from API: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`)
    this.name = 'WordpressSchemaError'
  }
}
