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