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
/**
 * @internal
 * Extracts pagination info from WordPress REST API response headers.
 */
export function extractPagination(response, page = 1, perPage = 10) {
    return {
        data: response.data,
        pagination: {
            total: parseInt(response.headers['x-wp-total'] || '0', 10),
            totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
            page,
            perPage,
        },
    };
}
//# sourceMappingURL=pagination.js.map