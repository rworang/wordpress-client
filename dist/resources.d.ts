import type { z } from 'zod';
import type { WordpressClient, RequestOptions } from './client';
import type { PaginatedResponse } from './utils/pagination';
import type { DeleteResult } from './types/payloads';
export interface DefineResourceConfig<_Payload = unknown> {
    /** REST path without the API origin prefix, e.g. `/worang/v1/reviews`. */
    path: string;
    /**
     * Namespace base — `'api'` resolves under `/wp-json/wp/v2`, `'site'` resolves under
     * `/wp-json` directly. Defaults to `'api'`.
     */
    base?: 'api' | 'site';
    /**
     * Optional Zod schema used to validate each item in responses. If provided,
     * `createResource` calls `safeParse` and throws `WordpressSchemaError` on failure.
     */
    itemSchema?: z.ZodType<unknown>;
    /**
     * Extra cache prefixes to invalidate after a write. The resource's own path is
     * already invalidated by `client.request()`; this adds more prefixes on top.
     */
    invalidates?: string[];
    /**
     * When `true`, returns a `SingletonResourceMethods<Item, Payload>` with only
     * `get` and `update`. When `false` (default), returns the full CRUD shape.
     */
    singleton?: boolean;
}
export interface ResourceMethods<Item, Payload> {
    list(params?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Item>>;
    get(idOrSlug: number | string, options?: RequestOptions): Promise<Item>;
    create(payload: Payload, options?: RequestOptions): Promise<Item>;
    update(id: number, payload: Partial<Payload>, options?: RequestOptions): Promise<Item>;
    delete(id: number, options?: {
        force?: boolean;
    } & RequestOptions): Promise<DeleteResult<Item>>;
}
export interface SingletonResourceMethods<Item, Payload> {
    get(options?: RequestOptions): Promise<Item>;
    update(payload: Partial<Payload>, options?: RequestOptions): Promise<Item>;
}
export declare function createResource<Item, Payload>(client: WordpressClient, config: DefineResourceConfig<Payload> & {
    singleton: true;
}): SingletonResourceMethods<Item, Payload>;
export declare function createResource<Item, Payload>(client: WordpressClient, config: DefineResourceConfig<Payload> & {
    singleton?: false;
}): ResourceMethods<Item, Payload>;
//# sourceMappingURL=resources.d.ts.map