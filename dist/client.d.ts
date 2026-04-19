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
import type { Post, Page, Media, Category, Tag, MenuItem, NavigationMenu, Author } from './types/domain';
import type { PostQueryParams, PageQueryParams, TaxonomyQueryParams, MediaQueryParams, MenuItemQueryParams, MenuQueryParams, UsersQueryParams } from './types/params';
import type { AuthConfig } from './types/auth';
import type { PostWritePayload, PageWritePayload, TermWritePayload, MediaWritePayload, DeleteResult } from './types/payloads';
import { type PaginatedResponse } from './utils/pagination';
import { type CacheOptions } from './utils/cache';
import { type HttpResponse } from './utils/http';
import { type DefineResourceConfig, type ResourceMethods, type SingletonResourceMethods } from './resources';
import { type CompanionNamespace } from './companion';
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
    /** Retry configuration for transient failures (408, 429, 5xx) */
    retry?: {
        /** Number of retry attempts - defaults to 3 */
        retries?: number;
    };
    /** Response cache configuration. Set to false to disable caching entirely. */
    cache?: CacheOptions | false;
    /** Authentication configuration. Omit for read-only public access. */
    auth?: AuthConfig;
}
/** Options for individual requests. */
export interface RequestOptions {
    /** AbortSignal for cancelling the request */
    signal?: AbortSignal;
}
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export interface RequestConfig {
    method: RequestMethod;
    path: string;
    body?: unknown;
    params?: Record<string, unknown>;
    signal?: AbortSignal;
    base?: 'api' | 'site';
    idempotent?: boolean;
    requireAuth?: boolean;
    headers?: HeadersInit;
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
    private readonly apiBaseURL;
    private readonly siteApiBaseURL;
    private readonly timeout;
    private readonly retries;
    private readonly cache;
    private readonly resolveAuthHeader;
    private readonly inflight;
    /**
     * Companion-plugin namespace. Methods return `null` when the companion plugin
     * is not installed on the host (404); other errors propagate.
     */
    readonly companion: CompanionNamespace;
    /**
     * Creates a new WordPress client.
     *
     * @throws {Error} If baseURL is not provided
     */
    constructor({ baseURL, namespace, timeout, retry, cache, auth }: WordpressClientOptions);
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
    posts(params?: PostQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Post>>;
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
    post(slug: string, options?: RequestOptions): Promise<Post | null>;
    /**
     * Fetch a single post by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the post doesn't exist
     */
    postById(id: number, options?: RequestOptions): Promise<Post>;
    /**
     * Create a post.
     */
    createPost(payload: PostWritePayload, options?: RequestOptions): Promise<Post>;
    /**
     * Update an existing post.
     */
    updatePost(id: number, payload: Partial<PostWritePayload>, options?: RequestOptions): Promise<Post>;
    /**
     * Permanently delete a post by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Post>`: hard delete → `{ deleted: true, previous }`;
     * soft delete → `{ deleted: false, trashed }`.
     */
    deletePost(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Post>>;
    /**
     * Fetch a paginated list of pages.
     *
     * @example
     * const { data: pages } = await client.pages({ parent: 0 })
     */
    pages(params?: PageQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Page>>;
    /**
     * Fetch a single page by its URL slug.
     *
     * @returns The page, or null if not found
     *
     * @example
     * const about = await client.page('about')
     */
    page(slug: string, options?: RequestOptions): Promise<Page | null>;
    /**
     * Fetch a single page by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the page doesn't exist
     */
    pageById(id: number, options?: RequestOptions): Promise<Page>;
    /**
     * Create a page.
     */
    createPage(payload: PageWritePayload, options?: RequestOptions): Promise<Page>;
    /**
     * Update an existing page.
     */
    updatePage(id: number, payload: Partial<PageWritePayload>, options?: RequestOptions): Promise<Page>;
    /**
     * Permanently delete a page by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Page>`.
     */
    deletePage(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Page>>;
    /**
     * Fetch a paginated list of categories.
     *
     * @example
     * const { data: categories } = await client.categories({ hide_empty: true })
     */
    categories(params?: TaxonomyQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Category>>;
    /**
     * Fetch a single category by its URL slug.
     *
     * @returns The category, or null if not found
     */
    category(slug: string, options?: RequestOptions): Promise<Category | null>;
    /**
     * Create a category. Also invalidates the cached `/posts` list because post embeds include term data.
     */
    createCategory(payload: TermWritePayload, options?: RequestOptions): Promise<Category>;
    /**
     * Update an existing category. Also invalidates the cached `/posts` list.
     */
    updateCategory(id: number, payload: Partial<TermWritePayload>, options?: RequestOptions): Promise<Category>;
    /**
     * Permanently delete a category by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Category>`.
     */
    deleteCategory(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Category>>;
    /**
     * Fetch a paginated list of tags.
     *
     * @example
     * const { data: tags } = await client.tags({ hide_empty: true })
     */
    tags(params?: TaxonomyQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Tag>>;
    /**
     * Fetch a single tag by its URL slug.
     *
     * @returns The tag, or null if not found
     */
    tag(slug: string, options?: RequestOptions): Promise<Tag | null>;
    /**
     * Create a tag. Also invalidates the cached `/posts` list because post embeds include term data.
     */
    createTag(payload: TermWritePayload, options?: RequestOptions): Promise<Tag>;
    /**
     * Update an existing tag. Also invalidates the cached `/posts` list.
     */
    updateTag(id: number, payload: Partial<TermWritePayload>, options?: RequestOptions): Promise<Tag>;
    /**
     * Permanently delete a tag by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Tag>`.
     */
    deleteTag(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Tag>>;
    /**
     * Fetch a paginated list of users.
     *
     * @example
     * const { data: users } = await client.users()
     */
    users(params?: UsersQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Author>>;
    /**
     * Fetch a single user by their username slug.
     *
     * @returns The author, or null if not found
     */
    user(slug: string, options?: RequestOptions): Promise<Author | null>;
    /**
     * Fetch a single user by their numeric ID.
     *
     * @throws {WordpressNotFoundError} If the user doesn't exist
     * @throws {WordpressAuthError} If the WP host restricts user listings
     */
    userById(id: number, options?: RequestOptions): Promise<Author>;
    /**
     * Fetch a single media item by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the media doesn't exist
     */
    media(id: number, options?: RequestOptions): Promise<Media>;
    /**
     * Fetch a paginated list of media items.
     *
     * @example
     * const { data: images } = await client.mediaList({ media_type: 'image' })
     */
    mediaList(params?: MediaQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Media>>;
    /**
     * Update metadata on an existing media item (title, alt text, caption, description).
     * Does not modify the binary file itself.
     */
    updateMedia(id: number, payload: Partial<MediaWritePayload>, options?: RequestOptions): Promise<Media>;
    /**
     * Permanently delete a media item by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Media>`.
     */
    deleteMedia(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Media>>;
    /**
     * Upload a binary file to the media library.
     *
     * When `altText`, `caption`, or `title` are provided, a follow-up `updateMedia` call
     * is issued to attach the metadata — WordPress doesn't accept arbitrary fields on the
     * initial binary upload. This means two HTTP round-trips when metadata is supplied.
     *
     * @example
     * const media = await client.uploadMedia(file, { altText: 'Cover photo' })
     */
    uploadMedia(file: File | Blob, options?: {
        filename?: string;
        altText?: string;
        caption?: string;
        title?: string;
    } & RequestOptions): Promise<Media>;
    /**
     * Fetch a paginated list of navigation menus.
     * Requires WP 5.9+ with the Menus REST API.
     *
     * @example
     * const { data: menus } = await client.menus()
     */
    menus(params?: MenuQueryParams, options?: RequestOptions): Promise<PaginatedResponse<NavigationMenu>>;
    /**
     * Fetch a paginated list of menu items, optionally filtered by menu.
     * Requires WP 5.9+ with the Menus REST API.
     *
     * @example
     * // Get all items from menu ID 3
     * const { data: items } = await client.menuItems({ menus: 3 })
     */
    menuItems(params?: MenuItemQueryParams, options?: RequestOptions): Promise<PaginatedResponse<MenuItem>>;
    /**
     * Fetch a paginated list from any WordPress REST API endpoint.
     * Use this for custom post types or plugin endpoints not covered
     * by the built-in methods.
     *
     * @param endpoint - The REST API path (e.g., '/products', '/events')
     * @param params - Optional query parameters
     * @returns Raw paginated response — caller is responsible for typing T as the item type
     *
     * @example
     * // Fetch WooCommerce products
     * interface Product { id: number; name: string; price: string }
     * const { data, pagination } = await client.fetchCustom<Product>('/products')
     *
     * @example
     * // With query parameters
     * const { data } = await client.fetchCustom<Event>('/events', { per_page: 5 })
     */
    fetchCustom<T>(endpoint: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<T>>;
    /**
     * Fetch the cache version from a custom WordPress endpoint.
     * Uses the `worang/v1` namespace, not the default `wp/v2`.
     *
     * @deprecated Use `client.companion.cacheVersion()` instead. This method
     * targets the legacy `/worang/v1/cache-version` path and will be removed in
     * v0.3.0. The companion-plugin endpoint lives at `/worang-client/v1/cache-version`.
     *
     * @returns The version string, or null if the endpoint is unavailable
     */
    cacheVersion(): Promise<string | null>;
    /** Clear all cached responses. */
    clearCache(): void;
    /** Invalidate cached entries by prefix, pattern, or predicate. */
    invalidate(pattern: string | RegExp | ((key: string) => boolean)): number;
    /**
     * Wrap any REST endpoint as a typed resource. Returns `SingletonResourceMethods`
     * when `singleton: true`, otherwise a full CRUD shape.
     *
     * @example
     * // Plugin-registered namespace needs base:'site' to avoid the /wp-json/wp/v2/ prefix.
     * const reviews = client.defineResource<Review, ReviewPayload>({
     *   path: '/worang/v1/reviews',
     *   base: 'site',
     * })
     * const { data } = await reviews.list({ per_page: 20 })
     */
    defineResource<Item, Payload>(config: DefineResourceConfig<Payload> & {
        singleton: true;
    }): SingletonResourceMethods<Item, Payload>;
    defineResource<Item, Payload>(config: DefineResourceConfig<Payload> & {
        singleton?: false;
    }): ResourceMethods<Item, Payload>;
    private dedupGet;
    request<T>(config: RequestConfig): Promise<HttpResponse<T>>;
    private handleError;
}
//# sourceMappingURL=client.d.ts.map