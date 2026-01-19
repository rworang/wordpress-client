/**
 * Query parameters for filtering and paginating API requests.
 *
 * @example
 * // Get posts from category 5, newest first
 * client.posts({ categories: [5], orderby: 'date', order: 'desc' })
 *
 * @example
 * // Search posts
 * client.posts({ search: 'typescript', per_page: 5 })
 *
 * @example
 * // Get categories with posts, sorted by name
 * client.categories({ hide_empty: true, orderby: 'name' })
 */
/** Query parameters for fetching posts. */
export interface PostQueryParams {
    /** Page number (1-indexed) - defaults to 1 */
    page?: number;
    /** Results per page - defaults to 10 */
    per_page?: number;
    /** Search term to filter posts */
    search?: string;
    /** Include only posts in these category IDs */
    categories?: number[];
    /** Exclude posts in these category IDs */
    categories_exclude?: number[];
    /** Include only posts with these tag IDs */
    tags?: number[];
    /** Exclude posts with these tag IDs */
    tags_exclude?: number[];
    /** Filter by author ID */
    author?: number;
    /** Field to sort by - defaults to 'date' */
    orderby?: 'date' | 'title' | 'slug' | 'author' | 'modified' | 'relevance';
    /** Sort direction - defaults to 'desc' */
    order?: 'asc' | 'desc';
    /** Include only posts published before this ISO 8601 date */
    before?: string;
    /** Include only posts published after this ISO 8601 date */
    after?: string;
    /** Filter by exact slug(s) */
    slug?: string | string[];
    /** Filter by post status (requires authentication for non-public statuses) */
    status?: 'publish' | 'draft' | 'pending' | 'private' | 'any';
}
/** Query parameters for fetching categories and tags. */
export interface TaxonomyQueryParams {
    /** Page number (1-indexed) - defaults to 1 */
    page?: number;
    /** Results per page - defaults to 100 for categories */
    per_page?: number;
    /** Search term to filter taxonomies */
    search?: string;
    /** Filter by exact slug(s) */
    slug?: string | string[];
    /** Exclude taxonomies with no posts - defaults to false */
    hide_empty?: boolean;
    /** Field to sort by */
    orderby?: 'id' | 'name' | 'slug' | 'count';
    /** Sort direction */
    order?: 'asc' | 'desc';
}
/** Query parameters for fetching media items. */
export interface MediaQueryParams {
    /** Page number (1-indexed) - defaults to 1 */
    page?: number;
    /** Results per page - defaults to 10 */
    per_page?: number;
    /** Search term to filter media */
    search?: string;
    /** Filter by media type */
    media_type?: 'image' | 'video' | 'audio' | 'application';
    /** Filter by MIME type (e.g., 'image/jpeg') */
    mime_type?: string;
    /** Field to sort by */
    orderby?: 'date' | 'title' | 'id';
    /** Sort direction */
    order?: 'asc' | 'desc';
}
//# sourceMappingURL=params.d.ts.map