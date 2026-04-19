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
import { toPost } from './adapters/post';
import { toPage } from './adapters/page';
import { toMedia } from './adapters/media';
import { toCategory } from './adapters/category';
import { toTag } from './adapters/tag';
import { toMenuItem, toNavigationMenu } from './adapters/navigation';
import { toAuthor } from './adapters/author';
import { extractPagination } from './utils/pagination';
import { WordpressError, WordpressNotFoundError, WordpressAuthError, WordpressValidationError, WordpressConflictError, WordpressRateLimitError, } from './errors';
import { dedup } from './utils/dedup';
import { TTLCache } from './utils/cache';
import { fetchWithRetry } from './utils/http';
import { createResource, } from './resources';
import { createCompanion } from './companion';
function encodeBasicAuth(username, appPassword) {
    const credentials = `${username}:${appPassword}`;
    if (typeof globalThis.btoa === 'function') {
        return `Basic ${globalThis.btoa(credentials)}`;
    }
    const nodeBuffer = globalThis.Buffer;
    if (nodeBuffer) {
        return `Basic ${nodeBuffer.from(credentials).toString('base64')}`;
    }
    throw new Error('WordpressClient: no base64 encoder available in this environment');
}
function appendQueryParams(searchParams, params) {
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null)
            continue;
        if (Array.isArray(value)) {
            searchParams.set(key, value.map((item) => String(item)).join(','));
            continue;
        }
        searchParams.set(key, String(value));
    }
}
function isBodyInit(value) {
    return (typeof value === 'string' ||
        value instanceof Blob ||
        value instanceof FormData ||
        value instanceof URLSearchParams ||
        value instanceof ArrayBuffer ||
        ArrayBuffer.isView(value));
}
function isIdempotentMethod(method) {
    return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}
function invalidationTargets(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const segments = normalizedPath.split('/').filter(Boolean);
    if (segments.length === 0) {
        return ['/'];
    }
    // Plugin-registered endpoints follow `namespace/version/resource` (≥3 segments); core
    // endpoints are `resource` or `resource/:id` (1–2 segments). Slicing the first 3 segments
    // for ≥3-segment paths gives plugin namespaces per-resource isolation without hard-coding
    // any particular vendor string.
    const basePath = segments.length >= 3 ? `/${segments.slice(0, 3).join('/')}` : `/${segments[0]}`;
    if (basePath === '/categories') {
        return ['/categories', '/posts'];
    }
    if (basePath === '/tags') {
        return ['/tags', '/posts'];
    }
    if (basePath === '/media') {
        return ['/media'];
    }
    return [basePath];
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
export class WordpressClient {
    apiBaseURL;
    siteApiBaseURL;
    timeout;
    retries;
    cache;
    resolveAuthHeader;
    inflight = new Map();
    /**
     * Companion-plugin namespace. Methods return `null` when the companion plugin
     * is not installed on the host (404); other errors propagate.
     */
    companion;
    /**
     * Creates a new WordPress client.
     *
     * @throws {Error} If baseURL is not provided
     */
    constructor({ baseURL, namespace = 'wp/v2', timeout = 10_000, retry, cache, auth }) {
        if (!baseURL) {
            throw new Error('WordpressClient: baseURL is required');
        }
        const normalizedBaseURL = baseURL.replace(/\/$/, '');
        this.apiBaseURL = `${normalizedBaseURL}/wp-json/${namespace}`;
        this.siteApiBaseURL = `${normalizedBaseURL}/wp-json`;
        this.timeout = timeout;
        this.retries = retry?.retries ?? 3;
        this.cache = cache === false ? null : new TTLCache(cache);
        if (!auth) {
            this.resolveAuthHeader = null;
        }
        else if ('getAuthHeader' in auth) {
            this.resolveAuthHeader = async () => auth.getAuthHeader();
        }
        else {
            const authorizationHeader = encodeBasicAuth(auth.username, auth.appPassword);
            this.resolveAuthHeader = async () => authorizationHeader;
        }
        this.companion = createCompanion(this);
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
    async posts(params = {}, options) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet('/posts', {
            _embed: true,
            page,
            per_page,
            ...rest,
        }, options?.signal);
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
    async post(slug, options) {
        const response = await this.dedupGet('/posts', {
            slug,
            _embed: true,
        }, options?.signal);
        return response.data.length ? toPost(response.data[0]) : null;
    }
    /**
     * Fetch a single post by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the post doesn't exist
     */
    async postById(id, options) {
        const response = await this.dedupGet(`/posts/${id}`, {
            _embed: true,
        }, options?.signal);
        return toPost(response.data);
    }
    /**
     * Create a post.
     */
    async createPost(payload, options) {
        const response = await this.request({
            method: 'POST',
            path: '/posts',
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toPost(response.data);
    }
    /**
     * Update an existing post.
     */
    async updatePost(id, payload, options) {
        const response = await this.request({
            method: 'POST',
            path: `/posts/${id}`,
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toPost(response.data);
    }
    /**
     * Permanently delete a post by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Post>`: hard delete → `{ deleted: true, previous }`;
     * soft delete → `{ deleted: false, trashed }`.
     */
    async deletePost(id, options) {
        const force = options?.force ?? true;
        const response = await this.request({
            method: 'DELETE',
            path: `/posts/${id}`,
            params: { force: force ? 'true' : 'false' },
            requireAuth: true,
            signal: options?.signal,
        });
        if (force) {
            const body = response.data;
            if (!body.previous) {
                throw new WordpressError('Delete response did not include the previous post');
            }
            return { deleted: true, previous: toPost(body.previous) };
        }
        return { deleted: false, trashed: toPost(response.data) };
    }
    // ---- Pages ----
    /**
     * Fetch a paginated list of pages.
     *
     * @example
     * const { data: pages } = await client.pages({ parent: 0 })
     */
    async pages(params = {}, options) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet('/pages', {
            _embed: true,
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toPage) };
    }
    /**
     * Fetch a single page by its URL slug.
     *
     * @returns The page, or null if not found
     *
     * @example
     * const about = await client.page('about')
     */
    async page(slug, options) {
        const response = await this.dedupGet('/pages', {
            slug,
            _embed: true,
        }, options?.signal);
        return response.data.length ? toPage(response.data[0]) : null;
    }
    /**
     * Fetch a single page by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the page doesn't exist
     */
    async pageById(id, options) {
        const response = await this.dedupGet(`/pages/${id}`, {
            _embed: true,
        }, options?.signal);
        return toPage(response.data);
    }
    /**
     * Create a page.
     */
    async createPage(payload, options) {
        const response = await this.request({
            method: 'POST',
            path: '/pages',
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toPage(response.data);
    }
    /**
     * Update an existing page.
     */
    async updatePage(id, payload, options) {
        const response = await this.request({
            method: 'POST',
            path: `/pages/${id}`,
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toPage(response.data);
    }
    /**
     * Permanently delete a page by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Page>`.
     */
    async deletePage(id, options) {
        const force = options?.force ?? true;
        const response = await this.request({
            method: 'DELETE',
            path: `/pages/${id}`,
            params: { force: force ? 'true' : 'false' },
            requireAuth: true,
            signal: options?.signal,
        });
        if (force) {
            const body = response.data;
            if (!body.previous) {
                throw new WordpressError('Delete response did not include the previous page');
            }
            return { deleted: true, previous: toPage(body.previous) };
        }
        return { deleted: false, trashed: toPage(response.data) };
    }
    // ---- Categories ----
    /**
     * Fetch a paginated list of categories.
     *
     * @example
     * const { data: categories } = await client.categories({ hide_empty: true })
     */
    async categories(params = {}, options) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.dedupGet('/categories', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toCategory) };
    }
    /**
     * Fetch a single category by its URL slug.
     *
     * @returns The category, or null if not found
     */
    async category(slug, options) {
        const response = await this.dedupGet('/categories', {
            slug,
        }, options?.signal);
        return response.data.length ? toCategory(response.data[0]) : null;
    }
    /**
     * Create a category. Also invalidates the cached `/posts` list because post embeds include term data.
     */
    async createCategory(payload, options) {
        const response = await this.request({
            method: 'POST',
            path: '/categories',
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toCategory(response.data);
    }
    /**
     * Update an existing category. Also invalidates the cached `/posts` list.
     */
    async updateCategory(id, payload, options) {
        const response = await this.request({
            method: 'POST',
            path: `/categories/${id}`,
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toCategory(response.data);
    }
    /**
     * Permanently delete a category by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Category>`.
     */
    async deleteCategory(id, options) {
        const force = options?.force ?? true;
        const response = await this.request({
            method: 'DELETE',
            path: `/categories/${id}`,
            params: { force: force ? 'true' : 'false' },
            requireAuth: true,
            signal: options?.signal,
        });
        if (force) {
            const body = response.data;
            if (!body.previous) {
                throw new WordpressError('Delete response did not include the previous category');
            }
            return { deleted: true, previous: toCategory(body.previous) };
        }
        return { deleted: false, trashed: toCategory(response.data) };
    }
    // ---- Tags ----
    /**
     * Fetch a paginated list of tags.
     *
     * @example
     * const { data: tags } = await client.tags({ hide_empty: true })
     */
    async tags(params = {}, options) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.dedupGet('/tags', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toTag) };
    }
    /**
     * Fetch a single tag by its URL slug.
     *
     * @returns The tag, or null if not found
     */
    async tag(slug, options) {
        const response = await this.dedupGet('/tags', {
            slug,
        }, options?.signal);
        return response.data.length ? toTag(response.data[0]) : null;
    }
    /**
     * Create a tag. Also invalidates the cached `/posts` list because post embeds include term data.
     */
    async createTag(payload, options) {
        const response = await this.request({
            method: 'POST',
            path: '/tags',
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toTag(response.data);
    }
    /**
     * Update an existing tag. Also invalidates the cached `/posts` list.
     */
    async updateTag(id, payload, options) {
        const response = await this.request({
            method: 'POST',
            path: `/tags/${id}`,
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toTag(response.data);
    }
    /**
     * Permanently delete a tag by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Tag>`.
     */
    async deleteTag(id, options) {
        const force = options?.force ?? true;
        const response = await this.request({
            method: 'DELETE',
            path: `/tags/${id}`,
            params: { force: force ? 'true' : 'false' },
            requireAuth: true,
            signal: options?.signal,
        });
        if (force) {
            const body = response.data;
            if (!body.previous) {
                throw new WordpressError('Delete response did not include the previous tag');
            }
            return { deleted: true, previous: toTag(body.previous) };
        }
        return { deleted: false, trashed: toTag(response.data) };
    }
    // ---- Users ----
    /**
     * Fetch a paginated list of users.
     *
     * @example
     * const { data: users } = await client.users()
     */
    async users(params = {}, options) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet('/users', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toAuthor) };
    }
    /**
     * Fetch a single user by their username slug.
     *
     * @returns The author, or null if not found
     */
    async user(slug, options) {
        const response = await this.dedupGet('/users', {
            slug,
        }, options?.signal);
        return response.data.length ? toAuthor(response.data[0]) : null;
    }
    /**
     * Fetch a single user by their numeric ID.
     *
     * @throws {WordpressNotFoundError} If the user doesn't exist
     * @throws {WordpressAuthError} If the WP host restricts user listings
     */
    async userById(id, options) {
        const response = await this.dedupGet(`/users/${id}`, undefined, options?.signal);
        return toAuthor(response.data);
    }
    // ---- Media ----
    /**
     * Fetch a single media item by its numeric ID.
     *
     * @throws {WordpressNotFoundError} If the media doesn't exist
     */
    async media(id, options) {
        const response = await this.dedupGet(`/media/${id}`, undefined, options?.signal);
        return toMedia(response.data);
    }
    /**
     * Fetch a paginated list of media items.
     *
     * @example
     * const { data: images } = await client.mediaList({ media_type: 'image' })
     */
    async mediaList(params = {}, options) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.dedupGet('/media', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toMedia) };
    }
    /**
     * Update metadata on an existing media item (title, alt text, caption, description).
     * Does not modify the binary file itself.
     */
    async updateMedia(id, payload, options) {
        const response = await this.request({
            method: 'POST',
            path: `/media/${id}`,
            body: payload,
            requireAuth: true,
            signal: options?.signal,
        });
        return toMedia(response.data);
    }
    /**
     * Permanently delete a media item by default. Set force to false to move it to trash instead.
     *
     * Returns a discriminated `DeleteResult<Media>`.
     */
    async deleteMedia(id, options) {
        const force = options?.force ?? true;
        const response = await this.request({
            method: 'DELETE',
            path: `/media/${id}`,
            params: { force: force ? 'true' : 'false' },
            requireAuth: true,
            signal: options?.signal,
        });
        if (force) {
            const body = response.data;
            if (!body.previous) {
                throw new WordpressError('Delete response did not include the previous media item');
            }
            return { deleted: true, previous: toMedia(body.previous) };
        }
        return { deleted: false, trashed: toMedia(response.data) };
    }
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
    async uploadMedia(file, options) {
        const filename = options?.filename ?? (typeof File !== 'undefined' && file instanceof File ? file.name : undefined) ?? 'upload.bin';
        const contentType = file.type || 'application/octet-stream';
        const response = await this.request({
            method: 'POST',
            path: '/media',
            body: file,
            requireAuth: true,
            signal: options?.signal,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
        let media = toMedia(response.data);
        if (options?.altText !== undefined || options?.caption !== undefined || options?.title !== undefined) {
            media = await this.updateMedia(media.id, {
                alt_text: options.altText,
                caption: options.caption,
                title: options.title,
            }, { signal: options.signal });
        }
        return media;
    }
    // ---- Navigation ----
    /**
     * Fetch a paginated list of navigation menus.
     * Requires WP 5.9+ with the Menus REST API.
     *
     * @example
     * const { data: menus } = await client.menus()
     */
    async menus(params = {}, options) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.dedupGet('/menus', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toNavigationMenu) };
    }
    /**
     * Fetch a paginated list of menu items, optionally filtered by menu.
     * Requires WP 5.9+ with the Menus REST API.
     *
     * @example
     * // Get all items from menu ID 3
     * const { data: items } = await client.menuItems({ menus: 3 })
     */
    async menuItems(params = {}, options) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.dedupGet('/menu-items', {
            page,
            per_page,
            ...rest,
        }, options?.signal);
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toMenuItem) };
    }
    // ---- Custom Endpoints ----
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
    async fetchCustom(endpoint, params, options) {
        const response = await this.dedupGet(endpoint, params, options?.signal);
        const page = params?.page ?? 1;
        const perPage = params?.per_page ?? 10;
        return extractPagination(response, page, perPage);
    }
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
    async cacheVersion() {
        try {
            const response = await this.dedupGet('/worang/v1/cache-version', undefined, undefined, {
                base: 'site',
            });
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
    /** Invalidate cached entries by prefix, pattern, or predicate. */
    invalidate(pattern) {
        return this.cache?.invalidate(pattern) ?? 0;
    }
    defineResource(config) {
        if (config.singleton) {
            return createResource(this, { ...config, singleton: true });
        }
        return createResource(this, { ...config, singleton: false });
    }
    dedupGet(url, params, signal, options = {}) {
        const key = `${options.base ?? 'api'}:${url}:${JSON.stringify(params ?? {})}`;
        if (this.cache) {
            const cached = this.cache.get(key);
            if (cached) {
                return Promise.resolve(cached);
            }
        }
        return dedup(this.inflight, key, async () => {
            const response = await this.request({
                method: 'GET',
                path: url,
                params,
                signal,
                base: options.base,
                idempotent: true,
            });
            this.cache?.set(key, response);
            return response;
        });
    }
    async request(config) {
        const method = config.method.toUpperCase();
        const baseURL = config.base === 'site' ? this.siteApiBaseURL : this.apiBaseURL;
        const normalizedPath = config.path.startsWith('/') ? config.path : `/${config.path}`;
        const url = new URL(`${baseURL}${normalizedPath}`);
        if (config.params) {
            appendQueryParams(url.searchParams, config.params);
        }
        const headers = new Headers(config.headers);
        headers.set('Accept', 'application/json');
        const authorizationHeader = this.resolveAuthHeader ? await this.resolveAuthHeader() : null;
        if (authorizationHeader) {
            headers.set('Authorization', authorizationHeader);
        }
        else if (config.requireAuth) {
            throw new WordpressAuthError('Authentication required for write operation');
        }
        let body;
        if (config.body !== undefined) {
            if (isBodyInit(config.body)) {
                body = config.body;
            }
            else {
                headers.set('Content-Type', 'application/json');
                body = JSON.stringify(config.body);
            }
        }
        const idempotent = config.idempotent ?? isIdempotentMethod(method);
        try {
            const response = await fetchWithRetry(url.toString(), {
                method,
                headers,
                ...(body !== undefined ? { body } : {}),
            }, {
                retries: this.retries,
                idempotent,
                signal: config.signal,
                timeoutMs: this.timeout,
            });
            if (response.status >= 400) {
                this.handleError(response, url.toString());
            }
            if (!idempotent) {
                for (const target of invalidationTargets(normalizedPath)) {
                    this.invalidate(target);
                }
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            if (error instanceof WordpressError) {
                throw error;
            }
            throw new WordpressError(error instanceof Error ? error.message : 'Unknown request failure');
        }
    }
    // ---- Error Handling ----
    handleError(response, requestUrl) {
        const status = response.status;
        const raw = response.data;
        const data = typeof raw === 'object' && raw !== null
            ? raw
            : undefined;
        const message = data?.message || `Request failed with status ${status}`;
        if (status === 404) {
            throw new WordpressNotFoundError('Resource', requestUrl);
        }
        if (status === 401 || status === 403) {
            throw new WordpressAuthError(message, status);
        }
        if (status === 400) {
            const params = data?.data?.params;
            const details = params ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, [v]])) : undefined;
            throw new WordpressValidationError(message, details);
        }
        if (status === 409) {
            throw new WordpressConflictError(message, data?.code);
        }
        if (status === 429) {
            const retryAfterHeader = response.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
            throw new WordpressRateLimitError(message, Number.isFinite(retryAfter) ? retryAfter : undefined);
        }
        throw new WordpressError(message, status, data?.code);
    }
}
//# sourceMappingURL=client.js.map