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
import axios from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';
import { toPost } from './adapters/post';
import { toMedia } from './adapters/media';
import { toCategory } from './adapters/category';
import { extractPagination } from './utils/pagination';
import { WordpressError, WordpressNotFoundError, WordpressAuthError, WordpressValidationError } from './errors';
import { dedup } from './utils/dedup';
import { TTLCache } from './utils/cache';
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
export class WordpressClient {
    http;
    siteHttp;
    siteBaseURL;
    cache;
    inflight = new Map();
    /**
     * Creates a new WordPress client.
     *
     * @throws {Error} If baseURL is not provided
     */
    constructor({ baseURL, namespace = 'wp/v2', timeout = 10_000, retry, cache, }) {
        if (!baseURL) {
            throw new Error('WordpressClient: baseURL is required');
        }
        this.siteBaseURL = baseURL.replace(/\/$/, '');
        const retryConfig = {
            retries: retry?.retries ?? 3,
            retryDelay: exponentialDelay,
            retryCondition: (error) => isNetworkOrIdempotentRequestError(error) ||
                error.response?.status === 408 ||
                error.response?.status === 429,
        };
        const errorInterceptor = (error) => this.handleError(error);
        this.http = axios.create({
            baseURL: `${this.siteBaseURL}/wp-json/${namespace}`,
            timeout,
        });
        axiosRetry(this.http, retryConfig);
        this.http.interceptors.response.use((r) => r, errorInterceptor);
        this.siteHttp = axios.create({
            baseURL: `${this.siteBaseURL}/wp-json`,
            timeout,
        });
        axiosRetry(this.siteHttp, retryConfig);
        this.siteHttp.interceptors.response.use((r) => r, errorInterceptor);
        this.cache = cache === false ? null : new TTLCache(cache);
    }
    // ---- Posts ----
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
    async posts(params = {}) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet(this.http, '/posts', {
            _embed: true, page, per_page, ...rest,
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toPost) };
    }
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
    async post(slug) {
        const response = await this.dedupGet(this.http, '/posts', {
            slug, _embed: true,
        });
        return response.data.length ? toPost(response.data[0]) : null;
    }
    /**
     * Fetch a single post by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the post doesn't exist
     */
    async postById(id) {
        const response = await this.dedupGet(this.http, `/posts/${id}`, {
            _embed: true,
        });
        return toPost(response.data);
    }
    // ---- Categories ----
    /**
     * Fetch a paginated list of categories.
     *
     * @example
     * const { data: categories } = await client.categories({ hide_empty: true })
     */
    async categories(params = {}) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.dedupGet(this.http, '/categories', {
            page, per_page, ...rest,
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toCategory) };
    }
    /**
     * Fetch a single category by its URL slug.
     *
     * @returns The category, or null if not found
     */
    async category(slug) {
        const response = await this.dedupGet(this.http, '/categories', {
            slug,
        });
        return response.data.length ? toCategory(response.data[0]) : null;
    }
    // ---- Media ----
    /**
     * Fetch a single media item by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the media doesn't exist
     */
    async media(id) {
        const response = await this.dedupGet(this.http, `/media/${id}`);
        return toMedia(response.data);
    }
    /**
     * Fetch a paginated list of media items.
     *
     * @example
     * const { data: images } = await client.mediaList({ media_type: 'image' })
     */
    async mediaList(params = {}) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet(this.http, '/media', {
            page, per_page, ...rest,
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toMedia) };
    }
    // ---- Custom Endpoints ----
    /**
     * Fetch the cache version from a custom WordPress endpoint.
     * Uses the `worang/v1` namespace, not the default `wp/v2`.
     *
     * @returns The version string, or null if the endpoint is unavailable
     */
    async cacheVersion() {
        try {
            const response = await this.dedupGet(this.siteHttp, '/worang/v1/cache-version');
            return String(response.data.version);
        }
        catch {
            return null;
        }
    }
    // ---- Internal ----
    /** Clear all cached responses. */
    clearCache() {
        this.cache?.clear();
    }
    dedupGet(instance, url, params) {
        const key = `${url}:${JSON.stringify(params ?? {})}`;
        if (this.cache) {
            const cached = this.cache.get(key);
            if (cached)
                return cached;
        }
        return dedup(this.inflight, key, async () => {
            const response = await instance.get(url, params ? { params } : undefined);
            this.cache?.set(key, response);
            return response;
        });
    }
    // ---- Error Handling ----
    handleError(error) {
        const requestUrl = error.config?.url ?? 'unknown';
        if (error.response) {
            const status = error.response.status;
            const raw = error.response.data;
            const data = typeof raw === 'object' && raw !== null
                ? raw
                : undefined;
            const message = data?.message || error.message;
            if (status === 404) {
                throw new WordpressNotFoundError('Resource', requestUrl);
            }
            if (status === 401 || status === 403) {
                throw new WordpressAuthError(message);
            }
            if (status === 400) {
                const params = data?.data?.params;
                const details = params
                    ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, [v]]))
                    : undefined;
                throw new WordpressValidationError(message, details);
            }
            throw new WordpressError(message, status, data?.code);
        }
        throw new WordpressError(error.message);
    }
}
//# sourceMappingURL=client.js.map