# @worang/wordpress-client

A typed WordPress REST API client for TypeScript/JavaScript.

## Quick Start

```typescript
import { WordpressClient } from '@worang/wordpress-client'

const client = new WordpressClient({
  baseURL: 'https://your-wordpress-site.com',
})

// Fetch the latest posts
const { data: posts } = await client.posts()
console.log(posts[0].title)
```

## Common Tasks

### Fetching Posts

**Get the latest posts:**

```typescript
const { data: posts } = await client.posts()
```

**With pagination:**

```typescript
const { data: posts, pagination } = await client.posts({
  page: 1,
  per_page: 5,
})

console.log(`Showing ${posts.length} of ${pagination.total} posts`)
console.log(`Page ${pagination.page} of ${pagination.totalPages}`)
```

**Filter by category:**

```typescript
// Get posts from category ID 3
const { data: techPosts } = await client.posts({
  categories: [3],
})

// Exclude a category
const { data: nonNewsPosts } = await client.posts({
  categories_exclude: [7],
})
```

**Search posts:**

```typescript
const { data: results } = await client.posts({
  search: 'typescript tutorial',
  per_page: 10,
})
```

**Sort posts:**

```typescript
// Oldest first
const { data: oldest } = await client.posts({
  orderby: 'date',
  order: 'asc',
})

// By title
const { data: alphabetical } = await client.posts({
  orderby: 'title',
  order: 'asc',
})
```

**Get a single post:**

```typescript
// By slug (returns null if not found)
const post = await client.post('hello-world')

// By ID (throws WordpressNotFoundError if not found)
const post = await client.postById(42)
```

### Working with Categories

**List all categories:**

```typescript
const { data: categories } = await client.categories()
```

**Only categories with posts:**

```typescript
const { data: categories } = await client.categories({
  hide_empty: true,
})
```

**Get a single category:**

```typescript
const category = await client.category('tutorials')
if (category) {
  console.log(`${category.name} has ${category.count} posts`)
}
```

### Getting Media

**Fetch media by ID:**

```typescript
const image = await client.media(123)
console.log(image.url)
console.log(image.sizes.thumbnail?.url)
```

**List media:**

```typescript
// All images
const { data: images } = await client.mediaList({
  media_type: 'image',
})

// Search media
const { data: logos } = await client.mediaList({
  search: 'logo',
})
```

## Understanding the Response

### Posts

A `Post` object contains:

```typescript
{
  id: number
  slug: string
  title: string           // Already extracted from { rendered: '...' }
  content: string         // HTML content
  excerpt: string         // HTML excerpt
  date: string            // ISO date string
  author: Author          // { id, name, url, description }
  categories: Category[]  // Array of category objects
  featuredImage: {        // Quick access to featured image
    id: number | undefined
    url: string
    alt: string
  }
  featuredMedia?: Media   // Full media object with all sizes
}
```

The client automatically:
- Extracts `title`, `content`, and `excerpt` from WordPress's `{ rendered: '...' }` format
- Embeds author and category data (no extra API calls needed)
- Hydrates featured media with all responsive image sizes

### Pagination

All list methods return a `PaginatedResponse`:

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

**Example:**

```typescript
const { data, pagination } = await client.posts({ page: 2, per_page: 10 })

// Check if there are more pages
if (pagination.page < pagination.totalPages) {
  // Load next page
  const next = await client.posts({ page: pagination.page + 1, per_page: 10 })
}
```

### Media

A `Media` object contains:

```typescript
{
  id: number
  url: string           // Full-size URL
  alt: string           // Alt text
  mimeType: string      // e.g., 'image/jpeg'
  width: number         // Full-size dimensions
  height: number
  sizes: {              // Responsive sizes
    thumbnail?: { url, width, height, mimeType, filesize? }
    medium?: { ... }
    large?: { ... }
    // ... other registered sizes
  }
}
```

## Error Handling

The client throws typed errors you can catch:

```typescript
import {
  WordpressClient,
  WordpressNotFoundError,
  WordpressAuthError,
  WordpressError,
} from '@worang/wordpress-client'

try {
  const post = await client.postById(99999)
} catch (err) {
  if (err instanceof WordpressNotFoundError) {
    // 404 - Resource doesn't exist
    console.log('Post not found')
  } else if (err instanceof WordpressAuthError) {
    // 401/403 - Authentication required or forbidden
    console.log('Not authorized')
  } else if (err instanceof WordpressError) {
    // Other API errors
    console.log(`API error: ${err.message}`)
    console.log(`Status: ${err.statusCode}`)
  }
}
```

**Error types:**

| Error | When thrown |
|-------|-------------|
| `WordpressNotFoundError` | Resource doesn't exist (404) |
| `WordpressAuthError` | Authentication failed (401/403) |
| `WordpressValidationError` | Invalid parameters (400) |
| `WordpressError` | Base class for all API errors |

## Types

Import types for your own use:

```typescript
import type {
  Post,
  Category,
  Author,
  Media,
  PostQueryParams,
  TaxonomyQueryParams,
  MediaQueryParams,
  PaginatedResponse,
} from '@worang/wordpress-client'
```

### PostQueryParams

```typescript
{
  page?: number
  per_page?: number
  search?: string
  categories?: number[]
  categories_exclude?: number[]
  tags?: number[]
  tags_exclude?: number[]
  author?: number
  orderby?: 'date' | 'title' | 'slug' | 'author' | 'modified' | 'relevance'
  order?: 'asc' | 'desc'
  before?: string         // ISO date
  after?: string          // ISO date
  slug?: string | string[]
  status?: 'publish' | 'draft' | 'pending' | 'private' | 'any'
}
```

### TaxonomyQueryParams

```typescript
{
  page?: number
  per_page?: number
  search?: string
  slug?: string | string[]
  hide_empty?: boolean
  orderby?: 'id' | 'name' | 'slug' | 'count'
  order?: 'asc' | 'desc'
}
```

### MediaQueryParams

```typescript
{
  page?: number
  per_page?: number
  search?: string
  media_type?: 'image' | 'video' | 'audio' | 'application'
  mime_type?: string
  orderby?: 'date' | 'title' | 'id'
  order?: 'asc' | 'desc'
}
```

## Configuration

```typescript
const client = new WordpressClient({
  baseURL: 'https://example.com',   // Required: Your WordPress site URL
  namespace: 'wp/v2',               // Optional: API namespace (default: 'wp/v2')
  timeout: 10000,                   // Optional: Request timeout in ms (default: 10000)
})
```

Custom namespaces are useful when:
- Using a different REST API version
- Working with custom post types that have their own namespace
