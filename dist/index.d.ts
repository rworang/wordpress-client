export { WordpressClient } from './client';
export type { WordpressClientOptions } from './client';
export type { Post, Media, Category, Author, } from './types/domain';
export type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams, } from './types/params';
export type { PaginatedResponse } from './utils/pagination';
export { WordpressError, WordpressNotFoundError, WordpressAuthError, WordpressValidationError, } from './errors';
export { toPost, toMedia, toCategory, toAuthor } from './adapters';
//# sourceMappingURL=index.d.ts.map