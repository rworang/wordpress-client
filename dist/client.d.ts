/**
 * WordPress REST API client with typed responses and pagination support.
 *
 * Use this to fetch posts, categories, and media from any WordPress site.
 *
 * @example
 * const client = new WordpressClient({ baseURL: 'https://myblog.com' })
 *
 * // Get the latest 5 posts
 * const { data: posts, pagination } = await client.posts({ per_page: 5 })
 *
 * // Get a single post by slug
 * const post = await client.post('hello-world')
 *
 * // Filter posts by category
 * const { data: techPosts } = await client.posts({ categories: [3] })
 */
import type { Post, Media, Category } from './types/domain';
import type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams } from './types/params';
import { type PaginatedResponse } from './utils/pagination';
/**
 * Configuration options for the WordPress client.
 *
 * @example
 * const client = new WordpressClient({
 *   baseURL: 'https://myblog.com',
 *   timeout: 5000,
 * })
 */
export interface WordpressClientOptions {
    /** Base URL of the WordPress site (required) */
    baseURL: string;
    /** REST API namespace - defaults to 'wp/v2' */
    namespace?: string;
    /** Request timeout in milliseconds - defaults to 10000 */
    timeout?: number;
}
/**
 * Typed client for fetching posts, categories, and media from WordPress.
 *
 * @example
 * const client = new WordpressClient({ baseURL: 'https://myblog.com' })
 * const { data: posts } = await client.posts({ per_page: 5 })
 *
 * @example
 * // Get a single post by slug
 * const post = await client.post('hello-world')
 */
export declare class WordpressClient {
    private readonly http;
    /**
     * Creates a new WordPress client.
     *
     * @throws {Error} If baseURL is not provided
     */
    constructor({ baseURL, namespace, timeout, }: WordpressClientOptions);
    /**
     * Fetch a paginated list of posts.
     *
     * @example
     * // Get first page
     * const { data: posts } = await client.posts()
     *
     * @example
     * // Filter by category
     * const { data: posts } = await client.posts({ categories: [5] })
     */
    posts(params?: PostQueryParams): Promise<PaginatedResponse<Post>>;
    /**
     * Fetch a single post by its URL slug.
     *
     * @returns The post, or null if not found
     *
     * @example
     * const post = await client.post('hello-world')
     * if (post) {
     *   console.log(post.title)
     * }
     */
    post(slug: string): Promise<Post | null>;
    /**
     * Fetch a single post by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the post doesn't exist
     */
    postById(id: number): Promise<Post>;
    /**
     * Fetch a paginated list of categories.
     *
     * @example
     * const { data: categories } = await client.categories({ hide_empty: true })
     */
    categories(params?: TaxonomyQueryParams): Promise<PaginatedResponse<Category>>;
    /**
     * Fetch a single category by its URL slug.
     *
     * @returns The category, or null if not found
     */
    category(slug: string): Promise<Category | null>;
    /**
     * Fetch a single media item by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the media doesn't exist
     */
    media(id: number): Promise<Media>;
    /**
     * Fetch a paginated list of media items.
     *
     * @example
     * const { data: images } = await client.mediaList({ media_type: 'image' })
     */
    mediaList(params?: MediaQueryParams): Promise<PaginatedResponse<Media>>;
    private handleError;
}
//# sourceMappingURL=client.d.ts.map