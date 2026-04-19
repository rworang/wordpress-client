import type { z } from 'zod'
import type { WordpressClient, RequestOptions } from './client'
import type { PaginatedResponse } from './utils/pagination'
import { extractPagination } from './utils/pagination'
import { WordpressSchemaError } from './errors'

export interface DefineResourceConfig<Payload> {
  /** REST path without the API origin prefix, e.g. `/worang/v1/reviews`. */
  path: string
  /**
   * Namespace base — `'api'` resolves under `/wp-json/wp/v2`, `'site'` resolves under
   * `/wp-json` directly. Defaults to `'api'`.
   */
  base?: 'api' | 'site'
  /**
   * Optional Zod schema used to validate each item in responses. If provided,
   * `createResource` calls `safeParse` and throws `WordpressSchemaError` on failure.
   */
  itemSchema?: z.ZodType<unknown>
  /**
   * Extra cache prefixes to invalidate after a write. The resource's own path is
   * already invalidated by `client.request()`; this adds more prefixes on top.
   */
  invalidates?: string[]
  /**
   * When `true`, returns a `SingletonResourceMethods<Item, Payload>` with only
   * `get` and `update`. When `false` (default), returns the full CRUD shape.
   */
  singleton?: boolean
  /** Payload type (never referenced; helps TS infer `Payload`). */
  _payload?: Payload
}

export interface ResourceMethods<Item, Payload> {
  list(params?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<Item>>
  get(idOrSlug: number | string, options?: RequestOptions): Promise<Item>
  create(payload: Payload, options?: RequestOptions): Promise<Item>
  update(id: number, payload: Partial<Payload>, options?: RequestOptions): Promise<Item>
  delete(id: number, options?: { force?: boolean } & RequestOptions): Promise<{ deleted: true; previous: Item }>
}

export interface SingletonResourceMethods<Item, Payload> {
  get(options?: RequestOptions): Promise<Item>
  update(payload: Partial<Payload>, options?: RequestOptions): Promise<Item>
}

function validateItem<Item>(schema: z.ZodType<unknown> | undefined, raw: unknown, label: string): Item {
  if (!schema) {
    return raw as Item
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError(label, result.error.issues)
  }
  return result.data as Item
}

function applyExtraInvalidations(client: WordpressClient, prefixes: string[] | undefined, resourcePath: string): void {
  if (!prefixes) return
  for (const prefix of prefixes) {
    if (prefix === resourcePath) continue
    client.invalidate(prefix)
  }
}

export function createResource<Item, Payload>(
  client: WordpressClient,
  config: DefineResourceConfig<Payload> & { singleton: true },
): SingletonResourceMethods<Item, Payload>
export function createResource<Item, Payload>(
  client: WordpressClient,
  config: DefineResourceConfig<Payload> & { singleton?: false },
): ResourceMethods<Item, Payload>
export function createResource<Item, Payload>(
  client: WordpressClient,
  config: DefineResourceConfig<Payload>,
): ResourceMethods<Item, Payload> | SingletonResourceMethods<Item, Payload> {
  const { path, base, itemSchema, invalidates, singleton } = config
  const label = path

  if (singleton) {
    const singletonMethods: SingletonResourceMethods<Item, Payload> = {
      async get(options) {
        const response = await client.request<unknown>({
          method: 'GET',
          path,
          base,
          signal: options?.signal,
        })
        return validateItem<Item>(itemSchema, response.data, label)
      },
      async update(payload, options) {
        const response = await client.request<unknown>({
          method: 'POST',
          path,
          body: payload,
          base,
          requireAuth: true,
          signal: options?.signal,
        })
        applyExtraInvalidations(client, invalidates, path)
        return validateItem<Item>(itemSchema, response.data, label)
      },
    }
    return singletonMethods
  }

  const methods: ResourceMethods<Item, Payload> = {
    async list(params, options) {
      const response = await client.request<unknown[]>({
        method: 'GET',
        path,
        params,
        base,
        signal: options?.signal,
      })
      const page = typeof params?.page === 'number' ? params.page : 1
      const perPage = typeof params?.per_page === 'number' ? params.per_page : response.data.length
      const paginated = extractPagination(response, page, perPage)
      const items = paginated.data.map((raw) => validateItem<Item>(itemSchema, raw, label))
      return { ...paginated, data: items }
    },
    async get(idOrSlug, options) {
      if (typeof idOrSlug === 'number') {
        const response = await client.request<unknown>({
          method: 'GET',
          path: `${path}/${idOrSlug}`,
          base,
          signal: options?.signal,
        })
        return validateItem<Item>(itemSchema, response.data, label)
      }
      const response = await client.request<unknown[]>({
        method: 'GET',
        path,
        params: { slug: idOrSlug },
        base,
        signal: options?.signal,
      })
      if (!response.data.length) {
        throw new WordpressSchemaError(label, [{ path: [], message: `No item found with slug "${idOrSlug}"` }])
      }
      return validateItem<Item>(itemSchema, response.data[0], label)
    },
    async create(payload, options) {
      const response = await client.request<unknown>({
        method: 'POST',
        path,
        body: payload,
        base,
        requireAuth: true,
        signal: options?.signal,
      })
      applyExtraInvalidations(client, invalidates, path)
      return validateItem<Item>(itemSchema, response.data, label)
    },
    async update(id, payload, options) {
      const response = await client.request<unknown>({
        method: 'POST',
        path: `${path}/${id}`,
        body: payload,
        base,
        requireAuth: true,
        signal: options?.signal,
      })
      applyExtraInvalidations(client, invalidates, path)
      return validateItem<Item>(itemSchema, response.data, label)
    },
    async delete(id, options) {
      const force = options?.force ?? true
      const response = await client.request<{ deleted?: boolean; previous?: unknown }>({
        method: 'DELETE',
        path: `${path}/${id}`,
        params: { force: force ? 'true' : 'false' },
        base,
        requireAuth: true,
        signal: options?.signal,
      })
      applyExtraInvalidations(client, invalidates, path)
      if (!response.data.previous) {
        throw new WordpressSchemaError(label, [
          { path: ['previous'], message: 'Delete response did not include the previous item' },
        ])
      }
      return {
        deleted: true,
        previous: validateItem<Item>(itemSchema, response.data.previous, label),
      }
    },
  }
  return methods
}
