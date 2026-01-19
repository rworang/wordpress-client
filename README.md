# @worang/wordpress-client

Typed WordPress REST API client for TypeScript/JavaScript projects.

## Installation

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

## Usage

```typescript
import { WordpressClient } from '@worang/wordpress-client'

const client = new WordpressClient({
  baseURL: 'https://your-wordpress-site.com',
})

// Fetch posts with pagination
const { data: posts, pagination } = await client.posts({
  page: 1,
  per_page: 10,
  categories: [5],
  orderby: 'date',
  order: 'desc',
})

// Fetch single post by slug
const post = await client.post('my-post-slug')

// Fetch categories
const { data: categories } = await client.categories()
```

## API

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | required | WordPress site URL |
| `namespace` | `string` | `'wp/v2'` | REST API namespace |
| `timeout` | `number` | `10000` | Request timeout in ms |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `posts(params?)` | `PaginatedResponse<Post>` | List posts with pagination |
| `post(slug)` | `Post \| null` | Get single post by slug |
| `postById(id)` | `Post` | Get single post by ID |
| `categories(params?)` | `PaginatedResponse<Category>` | List categories |
| `category(slug)` | `Category \| null` | Get single category by slug |
| `media(id)` | `Media` | Get single media item |
| `mediaList(params?)` | `PaginatedResponse<Media>` | List media items |

## Documentation

See [docs/README.md](./docs/README.md) for detailed documentation including:
- Common usage patterns
- Query parameter options
- Understanding the response shapes
- Error handling

## License

MIT
