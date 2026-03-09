/**
 * Pagination utilities for WordPress REST API responses.
 *
 * All list methods return a PaginatedResponse with both data and pagination info.
 *
 * @example
 * const { data: posts, pagination } = await client.posts({ page: 2, per_page: 10 })
 *
 * console.log(pagination)
 * // { total: 47, totalPages: 5, page: 2, perPage: 10 }
 *
 * // Check if there are more pages
 * const hasMore = pagination.page < pagination.totalPages
 */

import type { AxiosResponse } from 'axios'

/**
 * Response wrapper containing data and pagination metadata.
 *
 * Returned by all list methods like `posts()`, `categories()`, and `mediaList()`.
 */
export interface PaginatedResponse<T> {
  /** The requested items for the current page */
  data: T[]
  pagination: {
    /** Total number of items across all pages */
    total: number
    /** Total number of pages */
    totalPages: number
    /** Current page number (1-indexed) */
    page: number
    /** Items per page */
    perPage: number
  }
}

/**
 * @internal
 * Extracts pagination info from WordPress REST API response headers.
 */
export function extractPagination<T>(
  response: AxiosResponse<T[]>,
  page: number = 1,
  perPage: number = 10
): PaginatedResponse<T> {
  return {
    data: response.data,
    pagination: {
      total: parseInt(response.headers['x-wp-total'] || '0', 10),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
      page,
      perPage,
    },
  }
}

/**
 * Fetches all items across all pages by repeatedly calling a paginated method.
 *
 * @param fn - A function that takes a page number and returns a paginated response
 * @returns All items concatenated across all pages
 *
 * @example
 * import { fetchAll } from '@worang/wordpress-client'
 *
 * const allPosts = await fetchAll((page) => client.posts({ page, per_page: 100 }))
 */
export async function fetchAll<T>(
  fn: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const first = await fn(1)
  const items = [...first.data]
  const { totalPages } = first.pagination

  for (let page = 2; page <= totalPages; page++) {
    const result = await fn(page)
    items.push(...result.data)
  }

  return items
}
