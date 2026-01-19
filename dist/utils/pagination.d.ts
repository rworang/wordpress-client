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
import type { AxiosResponse } from 'axios';
/**
 * Response wrapper containing data and pagination metadata.
 *
 * Returned by all list methods like `posts()`, `categories()`, and `mediaList()`.
 */
export interface PaginatedResponse<T> {
    /** The requested items for the current page */
    data: T[];
    pagination: {
        /** Total number of items across all pages */
        total: number;
        /** Total number of pages */
        totalPages: number;
        /** Current page number (1-indexed) */
        page: number;
        /** Items per page */
        perPage: number;
    };
}
/**
 * @internal
 * Extracts pagination info from WordPress REST API response headers.
 */
export declare function extractPagination<T>(response: AxiosResponse<T[]>, page?: number, perPage?: number): PaginatedResponse<T>;
//# sourceMappingURL=pagination.d.ts.map