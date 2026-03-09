# Design: `@worang/wordpress-client` (Blocks 0–5)

**System:** `@worang/wordpress-client`
**Blocks:** 0 (foundational fixes), 1 (Pages), 2 (Tags + query params), 3 (CPT escape hatch), 4 (Navigation), 5 (DX utilities)
**Source:** existing repo at `/home/amnezia/projects/wordpress-client`

---

## 1. Boundaries

| Boundary | Left side | Right side |
|----------|-----------|------------|
| Transport ↔ Domain | `src/client.ts` (HTTP, retry, cache, dedup) | `src/types/`, `src/adapters/` |
| Raw API ↔ Domain types | `src/schemas/` (Zod validation) | `src/adapters/` (transformation) |
| Adapters ↔ Public API | `src/adapters/index.ts` (internal barrel) | `src/index.ts` (public barrel) |
| Utility ↔ Client | `src/utils/` (stateless helpers) | `src/client.ts` (stateful, passes context in) |
| Package ↔ Consumer | `src/index.ts` | caller code |

The critical constraint: **`src/utils/` and `src/schemas/` and `src/adapters/` must not depend on `src/client.ts`**. The client is the composition root; nothing flows back into it from below.

---

## 2. Module Layout

### Current state (pre-Block 0)

```
src/
├── adapters/
│   ├── index.ts          # internal barrel — re-exports adapter functions
│   ├── media.ts          # toMedia(), toMediaFromFeatured(), hydrateMedia() [DEPRECATED]
│   ├── post.ts           # toPost()
│   ├── category.ts       # toCategory()
│   └── author.ts         # toAuthor()
├── schemas/
│   ├── index.ts          # schema barrel
│   ├── post.ts           # RawPostSchema
│   ├── media.ts          # RawMediaSchema
│   ├── category.ts       # RawCategorySchema
│   └── author.ts         # RawAuthorSchema
├── types/
│   ├── index.ts          # type barrel
│   ├── domain.ts         # Post, Category, Media, Author
│   ├── raw.ts            # RawPost, RawCategory, RawMedia, RawAuthor
│   └── params.ts         # PostQueryParams, TaxonomyQueryParams, MediaQueryParams
├── utils/
│   ├── cache.ts          # request cache
│   ├── dedup.ts          # in-flight deduplication (module-level map — bug)
│   └── pagination.ts     # PaginatedResponse<T>, extractPagination()
├── client.ts             # WordpressClient class
├── errors.ts             # error hierarchy
└── index.ts              # public API barrel
```

### Target state (after Blocks 0–5)

```
src/
├── adapters/
│   ├── index.ts          # internal barrel — re-exports adapter functions
│   ├── media.ts          # toMedia(), toMediaFromFeatured()  [hydrateMedia REMOVED]
│   ├── post.ts           # toPost()
│   ├── page.ts           # toPage()                         [NEW — Block 1]
│   ├── category.ts       # toCategory()
│   ├── tag.ts            # toTag()                          [NEW — Block 2]
│   ├── author.ts         # toAuthor()
│   └── navigation.ts     # toNavigation()                   [NEW — Block 4]
├── schemas/
│   ├── index.ts          # schema barrel
│   ├── post.ts           # RawPostSchema
│   ├── media.ts          # RawMediaSchema
│   ├── page.ts           # RawPageSchema                    [NEW — Block 1]
│   ├── category.ts       # RawCategorySchema
│   ├── tag.ts            # RawTagSchema                     [NEW — Block 2]
│   ├── author.ts         # RawAuthorSchema
│   └── navigation.ts     # RawNavigationSchema              [NEW — Block 4]
├── types/
│   ├── index.ts          # type barrel
│   ├── domain.ts         # + Page, Tag, NavigationMenu, MenuItem
│   ├── raw.ts            # + RawPage, RawTag, RawNavigation
│   └── params.ts         # + PageQueryParams; extended Post/Taxonomy/MediaQueryParams
├── utils/
│   ├── cache.ts          # request cache (unchanged)
│   ├── dedup.ts          # accepts external Map — no module-level state [FIXED — Block 0]
│   └── pagination.ts     # + fetchAll<T>()                  [EXTENDED — Block 5]
├── client.ts             # + page/tag/navigation methods; fetchCustom(); inflight as instance prop
├── errors.ts             # WordpressValidationError thrown on 400; AuthError status fixed [Block 0]
└── index.ts              # public API barrel (updated exports)
```

---

## 3. Interface Definitions

### Block 0 — Errors (`src/errors.ts`)

```typescript
// WordpressAuthError: pass actual status, not hardcoded 401
class WordpressAuthError extends WordpressError {
  constructor(status: number, message: string)
  // status is now the real HTTP status (401 OR 403)
}

// WordpressValidationError: thrown on HTTP 400 (was defined but never thrown)
class WordpressValidationError extends WordpressError {
  // no interface change — just ensure handleError() throws it on status === 400
}
```

### Block 0 — Dedup (`src/utils/dedup.ts`)

Dedup must no longer own a module-level map. The client passes its own map in.

```typescript
// Before (bug):
//   const inflight = new Map<string, Promise<unknown>>()   // module-level
//   export function deduplicate<T>(key, fn): Promise<T>

// After (fixed):
export function deduplicate<T>(
  key: string,
  inflight: Map<string, Promise<unknown>>,
  fn: () => Promise<T>
): Promise<T>
```

### Block 0 — Client dedup ownership (`src/client.ts`)

```typescript
class WordpressClient {
  private readonly inflight: Map<string, Promise<unknown>>

  constructor(config: WordpressClientOptions) {
    this.inflight = new Map()
    // ... rest of init
  }
  // all calls to deduplicate() pass this.inflight
}
```

### Block 1 — Page domain type (`src/types/domain.ts`)

```typescript
interface Page {
  id: number
  slug: string
  title: string           // HTML entities decoded
  content: string         // rendered HTML
  excerpt: string         // rendered HTML
  date: string            // ISO 8601
  modified: string        // ISO 8601
  status: string          // 'publish' | 'draft' | 'private' | ...
  parent: number          // 0 = top-level page; >0 = child page (ID of parent)
  menuOrder: number       // for manual ordering
  featuredMediaId: number | null
  featuredMedia?: Media
}
```

Note: `Page` does NOT have `sticky`, `categories`, or `author` embedded (pages use different
`_embedded` structure than posts — this is why `RawPageSchema` must be distinct from `RawPostSchema`).

### Block 1 — Page query params (`src/types/params.ts`)

```typescript
interface PageQueryParams {
  page?: number
  perPage?: number
  search?: string
  slug?: string
  parent?: number           // filter by parent page ID (0 = top-level only)
  orderBy?: 'id' | 'date' | 'modified' | 'title' | 'menu_order'
  order?: 'asc' | 'desc'
  status?: string
}
```

### Block 1 — Client methods

```typescript
class WordpressClient {
  page(slug: string): Promise<Page | null>
  pageById(id: number): Promise<Page | null>
  pages(params?: PageQueryParams): Promise<PaginatedResponse<Page>>
}
```

### Block 2 — Tag domain type (`src/types/domain.ts`)

```typescript
interface Tag {
  id: number
  slug: string
  name: string
  description?: string
  count?: number
  // tags are FLAT — no parent field (unlike Category)
}
```

Note: `Category` must gain a `parent` field (currently absent, per gap analysis) in this block too:

```typescript
interface Category {
  id: number
  slug: string
  name: string
  description?: string
  count?: number
  parent: number          // ADD: 0 = top-level; ID = child category
}
```

### Block 2 — Extended query params (`src/types/params.ts`)

```typescript
// Additions to PostQueryParams:
interface PostQueryParams {
  // ... existing fields ...
  modifiedBefore?: string   // ISO 8601 — maps to modified_before
  modifiedAfter?: string    // ISO 8601 — maps to modified_after
}

// Additions to TaxonomyQueryParams (applies to both categories and tags):
interface TaxonomyQueryParams {
  // ... existing fields ...
  include?: number[]        // only return these IDs
  exclude?: number[]        // exclude these IDs
  parent?: number           // categories only (hierarchical); tags ignore this
}

// Additions to MediaQueryParams:
interface MediaQueryParams {
  // ... existing fields ...
  author?: number           // filter by author ID
  parent?: number           // filter by parent post/page ID
}
```

### Block 2 — Client methods

```typescript
class WordpressClient {
  tags(params?: TaxonomyQueryParams): Promise<PaginatedResponse<Tag>>
  tag(slug: string): Promise<Tag | null>
  tagById(id: number): Promise<Tag | null>
}
```

### Block 3 — CPT escape hatch (`src/client.ts`)

```typescript
class WordpressClient {
  fetchCustom<T>(
    endpoint: string,                 // e.g. 'wp/v2/portfolio' or full path
    params?: Record<string, unknown>, // forwarded as query params
    schema?: z.ZodType<T>             // optional — caller-supplied Zod validation
  ): Promise<PaginatedResponse<T>>
  // Returns PaginatedResponse<T> using existing extractPagination()
  // If schema provided: validate each item; throw WordpressSchemaError on failure
  // If schema omitted: data is typed as T with no runtime validation (caller responsibility)
}
```

### Block 4 — Navigation domain types (`src/types/domain.ts`)

```typescript
interface MenuItem {
  id: number
  title: string
  url: string
  target: '_blank' | ''
  order: number
  parent: number          // 0 = top-level; >0 = child item (ID of parent MenuItem)
  children: MenuItem[]
}

interface NavigationMenu {
  id: number
  slug: string
  title: string
  items: MenuItem[]
}
```

Note: This targets WP 6.3+ `wp/v2/navigation`. For sites on older WP, callers use
`fetchCustom()` against a navigation plugin endpoint. The client does not handle legacy menus.

### Block 4 — Client methods

```typescript
class WordpressClient {
  navigationMenus(): Promise<NavigationMenu[]>
  navigationMenu(slug: string): Promise<NavigationMenu | null>
}
```

### Block 5 — `fetchAll` utility (`src/utils/pagination.ts`)

```typescript
// Added to existing pagination.ts
async function fetchAll<T>(
  fn: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]>
// Calls fn(1), reads totalPages, calls fn(2)...fn(n) in parallel, concatenates data[]
// Caller is responsible for not calling this on endpoints with unbounded result sets
```

### Block 5 — Abort signal support (`src/client.ts`)

```typescript
// Per-request abort via optional last argument on all methods:
interface RequestOptions {
  signal?: AbortSignal
}

// Design decision on dedup + abort interaction:
// If a caller provides a signal and that signal fires, only that caller's
// promise rejects with AbortError. Other callers waiting on the same dedup key
// are unaffected — their promise continues. This means: the underlying request
// is NOT cancelled when the first caller aborts (it completes for remaining waiters).
// Accept this trade-off in sprint 1. A true per-request cancel would require
// a separate HTTP request per caller, losing dedup benefits.
```

---

## 4. Data Flow

```
Consumer call (e.g. client.post('hello-world'))
  │
  ▼
WordpressClient
  ├── Cache check (src/utils/cache.ts)
  │     hit → return cached value
  │     miss → continue
  ├── Dedup check (src/utils/dedup.ts, using this.inflight)
  │     in-flight → wait on existing promise
  │     new → continue
  ▼
Axios request (with retry on network errors + 408/429)
  │
  ▼
HTTP response
  ├── status 400 → throw WordpressValidationError   [Block 0 fix]
  ├── status 401 → throw WordpressAuthError(401)    [Block 0 fix]
  ├── status 403 → throw WordpressAuthError(403)    [Block 0 fix]
  ├── status 404 → return null (single-item methods)
  ├── status 5xx → let retry exhaust, then throw WordpressNetworkError
  └── status 2xx → continue
  │
  ▼
Zod schema validation (src/schemas/<entity>.ts)
  │
  ├── fail → throw WordpressSchemaError
  └── pass → continue
  │
  ▼
Adapter transform (src/adapters/<entity>.ts)
  Raw API shape → Domain type
  │
  ▼
Pagination extraction (src/utils/pagination.ts — list methods only)
  │
  ▼
Cache store → return to consumer
```

---

## 5. Dependency Map

| Module | Depends on | Must NOT depend on |
|--------|------------|--------------------|
| `src/types/` | nothing | everything else |
| `src/schemas/` | `zod` (external) | `src/client.ts`, `src/utils/`, `src/adapters/` |
| `src/errors.ts` | nothing | everything else |
| `src/utils/` | `src/types/` (pagination only) | `src/client.ts`, `src/adapters/`, `src/schemas/` |
| `src/adapters/` | `src/types/`, `src/schemas/`, `src/errors.ts` | `src/client.ts`, `src/utils/` |
| `src/client.ts` | all of above + `axios` | nothing below this level |
| `src/index.ts` | `src/client.ts`, `src/types/`, `src/errors.ts` | `src/adapters/`, `src/schemas/` (internal — do not re-export) |

`src/adapters/index.ts` is an **internal** barrel. It must NOT be re-exported from `src/index.ts`.
Consumers import domain types from `@worang/wordpress-client`, not adapter functions.

---

## 6. Public API Surface (`src/index.ts`)

After Blocks 0–5, `src/index.ts` exports:

```typescript
// Client
export { WordpressClient } from './client'
export type { WordpressClientOptions } from './client'

// Domain types
export type { Post, Page, Tag, Category, Author, Media, NavigationMenu, MenuItem } from './types/domain'

// Params
export type {
  PostQueryParams,
  PageQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
} from './types/params'

// Pagination
export type { PaginatedResponse } from './utils/pagination'
export { fetchAll } from './utils/pagination'

// Errors
export {
  WordpressError,
  WordpressNetworkError,
  WordpressAuthError,
  WordpressNotFoundError,
  WordpressValidationError,
  WordpressSchemaError,
} from './errors'
```

NOT exported: adapter functions, schema objects, raw types, internal utilities (cache, dedup).
