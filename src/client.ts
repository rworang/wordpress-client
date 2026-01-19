import axios, { AxiosInstance, AxiosError } from 'axios'
import type { RawPost, RawMedia, RawCategory } from './types/raw'
import type { Post, Media, Category } from './types/domain'
import type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams } from './types/params'
import { toPost } from './adapters/post'
import { toMedia } from './adapters/media'
import { toCategory } from './adapters/category'
import { extractPagination, type PaginatedResponse } from './utils/pagination'
import { WordpressError, WordpressNotFoundError, WordpressAuthError } from './errors'

export interface WordpressClientOptions {
  baseURL: string
  namespace?: string
  timeout?: number
}

export class WordpressClient {
  private readonly http: AxiosInstance

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

  async posts(params: PostQueryParams = {}): Promise<PaginatedResponse<Post>> {
    const { page = 1, per_page = 10, ...rest } = params
    const response = await this.http.get<RawPost[]>('/posts', {
      params: { _embed: true, page, per_page, ...rest },
    })
    const paginated = extractPagination(response, page, per_page)
    const posts = await Promise.all(paginated.data.map((raw) => toPost(raw, this)))
    return { ...paginated, data: posts }
  }

  async post(slug: string): Promise<Post | null> {
    const response = await this.http.get<RawPost[]>('/posts', {
      params: { slug, _embed: true },
    })
    return response.data.length ? await toPost(response.data[0], this) : null
  }

  async postById(id: number): Promise<Post> {
    const response = await this.http.get<RawPost>(`/posts/${id}`, {
      params: { _embed: true },
    })
    return toPost(response.data, this)
  }

  // ---- Categories ----

  async categories(params: TaxonomyQueryParams = {}): Promise<PaginatedResponse<Category>> {
    const { page = 1, per_page = 100, ...rest } = params
    const response = await this.http.get<RawCategory[]>('/categories', {
      params: { page, per_page, ...rest },
    })
    const paginated = extractPagination(response, page, per_page)
    return { ...paginated, data: paginated.data.map(toCategory) }
  }

  async category(slug: string): Promise<Category | null> {
    const response = await this.http.get<RawCategory[]>('/categories', {
      params: { slug },
    })
    return response.data.length ? toCategory(response.data[0]) : null
  }

  // ---- Media ----

  async media(id: number): Promise<Media> {
    const response = await this.http.get<RawMedia>(`/media/${id}`)
    return toMedia(response.data)
  }

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
