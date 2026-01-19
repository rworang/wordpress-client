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

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    totalPages: number
    page: number
    perPage: number
  }
}

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
