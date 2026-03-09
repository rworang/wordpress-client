/**
 * Main entry point for @worang/wordpress-client.
 *
 * Exports the client, domain types, query params, errors, and adapters.
 *
 * @example
 * import { WordpressClient, Post, PostQueryParams } from '@worang/wordpress-client'
 *
 * const client = new WordpressClient({ baseURL: 'https://example.com' })
 * const { data: posts } = await client.posts({ per_page: 5 })
 */
// Client
export { WordpressClient } from './client';
export { fetchAll } from './utils/pagination';
// Errors
export { WordpressError, WordpressNotFoundError, WordpressAuthError, WordpressValidationError, WordpressSchemaError, } from './errors';
//# sourceMappingURL=index.js.map