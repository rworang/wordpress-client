# @worang/wordpress-client

A typed, read-only WordPress REST API client for TypeScript and JavaScript. Designed for consuming and displaying WordPress content with runtime validation, automatic retries, caching, and request deduplication.

**This client is intentionally read-only.** It does not support authentication, write operations, or content management. It is built for front-end applications, static site generators, and any context where you need to _display_ WordPress content reliably.

## Table of Contents

1. [Installation & Requirements](#1-installation--requirements)
2. [Quick Start](#2-quick-start)
3. [Configuration](#3-configuration)
4. [Core Concepts](#4-core-concepts)
5. [API Reference](#5-api-reference)
6. [Query Parameters](#6-query-parameters)
7. [Error Handling](#7-error-handling)
8. [Pagination](#8-pagination)
9. [Custom Endpoints](#9-custom-endpoints)
10. [Limitations](#10-limitations)
11. [Version Notes](#11-version-notes)

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

- **Node.js** 18+
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
}

interface CacheOptions {
  /** Time-to-live in milliseconds — defaults to 60_000 (60s) */
  ttl?: number

  /** Maximum number of cached entries — defaults to 100 */
  maxEntries?: number
}
```

### Base URL handling

The trailing slash is stripped automatically. The client constructs two internal axios instances:

- **`http`** — for standard WP REST API requests at `{baseURL}/wp-json/{namespace}` (e.g., `/wp-json/wp/v2/posts`)
- **`siteHttp`** — for custom endpoints at `{baseURL}/wp-json` (used by `cacheVersion()`)

### Cache configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `cache` | `{}` (enabled) | Cache is **enabled by default** with default TTL and limit |
| `cache: false` | — | Disables caching entirely |
| `cache.ttl` | `60_000` (60s) | Time-to-live per entry in milliseconds |
| `cache.maxEntries` | `100` | Maximum cached entries; oldest evicted when full |

### Retry behavior

Retries use **exponential backoff** via `axios-retry`. The following conditions trigger a retry:

- Network errors (connection reset, DNS failure, etc.)
- HTTP 408 (Request Timeout)
- HTTP 429 (Too Many Requests)
- HTTP 5xx (Server Error)

| Setting | Default | Description |
|---------|---------|-------------|
| `retry.retries` | `3` | Maximum number of retry attempts |

---

## 4. Core Concepts

### Read-only design

This client only supports `GET` requests. There are no methods for creating, updating, or deleting content. Authentication headers are never sent. This is a deliberate constraint, not an omission — the client is purpose-built for content consumption.

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

All errors extend `WordpressError`, which itself extends the built-in `Error`. Use `instanceof` checks for granular handling. See [Error Handling](#7-error-handling) for details.

---

## 5. API Reference

### `posts(params?)`

Fetch a paginated list of posts with embedded author, categories, and featured media.

```typescript
async posts(params?: PostQueryParams): Promise<PaginatedResponse<Post>>
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

### `media(id)`

Fetch a single media item by its numeric ID.

```typescript
async media(id: number): Promise<Media>
```

```typescript
const image = await client.media(123)
console.log(image.url)                          // Full-size URL
console.log(image.sizes['thumbnail']?.url)       // Thumbnail variant
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

### `cacheVersion()`

Fetch the cache version from the `worang/v1/cache-version` custom endpoint (registered by the Worang Dev Tools plugin).

```typescript
async cacheVersion(): Promise<string | null>
```

Returns the version string, or `null` if the endpoint is unavailable. See [Custom Endpoints](#9-custom-endpoints).

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

## 6. Query Parameters

### `PostQueryParams`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (1-indexed) |
| `per_page` | `number` | `10` | Results per page |
| `search` | `string` | — | Full-text search term |
| `categories` | `number[]` | — | Include only posts in these category IDs |
| `categories_exclude` | `number[]` | — | Exclude posts in these category IDs |
| `tags` | `number[]` | — | Include only posts with these tag IDs |
| `tags_exclude` | `number[]` | — | Exclude posts with these tag IDs |
| `author` | `number` | — | Filter by author ID |
| `orderby` | `'date' \| 'title' \| 'slug' \| 'author' \| 'modified' \| 'relevance'` | `'date'` | Sort field |
| `order` | `'asc' \| 'desc'` | `'desc'` | Sort direction |
| `before` | `string` | — | ISO 8601 date — include posts published before this date |
| `after` | `string` | — | ISO 8601 date — include posts published after this date |
| `slug` | `string \| string[]` | — | Filter by exact slug(s) |
| `status` | `'publish' \| 'draft' \| 'pending' \| 'private' \| 'any'` | — | Post status filter |
| `sticky` | `boolean` | — | `true` for sticky posts only, `false` for non-sticky only |
| `exclude` | `number[]` | — | Exclude posts with these IDs |

### `TaxonomyQueryParams`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (1-indexed) |
| `per_page` | `number` | `100` | Results per page |
| `search` | `string` | — | Search term |
| `slug` | `string \| string[]` | — | Filter by exact slug(s) |
| `hide_empty` | `boolean` | `false` | Exclude categories with zero posts |
| `orderby` | `'id' \| 'name' \| 'slug' \| 'count'` | — | Sort field |
| `order` | `'asc' \| 'desc'` | — | Sort direction |

### `MediaQueryParams`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (1-indexed) |
| `per_page` | `number` | `10` | Results per page |
| `search` | `string` | — | Search term |
| `media_type` | `'image' \| 'video' \| 'audio' \| 'application'` | — | Filter by media type |
| `mime_type` | `string` | — | Filter by MIME type (e.g., `'image/jpeg'`) |
| `orderby` | `'date' \| 'title' \| 'id'` | — | Sort field |
| `order` | `'asc' \| 'desc'` | — | Sort direction |

---

## 7. Error Handling

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
  readonly statusCode?: number   // HTTP status code
  readonly code?: string         // WordPress error code (e.g., 'rest_post_invalid_id')
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
  readonly details?: Record<string, string[]>   // Field-level errors
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

## 8. Pagination

All list methods (`posts()`, `categories()`, `mediaList()`) return a `PaginatedResponse<T>`:

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number       // Total items across all pages
    totalPages: number  // Total number of pages
    page: number        // Current page (1-indexed)
    perPage: number     // Items per page
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

---

## 9. Custom Endpoints

### `cacheVersion()` — optional integration

Fetches a cache version string from the `worang/v1/cache-version` custom endpoint. This endpoint is **not part of the WordPress REST API** — it is registered by the **Worang Dev Tools** plugin.

```typescript
const version = await client.cacheVersion()
// "1709312400" or null if endpoint is unavailable
```

**How it works on the backend:** The plugin hooks into `save_post` to update a timestamp in `wp_options` whenever any post is saved. The REST route returns that timestamp:

```php
add_action('save_post', function($post_id) {
    if (wp_is_post_revision($post_id)) return;
    update_option('worang_cache_version', time());
});

add_action('rest_api_init', function() {
    register_rest_route('worang/v1', '/cache-version', [
        'methods'  => 'GET',
        'callback' => fn() => ['version' => get_option('worang_cache_version', 0)],
        'permission_callback' => '__return_true',
    ]);
});
```

**Use case:** Cache invalidation. Compare the returned version against a previously stored value to decide whether to refresh cached content. The version changes whenever a post is created, updated, or deleted.

**Graceful degradation:** If the plugin is not installed or the endpoint is unreachable, `cacheVersion()` returns `null`. It never throws. This makes it safe to use unconditionally — sites without the plugin simply skip cache-busting logic.

**Note:** The method uses the `siteHttp` axios instance (base path `/wp-json`) rather than the namespace-scoped instance, since it targets the `worang/v1` namespace instead of the default `wp/v2`.

---

## 10. Limitations

### Unsupported endpoints

The following WordPress REST API endpoints are **not** supported:

- **Users** — author data is available only as embedded data within posts
- **Tags** — no dedicated `tags()` or `tag()` methods (use `tags` / `tags_exclude` in `PostQueryParams` to filter by tag ID)
- **Pages** — no support for WordPress pages
- **Comments** — no comment retrieval or posting
- **Custom post types** — only the default `posts` endpoint is supported
- **WooCommerce** — no support for products, orders, or other WooCommerce endpoints

### No authentication

This client does not send authentication headers. Endpoints or post statuses that require authentication (drafts, private posts, etc.) will result in a `WordpressAuthError`.

### No write operations

There are no methods for creating, updating, or deleting any resource. All requests are HTTP `GET`.

### In-memory cache only

The TTL cache is stored in-process memory. It does not persist across restarts, is not shared between instances, and is not suitable for serverless environments where instances are short-lived.

### No media uploads

The `media()` and `mediaList()` methods are read-only. There is no support for uploading files to the WordPress media library.

---

## 11. Version Notes

The following features appear to be recent additions based on the commit history:

- **TTL response cache** with configurable `ttl` and `maxEntries` — enabled by default, disable with `cache: false`
- **`clearCache()`** method for manual cache invalidation
- **Request deduplication** — concurrent identical requests share a single HTTP call
- **`WordpressSchemaError`** — thrown when API responses fail Zod validation
- **`cacheVersion()`** — cache invalidation via Worang Dev Tools plugin endpoint
- **`exclude` parameter** in `PostQueryParams` — exclude specific post IDs from results
- **`mediaList()`** — paginated media listing
- **Optional `description` and `count`** fields on `Category`
- **Zod validation on `toMediaFromFeatured()`** — featured media embedded in posts is now validated

---

## Domain Types

### `Post`

```typescript
interface Post {
  id: number
  slug: string               // URL-friendly identifier
  title: string              // HTML entities decoded (plain string, not { rendered })
  content: string            // Full HTML content
  excerpt: string            // Short excerpt as HTML
  author: Author
  featuredImage: {
    id: number | undefined
    url: string
    alt: string
  }
  featuredMedia?: Media      // Full media object with responsive sizes
  date: string               // ISO 8601 publication date
  categories: Category[]
  sticky: boolean            // Whether post is pinned
}
```

### `Category`

```typescript
interface Category {
  id: number
  slug: string               // URL-friendly identifier
  name: string               // Display name
  description?: string
  count?: number             // Number of posts in this category
}
```

### `Media`

```typescript
interface Media {
  url: string                // Full-size URL
  id: number
  alt: string                // Alt text for accessibility
  mimeType: string
  width: number              // Full-size width in pixels
  height: number             // Full-size height in pixels
  sizes: Record<string, {
    url: string
    width: number
    height: number
    mimeType: string
    filesize?: number
  }>
}
```

### `Author`

```typescript
interface Author {
  id: number
  name: string
  url: string                // Author's website URL
  description: string        // Author bio
}
```

---

## Exports

The package exports the following from its single entry point:

```typescript
// Client
import { WordpressClient } from '@worang/wordpress-client'
import type { WordpressClientOptions } from '@worang/wordpress-client'

// Domain types
import type { Post, Media, Category, Author } from '@worang/wordpress-client'

// Query parameters
import type { PostQueryParams, TaxonomyQueryParams, MediaQueryParams } from '@worang/wordpress-client'

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

// Adapters (advanced use — transform raw WP responses into domain types)
import { toPost, toMedia, toCategory, toAuthor } from '@worang/wordpress-client'
```

---

## License

MIT
