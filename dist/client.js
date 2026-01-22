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
import { toPost } from './adapters/post';
import { toMedia } from './adapters/media';
import { toCategory } from './adapters/category';
import { extractPagination } from './utils/pagination';
import { WordpressError, WordpressNotFoundError, WordpressAuthError } from './errors';
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
    /**
     * Creates a new WordPress client.
     *
     * @throws {Error} If baseURL is not provided
     */
    constructor({ baseURL, namespace = 'wp/v2', timeout = 10_000, }) {
        if (!baseURL) {
            throw new Error('WordpressClient: baseURL is required');
        }
        this.http = axios.create({
            baseURL: `${baseURL.replace(/\/$/, '')}/wp-json/${namespace}`,
            timeout,
        });
        this.http.interceptors.response.use((response) => response, (error) => this.handleError(error));
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
        const response = await this.http.get('/posts', {
            params: { _embed: true, page, per_page, ...rest },
        });
        const paginated = extractPagination(response, page, per_page);
        const posts = await Promise.all(paginated.data.map((raw) => toPost(raw, this)));
        return { ...paginated, data: posts };
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
        const response = await this.http.get('/posts', {
            params: { slug, _embed: true },
        });
        return response.data.length ? await toPost(response.data[0], this) : null;
    }
    /**
     * Fetch a single post by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the post doesn't exist
     */
    async postById(id) {
        const response = await this.http.get(`/posts/${id}`, {
            params: { _embed: true },
        });
        return toPost(response.data, this);
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
        const response = await this.http.get('/categories', {
            params: { page, per_page, ...rest },
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
        const response = await this.http.get('/categories', {
            params: { slug },
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
        const response = await this.http.get(`/media/${id}`);
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
        const response = await this.http.get('/media', {
            params: { page, per_page, ...rest },
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toMedia) };
    }
    // ---- Error Handling ----
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            if (status === 404) {
                throw new WordpressNotFoundError('Resource', 'unknown');
            }
            if (status === 401 || status === 403) {
                throw new WordpressAuthError(data?.message);
            }
            throw new WordpressError(data?.message || error.message, status, data?.code);
        }
        throw new WordpressError(error.message);
    }
}
//# sourceMappingURL=client.js.map