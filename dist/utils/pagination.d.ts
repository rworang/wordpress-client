import type { AxiosResponse } from 'axios';
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        totalPages: number;
        page: number;
        perPage: number;
    };
}
export declare function extractPagination<T>(response: AxiosResponse<T[]>, page?: number, perPage?: number): PaginatedResponse<T>;
//# sourceMappingURL=pagination.d.ts.map