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

import axios, { AxiosInstance, AxiosError } from 'axios'
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry'
import type { RawPost, RawPage, RawMedia, RawCategory, RawTag, RawMenuItem, RawNavigationMenu, RawAuthor } from './types/raw'
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
  private readonly http: AxiosInstance
  private readonly siteHttp: AxiosInstance
  private readonly siteBaseURL: string
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

    this.siteBaseURL = baseURL.replace(/\/$/, '')

    const retryConfig = {
      retries: retry?.retries ?? 3,
      retryDelay: exponentialDelay,
      retryCondition: (error: AxiosError) =>
        isNetworkOrIdempotentRequestError(error) || error.response?.status === 408 || error.response?.status === 429,
    }

    const errorInterceptor = (error: AxiosError) => this.handleError(error)

    this.http = axios.create({
      baseURL: `${this.siteBaseURL}/wp-json/${namespace}`,
      timeout,
    })
    axiosRetry(this.http, retryConfig)
    this.http.interceptors.response.use((r) => r, errorInterceptor)

    this.siteHttp = axios.create({
      baseURL: `${this.siteBaseURL}/wp-json`,
      timeout,
    })
    axiosRetry(this.siteHttp, retryConfig)
    this.siteHttp.interceptors.response.use((r) => r, errorInterceptor)

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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
      this.http,
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
    const response = await this.dedupGet<RawMedia>(this.http, `/media/${id}`, undefined, options?.signal)
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
      this.http,
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
      this.http,
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
      this.http,
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
    const response = await this.dedupGet<T[]>(this.http, endpoint, params, options?.signal)
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
      const response = await this.dedupGet<{ version: string }>(this.siteHttp, '/worang/v1/cache-version')
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

  private dedupGet<T>(instance: AxiosInstance, url: string, params?: Record<string, unknown>, signal?: AbortSignal) {
    const key = `${url}:${JSON.stringify(params ?? {})}`

    if (this.cache) {
      const cached = this.cache.get(key)
      if (cached) return cached as Promise<import('axios').AxiosResponse<T>>
    }

    return dedup(this.inflight, key, async () => {
      const response = await instance.get<T>(url, {
        ...(params ? { params } : {}),
        ...(signal ? { signal } : {}),
      })
      this.cache?.set(key, response)
      return response
    })
  }

  // ---- Error Handling ----

  private handleError(error: AxiosError): never {
    const requestUrl = error.config?.url ?? 'unknown'

    if (error.response) {
      const status = error.response.status
      const raw = error.response.data
      const data =
        typeof raw === 'object' && raw !== null
          ? (raw as { message?: string; code?: string; data?: { params?: Record<string, string> } })
          : undefined
      const message = data?.message || error.message

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
    throw new WordpressError(error.message)
  }
}
