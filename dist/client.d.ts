import type { Post, Media, Category } from './types/domain';
import type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams } from './types/params';
import { type PaginatedResponse } from './utils/pagination';
export interface WordpressClientOptions {
    baseURL: string;
    namespace?: string;
    timeout?: number;
}
export declare class WordpressClient {
    private readonly http;
    constructor({ baseURL, namespace, timeout, }: WordpressClientOptions);
    posts(params?: PostQueryParams): Promise<PaginatedResponse<Post>>;
    post(slug: string): Promise<Post | null>;
    postById(id: number): Promise<Post>;
    categories(params?: TaxonomyQueryParams): Promise<PaginatedResponse<Category>>;
    category(slug: string): Promise<Category | null>;
    media(id: number): Promise<Media>;
    mediaList(params?: MediaQueryParams): Promise<PaginatedResponse<Media>>;
    private handleError;
}
//# sourceMappingURL=client.d.ts.map