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
export { WordpressClient } from './client'
export type { WordpressClientOptions, RequestOptions } from './client'

// Types
export type { Post, Page, Media, Category, Tag, MenuItem, NavigationMenu, Author } from './types/domain'

export type {
  PostQueryParams,
  PageQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
  MenuItemQueryParams,
  MenuQueryParams,
  UsersQueryParams,
} from './types/params'

export type { PaginatedResponse } from './utils/pagination'
export { fetchAll } from './utils/pagination'
export type { CacheOptions } from './utils/cache'

// Errors
export {
  WordpressError,
  WordpressNotFoundError,
  WordpressAuthError,
  WordpressValidationError,
  WordpressSchemaError,
} from './errors'
