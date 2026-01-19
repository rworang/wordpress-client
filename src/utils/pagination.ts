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
