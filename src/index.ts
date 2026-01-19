// Client
export { WordpressClient } from './client'
export type { WordpressClientOptions } from './client'

// Types
export type {
  Post,
  Media,
  Category,
  Author,
} from './types/domain'

export type {
  PostQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
} from './types/params'

export type { PaginatedResponse } from './utils/pagination'

// Errors
export {
  WordpressError,
  WordpressNotFoundError,
  WordpressAuthError,
  WordpressValidationError,
} from './errors'

// Adapters (for advanced use cases)
export { toPost, toMedia, toCategory, toAuthor } from './adapters'
