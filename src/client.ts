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
import type { RawPost, RawMedia, RawCategory } from './types/raw'
import type { Post, Media, Category } from './types/domain'
import type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams } from './types/params'
import { toPost } from './adapters/post'
import { toMedia } from './adapters/media'
import { toCategory } from './adapters/category'
import { extractPagination, type PaginatedResponse } from './utils/pagination'
import { WordpressError, WordpressNotFoundError, WordpressAuthError } from './errors'

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

  /**
   * Creates a new WordPress client.
   *
   * @throws {Error} If baseURL is not provided
   */
  constructor({
    baseURL,
    namespace = 'wp/v2',
    timeout = 10_000,
  }: WordpressClientOptions) {
    if (!baseURL) {
      throw new Error('WordpressClient: baseURL is required')
    }

    this.http = axios.create({
      baseURL: `${baseURL.replace(/\/$/, '')}/wp-json/${namespace}`,
      timeout,
    })

    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    )
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
  async posts(params: PostQueryParams = {}): Promise<PaginatedResponse<Post>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.http.get<RawPost[]>('/posts', {
      params: { _embed: true, page, per_page, ...rest },
    })
    const paginated = extractPagination(response, page, per_page)
    const posts = await Promise.all(paginated.data.map((raw) => toPost(raw, this)))
    return { ...paginated, data: posts }
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
  async post(slug: string): Promise<Post | null> {
    const response = await this.http.get<RawPost[]>('/posts', {
      params: { slug, _embed: true },
    })
    return response.data.length ? await toPost(response.data[0], this) : null
  }

  /**
   * Fetch a single post by its numeric ID.
   *
   * @throws {WordpressNotFoundError} If the post doesn't exist
   */
  async postById(id: number): Promise<Post> {
    const response = await this.http.get<RawPost>(`/posts/${id}`, {
      params: { _embed: true },
    })
    return toPost(response.data, this)
  }

  // ---- Categories ----

  /**
   * Fetch a paginated list of categories.
   *
   * @example
   * const { data: categories } = await client.categories({ hide_empty: true })
   */
  async categories(params: TaxonomyQueryParams = {}): Promise<PaginatedResponse<Category>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.http.get<RawCategory[]>('/categories', {
      params: { page, per_page, ...rest },
    })
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toCategory) }
  }

  /**
   * Fetch a single category by its URL slug.
   *
   * @returns The category, or null if not found
   */
  async category(slug: string): Promise<Category | null> {
    const response = await this.http.get<RawCategory[]>('/categories', {
      params: { slug },
    })
    return response.data.length ? toCategory(response.data[0]) : null
  }

  // ---- Media ----

  /**
   * Fetch a single media item by its numeric ID.
   *
   * @throws {WordpressNotFoundError} If the media doesn't exist
   */
  async media(id: number): Promise<Media> {
    const response = await this.http.get<RawMedia>(`/media/${id}`)
    return toMedia(response.data)
  }

  /**
   * Fetch a paginated list of media items.
   *
   * @example
   * const { data: images } = await client.mediaList({ media_type: 'image' })
   */
  async mediaList(params: MediaQueryParams = {}): Promise<PaginatedResponse<Media>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.http.get<RawMedia[]>('/media', {
      params: { page, per_page, ...rest },
    })
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toMedia) }
  }

  // ---- Error Handling ----

  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as { message?: string; code?: string } | undefined

      if (status === 404) {
        throw new WordpressNotFoundError('Resource', 'unknown')
      }
      if (status === 401 || status === 403) {
        throw new WordpressAuthError(data?.message)
      }
      throw new WordpressError(
        data?.message || error.message,
        status,
        data?.code
      )
    }
    throw new WordpressError(error.message)
  }
}
