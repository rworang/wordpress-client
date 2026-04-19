# @worang/wordpress-client

A typed WordPress REST API client for TypeScript and JavaScript. Designed for consuming, authoring, and managing WordPress content with runtime validation, automatic retries, caching, and request deduplication.

As of v0.2.0 the client supports reads, writes, media uploads, and auth — while preserving graceful-degradation defaults (no `auth` option = read-only behavior; failures never leak WordPress-shaped errors).

## Table of Contents

1. [Installation & Requirements](#1-installation--requirements)
2. [Quick Start](#2-quick-start)
3. [Configuration](#3-configuration)
4. [Authentication](#4-authentication)
5. [Core Concepts](#5-core-concepts)
6. [Writing Content](#6-writing-content)
7. [Custom Resources](#7-custom-resources)
8. [Companion Plugin](#8-companion-plugin)
9. [API Reference](#9-api-reference)
10. [Query Parameters](#10-query-parameters)
11. [Error Handling](#11-error-handling)
12. [Pagination](#12-pagination)
13. [Custom Endpoints](#13-custom-endpoints)
14. [Limitations](#14-limitations)
15. [Version Notes](#15-version-notes)

---

## 1. Installation & Requirements

```bash
pnpm install github:rworang/wordpress-client
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "@worang/wordpress-client": "github:rworang/wordpress-client"
  }
}
```

### Requirements

- **Node.js** 20+
- **TypeScript** 5.4+ (if using TypeScript)
- **ESM only** — this package ships as ES modules. Your project must use `"type": "module"` in `package.json` or import via dynamic `import()`.

---

## 2. Quick Start

### Minimal example

```typescript
import { WordpressClient } from '@worang/wordpress-client'

const client = new WordpressClient({ baseURL: 'https://your-site.com' })
const { data: posts } = await client.posts({ per_page: 5 })
```

### Realistic usage

```typescript
import { WordpressClient, WordpressNotFoundError } from '@worang/wordpress-client'
import type { Post, PaginatedResponse } from '@worang/wordpress-client'

const client = new WordpressClient({
  baseURL: 'https://your-site.com',
  timeout: 5000,
  retry: { retries: 2 },
  cache: { ttl: 30_000 },
})

// List posts filtered by category
const { data: posts, pagination } = await client.posts({
  categories: [5],
  per_page: 12,
  orderby: 'date',
  order: 'desc',
})

console.log(`Showing ${posts.length} of ${pagination.total} posts`)
console.log(`Page ${pagination.page} of ${pagination.totalPages}`)

// Get a single post by slug
const post = await client.post('hello-world')
if (post) {
  console.log(post.title)
  console.log(post.author.name)
  console.log(post.featuredMedia?.sizes['medium']?.url)
}

// Get a single post by ID (throws if not found)
try {
  const postById = await client.postById(42)
} catch (err) {
  if (err instanceof WordpressNotFoundError) {
    console.log('Post does not exist')
  }
}
```

---

## 3. Configuration

### Constructor options

```typescript
interface WordpressClientOptions {
  /** Base URL of the WordPress site (required) */
  baseURL: string

  /** REST API namespace — defaults to 'wp/v2' */
  namespace?: string

  /** Request timeout in milliseconds — defaults to 10000 */
  timeout?: number

  /** Retry configuration for transient failures */
  retry?: {
    /** Number of retry attempts — defaults to 3 */
    retries?: number
  }

  /** Response cache configuration. Set to false to disable caching entirely. */
  cache?: CacheOptions | false

  /** Auth configuration — enables write operations. Omit for read-only access. */
  auth?: AuthConfig
}

interface CacheOptions {
  /** Time-to-live in milliseconds — defaults to 60_000 (60s) */
  ttl?: number

  /** Maximum number of cached entries — defaults to 100 */
  maxEntries?: number
}
```

### Base URL handling

The trailing slash is stripped automatically. Internally the client maintains two base URLs:

- **API base** — `{baseURL}/wp-json/{namespace}` (e.g., `/wp-json/wp/v2/posts`). Most methods use this.
- **Site base** — `{baseURL}/wp-json`, for non-namespaced endpoints like the companion plugin routes. Reachable from `client.request({ ..., base: 'site' })` or `client.defineResource({ base: 'site', ... })`.

### Cache configuration

| Setting            | Default        | Description                                                |
| ------------------ | -------------- | ---------------------------------------------------------- |
| `cache`            | `{}` (enabled) | Cache is **enabled by default** with default TTL and limit |
| `cache: false`     | —              | Disables caching entirely                                  |
| `cache.ttl`        | `60_000` (60s) | Time-to-live per entry in milliseconds                     |
| `cache.maxEntries` | `100`          | Maximum cached entries; oldest evicted when full           |

### Retry behavior

Retries use exponential backoff on **idempotent methods only** (GET/HEAD/OPTIONS and explicitly-marked idempotent writes). Non-idempotent writes (POST/PUT/PATCH/DELETE) are never retried — a dropped request near a write boundary can produce duplicates.

The following conditions trigger a retry on idempotent methods:

- Network errors (connection reset, DNS failure, abort)
- HTTP 408 (Request Timeout)
- HTTP 429 (Too Many Requests)
- HTTP 5xx (Server Error)

| Setting         | Default | Description                      |
| --------------- | ------- | -------------------------------- |
| `retry.retries` | `3`     | Maximum number of retry attempts |

---

## 4. Authentication

v0.2.0 adds optional write support via WordPress [Application Passwords](https://wordpress.org/documentation/article/application-passwords/). Every endpoint that writes, uploads, deletes, or updates requires credentials; reads remain public.

### Static credentials

```typescript
const client = new WordpressClient({
  baseURL: 'https://myblog.com',
  auth: { username: 'alice', appPassword: 'xxxx xxxx xxxx xxxx xxxx xxxx' },
})
```

### Dynamic resolver (SPA session storage, token refresh, etc.)

```typescript
const client = new WordpressClient({
  baseURL: 'https://myblog.com',
  auth: {
    getAuthHeader: () => sessionStore.value.authHeader,
  },
})
```

The resolver is invoked on every request that needs auth. Return `null` to skip sending a header (the client then behaves as if unauthenticated for that call).

### Auth rules

- Read methods (`posts`, `pages`, `category`, …) work without `auth`.
- Write methods (create / update / delete / upload) throw `WordpressAuthError` when no credentials are available.
- Credentials are sent as `Authorization: Basic <base64(user:appPassword)>`. The encoder picks `btoa` in browsers and `Buffer.from` in Node.

---

## 5. Core Concepts

### Reads-first, writes on opt-in

Without `auth`, the client only makes `GET` requests. Once `auth` is configured, create / update / delete / upload become available and automatically invalidate the relevant cache prefixes (e.g. creating a post busts `/posts`, creating a tag busts both `/tags` and `/posts` because post embeds include term data).

### Why raw WordPress types are not exposed

The WordPress REST API returns deeply nested, inconsistently shaped responses. Titles arrive as `{ rendered: "Hello" }`. Embedded authors, categories, and featured media are buried inside `_embedded` arrays-of-arrays. Field names mix `snake_case` with arbitrary nesting.

This client treats raw API shapes as an internal implementation detail. Every response passes through:

```
WordPress API  →  Zod schema validation  →  Adapter  →  Clean domain type
```

1. **Zod validates** the raw response, catching unexpected shapes at runtime instead of letting malformed data propagate silently.
2. **Adapters flatten** nested structures into predictable, documented interfaces (`Post`, `Category`, `Media`, `Author`).
3. **Domain types** are the only public contract. They are stable, flat, and safe to build UI against.

This means consumers never depend on WordPress internals. If the REST API changes field nesting or naming, only the adapters and schemas need updating — application code stays untouched.

### Runtime validation with Zod

Every API response is validated against a Zod schema before being returned. If the WordPress API returns an unexpected shape, a `WordpressSchemaError` is thrown with detailed field-level error information rather than silently returning malformed data.

### Request deduplication

If multiple callers request the same endpoint with the same parameters concurrently, only one HTTP request is made. All callers receive the same response. The deduplication key is derived from the URL path and serialized query parameters.

Once the request settles (success or failure), the key is removed and subsequent calls will make a new request.

### TTL caching

Responses are cached in memory with a configurable time-to-live. Cache keys are identical to deduplication keys (URL + params). The cache uses FIFO eviction when `maxEntries` is reached.

Call `client.clearCache()` to manually invalidate all entries.

### Error model

All errors extend `WordpressError`, which itself extends the built-in `Error`. Use `instanceof` checks for granular handling. See [Error Handling](#11-error-handling) for details.

---

## 6. Writing Content

All write methods require `auth` to be configured on the client. Each mutation automatically invalidates the matching cache prefix.

### Posts

```typescript
const created = await client.createPost({ title: 'Hello', status: 'publish', content: 'Body' })
const updated = await client.updatePost(created.id, { status: 'draft' })
await client.deletePost(updated.id) // default force: true (skip trash)
```

### Pages

```typescript
const about = await client.createPage({ title: 'About', status: 'publish', content: 'About us' })
await client.updatePage(about.id, { menu_order: 2, parent: 0 })
await client.deletePage(about.id)
```

### Categories & tags

```typescript
const cat = await client.createCategory({ name: 'News', slug: 'news' })
await client.updateCategory(cat.id, { description: 'Site news' })
await client.deleteCategory(cat.id)

const tag = await client.createTag({ name: 'javascript' })
await client.updateTag(tag.id, { description: 'JS posts' })
await client.deleteTag(tag.id)
```

Category and tag writes invalidate both `/tags`|`/categories` **and** `/posts`, because post embeds include term data.

### Media

```typescript
// Metadata update (no binary)
await client.updateMedia(mediaId, { alt_text: 'Sunset over the bay' })

// Delete (force-delete by default — use { force: false } to send to trash)
await client.deleteMedia(mediaId)

// Upload a binary file (Blob or File)
const blob = new Blob([bytes], { type: 'image/jpeg' })
const media = await client.uploadMedia(blob, {
  filename: 'sunset.jpg',
  altText: 'Sunset over the bay',
  caption: 'Summer 2025',
})
```

`uploadMedia` sends the binary body with `Content-Type` preserved from the blob and `Content-Disposition: attachment; filename="..."`. If any of `altText` / `caption` / `title` are supplied, a follow-up `POST /media/:id` is issued to set the metadata — an upload with metadata is two round-trips.

### Custom writes via `request()`

For endpoints not covered by a built-in method, drop down to the low-level public API:

```typescript
const response = await client.request<Result>({
  method: 'POST',
  path: '/my/v1/feedback',
  body: { subject, message },
  requireAuth: true,
  base: 'site', // or 'api' (default)
})
```

`request()` handles retries (only for idempotent methods), auth headers, body encoding, and cache invalidation on writes. Pass `base: 'site'` to target `/wp-json/...` directly instead of `/wp-json/wp/v2/...`.

> **Note:** Write payloads are plain TypeScript interfaces, not Zod schemas. The WordPress server is the source of truth for field validation; malformed payloads surface as `WordpressValidationError` from a 400 response.

---

## 7. Custom Resources

`client.defineResource` wraps any REST endpoint as a typed resource with CRUD semantics. Use it for custom post types, plugin-provided endpoints, or anywhere the built-ins don't fit.

### CRUD resource

```typescript
interface Review {
  id: number
  title: string
  rating: number
}
interface ReviewPayload {
  title: string
  rating: number
}

const reviews = client.defineResource<Review, ReviewPayload>({
  path: '/worang/v1/reviews',
  base: 'site', // plugin-registered namespace — resolves to /wp-json/worang/v1/reviews
  invalidates: ['/worang/v1/reviews'], // optional extra prefixes busted after writes
})

const { data: recent } = await reviews.list({ per_page: 20 })
const one = await reviews.get(42) // by id
const bySlug = await reviews.get('best-review') // ?slug=...
const created = await reviews.create({ title: 'Great', rating: 5 })
const updated = await reviews.update(created.id, { rating: 4 })
await reviews.delete(created.id)
```

> **Pick the right `base`.** Use `base: 'site'` when `path` is already a full
> namespace (`worang/v1/...`, `wc/v3/...`). The default `base: 'api'` prefixes
> `/wp-json/wp/v2/`, so it's only correct when your endpoint is registered
> under the core namespace (e.g. a custom post type). Getting this wrong
> silently targets the wrong URL.

### Singleton resource

```typescript
interface SiteConfig {
  title: string
  tagline: string
}
interface SiteConfigPayload {
  title: string
  tagline?: string
}

const siteConfig = client.defineResource<SiteConfig, SiteConfigPayload>({
  path: '/worang/v1/site-config',
  base: 'site',
  singleton: true, // overload narrows the return type to { get, update }
})

const current = await siteConfig.get()
await siteConfig.update({ title: 'New Title' })
```

When `singleton: true` is set, the return type exposes only `get` and `update` — calling `.list()` or `.create()` is a TypeScript error.

### Options

| Field         | Type               | Description                                                                                     |
| ------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `path`        | `string`           | REST path without namespace prefix, e.g. `/worang/v1/reviews`                                   |
| `base`        | `'api' \| 'site'`  | `'api'` (default) resolves under `/wp-json/wp/v2`; `'site'` resolves under `/wp-json` directly  |
| `itemSchema`  | `z.ZodType<unknown>` | Optional Zod schema — runs `safeParse` and throws `WordpressSchemaError` on a mismatch        |
| `invalidates` | `string[]`         | Extra cache prefixes to invalidate after writes (on top of the auto-invalidation of `path`)     |
| `singleton`   | `boolean`          | When `true`, returns `{ get, update }` only                                                     |

---

## 8. Companion Plugin

The companion plugin is an **opt-in** WordPress plugin that extends what the SDK can do — currently just exposing a cache-busting token. When the plugin is absent, every `client.companion.*` method returns `null` gracefully.

```typescript
const info = await client.companion.version()
if (info?.features.includes('cache-version')) {
  const token = await client.companion.cacheVersion()
  // fold `token` into SWR / TanStack Query keys, service worker caches, etc.
}
```

- `client.companion.version()` → `{ version, features } | null` (404 → `null`)
- `client.companion.cacheVersion()` → `string | null`
- Any non-404 error (network failure, 5xx) is rethrown — "plugin absent" and "plugin broken" are different signals.

See [`docs/companion-plugin.md`](docs/companion-plugin.md) for the full contract and a reference PHP stub.

---

## 9. API Reference

### `posts(params?)`

Fetch a paginated list of posts with embedded author, categories, and featured media.

```typescript
async posts(params?: PostQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Post>>
```

**Defaults:** `page = 1`, `per_page = 10`

```typescript
const { data, pagination } = await client.posts({
  categories: [5],
  per_page: 12,
  orderby: 'date',
  order: 'desc',
})
```

**Error cases:** Throws `WordpressError` on server errors. Throws `WordpressSchemaError` if the response shape is invalid.

---

### `post(slug)`

Fetch a single post by its URL slug. Returns `null` if no post matches.

```typescript
async post(slug: string): Promise<Post | null>
```

```typescript
const post = await client.post('hello-world')
if (post) {
  console.log(post.title)
}
```

**Behavior:** Queries `/posts?slug={slug}&_embed=true` and returns the first result, or `null` if the array is empty. Does **not** throw on missing posts.

---

### `postById(id)`

Fetch a single post by its numeric ID.

```typescript
async postById(id: number): Promise<Post>
```

```typescript
const post = await client.postById(42)
```

**Error cases:** Throws `WordpressNotFoundError` if the post does not exist.

---

### `pages(params?)`

Fetch a paginated list of pages.

```typescript
async pages(params?: PageQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Page>>
```

**Defaults:** `page = 1`, `per_page = 10`

```typescript
const { data: pages } = await client.pages({ parent: 0 })
```

---

### `page(slug)`

Fetch a single page by its URL slug. Returns `null` if no page matches.

```typescript
async page(slug: string, options?: RequestOptions): Promise<Page | null>
```

```typescript
const about = await client.page('about')
```

---

### `pageById(id)`

Fetch a single page by its numeric ID.

```typescript
async pageById(id: number, options?: RequestOptions): Promise<Page>
```

```typescript
const page = await client.pageById(2)
```

**Error cases:** Throws `WordpressNotFoundError` if the page does not exist.

---

### `categories(params?)`

Fetch a paginated list of categories.

```typescript
async categories(params?: TaxonomyQueryParams): Promise<PaginatedResponse<Category>>
```

**Defaults:** `page = 1`, `per_page = 100`

```typescript
const { data: categories } = await client.categories({
  hide_empty: true,
  orderby: 'name',
})
```

---

### `category(slug)`

Fetch a single category by its URL slug. Returns `null` if no category matches.

```typescript
async category(slug: string): Promise<Category | null>
```

```typescript
const cat = await client.category('tech-news')
```

---

### `tags(params?)`

Fetch a paginated list of tags.

```typescript
async tags(params?: TaxonomyQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Tag>>
```

**Defaults:** `page = 1`, `per_page = 100`

```typescript
const { data: tags } = await client.tags({ hide_empty: true })
```

---

### `tag(slug)`

Fetch a single tag by its URL slug. Returns `null` if no tag matches.

```typescript
async tag(slug: string, options?: RequestOptions): Promise<Tag | null>
```

```typescript
const tag = await client.tag('javascript')
```

---

### `users(params?)`

Fetch a paginated list of users.

```typescript
async users(params?: UsersQueryParams, options?: RequestOptions): Promise<PaginatedResponse<Author>>
```

**Defaults:** `page = 1`, `per_page = 10`

```typescript
const { data: users } = await client.users({ per_page: 5 })
```

---

### `user(slug)`

Fetch a single user by their username slug. Returns `null` if no user matches.

```typescript
async user(slug: string, options?: RequestOptions): Promise<Author | null>
```

```typescript
const author = await client.user('jane-doe')
```

---

### `userById(id)`

Fetch a single user by their numeric ID.

```typescript
async userById(id: number, options?: RequestOptions): Promise<Author>
```

**Error cases:** Throws `WordpressNotFoundError` if the user does not exist. Throws `WordpressAuthError` if the host restricts user listings.

---

### `menus(params?)`

Fetch a paginated list of navigation menus.

```typescript
async menus(params?: MenuQueryParams, options?: RequestOptions): Promise<PaginatedResponse<NavigationMenu>>
```

**Defaults:** `page = 1`, `per_page = 100`

```typescript
const { data: menus } = await client.menus()
```

---

### `menuItems(params?)`

Fetch a paginated list of menu items, optionally filtered by menu.

```typescript
async menuItems(params?: MenuItemQueryParams, options?: RequestOptions): Promise<PaginatedResponse<MenuItem>>
```

**Defaults:** `page = 1`, `per_page = 100`

```typescript
const { data: items } = await client.menuItems({ menus: 3 })
```

---

### `media(id)`

Fetch a single media item by its numeric ID.

```typescript
async media(id: number): Promise<Media>
```

```typescript
const image = await client.media(123)
console.log(image.url) // Full-size URL
console.log(image.sizes['thumbnail']?.url) // Thumbnail variant
```

**Error cases:** Throws `WordpressNotFoundError` if the media item does not exist.

---

### `mediaList(params?)`

Fetch a paginated list of media items.

```typescript
async mediaList(params?: MediaQueryParams): Promise<PaginatedResponse<Media>>
```

**Defaults:** `page = 1`, `per_page = 10`

```typescript
const { data: images } = await client.mediaList({
  media_type: 'image',
  per_page: 20,
})
```

---

### Writing content (requires `auth`)

The following methods write to the WordPress REST API. All of them throw `WordpressAuthError` when `auth` is not configured. See [Writing Content](#6-writing-content) for worked examples.

| Method                                                                                                    | Returns                               | Notes                                                        |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `createPost(payload)`                                                                                     | `Post`                                | Invalidates `/posts`                                         |
| `updatePost(id, payload)`                                                                                 | `Post`                                | Invalidates `/posts`                                         |
| `deletePost(id, { force? })`                                                                              | `DeleteResult<Post>`                  | `force: true` by default; `force: false` returns `{ deleted: false; trashed: T }` |
| `createPage(payload)`                                                                                     | `Page`                                | Invalidates `/pages`                                         |
| `updatePage(id, payload)`                                                                                 | `Page`                                | Invalidates `/pages`                                         |
| `deletePage(id, { force? })`                                                                              | `DeleteResult<Page>`                  | `force: false` returns `{ deleted: false; trashed: T }`      |
| `createCategory(payload)`                                                                                 | `Category`                            | Invalidates `/categories` **and** `/posts`                   |
| `updateCategory(id, payload)`                                                                             | `Category`                            | Same invalidation                                            |
| `deleteCategory(id, { force? })`                                                                          | `DeleteResult<Category>`              | `force: false` returns `{ deleted: false; trashed: T }`      |
| `createTag(payload)`                                                                                      | `Tag`                                 | Invalidates `/tags` **and** `/posts`                         |
| `updateTag(id, payload)`                                                                                  | `Tag`                                 | Same                                                         |
| `deleteTag(id, { force? })`                                                                               | `DeleteResult<Tag>`                   | `force: false` returns `{ deleted: false; trashed: T }`      |
| `updateMedia(id, payload)`                                                                                | `Media`                               | Metadata-only                                                |
| `deleteMedia(id, { force? })`                                                                             | `DeleteResult<Media>`                 | Invalidates `/media`; `force: false` returns `{ deleted: false; trashed: T }` |
| `uploadMedia(file, { filename?, altText?, caption?, title? })`                                            | `Media`                               | Two HTTP round-trips when any metadata option is supplied    |

### `defineResource(config)`

Factory for wrapping arbitrary REST endpoints as typed resources. See [Custom Resources](#7-custom-resources).

```typescript
defineResource<Item, Payload>(config: DefineResourceConfig<Payload>): ResourceMethods<Item, Payload> | SingletonResourceMethods<Item, Payload>
```

### `companion.version()` / `companion.cacheVersion()`

Optional companion-plugin namespace with null-on-404 semantics. See [Companion Plugin](#8-companion-plugin).

### `request<T>(config)`

Low-level escape hatch for endpoints the built-ins don't cover. Handles retries, auth, body encoding, and cache invalidation.

### `fetchCustom<T>(endpoint, params?)`

Read-only helper for GET requests against custom REST namespaces. Returns `PaginatedResponse<T>` with the response payload typed as `T` (no adapter normalization, no Zod validation). See [Custom Endpoints](#13-custom-endpoints).

```typescript
async fetchCustom<T>(endpoint: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<T>>
```

### `invalidate(pattern)`

Invalidate cached entries by string prefix, `RegExp`, or predicate. Returns the number of keys cleared.

### `cacheVersion()` — **deprecated**

> Deprecated in v0.2.0. Use [`client.companion.cacheVersion()`](#8-companion-plugin) instead. The legacy method continues to hit the old `/worang/v1/cache-version` path and will be removed in v0.3.0.

```typescript
async cacheVersion(): Promise<string | null>
```

---

### `clearCache()`

Clear all cached responses.

```typescript
clearCache(): void
```

```typescript
client.clearCache()
```

---

## 10. Query Parameters

### `PostQueryParams`

| Parameter            | Type                                                                   | Default  | Description                                               |
| -------------------- | ---------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `page`               | `number`                                                               | `1`      | Page number (1-indexed)                                   |
| `per_page`           | `number`                                                               | `10`     | Results per page                                          |
| `search`             | `string`                                                               | —        | Full-text search term                                     |
| `categories`         | `number[]`                                                             | —        | Include only posts in these category IDs                  |
| `categories_exclude` | `number[]`                                                             | —        | Exclude posts in these category IDs                       |
| `tags`               | `number[]`                                                             | —        | Include only posts with these tag IDs                     |
| `tags_exclude`       | `number[]`                                                             | —        | Exclude posts with these tag IDs                          |
| `author`             | `number`                                                               | —        | Filter by author ID                                       |
| `orderby`            | `'date' \| 'title' \| 'slug' \| 'author' \| 'modified' \| 'relevance'` | `'date'` | Sort field                                                |
| `order`              | `'asc' \| 'desc'`                                                      | `'desc'` | Sort direction                                            |
| `before`             | `string`                                                               | —        | ISO 8601 date — include posts published before this date  |
| `after`              | `string`                                                               | —        | ISO 8601 date — include posts published after this date   |
| `slug`               | `string \| string[]`                                                   | —        | Filter by exact slug(s)                                   |
| `status`             | `'publish' \| 'draft' \| 'pending' \| 'private' \| 'any'`              | —        | Post status filter                                        |
| `sticky`             | `boolean`                                                              | —        | `true` for sticky posts only, `false` for non-sticky only |
| `exclude`            | `number[]`                                                             | —        | Exclude posts with these IDs                              |

### `TaxonomyQueryParams`

| Parameter    | Type                                  | Default | Description                        |
| ------------ | ------------------------------------- | ------- | ---------------------------------- |
| `page`       | `number`                              | `1`     | Page number (1-indexed)            |
| `per_page`   | `number`                              | `100`   | Results per page                   |
| `search`     | `string`                              | —       | Search term                        |
| `slug`       | `string \| string[]`                  | —       | Filter by exact slug(s)            |
| `hide_empty` | `boolean`                             | `false` | Exclude categories with zero posts |
| `orderby`    | `'id' \| 'name' \| 'slug' \| 'count'` | —       | Sort field                         |
| `order`      | `'asc' \| 'desc'`                     | —       | Sort direction                     |

### `MediaQueryParams`

| Parameter    | Type                                             | Default | Description                                |
| ------------ | ------------------------------------------------ | ------- | ------------------------------------------ |
| `page`       | `number`                                         | `1`     | Page number (1-indexed)                    |
| `per_page`   | `number`                                         | `10`    | Results per page                           |
| `search`     | `string`                                         | —       | Search term                                |
| `media_type` | `'image' \| 'video' \| 'audio' \| 'application'` | —       | Filter by media type                       |
| `mime_type`  | `string`                                         | —       | Filter by MIME type (e.g., `'image/jpeg'`) |
| `orderby`    | `'date' \| 'title' \| 'id'`                      | —       | Sort field                                 |
| `order`      | `'asc' \| 'desc'`                                | —       | Sort direction                             |

### `PageQueryParams`

| Parameter  | Type                                                      | Default  | Description                  |
| ---------- | --------------------------------------------------------- | -------- | ---------------------------- |
| `page`     | `number`                                                  | `1`      | Page number (1-indexed)      |
| `per_page` | `number`                                                  | `10`     | Results per page             |
| `search`   | `string`                                                  | —        | Search term                  |
| `slug`     | `string \| string[]`                                      | —        | Filter by exact slug(s)      |
| `status`   | `'publish' \| 'draft' \| 'pending' \| 'private' \| 'any'` | —        | Page status filter           |
| `parent`   | `number`                                                  | —        | Filter by parent page ID     |
| `orderby`  | `'date' \| 'title' \| 'slug' \| 'menu_order'`             | `'date'` | Sort field                   |
| `order`    | `'asc' \| 'desc'`                                         | `'desc'` | Sort direction               |
| `exclude`  | `number[]`                                                | —        | Exclude pages with these IDs |

### `MenuItemQueryParams`

| Parameter  | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `page`     | `number`               | `1`     | Page number (1-indexed)           |
| `per_page` | `number`               | `100`   | Results per page                  |
| `menus`    | `number`               | —       | Restrict items to a specific menu |
| `orderby`  | `'id' \| 'menu_order'` | —       | Sort field                        |
| `order`    | `'asc' \| 'desc'`      | —       | Sort direction                    |

### `MenuQueryParams`

| Parameter  | Type                       | Default | Description             |
| ---------- | -------------------------- | ------- | ----------------------- |
| `page`     | `number`                   | `1`     | Page number (1-indexed) |
| `per_page` | `number`                   | `100`   | Results per page        |
| `search`   | `string`                   | —       | Search term             |
| `orderby`  | `'id' \| 'name' \| 'slug'` | —       | Sort field              |
| `order`    | `'asc' \| 'desc'`          | —       | Sort direction          |

### `UsersQueryParams`

| Parameter  | Type                                                         | Default | Description             |
| ---------- | ------------------------------------------------------------ | ------- | ----------------------- |
| `page`     | `number`                                                     | `1`     | Page number (1-indexed) |
| `per_page` | `number`                                                     | `10`    | Results per page        |
| `search`   | `string`                                                     | —       | Search term             |
| `slug`     | `string \| string[]`                                         | —       | Filter by exact slug(s) |
| `orderby`  | `'id' \| 'include' \| 'name' \| 'registered_date' \| 'slug'` | —       | Sort field              |
| `order`    | `'asc' \| 'desc'`                                            | —       | Sort direction          |

---

## 11. Error Handling

All errors extend `WordpressError`. Use `instanceof` for granular handling.

### Error hierarchy

```
Error
  └── WordpressError             — Base class for all API errors
        ├── WordpressNotFoundError      — 404 responses
        ├── WordpressAuthError          — 401/403 responses
        ├── WordpressValidationError    — 400 responses (invalid parameters)
        └── WordpressSchemaError        — Response didn't match expected Zod schema
```

### `WordpressError`

Base class for any WordPress API failure.

```typescript
class WordpressError extends Error {
  readonly statusCode?: number // HTTP status code
  readonly code?: string // WordPress error code (e.g., 'rest_post_invalid_id')
}
```

Thrown for any HTTP error not covered by a more specific subclass (e.g., 500 Internal Server Error).

### `WordpressNotFoundError`

Thrown when a resource returns HTTP 404.

```typescript
class WordpressNotFoundError extends WordpressError {
  // statusCode: 404
  // code: 'not_found'
}
```

**Triggered by:** `postById()` and `media()` when the resource does not exist.

**Note:** `post(slug)` and `category(slug)` return `null` instead of throwing.

### `WordpressAuthError`

Thrown when the API responds with HTTP 401 or 403.

```typescript
class WordpressAuthError extends WordpressError {
  // statusCode: 401
  // code: 'unauthorized'
}
```

This may occur when querying non-public post statuses or restricted endpoints.

### `WordpressValidationError`

Thrown for HTTP 400 responses indicating invalid request parameters.

```typescript
class WordpressValidationError extends WordpressError {
  readonly details?: Record<string, string[]> // Field-level errors
  // statusCode: 400
  // code: 'validation_error'
}
```

### `WordpressSchemaError`

Thrown when an API response passes HTTP validation but fails Zod schema validation — meaning the response shape is unexpected.

```typescript
class WordpressSchemaError extends WordpressError {
  readonly issues: Array<{ path: PropertyKey[]; message: string }>
}
```

**Example message:** `"Invalid media response from API: width: Expected number, height: Expected number"`

### Error handling pattern

```typescript
import {
  WordpressError,
  WordpressNotFoundError,
  WordpressAuthError,
  WordpressSchemaError,
} from '@worang/wordpress-client'

try {
  const post = await client.postById(99999)
} catch (err) {
  if (err instanceof WordpressNotFoundError) {
    // Post doesn't exist — show 404 page
  } else if (err instanceof WordpressAuthError) {
    // Not authorized — the post may be private
  } else if (err instanceof WordpressSchemaError) {
    // API returned an unexpected shape — log for debugging
    console.error(err.issues)
  } else if (err instanceof WordpressError) {
    // Other API error (5xx, etc.)
    console.error(`API error ${err.statusCode}: ${err.message}`)
  }
}
```

---

## 12. Pagination

All list methods (`posts()`, `categories()`, `mediaList()`) return a `PaginatedResponse<T>`:

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number // Total items across all pages
    totalPages: number // Total number of pages
    page: number // Current page (1-indexed)
    perPage: number // Items per page
  }
}
```

Pagination metadata is extracted from the `X-WP-Total` and `X-WP-TotalPages` response headers set by the WordPress REST API.

### Iterating through pages

```typescript
let page = 1
let totalPages = 1

do {
  const result = await client.posts({ page, per_page: 20 })
  totalPages = result.pagination.totalPages

  for (const post of result.data) {
    console.log(post.title)
  }

  page++
} while (page <= totalPages)
```

### Checking for more pages

```typescript
const { pagination } = await client.posts({ page: 1 })
const hasNextPage = pagination.page < pagination.totalPages
```

### `fetchAll(fn)` — fetch all pages sequentially

`fetchAll` iterates through all pages of a paginated method and returns every item as a flat array. Pages are requested **sequentially** (one at a time), not in parallel.

```typescript
import { fetchAll } from '@worang/wordpress-client'

// Fetch every published post, one page at a time
const allPosts = await fetchAll((page) => client.posts({ page, per_page: 100 }))
console.log(allPosts.length) // total count across all pages
```

`fetchAll` calls the provided function with `page = 1` first, reads `pagination.totalPages` from the response, then calls the function for pages 2, 3, … N in order. All results are concatenated and returned.

---

## 13. Custom Endpoints

### `fetchCustom()` — read-only custom namespaces

For read-only GETs against custom REST namespaces, `fetchCustom<T>(endpoint, params?)` returns a `PaginatedResponse<T>` without adapter normalization — the response payload is typed as `T` directly.

```typescript
const { data } = await client.fetchCustom<{ id: number; title: string }>('/my/v1/articles', {
  per_page: 10,
})
```

### Write or mutate: use `request()` or `defineResource()`

For anything beyond a read, drop to `client.request({...})` (see [Writing Content](#6-writing-content)) or wrap the endpoint as a typed resource with `client.defineResource({ path, ... })` (see [Custom Resources](#7-custom-resources)).

### Companion plugin

See [§8 Companion Plugin](#8-companion-plugin) for the opt-in `worang-client/v1/*` namespace with null-on-404 fallback.

### Legacy: `cacheVersion()` — **deprecated**

The legacy `cacheVersion()` method (targeting `/worang/v1/cache-version`) still works but is deprecated in favor of `client.companion.cacheVersion()` (targeting `/worang-client/v1/cache-version`). The legacy method is scheduled for removal in v0.3.0.

---

## 14. Limitations

### Unsupported endpoints

- **Comments** — no comment retrieval or posting helpers.
- **WooCommerce** — no support for products, orders, or other WooCommerce endpoints.
- **Revisions / autosaves** — `updatePost`/`updatePage` write directly to the current record; revisions history is not exposed.
- **Multisite-aware routing** — a single `baseURL` is assumed; switching sites requires multiple client instances.

For custom post types or plugin-provided endpoints, use `client.defineResource({ path, ... })` or `client.request({ ... })`.

### No built-in token refresh

The static `{ username, appPassword }` form sends the same credentials on every request. For OAuth/JWT-style flows with rotation, use the dynamic `auth: { getAuthHeader }` form — the resolver runs on every authed call and can return a freshly-minted header.

### In-memory cache only

The TTL cache lives in-process. It does not persist across restarts, is not shared between instances, and is not suitable for serverless environments where instances are short-lived.

### Node ESM + `moduleResolution: bundler`

The package ships ESM only with `"type": "module"`. TypeScript consumers should set `moduleResolution: bundler` (or `node16`/`nodenext`) in `tsconfig.json`. Bundlerless `node` resolution will not find the package's `exports` map correctly.

### `List` methods default to `per_page = 10`

Matches the WP REST default. For complete enumeration, pair with `fetchAll((page) => client.posts({ page, per_page: 100 }))`.

---

## 15. Version Notes

### 0.2.0 — Authoring

- Application Password auth via `auth: { username, appPassword }` or `auth: { getAuthHeader }`
- CUD on posts, pages, categories, tags, media (including binary `uploadMedia`)
- `userById(id)` method
- Public `client.request<T>()` + `client.invalidate(pattern)` for custom writes
- `client.defineResource({ ... })` factory for custom resources (CRUD or singleton)
- `client.companion` namespace with null-on-404 fallback
- `docs/companion-plugin.md` contract spec for the optional WP plugin
- `cacheVersion()` deprecated — use `client.companion.cacheVersion()` instead

### 0.1.0

- Typed read client for posts, pages, categories, tags, users, media, menus
- Zod-validated responses + adapter-normalized domain types
- TTL response cache, request deduplication, retry with exponential backoff
- `fetchAll()` helper for sequential full-enumeration

---

## Domain Types

### `Post`

```typescript
interface Post {
  id: number
  slug: string // URL-friendly identifier
  title: string // HTML entities decoded (plain string, not { rendered })
  content: string // Full HTML content
  excerpt: string // Short excerpt as HTML
  author: Author
  featuredImage: {
    id: number | undefined
    url: string
    alt: string
  }
  featuredMedia?: Media // Full media object with responsive sizes
  date: string // ISO 8601 publication date
  categories: Category[]
  tags: Tag[]
  sticky: boolean // Whether post is pinned
}
```

### `Category`

```typescript
interface Category {
  id: number
  slug: string // URL-friendly identifier
  name: string // Display name
  description?: string
  count?: number // Number of posts in this category
}
```

### `Media`

```typescript
interface Media {
  url: string // Full-size URL
  id: number
  alt: string // Alt text for accessibility
  mimeType: string
  width: number // Full-size width in pixels
  height: number // Full-size height in pixels
  sizes: Record<
    string,
    {
      url: string
      width: number
      height: number
      mimeType: string
      filesize?: number
    }
  >
}
```

### `Author`

```typescript
interface Author {
  id: number
  name: string
  url: string // Author's website URL
  description: string // Author bio
}
```

---

## Exports

The package exports the following from its single entry point:

```typescript
// Client
import { WordpressClient, fetchAll } from '@worang/wordpress-client'
import type {
  WordpressClientOptions,
  RequestOptions,
  RequestConfig,
  RequestMethod,
  AuthConfig,
  AuthCredentials,
  AuthResolver,
} from '@worang/wordpress-client'

// Domain types
import type { Post, Page, Media, Category, Tag, MenuItem, NavigationMenu, Author } from '@worang/wordpress-client'

// Query parameters
import type {
  PostQueryParams,
  PageQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
  MenuItemQueryParams,
  MenuQueryParams,
  UsersQueryParams,
} from '@worang/wordpress-client'

// Write payloads
import type {
  PostWritePayload,
  PageWritePayload,
  TermWritePayload,
  MediaWritePayload,
} from '@worang/wordpress-client'

// Custom resources
import type {
  DefineResourceConfig,
  ResourceMethods,
  SingletonResourceMethods,
} from '@worang/wordpress-client'

// Companion plugin
import type { CompanionNamespace, CompanionVersion } from '@worang/wordpress-client'

// Response types
import type { PaginatedResponse, CacheOptions } from '@worang/wordpress-client'

// Errors
import {
  WordpressError,
  WordpressNotFoundError,
  WordpressAuthError,
  WordpressValidationError,
  WordpressSchemaError,
} from '@worang/wordpress-client'
```

---

## License

MIT
