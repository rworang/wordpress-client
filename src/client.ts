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

import type {
  RawPost,
  RawPage,
  RawMedia,
  RawCategory,
  RawTag,
  RawMenuItem,
  RawNavigationMenu,
  RawAuthor,
} from './types/raw'
import type { Post, Page, Media, Category, Tag, MenuItem, NavigationMenu, Author } from './types/domain'
import type {
  PostQueryParams,
  PageQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
  MenuItemQueryParams,
  MenuQueryParams,
  UsersQueryParams,
} from './types/params'
import { toPost } from './adapters/post'
import { toPage } from './adapters/page'
import { toMedia } from './adapters/media'
import { toCategory } from './adapters/category'
import { toTag } from './adapters/tag'
import { toMenuItem, toNavigationMenu } from './adapters/navigation'
import { toAuthor } from './adapters/author'
import { extractPagination, type PaginatedResponse } from './utils/pagination'
import { WordpressError, WordpressNotFoundError, WordpressAuthError, WordpressValidationError } from './errors'
import { dedup } from './utils/dedup'
import { TTLCache, type CacheOptions } from './utils/cache'
import { fetchWithRetry, type HttpResponse } from './utils/http'

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
  baseURL: string
  /** REST API namespace - defaults to 'wp/v2' */
  namespace?: string
  /** Request timeout in milliseconds - defaults to 10000 */
  timeout?: number
  /** Retry configuration for transient failures (408, 429, 5xx) */
  retry?: {
    /** Number of retry attempts - defaults to 3 */
    retries?: number
  }
  /** Response cache configuration. Set to false to disable caching entirely. */
  cache?: CacheOptions | false
}

/** Options for individual requests. */
export interface RequestOptions {
  /** AbortSignal for cancelling the request */
  signal?: AbortSignal
}

function appendQueryParams(searchParams: URLSearchParams, params: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item))
      }
      continue
    }

    searchParams.set(key, String(value))
  }
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  )
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
  private readonly apiBaseURL: string
  private readonly siteApiBaseURL: string
  private readonly timeout: number
  private readonly retries: number
  private readonly cache: TTLCache<unknown> | null
  private readonly inflight = new Map<string, Promise<unknown>>()

  /**
   * Creates a new WordPress client.
   *
   * @throws {Error} If baseURL is not provided
   */
  constructor({ baseURL, namespace = 'wp/v2', timeout = 10_000, retry, cache }: WordpressClientOptions) {
    if (!baseURL) {
      throw new Error('WordpressClient: baseURL is required')
    }

    const normalizedBaseURL = baseURL.replace(/\/$/, '')

    this.apiBaseURL = `${normalizedBaseURL}/wp-json/${namespace}`
    this.siteApiBaseURL = `${normalizedBaseURL}/wp-json`
    this.timeout = timeout
    this.retries = retry?.retries ?? 3
    this.cache = cache === false ? null : new TTLCache(cache)
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
  async posts(params: PostQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Post>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.dedupGet<RawPost[]>(
      '/posts',
      {
        _embed: true,
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toPost) }
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
  async post(slug: string, options?: RequestOptions): Promise<Post | null> {
    const response = await this.dedupGet<RawPost[]>(
      '/posts',
      {
        slug,
        _embed: true,
      },
      options?.signal,
    )
    return response.data.length ? toPost(response.data[0]) : null
  }

  /**
   * Fetch a single post by its numeric ID.
   *
   * @throws {WordpressNotFoundError} If the post doesn't exist
   */
  async postById(id: number, options?: RequestOptions): Promise<Post> {
    const response = await this.dedupGet<RawPost>(
      `/posts/${id}`,
      {
        _embed: true,
      },
      options?.signal,
    )
    return toPost(response.data)
  }

  // ---- Pages ----

  /**
   * Fetch a paginated list of pages.
   *
   * @example
   * const { data: pages } = await client.pages({ parent: 0 })
   */
  async pages(params: PageQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Page>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.dedupGet<RawPage[]>(
      '/pages',
      {
        _embed: true,
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toPage) }
  }

  /**
   * Fetch a single page by its URL slug.
   *
   * @returns The page, or null if not found
   *
   * @example
   * const about = await client.page('about')
   */
  async page(slug: string, options?: RequestOptions): Promise<Page | null> {
    const response = await this.dedupGet<RawPage[]>(
      '/pages',
      {
        slug,
        _embed: true,
      },
      options?.signal,
    )
    return response.data.length ? toPage(response.data[0]) : null
  }

  /**
   * Fetch a single page by its numeric ID.
   *
   * @throws {WordpressNotFoundError} If the page doesn't exist
   */
  async pageById(id: number, options?: RequestOptions): Promise<Page> {
    const response = await this.dedupGet<RawPage>(
      `/pages/${id}`,
      {
        _embed: true,
      },
      options?.signal,
    )
    return toPage(response.data)
  }

  // ---- Categories ----

  /**
   * Fetch a paginated list of categories.
   *
   * @example
   * const { data: categories } = await client.categories({ hide_empty: true })
   */
  async categories(params: TaxonomyQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.dedupGet<RawCategory[]>(
      '/categories',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toCategory) }
  }

  /**
   * Fetch a single category by its URL slug.
   *
   * @returns The category, or null if not found
   */
  async category(slug: string, options?: RequestOptions): Promise<Category | null> {
    const response = await this.dedupGet<RawCategory[]>(
      '/categories',
      {
        slug,
      },
      options?.signal,
    )
    return response.data.length ? toCategory(response.data[0]) : null
  }

  // ---- Tags ----

  /**
   * Fetch a paginated list of tags.
   *
   * @example
   * const { data: tags } = await client.tags({ hide_empty: true })
   */
  async tags(params: TaxonomyQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Tag>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.dedupGet<RawTag[]>(
      '/tags',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toTag) }
  }

  /**
   * Fetch a single tag by its URL slug.
   *
   * @returns The tag, or null if not found
   */
  async tag(slug: string, options?: RequestOptions): Promise<Tag | null> {
    const response = await this.dedupGet<RawTag[]>(
      '/tags',
      {
        slug,
      },
      options?.signal,
    )
    return response.data.length ? toTag(response.data[0]) : null
  }

  // ---- Users ----

  /**
   * Fetch a paginated list of users.
   *
   * @example
   * const { data: users } = await client.users()
   */
  async users(params: UsersQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Author>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.dedupGet<RawAuthor[]>(
      '/users',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toAuthor) }
  }

  /**
   * Fetch a single user by their username slug.
   *
   * @returns The author, or null if not found
   */
  async user(slug: string, options?: RequestOptions): Promise<Author | null> {
    const response = await this.dedupGet<RawAuthor[]>(
      '/users',
      {
        slug,
      },
      options?.signal,
    )
    return response.data.length ? toAuthor(response.data[0]) : null
  }

  // ---- Media ----

  /**
   * Fetch a single media item by its numeric ID.
   *
   * @throws {WordpressNotFoundError} If the media doesn't exist
   */
  async media(id: number, options?: RequestOptions): Promise<Media> {
    const response = await this.dedupGet<RawMedia>(`/media/${id}`, undefined, options?.signal)
    return toMedia(response.data)
  }

  /**
   * Fetch a paginated list of media items.
   *
   * @example
   * const { data: images } = await client.mediaList({ media_type: 'image' })
   */
  async mediaList(params: MediaQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Media>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.dedupGet<RawMedia[]>(
      '/media',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toMedia) }
  }

  // ---- Navigation ----

  /**
   * Fetch a paginated list of navigation menus.
   * Requires WP 5.9+ with the Menus REST API.
   *
   * @example
   * const { data: menus } = await client.menus()
   */
  async menus(params: MenuQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<NavigationMenu>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.dedupGet<RawNavigationMenu[]>(
      '/menus',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toNavigationMenu) }
  }

  /**
   * Fetch a paginated list of menu items, optionally filtered by menu.
   * Requires WP 5.9+ with the Menus REST API.
   *
   * @example
   * // Get all items from menu ID 3
   * const { data: items } = await client.menuItems({ menus: 3 })
   */
  async menuItems(params: MenuItemQueryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<MenuItem>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.dedupGet<RawMenuItem[]>(
      '/menu-items',
      {
        page,
        per_page,
        ...rest,
      },
      options?.signal,
    )
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toMenuItem) }
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
  async fetchCustom<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<T>> {
    const response = await this.dedupGet<T[]>(endpoint, params, options?.signal)
    const page = (params?.page as number) ?? 1
    const perPage = (params?.per_page as number) ?? 10
    return extractPagination(response, page, perPage)
  }

  /**
   * Fetch the cache version from a custom WordPress endpoint.
   * Uses the `worang/v1` namespace, not the default `wp/v2`.
   *
   * @returns The version string, or null if the endpoint is unavailable
   */
  async cacheVersion(): Promise<string | null> {
    try {
      const response = await this.dedupGet<{ version: string }>('/worang/v1/cache-version', undefined, undefined, {
        base: 'site',
      })
      return String(response.data.version)
    } catch {
      return null
    }
  }

  // ---- Internal ----

  /** Clear all cached responses. */
  clearCache(): void {
    this.cache?.clear()
  }

  private dedupGet<T>(
    url: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
    options: { base?: 'api' | 'site' } = {},
  ): Promise<HttpResponse<T>> {
    const key = `${options.base ?? 'api'}:${url}:${JSON.stringify(params ?? {})}`

    if (this.cache) {
      const cached = this.cache.get(key) as HttpResponse<T> | undefined
      if (cached) {
        return Promise.resolve(cached)
      }
    }

    return dedup(this.inflight, key, async () => {
      const response = await this.request<T>('GET', url, {
        params,
        signal,
        base: options.base,
        idempotent: true,
      })
      this.cache?.set(key, response)
      return response
    })
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      params?: Record<string, unknown>
      signal?: AbortSignal
      base?: 'api' | 'site'
      headers?: HeadersInit
      body?: unknown
      idempotent?: boolean
    } = {},
  ): Promise<HttpResponse<T>> {
    const baseURL = options.base === 'site' ? this.siteApiBaseURL : this.apiBaseURL
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(`${baseURL}${normalizedPath}`)

    if (options.params) {
      appendQueryParams(url.searchParams, options.params)
    }

    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')

    let body: BodyInit | undefined
    if (options.body !== undefined) {
      if (isBodyInit(options.body)) {
        body = options.body
      } else {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(options.body)
      }
    }

    try {
      const response = await fetchWithRetry<T>(
        url.toString(),
        {
          method,
          headers,
          ...(body !== undefined ? { body } : {}),
        },
        {
          retries: this.retries,
          idempotent: options.idempotent,
          signal: options.signal,
          timeoutMs: this.timeout,
        },
      )

      if (response.status >= 400) {
        this.handleError(response, url.toString())
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      if (error instanceof WordpressError) {
        throw error
      }

      throw new WordpressError(error instanceof Error ? error.message : 'Unknown request failure')
    }
  }

  // ---- Error Handling ----

  private handleError(response: HttpResponse<unknown>, requestUrl: string): never {
    const status = response.status
    const raw = response.data
    const data =
      typeof raw === 'object' && raw !== null
        ? (raw as { message?: string; code?: string; data?: { params?: Record<string, string> } })
        : undefined
    const message = data?.message || `Request failed with status ${status}`

    if (status === 404) {
      throw new WordpressNotFoundError('Resource', requestUrl)
    }
    if (status === 401 || status === 403) {
      throw new WordpressAuthError(message, status)
    }
    if (status === 400) {
      const params = data?.data?.params
      const details = params ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, [v]])) : undefined
      throw new WordpressValidationError(message, details)
    }
    throw new WordpressError(message, status, data?.code)
  }
}
